import React from 'react';
import { Wine, Plus, ArrowRight } from 'lucide-react';

interface Props {
  bottleCount: number;
  onCreateBottle: () => void;
}

export function WelcomeView({ bottleCount, onCreateBottle }: Props) {
  return (
    <>
      <div className="content-header">
        <h2>Welcome</h2>
      </div>
      <div className="content-body">
        <div className="empty-state">
          <Wine size={48} className="icon" />
          <h3>Wine Launcher</h3>
          <p>
            Manage Wine bottles, configure rendering backends, and launch Windows applications on macOS with Apple Silicon.
          </p>

          {bottleCount === 0 ? (
            <button className="btn btn-primary" onClick={onCreateBottle}>
              <Plus size={14} /> Create Your First Bottle
            </button>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              You have {bottleCount} bottle{bottleCount !== 1 ? 's' : ''}. Select one from the sidebar to get started.
            </p>
          )}

          <div style={{ marginTop: 32, textAlign: 'left', maxWidth: 500 }}>
            <h4 style={{ fontSize: 13, color: 'var(--text-bright)', marginBottom: 12 }}>Quick Start</h4>
            <div className="card" style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>1.</span>
                Check <strong>Tools & Dependencies</strong> to ensure Wine and GPTK are installed.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>2.</span>
                Create a <strong>Bottle</strong> — an isolated Windows environment.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>3.</span>
                Choose your <strong>Graphics Backend</strong> (D3DMetal recommended).
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>4.</span>
                Install packages and <strong>launch</strong> your Windows apps.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
