import type { VersionRegistry } from '../types';

export const BUNDLED_REGISTRY: VersionRegistry = {
  schemaVersion: 1,
  lastUpdated: '2026-03-23',
  entries: [
    // ─── Wine Builds (Gcenx/macOS_Wine_builds) ───
    // Naming: wine-{devel|staging|stable}-{version}-osx64.tar.xz
    // These are universal builds that include ARM64 support
    {
      id: 'wine-stable-11.0-osx64',
      component: 'wine',
      version: '11.0',
      displayName: 'Wine Stable 11.0',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/macOS_Wine_builds/releases/download/11.0/wine-stable-11.0-osx64.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'Latest stable release. Recommended for most applications.',
    },
    {
      id: 'wine-devel-11.5-osx64',
      component: 'wine',
      version: '11.5-dev',
      displayName: 'Wine Development 11.5',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/macOS_Wine_builds/releases/download/11.5/wine-devel-11.5-osx64.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'Latest development build. Newest features but may be less stable.',
    },
    {
      id: 'wine-staging-11.5-osx64',
      component: 'wine',
      version: '11.5-staging',
      displayName: 'Wine Staging 11.5',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/macOS_Wine_builds/releases/download/11.5/wine-staging-11.5-osx64.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'Development build with experimental patches. May improve compatibility for some games.',
    },
    {
      id: 'wine-devel-11.4-osx64',
      component: 'wine',
      version: '11.4-dev',
      displayName: 'Wine Development 11.4',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/macOS_Wine_builds/releases/download/11.4/wine-devel-11.4-osx64.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'Previous development release.',
    },
    {
      id: 'wine-staging-11.4-osx64',
      component: 'wine',
      version: '11.4-staging',
      displayName: 'Wine Staging 11.4',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/macOS_Wine_builds/releases/download/11.4/wine-staging-11.4-osx64.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'Previous staging release with experimental patches.',
    },

    // ─── Game Porting Toolkit (Gcenx/game-porting-toolkit) ───
    {
      id: 'gptk-3.0-3',
      component: 'gptk',
      version: '3.0-3',
      displayName: 'Game Porting Toolkit 3.0-3',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/game-porting-toolkit/releases/download/Game-Porting-Toolkit-3.0-3/game-porting-toolkit-3.0-3.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'Latest GPTK with D3DMetal support. Required for D3DMetal backend.',
    },
    {
      id: 'gptk-3.0',
      component: 'gptk',
      version: '3.0',
      displayName: 'Game Porting Toolkit 3.0',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/game-porting-toolkit/releases/download/Game-Porting-Toolkit-3.0/game-porting-toolkit-3.0.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'GPTK 3.0 base release.',
    },
    {
      id: 'gptk-2.1',
      component: 'gptk',
      version: '2.1',
      displayName: 'Game Porting Toolkit 2.1',
      arch: 'arm64',
      downloadUrl: 'https://github.com/Gcenx/game-porting-toolkit/releases/download/Game-Porting-Toolkit-2.1/game-porting-toolkit-2.1.tar.xz',
      archiveFormat: 'tar.xz',
      stripComponents: 1,
      notes: 'GPTK 2.x release. Use if 3.0 causes issues.',
    },

    // ─── DXVK (doitsujin/dxvk) ───
    {
      id: 'dxvk-2.7.1',
      component: 'dxvk',
      version: '2.7.1',
      displayName: 'DXVK 2.7.1',
      arch: 'arm64',
      downloadUrl: 'https://github.com/doitsujin/dxvk/releases/download/v2.7.1/dxvk-2.7.1.tar.gz',
      archiveFormat: 'tar.gz',
      stripComponents: 1,
      notes: 'Latest DXVK. D3D9/10/11 → Vulkan translation. Used with MoltenVK backend path.',
    },
    {
      id: 'dxvk-2.7',
      component: 'dxvk',
      version: '2.7',
      displayName: 'DXVK 2.7',
      arch: 'arm64',
      downloadUrl: 'https://github.com/doitsujin/dxvk/releases/download/v2.7/dxvk-2.7.tar.gz',
      archiveFormat: 'tar.gz',
      stripComponents: 1,
      notes: 'Previous stable DXVK release.',
    },

    // ─── MoltenVK (KhronosGroup/MoltenVK) ───
    {
      id: 'moltenvk-1.4.1',
      component: 'moltenvk',
      version: '1.4.1',
      displayName: 'MoltenVK 1.4.1',
      arch: 'arm64',
      downloadUrl: 'https://github.com/KhronosGroup/MoltenVK/releases/download/v1.4.1/MoltenVK-macos.tar',
      archiveFormat: 'tar.gz', // .tar (no compression) but tar handles it
      stripComponents: 0,
      notes: 'Vulkan → Metal translation layer. Required for DXVK backend path.',
    },

    // ─── DXMT ───
    // Note: DXMT does not have well-established GitHub release builds.
    // This is a placeholder — users may need to provide their own builds.
    {
      id: 'dxmt-latest',
      component: 'dxmt',
      version: 'manual',
      displayName: 'DXMT (Manual Install)',
      arch: 'arm64',
      downloadUrl: '',
      archiveFormat: 'tar.gz',
      notes: 'DXMT does not have standard release builds. Place DXMT DLLs in the bottle manually.',
    },
  ],
};

/**
 * Returns the default wine entry ID for new bottles.
 */
export const DEFAULT_WINE_ENTRY_ID = 'wine-stable-11.0-osx64';

/**
 * Returns the recommended backend component entries for each graphics backend.
 */
export const BACKEND_COMPONENT_MAP: Record<string, string[]> = {
  d3dmetal: ['gptk-3.0-3'],
  dxmt: [], // DXMT requires manual install
  dxvk: ['dxvk-2.7.1', 'moltenvk-1.4.1'],
  wined3d: [],
};
