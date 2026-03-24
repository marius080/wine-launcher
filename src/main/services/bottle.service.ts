import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';
import {
  Bottle, CreateBottleOpts, GraphicsBackend, WineArch, WindowsVersion,
  BackendProfile, DllOverride, BottleBinaries, DownloadProgress, ShortcutEntry,
} from '../../shared/types';
import { BACKEND_DEFAULTS, BOTTLES_FILE, BACKEND_COMPONENT_MAP, DEFAULT_WINE_ENTRY_ID } from '../../shared/constants';
import { ConfigService } from './config.service';
import { DownloadService } from './download.service';
import { RegistryService } from './registry.service';

export class BottleService {
  private bottles: Map<string, Bottle> = new Map();
  private storagePath: string;

  constructor(
    private configService: ConfigService,
    private downloadService: DownloadService,
    private registryService: RegistryService,
  ) {
    const { app } = require('electron');
    this.storagePath = path.join(app.getPath('userData'), BOTTLES_FILE);
    this.loadBottles();
  }

  private loadBottles(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const arr: Bottle[] = JSON.parse(raw);
        for (const b of arr) {
          // Migration: add binaries field for old bottles
          if (!b.binaries) {
            b.binaries = {
              wineEntryId: 'system',
              wineVersion: b.wineVersion || 'system',
              backendEntryIds: [],
              binDir: 'bin',
              libDir: 'lib',
              shareDir: 'share',
            };
          }
          this.bottles.set(b.id, b);
        }
      }
    } catch (err) {
      console.error('Failed to load bottles:', err);
    }
  }

  private persist(): void {
    const arr = Array.from(this.bottles.values());
    fs.writeFileSync(this.storagePath, JSON.stringify(arr, null, 2), 'utf-8');
  }

  private buildBackendProfile(backend: GraphicsBackend): BackendProfile {
    const defaults = BACKEND_DEFAULTS[backend];
    return {
      backend,
      dllOverrides: defaults.dllOverrides.map(d => ({ name: d.name, mode: d.mode as DllOverride['mode'] })),
      envVars: [...defaults.envVars],
      wrapperCommand: defaults.wrapperCommand,
    };
  }

  list(): Bottle[] {
    return Array.from(this.bottles.values());
  }

  get(id: string): Bottle | null {
    return this.bottles.get(id) ?? null;
  }

  /**
   * Create a new bottle with self-contained binaries.
   * Downloads Wine and backend components into the bottle directory.
   */
  async create(
    opts: CreateBottleOpts,
    progressCallback?: (progress: DownloadProgress) => void,
  ): Promise<Bottle> {
    const config = this.configService.get();
    const id = uuidv4();
    const bottleName = opts.name.replace(/[^a-zA-Z0-9_\- ]/g, '');
    const bottlePath = opts.path || path.join(config.bottlesDirectory, bottleName);
    const backend = opts.backend || config.defaultBackend;
    const wineEntryId = opts.wineEntryId || config.defaultWineEntryId || DEFAULT_WINE_ENTRY_ID;

    // Ensure bottle directory exists
    if (!fs.existsSync(bottlePath)) {
      fs.mkdirSync(bottlePath, { recursive: true });
    }

    const emitProgress = (p: Partial<DownloadProgress>) => {
      if (progressCallback) {
        progressCallback({ bottleId: id, component: 'wine', phase: 'downloading', percent: 0, ...p } as DownloadProgress);
      }
    };

    // Download Wine build into bottle
    const wineEntry = this.registryService.getEntry(wineEntryId);
    if (!wineEntry) throw new Error(`Wine registry entry not found: ${wineEntryId}`);

    await this.downloadService.downloadAndExtract(wineEntryId, bottlePath, emitProgress);

    // Determine backend components to download
    const backendEntryIds = opts.backendEntryIds || BACKEND_COMPONENT_MAP[backend] || [];
    const installedBackendIds: string[] = [];

    for (const entryId of backendEntryIds) {
      const entry = this.registryService.getEntry(entryId);
      if (entry) {
        try {
          await this.downloadService.downloadAndExtract(entryId, bottlePath, emitProgress);
          installedBackendIds.push(entryId);
        } catch (err) {
          console.error(`Failed to download backend component ${entryId}:`, err);
          // Non-fatal — continue without this component
        }
      }
    }

    // Determine wine binary path inside bottle
    const wineBinaryPath = this.findWineBinary(bottlePath);

    const binaries: BottleBinaries = {
      wineEntryId,
      wineVersion: wineEntry.version,
      backendEntryIds: installedBackendIds,
      binDir: 'bin',
      libDir: 'lib',
      shareDir: 'share',
    };

    const now = new Date().toISOString();
    const bottle: Bottle = {
      id,
      name: opts.name,
      path: bottlePath,
      wineVersion: wineEntry.version,
      wineBinaryPath,
      arch: opts.arch || config.defaultArch,
      windowsVersion: opts.windowsVersion || config.defaultWindowsVersion,
      backend,
      backendProfile: this.buildBackendProfile(backend),
      binaries,
      envVars: [],
      dllOverrides: [],
      shortcuts: [],
      installedPackages: [],
      launchArguments: '',
      createdAt: now,
      updatedAt: now,
    };

    this.bottles.set(id, bottle);
    this.persist();

    // Initialize the Wine prefix
    emitProgress({ component: 'init', phase: 'configuring', percent: 80 });
    this.initializePrefix(bottle);
    emitProgress({ component: 'init', phase: 'done', percent: 100 });

    return bottle;
  }

  private findWineBinary(bottlePath: string): string {
    // Check common locations in extracted Wine builds
    const candidates = [
      path.join(bottlePath, 'bin', 'wine64'),
      path.join(bottlePath, 'bin', 'wine'),
      path.join(bottlePath, 'bin', 'game-porting-toolkit'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    // Fallback
    return path.join(bottlePath, 'bin', 'wine64');
  }

  private initializePrefix(bottle: Bottle): void {
    try {
      const env = this.getBottleEnv(bottle);
      execSync(`"${bottle.wineBinaryPath}" wineboot --init`, {
        env,
        timeout: 60000,
        stdio: 'pipe',
      });
    } catch (err) {
      console.error(`Failed to initialize prefix for bottle ${bottle.name}:`, err);
    }
  }

  /**
   * Build environment variables with bottle-local PATH and DYLD paths.
   */
  getBottleEnv(bottle: Bottle): Record<string, string> {
    const binDir = path.join(bottle.path, bottle.binaries?.binDir || 'bin');
    const libDir = path.join(bottle.path, bottle.binaries?.libDir || 'lib');

    return {
      ...process.env as Record<string, string>,
      WINEPREFIX: bottle.path,
      WINEARCH: bottle.arch,
      PATH: `${binDir}:${process.env.PATH || ''}`,
      DYLD_FALLBACK_LIBRARY_PATH: `${libDir}:/usr/lib`,
    };
  }

  update(id: string, updates: Partial<Bottle>): Bottle {
    const bottle = this.bottles.get(id);
    if (!bottle) throw new Error(`Bottle not found: ${id}`);

    // If backend changed, rebuild profile
    if (updates.backend && updates.backend !== bottle.backend) {
      updates.backendProfile = this.buildBackendProfile(updates.backend);
    }

    const updated: Bottle = {
      ...bottle,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.bottles.set(id, updated);
    this.persist();
    return updated;
  }

  delete(id: string): void {
    const bottle = this.bottles.get(id);
    if (!bottle) return;
    this.bottles.delete(id);
    this.persist();
  }

  clone(id: string, newName: string): Bottle {
    const source = this.bottles.get(id);
    if (!source) throw new Error(`Bottle not found: ${id}`);

    const config = this.configService.get();
    const newId = uuidv4();
    const safeName = newName.replace(/[^a-zA-Z0-9_\- ]/g, '');
    const newPath = path.join(config.bottlesDirectory, safeName);

    // Copy entire bottle directory (including bin/, lib/)
    if (fs.existsSync(source.path)) {
      fs.cpSync(source.path, newPath, { recursive: true });
    }

    const now = new Date().toISOString();
    const cloned: Bottle = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: newName,
      path: newPath,
      // Update wineBinaryPath to point into new bottle
      wineBinaryPath: source.wineBinaryPath.replace(source.path, newPath),
      createdAt: now,
      updatedAt: now,
    };

    cloned.shortcuts = cloned.shortcuts.map((s: ShortcutEntry) => ({ ...s, id: uuidv4() }));

    this.bottles.set(newId, cloned);
    this.persist();
    return cloned;
  }

  exportMetadata(id: string): string {
    const bottle = this.bottles.get(id);
    if (!bottle) throw new Error(`Bottle not found: ${id}`);
    return JSON.stringify(bottle, null, 2);
  }

  importBottle(filePath: string): Bottle {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Bottle;
    data.id = uuidv4();
    data.updatedAt = new Date().toISOString();
    if (!data.binaries) {
      data.binaries = {
        wineEntryId: 'system',
        wineVersion: data.wineVersion || 'system',
        backendEntryIds: [],
        binDir: 'bin',
        libDir: 'lib',
        shareDir: 'share',
      };
    }
    this.bottles.set(data.id, data);
    this.persist();
    return data;
  }
}
