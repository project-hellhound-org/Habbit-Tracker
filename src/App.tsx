import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { initializeDatabase } from './db/seed';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ContextualSidebarDrawer } from './components/ContextualSidebarDrawer';
import { EnvironmentalBackground } from './components/EnvironmentalBackground';
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

  // Sync environmental theme attribute to document root
  useEffect(() => {
    if (settings?.environmentTheme) {
      document.documentElement.setAttribute('data-theme', settings.environmentTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'rain_forest');
    }
  }, [settings?.environmentTheme]);

  if (!isInitialized || showSplash) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#071A13',
          color: '#E8F5EC',
        }}
      >
        <div className="app-launch-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #163A29 0%, #2F8F5B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              border: '1px solid rgba(141, 217, 160, 0.2)',
            }}
          >
            <Leaf size={40} style={{ color: '#57B978' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#E8F5EC' }}>🌿 Habit OS</h1>
          <p className="subtitle" style={{ color: '#A9C7B3', fontSize: '0.9rem' }}>
            Initializing environmental workspace...
          </p>
        </div>
      </div>
    );
  }

  const activeTheme = settings?.environmentTheme || 'rain_forest';

  return (
    <div
      id="app-root-canvas"
      style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}
    >
      {/* Dynamic 6-Layer Environmental Background */}
      <EnvironmentalBackground theme={activeTheme} settings={settings} />

      {/* Application UI */}
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




