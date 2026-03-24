import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../../shared/types';
import { CONFIG_FILE, DEFAULT_CONFIG, DEFAULT_BOTTLES_DIR_NAME, DEFAULT_WINE_ENTRY_ID } from '../../shared/constants';

export class ConfigService {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, CONFIG_FILE);
    this.config = this.load();
  }

  private getDefaultConfig(): AppConfig {
    return {
      ...DEFAULT_CONFIG,
      bottlesDirectory: path.join(app.getPath('userData'), DEFAULT_BOTTLES_DIR_NAME),
    };
  }

  private load(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);

        // Migration: old config had defaultWineBinary instead of defaultWineEntryId
        if (parsed.defaultWineBinary && !parsed.defaultWineEntryId) {
          parsed.defaultWineEntryId = DEFAULT_WINE_ENTRY_ID;
          delete parsed.defaultWineBinary;
        }

        return { ...this.getDefaultConfig(), ...parsed };
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
    const defaults = this.getDefaultConfig();
    this.save(defaults);
    return defaults;
  }

  private save(config: AppConfig): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  get(): AppConfig {
    return { ...this.config };
  }

  update(updates: Partial<AppConfig>): AppConfig {
    this.config = { ...this.config, ...updates };
    this.save(this.config);
    return this.get();
  }

  getBottlesDirectory(): string {
    const dir = this.config.bottlesDirectory;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }
}
