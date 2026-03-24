import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { exec } from 'child_process';
import {
  ConfigService, BottleService, DependencyService,
  BackendService, LaunchService, LogService, PackageService,
  RegistryService, DownloadService,
} from '../services';
import { LaunchProfile, ComponentKind } from '../../shared/types';

export function registerIpcHandlers(
  services: {
    config: ConfigService;
    bottles: BottleService;
    dependencies: DependencyService;
    backend: BackendService;
    launch: LaunchService;
    logs: LogService;
    packages: PackageService;
    registry: RegistryService;
    download: DownloadService;
  },
  getMainWindow: () => BrowserWindow | null,
) {
  const { config, bottles, dependencies, backend, launch, logs, packages, registry } = services;

  // ─── Config ───
  ipcMain.handle('config:get', () => config.get());
  ipcMain.handle('config:update', (_e, updates) => config.update(updates));

  // ─── Registry ───
  ipcMain.handle('registry:list', (_e, component?: ComponentKind) => registry.list(component));
  ipcMain.handle('registry:refresh', () => registry.refresh(config.get().registryUrl));
  ipcMain.handle('registry:getEntry', (_e, id) => registry.getEntry(id));

  // ─── System Prerequisites ───
  ipcMain.handle('system:check', () => dependencies.check());

  // ─── Bottles ───
  ipcMain.handle('bottles:list', () => bottles.list());
  ipcMain.handle('bottles:get', (_e, id) => bottles.get(id));

  ipcMain.handle('bottles:create', async (_e, opts) => {
    const bottle = await bottles.create(opts, (progress) => {
      const win = getMainWindow();
      if (win) win.webContents.send('download:progress', progress);
    });
    return bottle;
  });

  ipcMain.handle('bottles:update', (_e, id, updates) => bottles.update(id, updates));
  ipcMain.handle('bottles:delete', (_e, id) => bottles.delete(id));
  ipcMain.handle('bottles:clone', (_e, id, newName) => bottles.clone(id, newName));
  ipcMain.handle('bottles:export', (_e, id) => bottles.exportMetadata(id));
  ipcMain.handle('bottles:import', (_e, filePath) => bottles.importBottle(filePath));

  ipcMain.handle('bottles:openInFinder', (_e, id) => {
    const bottle = bottles.get(id);
    if (bottle) shell.openPath(bottle.path);
  });

  ipcMain.handle('bottles:openTerminal', (_e, id) => {
    const bottle = bottles.get(id);
    if (bottle) {
      const envExports = `export WINEPREFIX="${bottle.path}" && export WINEARCH="${bottle.arch}"`;
      exec(`osascript -e 'tell application "Terminal" to do script "${envExports}"'`);
    }
  });

  // ─── Launch ───
  ipcMain.handle('launch:run', (_e, profile: LaunchProfile) => launch.run(profile));
  ipcMain.handle('launch:resolve', (_e, profile: LaunchProfile) => launch.resolve(profile));
  ipcMain.handle('launch:runWinecfg', (_e, bottleId) => launch.runWinecfg(bottleId));
  ipcMain.handle('launch:runRegedit', (_e, bottleId) => launch.runRegedit(bottleId));
  ipcMain.handle('launch:runWinetricks', (_e, bottleId) => launch.runWinetricks(bottleId));
  ipcMain.handle('launch:killAll', (_e, bottleId) => launch.killAll(bottleId));
  ipcMain.handle('launch:runExe', (_e, bottleId, exePath) => launch.runExe(bottleId, exePath));

  // ─── Packages ───
  ipcMain.handle('packages:list', () => packages.listAvailable());
  ipcMain.handle('packages:install', async (_e, bottleId, packageId) => {
    await packages.install(bottleId, packageId);
  });

  // ─── Logs ───
  ipcMain.handle('logs:get', (_e, bottleId) => logs.getSessions(bottleId));

  // ─── Backend validation ───
  ipcMain.handle('backend:validate', (_e, backendType, bottlePath) => backend.validate(backendType, bottlePath));

  // ─── Dialogs ───
  ipcMain.handle('dialog:openFile', async (_e, opts) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: opts?.filters,
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
}
