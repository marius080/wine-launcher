import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottleDetailView } from './views/BottleDetailView';
import { ToolsView } from './views/ToolsView';
import { SettingsView } from './views/SettingsView';
import { LogsView } from './views/LogsView';
import { WelcomeView } from './views/WelcomeView';
import { CreateBottleModal } from './components/CreateBottleModal';
import { useBottles } from './hooks/useApi';
import type { Bottle } from '../shared/types';

export type ViewId = 'welcome' | 'bottle' | 'tools' | 'settings' | 'logs';

export default function App() {
  const { bottles, loading, refresh } = useBottles();
  const [activeView, setActiveView] = useState<ViewId>('welcome');
  const [selectedBottleId, setSelectedBottleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedBottle = bottles.find(b => b.id === selectedBottleId) ?? null;

  const handleSelectBottle = useCallback((bottle: Bottle) => {
    setSelectedBottleId(bottle.id);
    setActiveView('bottle');
  }, []);

  const handleNavigate = useCallback((view: ViewId) => {
    setActiveView(view);
    if (view !== 'bottle') setSelectedBottleId(null);
  }, []);

  const handleBottleCreated = useCallback(() => {
    refresh();
    setShowCreateModal(false);
  }, [refresh]);

  const handleBottleUpdated = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app-layout">
      <Sidebar
        bottles={bottles}
        selectedBottleId={selectedBottleId}
        activeView={activeView}
        onSelectBottle={handleSelectBottle}
        onNavigate={handleNavigate}
        onCreateBottle={() => setShowCreateModal(true)}
      />

      <div className="main-content">
        {activeView === 'welcome' && (
          <WelcomeView
            bottleCount={bottles.length}
            onCreateBottle={() => setShowCreateModal(true)}
          />
        )}

        {activeView === 'bottle' && selectedBottle && (
          <BottleDetailView
            bottle={selectedBottle}
            onUpdate={handleBottleUpdated}
          />
        )}

        {activeView === 'tools' && <ToolsView />}

        {activeView === 'settings' && <SettingsView />}

        {activeView === 'logs' && <LogsView bottleId={selectedBottleId} />}
      </div>

      {showCreateModal && (
        <CreateBottleModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBottleCreated}
        />
      )}
    </div>
  );
}
