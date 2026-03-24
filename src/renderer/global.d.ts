import type { WineLauncherAPI } from '../preload/index';

declare global {
  interface Window {
    api: WineLauncherAPI;
  }
}
