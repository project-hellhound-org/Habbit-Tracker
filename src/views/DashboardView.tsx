import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { ActiveTab } from '../App';
import { Calendar, CheckSquare, Clock, Sparkles, ArrowRight, Activity } from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const focusSessions = useLiveQuery(() => db.focusSessions.where('status').equals('completed').toArray()) || [];

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed').length;
  const totalFocusMins = Math.round(focusSessions.reduce((sum, s) => sum + s.verifiedSeconds, 0) / 60);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Precision Workspace Dashboard</h2>
          <p className="subtitle">High-density summary of your daily habits, task workloads, and verified focus time.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('insights')}>
          <Sparkles size={14} /> Ask AI Analyst
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE HABITS</span>
            <Calendar size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{habits.length}</div>
          <span className="subtitle">Tracked daily & custom routines</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TASK WORKLOAD</span>
            <CheckSquare size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{completedTasks} / {tasks.length}</div>
          <span className="subtitle" style={{ color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
            {overdueTasks > 0 ? `${overdueTasks} Overdue Tasks` : '0 Overdue Tasks'}
          </span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>VERIFIED FOCUS</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalFocusMins}m</div>
          <span className="subtitle">Anti-gaming verified deep work</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>SYSTEM HEALTH</span>
            <Activity size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>100%</div>
          <span className="subtitle">Local-First IndexedDB Sync</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Active Habits</h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('habits')}>
              Manage Habits <ArrowRight size={12} />
            </button>
          </div>
          {habits.length === 0 ? (
            <p className="subtitle">No active habits recorded. Click Manage Habits to create your first habit.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {habits.slice(0, 5).map((h) => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <strong>{h.name}</strong>
                  <span className="subtitle">{h.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Critical Tasks</h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('tasks')}>
              Manage Tasks <ArrowRight size={12} />
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="subtitle">No pending tasks recorded. Click Manage Tasks to add work items.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <span>{t.title}</span>
                  <span className="subtitle" style={{ color: t.priority === 'critical' ? 'var(--danger)' : 'var(--text-muted)' }}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
