import React, { useState } from 'react';
import { Download, Check, Loader } from 'lucide-react';
import type { Bottle } from '../../shared/types';
import { AVAILABLE_PACKAGES } from '../../shared/constants';
import { api } from '../hooks/useApi';

interface Props {
  bottle: Bottle;
  onUpdate: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  fonts: 'Fonts',
  runtime: 'Visual C++ Runtimes',
  directx: 'DirectX',
  dotnet: '.NET Framework',
  redistributable: 'Redistributables',
  launcher: 'Game Launchers',
  other: 'Other',
};

export function PackageInstaller({ bottle, onUpdate }: Props) {
  const [installing, setInstalling] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleInstall = async (packageId: string) => {
    setInstalling(packageId);
    setError('');
    try {
      if (api) {
        await api.installPackage(bottle.id, packageId);
        onUpdate();
      }
    } catch (err: any) {
      setError(err.message || `Failed to install package`);
    }
    setInstalling(null);
  };

  // Group by category
  const grouped = AVAILABLE_PACKAGES.reduce((acc, pkg) => {
    const cat = pkg.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(pkg);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PACKAGES>);

  return (
    <div>
      {error && (
        <div className="card" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)', fontSize: 12 }}>
          {error}
        </div>
      )}

      {Object.entries(grouped).map(([category, packages]) => (
        <div key={category} className="card">
          <div className="card-header">
            <span className="card-title">{CATEGORY_LABELS[category] || category}</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Description</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => {
                const isInstalled = bottle.installedPackages.includes(pkg.id);
                const isInstalling = installing === pkg.id;

                return (
                  <tr key={pkg.id}>
                    <td style={{ fontWeight: 500 }}>{pkg.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{pkg.description}</td>
                    <td>
                      {isInstalled ? (
                        <span className="badge badge-green"><Check size={10} /> Installed</span>
                      ) : (
                        <span className="badge badge-yellow">Not installed</span>
                      )}
                    </td>
                    <td>
                      {!isInstalled && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleInstall(pkg.id)}
                          disabled={isInstalling}
                        >
                          {isInstalling ? <Loader size={12} className="spinning" /> : <Download size={12} />}
                          {isInstalling ? '' : 'Install'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
