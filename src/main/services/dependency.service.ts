import { execSync } from 'child_process';
import * as fs from 'fs';
import { SystemPrerequisite, ToolStatus } from '../../shared/types';

/**
 * Checks system-level prerequisites that cannot be bundled per-bottle.
 * Wine/GPTK/DXVK are now downloaded per-bottle — this only checks OS-level requirements.
 */
export class DependencyService {
  check(): SystemPrerequisite[] {
    return [
      this.checkRosetta2(),
      this.checkXcodeTools(),
    ];
  }

  private checkRosetta2(): SystemPrerequisite {
    try {
      execSync('/usr/bin/arch -x86_64 /usr/bin/true', { timeout: 5000, stdio: 'pipe' });
      return {
        id: 'rosetta2',
        name: 'Rosetta 2',
        status: ToolStatus.Installed,
        description: 'Required for running x86_64 Wine builds on Apple Silicon.',
      };
    } catch {
      return {
        id: 'rosetta2',
        name: 'Rosetta 2',
        status: ToolStatus.Missing,
        description: 'Required for running x86_64 Wine builds. Install via: softwareupdate --install-rosetta',
      };
    }
  }

  private checkXcodeTools(): SystemPrerequisite {
    try {
      execSync('xcode-select -p', { timeout: 5000, stdio: 'pipe' });
      return {
        id: 'xcode-cli',
        name: 'Xcode Command Line Tools',
        status: ToolStatus.Installed,
        description: 'Provides developer tools used by some Wine components.',
      };
    } catch {
      return {
        id: 'xcode-cli',
        name: 'Xcode Command Line Tools',
        status: ToolStatus.Missing,
        description: 'Install via: xcode-select --install',
      };
    }
  }
}
