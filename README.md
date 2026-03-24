# Wine Launcher

A desktop Electron app for macOS Apple Silicon that acts as a Wine/Game Porting Toolkit orchestration layer. Built as a modern, maintained alternative to Whisky — without requiring CrossOver.

Wine Launcher manages multiple Wine bottles with self-contained binaries, per-bottle graphics backend selection, environment variable orchestration, and one-click launch configuration.

## Features

### Self-Contained Bottles
Each bottle downloads and stores its own Wine, GPTK, DXVK, and MoltenVK binaries. No Homebrew or system-level Wine installation required. Bottles are fully portable and isolated from each other.

### Graphics Backend Selection
Per-bottle backend switching with clear descriptions and trade-off explanations:

| Backend | Description | Status |
|---------|-------------|--------|
| **D3DMetal** | Apple Game Porting Toolkit — native Metal translation for D3D11/D3D12 | Recommended |
| **DXMT** | Experimental native Metal backend for D3D11 | Experimental |
| **DXVK + MoltenVK** | D3D9/10/11 → Vulkan → Metal translation | Legacy/Fallback |
| **WineD3D** | Wine built-in OpenGL-based D3D translation | Debug |

### Bottle Management
- Create, clone, delete, import/export bottles
- Per-bottle Wine version selection from a built-in registry
- Per-bottle environment variables, DLL overrides, and launch arguments
- App/game shortcuts with one-click launch
- Browse bottle contents in Finder
- Run winecfg, regedit, winetricks per bottle

### Version Registry
Built-in manifest of verified download URLs from GitHub releases:
- **Wine** — Gcenx/macOS_Wine_builds (Stable, Development, Staging)
- **Game Porting Toolkit** — Gcenx/game-porting-toolkit (3.0, 2.1)
- **DXVK** — doitsujin/dxvk
- **MoltenVK** — KhronosGroup/MoltenVK

Supports custom remote registry URLs for additional versions.

### Environment Variable Orchestration
- Global default env vars applied to all bottles
- Per-bottle env var overrides
- Per-launch temporary overrides
- Inspect the final resolved environment before running
- Presets for common configurations

### Launch Orchestration
- Launch `.exe`, `.msi`, and saved shortcuts
- Automatic wrapper selection (GPTK binary for D3DMetal, standard Wine otherwise)
- Debug mode with in-app log capture
- View the exact generated command before launch
- Open terminal with bottle environment pre-configured
- Kill all processes in a bottle

### Package Installation
Install common dependencies into bottles:
- Fonts (Core Fonts, Tahoma)
- VC++ Redistributables (2010–2022)
- .NET Framework (3.5, 4.0, 4.8)
- DirectX components (D3DX9, D3DCompiler)
- Launchers (Steam, Epic Games)

## Requirements

- macOS on Apple Silicon (M1/M2/M3/M4)
- Node.js 18+
- Rosetta 2 (for x86_64 Wine builds)

## Getting Started

```bash
# Install dependencies
npm install

# Build the main process
npm run build:main

# Run in development mode (Vite dev server + Electron)
npm run dev:renderer &
npm start -- --dev

# Or build everything for production
npm run build:main
npm run build:renderer
npm start
```

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # App entry, window creation, service init
│   ├── ipc/
│   │   └── handlers.ts      # IPC channel handlers
│   └── services/
│       ├── backend.service.ts    # Graphics backend resolution
│       ├── bottle.service.ts     # Bottle CRUD + binary download orchestration
│       ├── config.service.ts     # App configuration persistence
│       ├── dependency.service.ts # System prerequisite checks
│       ├── download.service.ts   # HTTP download + archive extraction
│       ├── launch.service.ts     # Process spawning + env orchestration
│       ├── log.service.ts        # Log session management
│       ├── package.service.ts    # Per-bottle package installation
│       └── registry.service.ts   # Version registry management
├── preload/
│   └── index.ts             # Secure IPC bridge (contextBridge)
├── renderer/                # React UI
│   ├── components/          # Reusable UI components
│   ├── hooks/               # React hooks (useApi, useRegistry, etc.)
│   ├── views/               # Main views (Bottles, Settings, Tools, Logs)
│   └── styles/              # Global CSS
└── shared/                  # Shared types and constants
    ├── types/index.ts       # TypeScript interfaces and enums
    └── constants/
        ├── index.ts          # App defaults, backend configs
        └── registry.ts       # Bundled version registry
```

## How It Works

1. **Create a bottle** — choose a Wine version and graphics backend from the registry
2. **Binaries are downloaded** — Wine + backend components are fetched from GitHub releases into the bottle's own `bin/` and `lib/` directories
3. **Prefix is initialized** — `wineboot --init` runs using the bottle-local Wine binary
4. **Launch apps** — the app builds the full command with `PATH` and `DYLD_FALLBACK_LIBRARY_PATH` pointing into the bottle, ensuring complete isolation

Each bottle directory is self-contained:
```
<bottle>/
├── bin/       # Wine binaries, GPTK wrapper
├── lib/       # Shared libraries (MoltenVK, etc.)
├── share/     # Wine data files
└── drive_c/   # Windows filesystem
```

## Configuration

App config is stored at `~/Library/Application Support/Wine Launcher/config.json`. Key settings:

- **Bottles directory** — where new bottles are created (configurable via Settings → Browse)
- **Default Wine version** — which registry entry to use for new bottles
- **Default backend** — D3DMetal recommended
- **Global env vars** — applied to all bottles (WINEESYNC, WINEFSYNC, etc.)
- **Custom registry URL** — point to your own version manifest

## Tech Stack

- **Electron** — desktop app framework
- **React** — renderer UI
- **TypeScript** — end-to-end type safety
- **Vite** — renderer bundling and HMR

## License

MIT
