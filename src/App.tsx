import React, { useState, useEffect } from 'react';
import { initializeDatabase } from './db/seed';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { HabitsView } from './views/HabitsView';
import { TasksView } from './views/TasksView';
import { JournalView } from './views/JournalView';
import { AnalyticsView } from './views/AnalyticsView';
import { CalendarView } from './views/CalendarView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';

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

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0B0C10', color: '#F5F5F2', gap: '1rem' }}>
        <img
          src="public/icon.png"
          alt="Habit OS Logo"
          style={{ width: '72px', height: '72px', borderRadius: '16px', boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)', animation: 'editPulse 1.5s infinite alternate ease-in-out' }}
        />
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>Habit OS</h2>
        <span className="subtitle" style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Initializing Local-First Workstation...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
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
    </div>
  );
};

export default App;
