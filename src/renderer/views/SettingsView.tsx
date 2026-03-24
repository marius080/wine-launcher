import React, { useState } from 'react';
import { useConfig, useRegistry, api } from '../hooks/useApi';
import { EnvVarEditor } from '../components/EnvVarEditor';
import { GraphicsBackend, WindowsVersion, WineArch } from '../../shared/types';
import type { EnvVar } from '../../shared/types';

export function SettingsView() {
  const { config, update } = useConfig();
  const { entries: wineEntries } = useRegistry('wine');
  const [saved, setSaved] = useState(false);

  if (!config) return <div className="content-body"><p>Loading settings...</p></div>;

  const handleSave = async (updates: Record<string, any>) => {
    await update(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="content-header">
        <h2>Settings</h2>
      </div>
      <div className="content-body">
        {saved && (
          <div className="card" style={{ background: 'rgba(78,200,96,0.1)', borderColor: 'var(--accent-green)', color: 'var(--accent-green)', fontSize: 12 }}>
            Settings saved.
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <span className="card-title">Defaults</span>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Default Wine Version</label>
              <select
                className="form-select"
                value={config.defaultWineEntryId}
                onChange={e => handleSave({ defaultWineEntryId: e.target.value })}
              >
                {wineEntries.length === 0 && (
                  <option value={config.defaultWineEntryId}>{config.defaultWineEntryId}</option>
                )}
                {wineEntries.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bottles Directory</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="form-input"
                  value={config.bottlesDirectory}
                  readOnly
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, flex: 1, opacity: 0.8 }}
                />
                <button
                  className="btn"
                  onClick={async () => {
                    if (!api) return;
                    const dir = await api.openDirectoryDialog();
                    if (dir) handleSave({ bottlesDirectory: dir });
                  }}
                >
                  Browse…
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                New bottles will be created inside this folder. Existing bottles are not moved.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default Graphics Backend</label>
              <select
                className="form-select"
                value={config.defaultBackend}
                onChange={e => handleSave({ defaultBackend: e.target.value })}
              >
                <option value={GraphicsBackend.D3DMetal}>D3DMetal (Recommended)</option>
                <option value={GraphicsBackend.DXMT}>DXMT (Experimental)</option>
                <option value={GraphicsBackend.DXVK}>DXVK + MoltenVK (Legacy)</option>
                <option value={GraphicsBackend.WineD3D}>WineD3D (Debug)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Windows Version</label>
              <select
                className="form-select"
                value={config.defaultWindowsVersion}
                onChange={e => handleSave({ defaultWindowsVersion: e.target.value })}
              >
                <option value={WindowsVersion.Win11}>Windows 11</option>
                <option value={WindowsVersion.Win10}>Windows 10</option>
                <option value={WindowsVersion.Win81}>Windows 8.1</option>
                <option value={WindowsVersion.Win7}>Windows 7</option>
                <option value={WindowsVersion.WinXP}>Windows XP</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Architecture</label>
              <select
                className="form-select"
                value={config.defaultArch}
                onChange={e => handleSave({ defaultArch: e.target.value })}
              >
                <option value={WineArch.Win64}>64-bit</option>
                <option value={WineArch.Win32}>32-bit</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Log Level</label>
              <select
                className="form-select"
                value={config.logLevel}
                onChange={e => handleSave({ logLevel: e.target.value })}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Component Registry</span>
          </div>
          <div className="form-group">
            <label className="form-label">Custom Registry URL (optional)</label>
            <input
              className="form-input"
              value={config.registryUrl || ''}
              onChange={e => handleSave({ registryUrl: e.target.value || undefined })}
              placeholder="https://example.com/wine-launcher-registry.json"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Point to a custom JSON manifest to add or override available component versions.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Global Environment Variables</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            These variables are applied to all bottles by default. Per-bottle variables take precedence.
          </p>
          <EnvVarEditor
            vars={config.globalEnvVars}
            onChange={(vars: EnvVar[]) => handleSave({ globalEnvVars: vars })}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Display</span>
          </div>
          <div className="form-group">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={config.showDebugInfo}
                onChange={e => handleSave({ showDebugInfo: e.target.checked })}
              />
              <span style={{ fontSize: 13 }}>Show debug information in UI</span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
