import React from 'react';
import {
  Wine, Wrench, Settings, ScrollText, Plus, Package,
} from 'lucide-react';
import type { Bottle } from '../../shared/types';
import type { ViewId } from '../App';

interface SidebarProps {
  bottles: Bottle[];
  selectedBottleId: string | null;
  activeView: ViewId;
  onSelectBottle: (bottle: Bottle) => void;
  onNavigate: (view: ViewId) => void;
  onCreateBottle: () => void;
}

export function Sidebar({
  bottles, selectedBottleId, activeView,
  onSelectBottle, onNavigate, onCreateBottle,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Wine Launcher</h1>
      </div>

      <nav className="sidebar-nav">
        {/* Bottles */}
        <div className="sidebar-section">
          <div className="sidebar-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bottles</span>
            <button
              className="btn btn-icon"
              onClick={onCreateBottle}
              title="Create new bottle"
              style={{ padding: 2 }}
            >
              <Plus size={14} />
            </button>
          </div>

          {bottles.length === 0 && (
            <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-muted)' }}>
              No bottles yet
            </div>
          )}

          {bottles.map(bottle => (
            <div
              key={bottle.id}
              className={`sidebar-item ${activeView === 'bottle' && selectedBottleId === bottle.id ? 'active' : ''}`}
              onClick={() => onSelectBottle(bottle)}
            >
              <Wine size={16} className="icon" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bottle.name}
              </span>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">System</div>

          <div
            className={`sidebar-item ${activeView === 'tools' ? 'active' : ''}`}
            onClick={() => onNavigate('tools')}
          >
            <Wrench size={16} className="icon" />
            <span>Version Manager</span>
          </div>

          <div
            className={`sidebar-item ${activeView === 'logs' ? 'active' : ''}`}
            onClick={() => onNavigate('logs')}
          >
            <ScrollText size={16} className="icon" />
            <span>Logs</span>
          </div>

          <div
            className={`sidebar-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            <Settings size={16} className="icon" />
            <span>Settings</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
