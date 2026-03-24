import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { GraphicsBackend, WindowsVersion, WineArch, BACKEND_INFO } from '../../shared/types';
import type { RegistryEntry, DownloadProgress } from '../../shared/types';
import { BACKEND_COMPONENT_MAP } from '../../shared/constants/registry';
import { api, useRegistry, useDownloadProgress } from '../hooks/useApi';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBottleModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [backend, setBackend] = useState<GraphicsBackend>(GraphicsBackend.D3DMetal);
  const [windowsVersion, setWindowsVersion] = useState<WindowsVersion>(WindowsVersion.Win10);
  const [arch, setArch] = useState<WineArch>(WineArch.Win64);
  const [wineEntryId, setWineEntryId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { entries: wineEntries } = useRegistry('wine');
  const { entries: allEntries } = useRegistry();
  const { progress } = useDownloadProgress();

  // Set default wine entry once loaded
  useEffect(() => {
    if (wineEntries.length > 0 && !wineEntryId) {
      setWineEntryId(wineEntries[0].id);
    }
  }, [wineEntries, wineEntryId]);

  // Determine which backend components will be downloaded
  const backendComponentIds = BACKEND_COMPONENT_MAP[backend] || [];
  const backendComponents = backendComponentIds
    .map(id => allEntries.find(e => e.id === id))
    .filter(Boolean) as RegistryEntry[];

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a bottle name.');
      return;
    }
    if (!wineEntryId) {
      setError('Please select a Wine version.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      if (api) {
        await api.createBottle({
          name: name.trim(),
          backend,
          windowsVersion,
          arch,
          wineEntryId,
          backendEntryIds: backendComponentIds,
        });
      }
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create bottle');
      setCreating(false);
    }
  };

  const selectedWine = wineEntries.find(e => e.id === wineEntryId);

  return (
    <div className="modal-overlay" onClick={creating ? undefined : onClose}>
      <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ width: 540 }}>
        <h3 className="modal-title">Create New Bottle</h3>

        {!creating ? (
          <>
            <div className="form-group">
              <label className="form-label">Bottle Name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Gaming, Steam, Office"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Wine Version</label>
              <select
                className="form-select"
                value={wineEntryId}
                onChange={e => setWineEntryId(e.target.value)}
              >
                {wineEntries.length === 0 && (
                  <option value="">Loading versions...</option>
                )}
                {wineEntries.map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.displayName} ({entry.arch})
                  </option>
                ))}
              </select>
              {selectedWine?.notes && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {selectedWine.notes}
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Windows Version</label>
                <select
                  className="form-select"
                  value={windowsVersion}
                  onChange={e => setWindowsVersion(e.target.value as WindowsVersion)}
                >
                  <option value={WindowsVersion.Win11}>Windows 11</option>
                  <option value={WindowsVersion.Win10}>Windows 10</option>
                  <option value={WindowsVersion.Win81}>Windows 8.1</option>
                  <option value={WindowsVersion.Win7}>Windows 7</option>
                  <option value={WindowsVersion.WinXP}>Windows XP</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Architecture</label>
                <select
                  className="form-select"
                  value={arch}
                  onChange={e => setArch(e.target.value as WineArch)}
                >
                  <option value={WineArch.Win64}>64-bit (win64)</option>
                  <option value={WineArch.Win32}>32-bit (win32)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Graphics Backend</label>
              {Object.values(GraphicsBackend).map(b => (
                <div
                  key={b}
                  className={`backend-option ${backend === b ? 'selected' : ''}`}
                  onClick={() => setBackend(b)}
                >
                  <div className="radio" />
                  <div className="backend-info">
                    <h4>
                      {BACKEND_INFO[b].label}
                      {' '}
                      <span className={`badge ${
                        b === GraphicsBackend.D3DMetal ? 'badge-green' :
                        b === GraphicsBackend.DXMT ? 'badge-orange' :
                        b === GraphicsBackend.DXVK ? 'badge-yellow' :
                        'badge-purple'
                      }`}>
                        {BACKEND_INFO[b].tag}
                      </span>
                    </h4>
                    <p>{BACKEND_INFO[b].description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Show which components will be downloaded */}
            {backendComponents.length > 0 && (
              <div className="card" style={{ background: 'rgba(0,120,212,0.08)', borderColor: 'var(--accent-blue)', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong>Components to download:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {selectedWine && (
                      <li>{selectedWine.displayName}</li>
                    )}
                    {backendComponents.map(c => (
                      <li key={c.id}>{c.displayName}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {error && (
              <div style={{ color: 'var(--accent-red)', fontSize: 12, marginBottom: 8 }}>{error}</div>
            )}

            <div className="modal-actions">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>
                Create Bottle
              </button>
            </div>
          </>
        ) : (
          /* Download progress view */
          <div>
            <DownloadProgressView progress={progress} />
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Downloading and setting up bottle. This may take a few minutes...
            </div>
            {error && (
              <div style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 8 }}>{error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadProgressView({ progress }: { progress: DownloadProgress | null }) {
  if (!progress) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          Preparing...
        </div>
      </div>
    );
  }

  const phaseLabels: Record<string, string> = {
    downloading: 'Downloading',
    extracting: 'Extracting',
    configuring: 'Configuring',
    done: 'Complete',
    error: 'Error',
  };

  const componentLabels: Record<string, string> = {
    wine: 'Wine',
    gptk: 'Game Porting Toolkit',
    dxvk: 'DXVK',
    dxmt: 'DXMT',
    moltenvk: 'MoltenVK',
    init: 'Wine Prefix',
  };

  const label = componentLabels[progress.component] || progress.component;
  const phase = phaseLabels[progress.phase] || progress.phase;

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: 'var(--text-bright)' }}>{phase} {label}...</span>
        <span style={{ color: 'var(--text-muted)' }}>{progress.percent}%</span>
      </div>
      <div style={{
        height: 6,
        background: 'var(--bg-tertiary)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress.percent}%`,
          background: progress.phase === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)',
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {progress.totalBytes && progress.totalBytes > 0 && progress.phase === 'downloading' && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {formatBytes(progress.bytesDownloaded || 0)} / {formatBytes(progress.totalBytes)}
        </div>
      )}
      {progress.error && (
        <div style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 4 }}>
          {progress.error}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
