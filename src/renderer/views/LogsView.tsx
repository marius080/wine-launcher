import React from 'react';
import { ScrollText } from 'lucide-react';
import { useLogs } from '../hooks/useApi';

interface Props {
  bottleId: string | null;
}

export function LogsView({ bottleId }: Props) {
  const { logs, refresh } = useLogs(bottleId);

  return (
    <>
      <div className="content-header">
        <h2>Logs</h2>
      </div>
      <div className="content-body">
        {!bottleId ? (
          <div className="empty-state">
            <ScrollText size={48} className="icon" />
            <h3>No bottle selected</h3>
            <p>Select a bottle from the sidebar to view its launch logs.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <ScrollText size={48} className="icon" />
            <h3>No logs yet</h3>
            <p>Launch an application in this bottle to see logs here.</p>
          </div>
        ) : (
          logs.map(session => (
            <div key={session.id} className="card">
              <div className="card-header">
                <span className="card-title">
                  Session — {new Date(session.startedAt).toLocaleString()}
                </span>
                {session.endedAt && (
                  <span className="badge badge-green">Ended</span>
                )}
              </div>
              <div className="log-viewer">
                {session.entries.map((entry, i) => (
                  <div key={i} className={`log-entry ${entry.level}`}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      [{new Date(entry.timestamp).toLocaleTimeString()}]
                    </span>
                    {' '}
                    <span style={{ color: 'var(--accent-purple)' }}>[{entry.source}]</span>
                    {' '}
                    {entry.message}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
