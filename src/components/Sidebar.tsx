import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { format } from 'date-fns';
import { ActiveTab } from '../App';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  BookOpen,
  BarChart2,
  Calendar,
  Sparkles,
  Settings,
  Leaf
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const allLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));
  const todayLogs = allLogs.filter((l) => l.date === todayIso && l.status === 'completed');
  const totalHabits = habits.length || 1;
  const progressPct = Math.min(Math.round((todayLogs.length / totalHabits) * 100), 100);

  const userName = settings?.userName || 'User Workspace';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits', label: 'Habits', icon: CalendarDays },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'journal', label: 'Daily Review', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'insights', label: 'Smart Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings & AI', icon: Settings },
  ];

  return (
    <aside
      className="dynamic-sidebar"
      style={{
        width: '260px',
        padding: '1.4rem 0.9rem',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        flexShrink: 0,
        zIndex: 80,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0 0.5rem 1.4rem 0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px var(--accent-glow)',
          }}
        >
          <Leaf size={22} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            🌿 {userName}
          </h2>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
            Personal Productivity OS
          </span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={19} style={{ color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="liquid-panel"
        style={{
          padding: '1rem',
          marginTop: '1.25rem',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Today's Progress</span>
          <strong style={{ color: 'var(--accent-secondary)' }}>{progressPct}%</strong>
        </div>
        <div className="progress-bar-track" style={{ height: '7px' }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </aside>
  );
};


