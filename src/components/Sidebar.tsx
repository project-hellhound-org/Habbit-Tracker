import React from 'react';
import { ActiveTab } from '../App';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Clock,
  BookOpen,
  BarChart2,
  Calendar,
  Sparkles,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'habits', label: 'Habit Consistency', icon: CalendarDays },
    { id: 'tasks', label: 'Tasks & Projects', icon: CheckSquare },
    { id: 'calendar', label: 'Task Scheduling', icon: Calendar },
    { id: 'focus', label: 'Verified Focus', icon: Clock },
    { id: 'journal', label: 'Daily Review', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'insights', label: 'Smart Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings & AI', icon: Settings },
  ];

  return (
    <aside style={{ width: '240px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '1.25rem 0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 1.25rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
        <img src="icon.png" alt="Habit OS Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Habit OS</h2>
          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productivity OS</span>
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
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>Local-First Engine</strong>
        Dexie IndexedDB Persistent
      </div>
    </aside>
  );
};
