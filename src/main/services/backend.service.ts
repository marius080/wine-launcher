import * as fs from 'fs';
import * as path from 'path';
import {
  GraphicsBackend, BackendProfile, Bottle, EnvVar, DllOverride,
} from '../../shared/types';

export interface ResolvedBackend {
  wineCommand: string;
  envVars: Record<string, string>;
  dllOverrides: string;
  warnings: string[];
}

export class BackendService {

  /**
   * Resolve the full launch environment for a given bottle's backend configuration.
   * All paths are resolved relative to the bottle's own bin/lib directories.
   */
  resolve(bottle: Bottle): ResolvedBackend {
    const warnings: string[] = [];
    const profile = bottle.backendProfile;
    let wineCommand = bottle.wineBinaryPath;

    const binDir = path.join(bottle.path, bottle.binaries?.binDir || 'bin');
    const libDir = path.join(bottle.path, bottle.binaries?.libDir || 'lib');

    switch (profile.backend) {
      case GraphicsBackend.D3DMetal: {
        // Check for GPTK binary inside the bottle
        const gptkBinary = path.join(binDir, 'game-porting-toolkit');
        if (fs.existsSync(gptkBinary)) {
          wineCommand = gptkBinary;
        } else {
          // GPTK not in bottle — use the Wine binary but warn
          warnings.push('Game Porting Toolkit binary not found in this bottle. D3DMetal may not work correctly. Consider re-creating the bottle with GPTK selected.');
        }
        break;
      }
      case GraphicsBackend.DXMT: {
        const dxmtCheck = path.join(bottle.path, 'drive_c', 'windows', 'system32', 'd3d11.dll');
        if (!fs.existsSync(dxmtCheck)) {
          warnings.push('DXMT DLLs not found in bottle system32. You may need to install DXMT into this prefix.');
        }
        break;
      }
      case GraphicsBackend.DXVK: {
        const dxvkCheck = path.join(bottle.path, 'drive_c', 'windows', 'system32', 'd3d11.dll');
        if (!fs.existsSync(dxvkCheck)) {
          warnings.push('DXVK DLLs not found in bottle system32. Install DXVK into this prefix first.');
        }
        // Check MoltenVK in bottle lib
        const moltenvkCheck = path.join(libDir, 'libMoltenVK.dylib');
        if (!fs.existsSync(moltenvkCheck)) {
          warnings.push('MoltenVK not found in bottle lib/. DXVK requires MoltenVK for Vulkan → Metal translation.');
        }
        break;
      }
      case GraphicsBackend.WineD3D: {
        break;
      }
    }

    const overrides = this.buildDllOverrideString(profile.dllOverrides, bottle.dllOverrides);
    const envVars = this.buildEnvVars(bottle, profile, overrides);

    return { wineCommand, envVars, dllOverrides: overrides, warnings };
  }

  private buildDllOverrideString(profileOverrides: DllOverride[], bottleOverrides: DllOverride[]): string {
    const map = new Map<string, string>();
    for (const o of profileOverrides) {
      if (o.mode) map.set(o.name, `${o.name}=${o.mode[0]}`);
    }
    for (const o of bottleOverrides) {
      if (o.mode === 'disabled') {
        map.set(o.name, `${o.name}=`);
      } else if (o.mode) {
        map.set(o.name, `${o.name}=${o.mode[0]}`);
      }
    }
    return Array.from(map.values()).join(';');
  }

  private buildEnvVars(bottle: Bottle, profile: BackendProfile, dllOverrides: string): Record<string, string> {
    const binDir = path.join(bottle.path, bottle.binaries?.binDir || 'bin');
    const libDir = path.join(bottle.path, bottle.binaries?.libDir || 'lib');

    const env: Record<string, string> = {};

    // Core Wine variables
    env['WINEPREFIX'] = bottle.path;
    env['WINEARCH'] = bottle.arch;

    // Bottle-local paths
    env['PATH'] = `${binDir}:${process.env.PATH || ''}`;
    env['DYLD_FALLBACK_LIBRARY_PATH'] = `${libDir}:/usr/lib`;

    if (dllOverrides) {
      env['WINEDLLOVERRIDES'] = dllOverrides;
    }

    // Merge profile env vars → bottle env vars (bottle takes precedence)
    const mergeVars = (vars: EnvVar[]) => {
      for (const v of vars) {
        if (v.enabled) {
          env[v.key] = v.value;
        }
      }
    };

    mergeVars(profile.envVars);
    mergeVars(bottle.envVars);

    return env;
  }

  /**
   * Validate that the necessary components are available for a backend in a specific bottle.
   */
  validate(backend: GraphicsBackend, bottlePath?: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!bottlePath) {
      // Can't validate without a bottle path
      return { valid: true, issues: [] };
    }

    const binDir = path.join(bottlePath, 'bin');
    const libDir = path.join(bottlePath, 'lib');

    switch (backend) {
      case GraphicsBackend.D3DMetal:
        if (!fs.existsSync(path.join(binDir, 'game-porting-toolkit'))) {
          issues.push('Game Porting Toolkit binary not found in bottle. Select a GPTK version when creating the bottle.');
        }
        break;
      case GraphicsBackend.DXVK:
        if (!fs.existsSync(path.join(libDir, 'libMoltenVK.dylib'))) {
          issues.push('MoltenVK not found in bottle. DXVK requires MoltenVK for Vulkan → Metal translation.');
        }
        break;
      case GraphicsBackend.DXMT:
        issues.push('DXMT is experimental. Ensure DXMT DLLs are present in the bottle.');
        break;
      case GraphicsBackend.WineD3D:
        break;
    }

    return { valid: issues.length === 0, issues };
  }
}
