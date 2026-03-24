import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { app } from 'electron';
import { RegistryEntry, VersionRegistry, ComponentKind } from '../../shared/types';
import { BUNDLED_REGISTRY } from '../../shared/constants/registry';

const CACHE_FILE = 'registry-cache.json';

export class RegistryService {
  private registry: VersionRegistry;
  private cachePath: string;

  constructor() {
    this.cachePath = path.join(app.getPath('userData'), CACHE_FILE);
    this.registry = this.loadCachedOrBundled();
  }

  private loadCachedOrBundled(): VersionRegistry {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf-8');
        const cached: VersionRegistry = JSON.parse(raw);
        if (cached.schemaVersion === BUNDLED_REGISTRY.schemaVersion) {
          // Merge: cached entries override bundled entries with same ID
          const merged = this.mergeRegistries(BUNDLED_REGISTRY, cached);
          return merged;
        }
      }
    } catch (err) {
      console.error('Failed to load cached registry:', err);
    }
    return { ...BUNDLED_REGISTRY };
  }

  private mergeRegistries(base: VersionRegistry, overlay: VersionRegistry): VersionRegistry {
    const entryMap = new Map<string, RegistryEntry>();
    for (const e of base.entries) entryMap.set(e.id, e);
    for (const e of overlay.entries) entryMap.set(e.id, e);
    return {
      schemaVersion: base.schemaVersion,
      lastUpdated: overlay.lastUpdated > base.lastUpdated ? overlay.lastUpdated : base.lastUpdated,
      entries: Array.from(entryMap.values()),
    };
  }

  list(component?: ComponentKind): RegistryEntry[] {
    if (component) {
      return this.registry.entries.filter(e => e.component === component);
    }
    return [...this.registry.entries];
  }

  getEntry(id: string): RegistryEntry | null {
    return this.registry.entries.find(e => e.id === id) ?? null;
  }

  getRegistry(): VersionRegistry {
    return { ...this.registry };
  }

  async refresh(remoteUrl?: string): Promise<VersionRegistry> {
    if (!remoteUrl) {
      // No remote URL configured — return current
      return this.getRegistry();
    }

    try {
      const raw = await this.fetchJson(remoteUrl);
      const remote: VersionRegistry = JSON.parse(raw);

      if (remote.schemaVersion !== BUNDLED_REGISTRY.schemaVersion) {
        console.warn('Remote registry schema version mismatch, ignoring.');
        return this.getRegistry();
      }

      this.registry = this.mergeRegistries(BUNDLED_REGISTRY, remote);

      // Cache to disk
      fs.writeFileSync(this.cachePath, JSON.stringify(this.registry, null, 2), 'utf-8');

      return this.getRegistry();
    } catch (err) {
      console.error('Failed to refresh registry:', err);
      return this.getRegistry();
    }
  }

  private fetchJson(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = (u: string, redirects = 0) => {
        if (redirects > 5) return reject(new Error('Too many redirects'));
        https.get(u, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return request(res.headers.location, redirects + 1);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          let data = '';
          res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
          res.on('end', () => resolve(data));
          res.on('error', reject);
        }).on('error', reject);
      };
      request(url);
    });
  }
}
