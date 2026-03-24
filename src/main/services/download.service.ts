import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as crypto from 'crypto';
import { execSync, spawn } from 'child_process';
import { app } from 'electron';
import { RegistryEntry, DownloadProgress, ComponentKind } from '../../shared/types';
import { RegistryService } from './registry.service';

export class DownloadService {
  private downloadsDir: string;

  constructor(private registryService: RegistryService) {
    this.downloadsDir = path.join(app.getPath('userData'), 'downloads');
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
  }

  /**
   * Download and extract a registry component into a target directory.
   */
  async downloadAndExtract(
    entryId: string,
    targetDir: string,
    progressCallback: (progress: Partial<DownloadProgress>) => void,
  ): Promise<void> {
    const entry = this.registryService.getEntry(entryId);
    if (!entry) throw new Error(`Registry entry not found: ${entryId}`);

    if (!entry.downloadUrl) {
      // No download URL (e.g., manual-install components like DXMT)
      progressCallback({ component: entry.component, phase: 'done', percent: 100 });
      return;
    }

    const ext = this.getExtension(entry.archiveFormat);
    const tempFile = path.join(this.downloadsDir, `${entryId}${ext}`);

    try {
      // Phase: downloading
      progressCallback({ component: entry.component, phase: 'downloading', percent: 0 });
      await this.downloadFile(entry.downloadUrl, tempFile, (percent, bytesDownloaded, totalBytes) => {
        progressCallback({ component: entry.component, phase: 'downloading', percent, bytesDownloaded, totalBytes });
      });

      // Verify SHA256 if provided
      if (entry.sha256) {
        const hash = await this.computeSha256(tempFile);
        if (hash !== entry.sha256) {
          throw new Error(`SHA256 mismatch for ${entry.displayName}: expected ${entry.sha256}, got ${hash}`);
        }
      }

      // Phase: extracting
      progressCallback({ component: entry.component, phase: 'extracting', percent: 50 });

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      await this.extractArchive(tempFile, targetDir, entry);

      // For DXVK/DXMT: copy DLLs into the Wine prefix system32/syswow64
      if (entry.component === 'dxvk' || entry.component === 'dxmt') {
        this.installDllsToPrefix(targetDir, entry.component);
      }

      // Phase: done
      progressCallback({ component: entry.component, phase: 'done', percent: 100 });

    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }

  private getExtension(format: string): string {
    switch (format) {
      case 'tar.xz': return '.tar.xz';
      case 'tar.gz': return '.tar.gz';
      case 'zip': return '.zip';
      case 'dmg': return '.dmg';
      default: return '.tar.gz';
    }
  }

  private downloadFile(
    url: string,
    destPath: string,
    onProgress: (percent: number, downloaded: number, total: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doRequest = (u: string, redirects = 0) => {
        if (redirects > 10) return reject(new Error('Too many redirects'));

        const proto = u.startsWith('https') ? https : http;
        proto.get(u, (res) => {
          // Follow redirects
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return doRequest(res.headers.location, redirects + 1);
          }

          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let downloaded = 0;

          const file = fs.createWriteStream(destPath);
          res.on('data', (chunk: Buffer) => {
            downloaded += chunk.length;
            const percent = totalBytes > 0 ? Math.round((downloaded / totalBytes) * 100) : 0;
            onProgress(percent, downloaded, totalBytes);
          });
          res.pipe(file);
          file.on('finish', () => { file.close(() => resolve()); });
          file.on('error', (err) => {
            fs.unlinkSync(destPath);
            reject(err);
          });
          res.on('error', reject);
        }).on('error', reject);
      };

      doRequest(url);
    });
  }

  private computeSha256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async extractArchive(archivePath: string, targetDir: string, entry: RegistryEntry): Promise<void> {
    const { archiveFormat, stripComponents } = entry;
    const strip = stripComponents ?? 0;

    switch (archiveFormat) {
      case 'tar.xz':
      case 'tar.gz': {
        const stripArg = strip > 0 ? `--strip-components=${strip}` : '';
        const cmd = `tar xf "${archivePath}" -C "${targetDir}" ${stripArg}`;
        execSync(cmd, { timeout: 300000, stdio: 'pipe' });
        break;
      }
      case 'zip': {
        execSync(`unzip -o "${archivePath}" -d "${targetDir}"`, { timeout: 300000, stdio: 'pipe' });
        break;
      }
      case 'dmg': {
        await this.extractDmg(archivePath, targetDir);
        break;
      }
      default:
        throw new Error(`Unsupported archive format: ${archiveFormat}`);
    }

    // Make binaries executable
    const binDir = path.join(targetDir, 'bin');
    if (fs.existsSync(binDir)) {
      execSync(`chmod -R +x "${binDir}"`, { stdio: 'pipe' });
    }
  }

  private extractDmg(dmgPath: string, targetDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const mountPoint = `/tmp/wine-launcher-dmg-${Date.now()}`;
        fs.mkdirSync(mountPoint, { recursive: true });
        execSync(`hdiutil attach "${dmgPath}" -mountpoint "${mountPoint}" -nobrowse -quiet`, { timeout: 60000, stdio: 'pipe' });

        try {
          execSync(`cp -R "${mountPoint}/"* "${targetDir}/"`, { timeout: 120000, stdio: 'pipe' });
        } finally {
          execSync(`hdiutil detach "${mountPoint}" -quiet`, { timeout: 30000, stdio: 'pipe' });
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * After extracting DXVK/DXMT into the bottle directory,
   * copy the DLLs into the Wine prefix system32 directory.
   */
  private installDllsToPrefix(bottlePath: string, component: ComponentKind): void {
    const system32 = path.join(bottlePath, 'drive_c', 'windows', 'system32');
    const syswow64 = path.join(bottlePath, 'drive_c', 'windows', 'syswow64');

    // DXVK/DXMT archives typically have x64/ and x32/ subdirectories
    const extractedBase = bottlePath;
    const x64Dir = fs.existsSync(path.join(extractedBase, 'x64'))
      ? path.join(extractedBase, 'x64')
      : fs.existsSync(path.join(extractedBase, 'x86_64'))
        ? path.join(extractedBase, 'x86_64')
        : null;
    const x32Dir = fs.existsSync(path.join(extractedBase, 'x32'))
      ? path.join(extractedBase, 'x32')
      : fs.existsSync(path.join(extractedBase, 'x86'))
        ? path.join(extractedBase, 'x86')
        : null;

    const dllNames = ['d3d9.dll', 'd3d10core.dll', 'd3d11.dll', 'dxgi.dll'];

    if (x64Dir && fs.existsSync(system32)) {
      for (const dll of dllNames) {
        const src = path.join(x64Dir, dll);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(system32, dll));
        }
      }
    }

    if (x32Dir && fs.existsSync(syswow64)) {
      for (const dll of dllNames) {
        const src = path.join(x32Dir, dll);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(syswow64, dll));
        }
      }
    }
  }
}
