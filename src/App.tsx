import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { initializeDatabase } from './db/seed';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ContextualSidebarDrawer } from './components/ContextualSidebarDrawer';
import { DashboardView } from './views/DashboardView';
import { HabitsView } from './views/HabitsView';
import { TasksView } from './views/TasksView';
import { JournalView } from './views/JournalView';
import { AnalyticsView } from './views/AnalyticsView';
import { CalendarView } from './views/CalendarView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { Leaf } from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'habits'
  | 'tasks'
  | 'journal'
  | 'analytics'
  | 'calendar'
  | 'insights'
  | 'settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Contextual Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const settings = useLiveQuery(() => db.settings.get('default'));

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsInitialized(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 700);
      return () => clearTimeout(timer);
    });
  }, []);

  // Sync background texture and palette data attributes to document/canvas
  useEffect(() => {
    if (settings) {
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme);
      }
      if (settings.colorPalette) {
        document.documentElement.setAttribute('data-palette', settings.colorPalette);
      }
      const rootCanvas = document.getElementById('app-root-canvas');
      if (rootCanvas && settings.backgroundTexture) {
        rootCanvas.setAttribute('data-texture', settings.backgroundTexture);
      }
    }
  }, [settings?.theme, settings?.colorPalette, settings?.backgroundTexture]);

  if (!isInitialized || showSplash) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0D221A',
          color: '#F3F1E7',
        }}
      >
        <div className="app-launch-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #2E5E44 0%, #8FAF82 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
            }}
          >
            <Leaf size={40} style={{ color: '#FFFFFF' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#F3F1E7' }}>🌿 Forest Flow</h1>
          <p className="subtitle" style={{ color: '#8FAF82', fontSize: '0.9rem' }}>
            Initializing fluid workspace & botanical theme engine...
          </p>
        </div>
      </div>
    );
  }

  const textureAttr = settings?.backgroundTexture || 'grain';

  return (
    <div
      id="app-root-canvas"
      data-texture={textureAttr}
      style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}
    >
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, overflow: 'hidden', zIndex: 1 }}>
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        />
        
        <main key={activeTab} className="nav-page-transition" style={{ flex: 1, overflowY: 'auto', scrollbarGutter: 'stable' }}>
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'habits' && <HabitsView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'journal' && <JournalView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'insights' && <InsightsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Adaptive Contextual Sidebar Drawer */}
      <ContextualSidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        selectedTaskId={selectedTaskId}
        selectedHabitId={selectedHabitId}
      />
    </div>
  );
};

export default App;



