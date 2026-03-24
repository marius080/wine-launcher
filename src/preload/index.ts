import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (updates: any) => ipcRenderer.invoke('config:update', updates),

  // Registry
  listRegistry: (component?: string) => ipcRenderer.invoke('registry:list', component),
  refreshRegistry: () => ipcRenderer.invoke('registry:refresh'),
  getRegistryEntry: (id: string) => ipcRenderer.invoke('registry:getEntry', id),

  // System prerequisites
  checkSystem: () => ipcRenderer.invoke('system:check'),

  // Download progress events
  onDownloadProgress: (callback: (progress: any) => void) => {
    const handler = (_e: any, progress: any) => callback(progress);
    ipcRenderer.on('download:progress', handler);
    return () => { ipcRenderer.removeListener('download:progress', handler); };
  },

  // Bottles
  listBottles: () => ipcRenderer.invoke('bottles:list'),
  getBottle: (id: string) => ipcRenderer.invoke('bottles:get', id),
  createBottle: (opts: any) => ipcRenderer.invoke('bottles:create', opts),
  updateBottle: (id: string, updates: any) => ipcRenderer.invoke('bottles:update', id, updates),
  deleteBottle: (id: string) => ipcRenderer.invoke('bottles:delete', id),
  cloneBottle: (id: string, newName: string) => ipcRenderer.invoke('bottles:clone', id, newName),
  exportBottle: (id: string) => ipcRenderer.invoke('bottles:export', id),
  importBottle: (path: string) => ipcRenderer.invoke('bottles:import', path),
  openBottleInFinder: (id: string) => ipcRenderer.invoke('bottles:openInFinder', id),
  openBottleTerminal: (id: string) => ipcRenderer.invoke('bottles:openTerminal', id),

  // Launch
  launchRun: (profile: any) => ipcRenderer.invoke('launch:run', profile),
  launchResolve: (profile: any) => ipcRenderer.invoke('launch:resolve', profile),
  launchWinecfg: (bottleId: string) => ipcRenderer.invoke('launch:runWinecfg', bottleId),
  launchRegedit: (bottleId: string) => ipcRenderer.invoke('launch:runRegedit', bottleId),
  launchWinetricks: (bottleId: string) => ipcRenderer.invoke('launch:runWinetricks', bottleId),
  launchKillAll: (bottleId: string) => ipcRenderer.invoke('launch:killAll', bottleId),
  launchExe: (bottleId: string, exePath: string) => ipcRenderer.invoke('launch:runExe', bottleId, exePath),

  // Packages
  listPackages: () => ipcRenderer.invoke('packages:list'),
  installPackage: (bottleId: string, packageId: string) => ipcRenderer.invoke('packages:install', bottleId, packageId),

  // Backend
  validateBackend: (backend: string, bottlePath?: string) => ipcRenderer.invoke('backend:validate', backend, bottlePath),

  // Logs
  getLogs: (bottleId: string) => ipcRenderer.invoke('logs:get', bottleId),

  // Dialogs
  openFileDialog: (opts?: any) => ipcRenderer.invoke('dialog:openFile', opts),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
};

contextBridge.exposeInMainWorld('api', api);

export type WineLauncherAPI = typeof api;
