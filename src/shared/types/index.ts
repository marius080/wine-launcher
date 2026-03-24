// ─── Rendering Backends ───

export enum GraphicsBackend {
  D3DMetal = 'd3dmetal',
  DXMT = 'dxmt',
  DXVK = 'dxvk',
  WineD3D = 'wined3d',
}

export const BACKEND_INFO: Record<GraphicsBackend, { label: string; description: string; tag: string }> = {
  [GraphicsBackend.D3DMetal]: {
    label: 'D3DMetal (Recommended)',
    description: 'Apple Game Porting Toolkit — native Metal translation for D3D11/D3D12. Best performance on Apple Silicon.',
    tag: 'Recommended',
  },
  [GraphicsBackend.DXMT]: {
    label: 'DXMT',
    description: 'Experimental native Metal backend for D3D11. May offer better compatibility for some D3D11-only titles.',
    tag: 'Experimental',
  },
  [GraphicsBackend.DXVK]: {
    label: 'DXVK + MoltenVK',
    description: 'Translates D3D9/D3D10/D3D11 → Vulkan → Metal via MoltenVK. Legacy fallback for compatibility.',
    tag: 'Legacy',
  },
  [GraphicsBackend.WineD3D]: {
    label: 'WineD3D',
    description: 'Wine built-in OpenGL-based D3D translation. Useful for debugging or very old titles.',
    tag: 'Debug',
  },
};

// ─── Windows Versions ───

export enum WindowsVersion {
  Win11 = 'win11',
  Win10 = 'win10',
  Win81 = 'win81',
  Win8 = 'win8',
  Win7 = 'win7',
  WinXP = 'winxp',
}

// ─── Architecture ───

export enum WineArch {
  Win64 = 'win64',
  Win32 = 'win32',
}

// ─── Component Registry ───

export type ComponentKind = 'wine' | 'gptk' | 'dxvk' | 'dxmt' | 'moltenvk';

export interface RegistryEntry {
  id: string;
  component: ComponentKind;
  version: string;
  displayName: string;
  arch: 'arm64' | 'x86_64';
  downloadUrl: string;
  sha256?: string;
  archiveFormat: 'tar.xz' | 'tar.gz' | 'zip' | 'dmg';
  stripComponents?: number;
  extractSubpath?: string;
  size?: number; // bytes
  notes?: string;
}

export interface VersionRegistry {
  schemaVersion: number;
  lastUpdated: string;
  entries: RegistryEntry[];
}

export interface BottleBinaries {
  wineEntryId: string;
  wineVersion: string;
  backendEntryIds: string[];
  binDir: string;  // relative to bottle path, e.g. "bin"
  libDir: string;
  shareDir: string;
}

export interface DownloadProgress {
  bottleId: string;
  component: ComponentKind | 'init';
  phase: 'downloading' | 'extracting' | 'configuring' | 'done' | 'error';
  percent: number;
  bytesDownloaded?: number;
  totalBytes?: number;
  error?: string;
}

// ─── System Prerequisites ───

export enum ToolStatus {
  Installed = 'installed',
  Missing = 'missing',
  Outdated = 'outdated',
  Unknown = 'unknown',
}

export interface SystemPrerequisite {
  id: string;
  name: string;
  status: ToolStatus;
  description: string;
}

// ─── DLL Overrides ───

export type DllOverrideMode = 'native' | 'builtin' | 'native,builtin' | 'builtin,native' | 'disabled' | '';

export interface DllOverride {
  name: string;
  mode: DllOverrideMode;
}

// ─── Environment Variables ───

export interface EnvVar {
  key: string;
  value: string;
  enabled: boolean;
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  vars: EnvVar[];
}

// ─── Shortcuts / Launchers ───

export interface ShortcutEntry {
  id: string;
  name: string;
  executablePath: string;
  arguments: string;
  workingDirectory: string;
  iconPath?: string;
}

// ─── Backend Profile ───

export interface BackendProfile {
  backend: GraphicsBackend;
  dllOverrides: DllOverride[];
  envVars: EnvVar[];
  wrapperCommand?: string;
  notes?: string;
}

// ─── Bottle ───

export interface Bottle {
  id: string;
  name: string;
  path: string; // WINEPREFIX path
  wineVersion: string;
  wineBinaryPath: string;
  arch: WineArch;
  windowsVersion: WindowsVersion;
  backend: GraphicsBackend;
  backendProfile: BackendProfile;
  binaries: BottleBinaries;
  envVars: EnvVar[];
  dllOverrides: DllOverride[];
  shortcuts: ShortcutEntry[];
  installedPackages: string[];
  launchArguments: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Launch Profile ───

export interface LaunchProfile {
  bottleId: string;
  shortcutId?: string;
  executablePath: string;
  arguments: string;
  envVars: EnvVar[];
  debugMode: boolean;
  resolvedCommand?: string;
  resolvedEnv?: Record<string, string>;
}

// ─── Log Session ───

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

export interface LogSession {
  id: string;
  bottleId: string;
  startedAt: string;
  endedAt?: string;
  entries: LogEntry[];
}

// ─── App Config ───

export interface AppConfig {
  defaultWineEntryId: string;
  defaultBackend: GraphicsBackend;
  defaultWindowsVersion: WindowsVersion;
  defaultArch: WineArch;
  bottlesDirectory: string;
  globalEnvVars: EnvVar[];
  environmentPresets: EnvironmentPreset[];
  registryUrl?: string;
  theme: 'system' | 'light' | 'dark';
  showDebugInfo: boolean;
  logLevel: 'info' | 'debug' | 'warn' | 'error';
  // Deprecated — kept for migration
  defaultWineBinary?: string;
}

// ─── Per-Bottle Package Definitions ───

export interface BottlePackage {
  id: string;
  name: string;
  description: string;
  category: 'fonts' | 'runtime' | 'directx' | 'dotnet' | 'redistributable' | 'launcher' | 'other';
  winetricksVerb?: string;
  customScript?: string;
  installed?: boolean;
}

// ─── IPC Channel Types ───

export interface IpcChannels {
  // Bottle management
  'bottles:list': () => Bottle[];
  'bottles:get': (id: string) => Bottle | null;
  'bottles:create': (opts: CreateBottleOpts) => Promise<Bottle>;
  'bottles:update': (id: string, updates: Partial<Bottle>) => Bottle;
  'bottles:delete': (id: string) => void;
  'bottles:clone': (id: string, newName: string) => Bottle;
  'bottles:openInFinder': (id: string) => void;
  'bottles:openTerminal': (id: string) => void;
  'bottles:export': (id: string) => string;
  'bottles:import': (path: string) => Bottle;

  // Registry
  'registry:list': (component?: ComponentKind) => RegistryEntry[];
  'registry:refresh': () => VersionRegistry;
  'registry:getEntry': (id: string) => RegistryEntry | null;

  // System prerequisites
  'system:check': () => SystemPrerequisite[];

  // Launch
  'launch:run': (profile: LaunchProfile) => void;
  'launch:runWinecfg': (bottleId: string) => void;
  'launch:runRegedit': (bottleId: string) => void;
  'launch:runWinetricks': (bottleId: string) => void;
  'launch:killAll': (bottleId: string) => void;
  'launch:resolve': (profile: LaunchProfile) => { command: string; env: Record<string, string> };
  'launch:runExe': (bottleId: string, exePath: string) => void;

  // Packages
  'packages:list': () => BottlePackage[];
  'packages:install': (bottleId: string, packageId: string) => void;

  // Config
  'config:get': () => AppConfig;
  'config:update': (updates: Partial<AppConfig>) => AppConfig;

  // Logs
  'logs:get': (bottleId: string) => LogSession[];

  // Dialog helpers
  'dialog:openFile': (opts?: { filters?: { name: string; extensions: string[] }[] }) => string | null;
  'dialog:openDirectory': () => string | null;
}

export interface CreateBottleOpts {
  name: string;
  path?: string;
  wineEntryId?: string;
  backendEntryIds?: string[];
  arch?: WineArch;
  windowsVersion?: WindowsVersion;
  backend?: GraphicsBackend;
}
