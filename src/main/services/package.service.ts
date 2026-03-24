import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { BottlePackage, Bottle } from '../../shared/types';
import { AVAILABLE_PACKAGES } from '../../shared/constants';
import { BottleService } from './bottle.service';

export class PackageService {
  constructor(private bottleService: BottleService) {}

  listAvailable(): BottlePackage[] {
    return AVAILABLE_PACKAGES;
  }

  async install(bottleId: string, packageId: string): Promise<void> {
    const bottle = this.bottleService.get(bottleId);
    if (!bottle) throw new Error(`Bottle not found: ${bottleId}`);

    const pkg = AVAILABLE_PACKAGES.find(p => p.id === packageId);
    if (!pkg) throw new Error(`Package not found: ${packageId}`);

    if (pkg.winetricksVerb) {
      await this.runWinetricks(bottle, pkg.winetricksVerb);
    } else if (pkg.id === 'steam') {
      await this.installSteam(bottle);
    } else if (pkg.id === 'epic') {
      await this.installEpic(bottle);
    } else if (pkg.customScript) {
      await this.runCustomScript(bottle, pkg.customScript);
    } else {
      throw new Error(`No installation method for package: ${pkg.name}`);
    }

    if (!bottle.installedPackages.includes(packageId)) {
      this.bottleService.update(bottleId, {
        installedPackages: [...bottle.installedPackages, packageId],
      });
    }
  }

  private getWinetricksPath(): string {
    const bundled = path.join(app.getAppPath(), 'resources', 'winetricks');
    if (fs.existsSync(bundled)) return bundled;
    const systemPaths = ['/opt/homebrew/bin/winetricks', '/usr/local/bin/winetricks'];
    for (const p of systemPaths) {
      if (fs.existsSync(p)) return p;
    }
    return 'winetricks';
  }

  private runWinetricks(bottle: Bottle, verb: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = this.bottleService.getBottleEnv(bottle);
      env['WINE'] = bottle.wineBinaryPath;

      const winetricksPath = this.getWinetricksPath();

      const child = spawn(winetricksPath, ['-q', verb], {
        env,
        stdio: 'pipe',
      });

      let stderr = '';
      child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`winetricks ${verb} failed (code ${code}): ${stderr}`));
      });

      child.on('error', reject);
    });
  }

  private async installSteam(bottle: Bottle): Promise<void> {
    const env = this.bottleService.getBottleEnv(bottle);

    execSync(
      `curl -sLo /tmp/SteamSetup.exe https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe`,
      { timeout: 60000, stdio: 'pipe' },
    );

    return new Promise((resolve, reject) => {
      const child = spawn(bottle.wineBinaryPath, ['/tmp/SteamSetup.exe'], {
        env,
        stdio: 'pipe',
      });
      child.on('exit', () => resolve());
      child.on('error', reject);
    });
  }

  private async installEpic(bottle: Bottle): Promise<void> {
    const env = this.bottleService.getBottleEnv(bottle);

    execSync(
      `curl -sLo /tmp/EpicInstaller.msi https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/installer/download/EpicGamesLauncherInstaller.msi`,
      { timeout: 120000, stdio: 'pipe' },
    );

    return new Promise((resolve, reject) => {
      const child = spawn(bottle.wineBinaryPath, ['msiexec', '/i', '/tmp/EpicInstaller.msi'], {
        env,
        stdio: 'pipe',
      });
      child.on('exit', () => resolve());
      child.on('error', reject);
    });
  }

  private runCustomScript(bottle: Bottle, script: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = this.bottleService.getBottleEnv(bottle);
      env['WINE'] = bottle.wineBinaryPath;

      const child = spawn('sh', ['-c', script], {
        env,
        stdio: 'pipe',
      });

      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Custom script failed with code ${code}`));
      });

      child.on('error', reject);
    });
  }
}
