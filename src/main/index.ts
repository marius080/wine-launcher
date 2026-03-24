import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import {
  ConfigService, BottleService, DependencyService,
  BackendService, LaunchService, LogService, PackageService,
  RegistryService, DownloadService,
} from './services';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize services
  const configService = new ConfigService();
  const registryService = new RegistryService();
  const downloadService = new DownloadService(registryService);
  const bottleService = new BottleService(configService, downloadService, registryService);
  const dependencyService = new DependencyService();
  const backendService = new BackendService();
  const logService = new LogService();
  const launchService = new LaunchService(bottleService, backendService, configService, logService);
  const packageService = new PackageService(bottleService);

  // Register IPC handlers
  registerIpcHandlers(
    {
      config: configService,
      bottles: bottleService,
      dependencies: dependencyService,
      backend: backendService,
      launch: launchService,
      logs: logService,
      packages: packageService,
      registry: registryService,
      download: downloadService,
    },
    () => mainWindow,
  );

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
