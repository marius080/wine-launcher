import { GraphicsBackend, WindowsVersion, WineArch, type BottlePackage, type EnvVar } from '../types';
export { BUNDLED_REGISTRY, DEFAULT_WINE_ENTRY_ID, BACKEND_COMPONENT_MAP } from './registry';

export const APP_NAME = 'Wine Launcher';
export const CONFIG_FILE = 'config.json';
export const BOTTLES_FILE = 'bottles.json';

export const DEFAULT_BOTTLES_DIR_NAME = 'Bottles';

export const DEFAULT_GLOBAL_ENV_VARS: EnvVar[] = [
  { key: 'WINEESYNC', value: '1', enabled: true },
  { key: 'WINEFSYNC', value: '1', enabled: true },
  { key: 'MTL_HUD_ENABLED', value: '0', enabled: false },
];

export const DEFAULT_CONFIG = {
  defaultWineEntryId: 'wine-stable-11.0-osx64',
  defaultBackend: GraphicsBackend.D3DMetal,
  defaultWindowsVersion: WindowsVersion.Win10,
  defaultArch: WineArch.Win64,
  globalEnvVars: DEFAULT_GLOBAL_ENV_VARS,
  environmentPresets: [],
  theme: 'system' as const,
  showDebugInfo: false,
  logLevel: 'info' as const,
};

// Backend-specific environment variables and DLL overrides
export const BACKEND_DEFAULTS: Record<GraphicsBackend, { envVars: EnvVar[]; dllOverrides: { name: string; mode: string }[]; wrapperCommand?: string }> = {
  [GraphicsBackend.D3DMetal]: {
    envVars: [
      { key: 'WINEDLLOVERRIDES', value: 'd3d9=;d3d10core=;d3d11=;d3d12=;dxgi=', enabled: false },
    ],
    dllOverrides: [],
    wrapperCommand: undefined,
  },
  [GraphicsBackend.DXMT]: {
    envVars: [
      { key: 'DXMT_LOG_LEVEL', value: 'info', enabled: false },
    ],
    dllOverrides: [
      { name: 'd3d11', mode: 'native' },
      { name: 'dxgi', mode: 'native' },
    ],
  },
  [GraphicsBackend.DXVK]: {
    envVars: [
      { key: 'DXVK_LOG_LEVEL', value: 'info', enabled: false },
      { key: 'MVK_CONFIG_FULL_IMAGE_VIEW_SWIZZLE', value: '1', enabled: true },
      { key: 'MVK_ALLOW_METAL_FENCES', value: '1', enabled: true },
    ],
    dllOverrides: [
      { name: 'd3d9', mode: 'native' },
      { name: 'd3d10core', mode: 'native' },
      { name: 'd3d11', mode: 'native' },
      { name: 'dxgi', mode: 'native' },
    ],
  },
  [GraphicsBackend.WineD3D]: {
    envVars: [],
    dllOverrides: [
      { name: 'd3d9', mode: 'builtin' },
      { name: 'd3d10core', mode: 'builtin' },
      { name: 'd3d11', mode: 'builtin' },
      { name: 'dxgi', mode: 'builtin' },
    ],
  },
};

// Available per-bottle packages
export const AVAILABLE_PACKAGES: BottlePackage[] = [
  // Fonts
  { id: 'corefonts', name: 'Core Fonts', description: 'Microsoft core TrueType fonts', category: 'fonts', winetricksVerb: 'corefonts' },
  { id: 'tahoma', name: 'Tahoma', description: 'Tahoma font', category: 'fonts', winetricksVerb: 'tahoma' },
  { id: 'allfonts', name: 'All Fonts', description: 'Install all available Wine fonts', category: 'fonts', winetricksVerb: 'allfonts' },
  // Runtimes
  { id: 'vcrun2019', name: 'VC++ 2015-2022', description: 'Visual C++ 2015-2022 Redistributable', category: 'runtime', winetricksVerb: 'vcrun2022' },
  { id: 'vcrun2017', name: 'VC++ 2017', description: 'Visual C++ 2017 Redistributable', category: 'runtime', winetricksVerb: 'vcrun2017' },
  { id: 'vcrun2015', name: 'VC++ 2015', description: 'Visual C++ 2015 Redistributable', category: 'runtime', winetricksVerb: 'vcrun2015' },
  { id: 'vcrun2013', name: 'VC++ 2013', description: 'Visual C++ 2013 Redistributable', category: 'runtime', winetricksVerb: 'vcrun2013' },
  { id: 'vcrun2012', name: 'VC++ 2012', description: 'Visual C++ 2012 Redistributable', category: 'runtime', winetricksVerb: 'vcrun2012' },
  { id: 'vcrun2010', name: 'VC++ 2010', description: 'Visual C++ 2010 Redistributable', category: 'runtime', winetricksVerb: 'vcrun2010' },
  // DirectX
  { id: 'dxvk_install', name: 'DXVK', description: 'Install DXVK DLLs into this bottle', category: 'directx', winetricksVerb: 'dxvk' },
  { id: 'd3dx9', name: 'DirectX 9 Extras', description: 'D3DX9 runtime libraries', category: 'directx', winetricksVerb: 'd3dx9' },
  { id: 'd3dcompiler_47', name: 'D3D Compiler 47', description: 'DirectX shader compiler', category: 'directx', winetricksVerb: 'd3dcompiler_47' },
  // .NET
  { id: 'dotnet48', name: '.NET Framework 4.8', description: 'Microsoft .NET Framework 4.8', category: 'dotnet', winetricksVerb: 'dotnet48' },
  { id: 'dotnet40', name: '.NET Framework 4.0', description: 'Microsoft .NET Framework 4.0', category: 'dotnet', winetricksVerb: 'dotnet40' },
  { id: 'dotnet35', name: '.NET Framework 3.5', description: 'Microsoft .NET Framework 3.5', category: 'dotnet', winetricksVerb: 'dotnet35sp1' },
  // Redistributables
  { id: 'xna40', name: 'XNA 4.0', description: 'Microsoft XNA Framework 4.0', category: 'redistributable', winetricksVerb: 'xna40' },
  { id: 'physx', name: 'PhysX', description: 'NVIDIA PhysX runtime', category: 'redistributable', winetricksVerb: 'physx' },
  // Launchers
  { id: 'steam', name: 'Steam', description: 'Install Steam client inside this bottle', category: 'launcher' },
  { id: 'epic', name: 'Epic Games Launcher', description: 'Install Epic Games Launcher inside this bottle', category: 'launcher' },
];
