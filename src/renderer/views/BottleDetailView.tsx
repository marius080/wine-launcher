import React, { useState, useCallback } from 'react';
import {
  Play, Terminal, Settings, Trash2, Copy, FolderOpen,
  FileText, Skull, Eye, Bug, Package, Layers, Variable,
  MonitorPlay, Info,
} from 'lucide-react';
import type { Bottle, GraphicsBackend, EnvVar, DllOverride, ShortcutEntry, WindowsVersion } from '../../shared/types';
import { BACKEND_INFO } from '../../shared/types';
import { BackendSelector } from '../components/BackendSelector';
import { EnvVarEditor } from '../components/EnvVarEditor';
import { DllOverrideEditor } from '../components/DllOverrideEditor';
import { PackageInstaller } from './PackageInstaller';
import { api } from '../hooks/useApi';

type Tab = 'overview' | 'launchers' | 'backend' | 'env' | 'dlls' | 'packages' | 'tools' | 'logs';

interface Props {
  bottle: Bottle;
  onUpdate: () => void;
}

export function BottleDetailView({ bottle, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [resolvedCommand, setResolvedCommand] = useState<string | null>(null);
  const [resolvedEnv, setResolvedEnv] = useState<Record<string, string> | null>(null);
  const [exePath, setExePath] = useState('');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'launchers', label: 'Launchers' },
    { id: 'backend', label: 'Graphics Backend' },
    { id: 'env', label: 'Environment' },
    { id: 'dlls', label: 'DLL Overrides' },
    { id: 'packages', label: 'Packages' },
    { id: 'tools', label: 'Tools' },
    { id: 'logs', label: 'Logs' },
  ];

  const updateBottle = useCallback(async (updates: Partial<Bottle>) => {
    if (api) {
      await api.updateBottle(bottle.id, updates);
      onUpdate();
    }
  }, [bottle.id, onUpdate]);

  const handleBackendChange = (backend: GraphicsBackend) => {
    updateBottle({ backend });
  };

  const handleEnvChange = (envVars: EnvVar[]) => {
    updateBottle({ envVars });
  };

  const handleDllChange = (dllOverrides: DllOverride[]) => {
    updateBottle({ dllOverrides });
  };

  const handleRunExe = async () => {
    if (!exePath.trim()) {
      const path = api ? await api.openFileDialog({ filters: [{ name: 'Executables', extensions: ['exe', 'msi'] }] }) : null;
      if (path && api) {
        await api.launchExe(bottle.id, path);
      }
    } else if (api) {
      await api.launchExe(bottle.id, exePath);
    }
  };

  const handleResolve = async () => {
    if (api) {
      const result = await api.launchResolve({
        bottleId: bottle.id,
        executablePath: exePath || 'app.exe',
        arguments: '',
        envVars: [],
        debugMode: false,
      });
      setResolvedCommand(result.command);
      setResolvedEnv(result.env);
    }
  };

  return (
    <>
      <div className="content-header">
        <h2>{bottle.name}</h2>
      </div>

      <div className="tab-bar">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`tab-item ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="content-body fade-in">
        {/* ─── Overview Tab ─── */}
        {activeTab === 'overview' && (
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Bottle Info</span>
                <span className={`badge ${
                  bottle.backend === 'd3dmetal' ? 'badge-green' :
                  bottle.backend === 'dxmt' ? 'badge-orange' :
                  bottle.backend === 'dxvk' ? 'badge-yellow' : 'badge-purple'
                }`}>
                  {BACKEND_INFO[bottle.backend]?.label || bottle.backend}
                </span>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>{bottle.name}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Wine Version</label>
                  <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>
                    {bottle.wineVersion}
                    {bottle.binaries?.wineEntryId && bottle.binaries.wineEntryId !== 'system' && (
                      <span className="badge badge-blue" style={{ marginLeft: 6 }}>Self-contained</span>
                    )}
                    {bottle.binaries?.wineEntryId === 'system' && (
                      <span className="badge badge-yellow" style={{ marginLeft: 6 }}>System (legacy)</span>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Prefix Path</label>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {bottle.path}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Windows Version</label>
                  <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>{bottle.windowsVersion}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Architecture</label>
                  <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>{bottle.arch}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Installed Packages</label>
                  <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>
                    {bottle.installedPackages.length || 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Quick Actions</span>
              </div>
              <div className="toolbar">
                <button className="btn" onClick={handleRunExe}>
                  <Play size={14} /> Run .exe / .msi
                </button>
                <button className="btn" onClick={() => api?.launchWinecfg(bottle.id)}>
                  <Settings size={14} /> winecfg
                </button>
                <button className="btn" onClick={() => api?.launchRegedit(bottle.id)}>
                  <FileText size={14} /> regedit
                </button>
                <button className="btn" onClick={() => api?.launchWinetricks(bottle.id)}>
                  <Package size={14} /> winetricks
                </button>
                <button className="btn" onClick={() => api?.openBottleTerminal(bottle.id)}>
                  <Terminal size={14} /> Terminal
                </button>
                <button className="btn" onClick={() => api?.openBottleInFinder(bottle.id)}>
                  <FolderOpen size={14} /> Finder
                </button>
                <button className="btn btn-danger" onClick={() => api?.launchKillAll(bottle.id)}>
                  <Skull size={14} /> Kill All
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ borderColor: 'rgba(244,71,71,0.3)' }}>
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--accent-red)' }}>Danger Zone</span>
              </div>
              <div className="toolbar">
                <button className="btn" onClick={async () => {
                  const name = prompt('New bottle name:');
                  if (name && api) {
                    await api.cloneBottle(bottle.id, name);
                    onUpdate();
                  }
                }}>
                  <Copy size={14} /> Clone Bottle
                </button>
                <button className="btn btn-danger" onClick={async () => {
                  if (confirm(`Delete bottle "${bottle.name}"? The prefix files will NOT be removed.`)) {
                    if (api) await api.deleteBottle(bottle.id);
                    onUpdate();
                  }
                }}>
                  <Trash2 size={14} /> Delete Bottle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Launchers Tab ─── */}
        {activeTab === 'launchers' && (
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Launch an Executable</span>
              </div>

              <div className="form-group">
                <label className="form-label">Executable Path (inside bottle or host)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    value={exePath}
                    onChange={e => setExePath(e.target.value)}
                    placeholder="C:\path\to\game.exe or /host/path/to/file.exe"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  />
                  <button className="btn" onClick={async () => {
                    const p = api ? await api.openFileDialog({ filters: [{ name: 'Executables', extensions: ['exe', 'msi'] }] }) : null;
                    if (p) setExePath(p);
                  }}>
                    Browse
                  </button>
                </div>
              </div>

              <div className="toolbar" style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={handleRunExe}>
                  <Play size={14} /> Run
                </button>
                <button className="btn" onClick={handleResolve}>
                  <Eye size={14} /> Preview Command
                </button>
              </div>

              {resolvedCommand && (
                <div style={{ marginTop: 16 }}>
                  <label className="form-label">Resolved Command</label>
                  <div className="command-preview">{resolvedCommand}</div>
                </div>
              )}

              {resolvedEnv && (
                <div style={{ marginTop: 12 }}>
                  <label className="form-label">Resolved Environment</label>
                  <div className="log-viewer" style={{ maxHeight: 200 }}>
                    {Object.entries(resolvedEnv)
                      .filter(([k]) => k.startsWith('WINE') || k.startsWith('DXVK') || k.startsWith('MVK') || k.startsWith('MTL') || k.startsWith('DYLD') || k === 'PATH')
                      .map(([k, v]) => (
                        <div key={k} className="log-entry info">
                          <span style={{ color: 'var(--accent-blue)' }}>{k}</span>={v}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Saved Shortcuts */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Saved Shortcuts</span>
              </div>
              {bottle.shortcuts.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  No saved shortcuts. Run an executable and it can be saved as a shortcut.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Path</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottle.shortcuts.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{s.executablePath}</td>
                        <td>
                          <button className="btn btn-sm" onClick={() => api?.launchExe(bottle.id, s.executablePath)}>
                            <Play size={12} /> Run
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ─── Backend Tab ─── */}
        {activeTab === 'backend' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Graphics Backend</span>
            </div>
            <BackendSelector selected={bottle.backend} onChange={handleBackendChange} />
          </div>
        )}

        {/* ─── Environment Tab ─── */}
        {activeTab === 'env' && (
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Bottle Environment Variables</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                These variables are set when launching any executable in this bottle.
                They merge with global defaults and backend-specific vars.
              </p>
              <EnvVarEditor vars={bottle.envVars} onChange={handleEnvChange} />
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Backend Environment (read-only)</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Auto-configured by the selected backend ({BACKEND_INFO[bottle.backend]?.label}).
              </p>
              <EnvVarEditor vars={bottle.backendProfile.envVars} onChange={() => {}} readOnly />
            </div>
          </div>
        )}

        {/* ─── DLL Overrides Tab ─── */}
        {activeTab === 'dlls' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">DLL Overrides</span>
            </div>
            <DllOverrideEditor overrides={bottle.dllOverrides} onChange={handleDllChange} />
          </div>
        )}

        {/* ─── Packages Tab ─── */}
        {activeTab === 'packages' && (
          <PackageInstaller bottle={bottle} onUpdate={onUpdate} />
        )}

        {/* ─── Tools Tab ─── */}
        {activeTab === 'tools' && (
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Bottle Tools</span>
              </div>
              <div className="toolbar">
                <button className="btn" onClick={() => api?.launchWinecfg(bottle.id)}>
                  <Settings size={14} /> Wine Configuration
                </button>
                <button className="btn" onClick={() => api?.launchRegedit(bottle.id)}>
                  <FileText size={14} /> Registry Editor
                </button>
                <button className="btn" onClick={() => api?.launchWinetricks(bottle.id)}>
                  <Package size={14} /> Winetricks GUI
                </button>
                <button className="btn" onClick={() => api?.openBottleTerminal(bottle.id)}>
                  <Terminal size={14} /> Open Terminal
                </button>
                <button className="btn" onClick={() => api?.openBottleInFinder(bottle.id)}>
                  <FolderOpen size={14} /> Open in Finder
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Bottle Settings</span>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Windows Version</label>
                  <select
                    className="form-select"
                    value={bottle.windowsVersion}
                    onChange={e => updateBottle({ windowsVersion: e.target.value as WindowsVersion })}
                  >
                    <option value="win11">Windows 11</option>
                    <option value="win10">Windows 10</option>
                    <option value="win81">Windows 8.1</option>
                    <option value="win7">Windows 7</option>
                    <option value="winxp">Windows XP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Wine Binary</label>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {bottle.wineBinaryPath}
                  </div>
                </div>
              </div>
            </div>

            {/* Installed Binaries */}
            {bottle.binaries && bottle.binaries.wineEntryId !== 'system' && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Installed Binaries</span>
                  <span className="badge badge-blue">Self-contained</span>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Wine</label>
                    <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>
                      {bottle.binaries.wineVersion} ({bottle.binaries.wineEntryId})
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Backend Components</label>
                    <div style={{ fontSize: 13, color: 'var(--text-bright)' }}>
                      {bottle.binaries.backendEntryIds.length > 0
                        ? bottle.binaries.backendEntryIds.join(', ')
                        : 'None (WineD3D built-in)'}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bin Directory</label>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {bottle.path}/{bottle.binaries.binDir}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lib Directory</label>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {bottle.path}/{bottle.binaries.libDir}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Logs Tab ─── */}
        {activeTab === 'logs' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Logs</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Launch an application with debug mode to see logs here. Logs are stored in memory during the session.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
