import { spawn, execSync } from 'child_process';
import * as path from 'path';
import { app } from 'electron';
import { Bottle, LaunchProfile, EnvVar } from '../../shared/types';
import { BackendService } from './backend.service';
import { BottleService } from './bottle.service';
import { ConfigService } from './config.service';
import { LogService } from './log.service';

export class LaunchService {
  private activeProcesses: Map<string, import('child_process').ChildProcess> = new Map();

  constructor(
    private bottleService: BottleService,
    private backendService: BackendService,
    private configService: ConfigService,
    private logService: LogService,
  ) {}

  /**
   * Resolve the full command and environment that would be used to launch.
   */
  resolve(profile: LaunchProfile): { command: string; env: Record<string, string> } {
    const bottle = this.bottleService.get(profile.bottleId);
    if (!bottle) throw new Error(`Bottle not found: ${profile.bottleId}`);

    const resolved = this.backendService.resolve(bottle);
    const config = this.configService.get();

    // Start with bottle-local env (includes PATH, DYLD_FALLBACK_LIBRARY_PATH)
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
    };

    // Global env vars from config
    for (const v of config.globalEnvVars) {
      if (v.enabled) env[v.key] = v.value;
    }

    // Backend-resolved env vars (includes WINEPREFIX, WINEARCH, PATH, DYLD)
    Object.assign(env, resolved.envVars);

    // Profile-level overrides
    for (const v of profile.envVars) {
      if (v.enabled) env[v.key] = v.value;
    }

    if (profile.debugMode) {
      env['WINEDEBUG'] = '+all';
    }

    const args = [profile.executablePath];
    if (profile.arguments) {
      args.push(...profile.arguments.split(/\s+/).filter(Boolean));
    }
    const command = `"${resolved.wineCommand}" ${args.map(a => `"${a}"`).join(' ')}`;

    return { command, env };
  }

  /**
   * Launch an executable in a bottle.
   */
  run(profile: LaunchProfile): void {
    const bottle = this.bottleService.get(profile.bottleId);
    if (!bottle) throw new Error(`Bottle not found: ${profile.bottleId}`);

    const { command, env } = this.resolve(profile);
    const resolved = this.backendService.resolve(bottle);

    const sessionId = this.logService.startSession(bottle.id);
    this.logService.log(sessionId, 'info', 'launch', `Launching: ${command}`);

    const args = [profile.executablePath];
    if (profile.arguments) {
      args.push(...profile.arguments.split(/\s+/).filter(Boolean));
    }

    const child = spawn(resolved.wineCommand, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    this.activeProcesses.set(bottle.id, child);

    child.stdout?.on('data', (data: Buffer) => {
      this.logService.log(sessionId, 'info', 'stdout', data.toString());
    });

    child.stderr?.on('data', (data: Buffer) => {
      this.logService.log(sessionId, 'debug', 'stderr', data.toString());
    });

    child.on('exit', (code) => {
      this.logService.log(sessionId, 'info', 'launch', `Process exited with code ${code}`);
      this.logService.endSession(sessionId);
      this.activeProcesses.delete(bottle.id);
    });

    child.on('error', (err) => {
      this.logService.log(sessionId, 'error', 'launch', `Process error: ${err.message}`);
      this.logService.endSession(sessionId);
      this.activeProcesses.delete(bottle.id);
    });
  }

  runExe(bottleId: string, exePath: string): void {
    this.run({
      bottleId,
      executablePath: exePath,
      arguments: '',
      envVars: [],
      debugMode: false,
    });
  }

  runWinecfg(bottleId: string): void {
    this.runUtility(bottleId, 'winecfg');
  }

  runRegedit(bottleId: string): void {
    this.runUtility(bottleId, 'regedit');
  }

  runWinetricks(bottleId: string): void {
    const bottle = this.bottleService.get(bottleId);
    if (!bottle) throw new Error(`Bottle not found: ${bottleId}`);

    const env = this.bottleService.getBottleEnv(bottle);
    env['WINE'] = bottle.wineBinaryPath;

    // Use bundled winetricks or fall back to system
    const winetricksPath = this.getWinetricksPath();

    spawn(winetricksPath, ['--gui'], {
      env,
      stdio: 'ignore',
      detached: true,
    }).unref();
  }

  private runUtility(bottleId: string, utility: string): void {
    const bottle = this.bottleService.get(bottleId);
    if (!bottle) throw new Error(`Bottle not found: ${bottleId}`);

    const env = this.bottleService.getBottleEnv(bottle);

    spawn(bottle.wineBinaryPath, [utility], {
      env,
      stdio: 'ignore',
      detached: true,
    }).unref();
  }

  killAll(bottleId: string): void {
    const bottle = this.bottleService.get(bottleId);
    if (!bottle) throw new Error(`Bottle not found: ${bottleId}`);

    const env = this.bottleService.getBottleEnv(bottle);

    try {
      execSync(`"${bottle.wineBinaryPath}" wineboot --kill`, { env, timeout: 10000, stdio: 'pipe' });
    } catch {
      // Best effort
    }

    const proc = this.activeProcesses.get(bottleId);
    if (proc) {
      proc.kill('SIGTERM');
      this.activeProcesses.delete(bottleId);
    }
  }

  /**
   * Find winetricks — check bundled resources first, then bottle bin, then system.
   */
  private getWinetricksPath(): string {
    const bundled = path.join(app.getAppPath(), 'resources', 'winetricks');
    if (require('fs').existsSync(bundled)) return bundled;

    // Fall back to system winetricks
    const systemPaths = ['/opt/homebrew/bin/winetricks', '/usr/local/bin/winetricks'];
    for (const p of systemPaths) {
      if (require('fs').existsSync(p)) return p;
    }

    return 'winetricks'; // Hope it's on PATH
  }
}
