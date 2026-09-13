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
  const todayLogs = allLogs.filter((l) => l.date === todayIso && l.status === 'completed');
  const totalHabits = habits.length || 1;
  const progressPct = Math.min(Math.round((todayLogs.length / totalHabits) * 100), 100);

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
      style={{
        width: '240px',
        background: '#142F24',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 0.5rem 1.25rem 0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
        >
          <Leaf size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#F3F1E7' }}>
            🌿 Forest Flow
          </h2>
          <span style={{ fontSize: '0.675rem', color: '#8FAF82', letterSpacing: '0.03em' }}>
            Better habits. A better life.
          </span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: isActive ? '#18382A' : 'transparent',
                color: isActive ? '#F3F1E7' : '#C5D6B9',
                borderLeft: isActive ? '3px solid #8FAF82' : '3px solid transparent',
                borderTop: '1px solid transparent',
                borderRight: '1px solid transparent',
                borderBottom: '1px solid transparent',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 180ms ease',
              }}
            >
              <Icon size={16} style={{ color: isActive ? '#8FAF82' : '#C5D6B9' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: '0.85rem',
          background: '#102A20',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: '#C5D6B9',
          marginTop: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontWeight: 600, color: '#F3F1E7' }}>Today's progress</span>
          <strong style={{ color: '#8FAF82' }}>{progressPct}%</strong>
        </div>
        <div className="progress-bar-track" style={{ height: '6px' }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </aside>
  );
};

