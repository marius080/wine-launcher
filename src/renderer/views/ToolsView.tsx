import React from 'react';
import { Check, X, HelpCircle, RefreshCw, Package } from 'lucide-react';
import { useRegistry, useSystemCheck } from '../hooks/useApi';
import { ToolStatus } from '../../shared/types';
import type { ComponentKind } from '../../shared/types';

const COMPONENT_LABELS: Record<ComponentKind, string> = {
  wine: 'Wine',
  gptk: 'Game Porting Toolkit',
  dxvk: 'DXVK',
  dxmt: 'DXMT',
  moltenvk: 'MoltenVK',
};

const COMPONENT_ORDER: ComponentKind[] = ['wine', 'gptk', 'dxvk', 'moltenvk', 'dxmt'];

export function ToolsView() {
  const { entries, loading: registryLoading, refresh: refreshRegistry } = useRegistry();
  const { prerequisites, loading: sysLoading, refresh: refreshSys } = useSystemCheck();

  // Group registry entries by component
  const grouped = new Map<ComponentKind, typeof entries>();
  for (const entry of entries) {
    const list = grouped.get(entry.component) || [];
    list.push(entry);
    grouped.set(entry.component, list);
  }

  return (
    <>
      <div className="content-header">
        <h2>Version Manager</h2>
      </div>
      <div className="content-body">
        {/* System Prerequisites */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">System Prerequisites</span>
            <button className="btn btn-sm" onClick={refreshSys} disabled={sysLoading}>
              <RefreshCw size={12} /> Check
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            OS-level requirements. Wine and backend components are downloaded per-bottle automatically.
          </p>

          {sysLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Checking...</p>
          ) : prerequisites.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No system prerequisites detected (running outside Electron).</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Prerequisite</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prerequisites.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.description}
                      </div>
                    </td>
                    <td>
                      {p.status === ToolStatus.Installed ? (
                        <span className="badge badge-green"><Check size={10} /> Installed</span>
                      ) : p.status === ToolStatus.Missing ? (
                        <span className="badge badge-red"><X size={10} /> Missing</span>
                      ) : (
                        <span className="badge badge-yellow"><HelpCircle size={10} /> Unknown</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Available Component Versions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Available Component Versions</span>
            <button className="btn btn-sm" onClick={refreshRegistry} disabled={registryLoading}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            These versions are available for download when creating or updating bottles.
            Each bottle gets its own self-contained copy of selected components.
          </p>

          {registryLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading registry...</p>
          ) : entries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No registry entries found (running outside Electron).</p>
          ) : (
            COMPONENT_ORDER.map(component => {
              const componentEntries = grouped.get(component);
              if (!componentEntries || componentEntries.length === 0) return null;
              return (
                <div key={component} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={14} />
                    {COMPONENT_LABELS[component]}
                  </h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Architecture</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {componentEntries.map(entry => (
                        <tr key={entry.id}>
                          <td style={{ fontWeight: 500 }}>
                            {entry.displayName}
                          </td>
                          <td>
                            <span className="badge badge-blue">{entry.arch}</span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {entry.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
