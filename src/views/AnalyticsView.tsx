import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { BarChart2, TrendingUp, ShieldCheck, Activity } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const focusSessions = useLiveQuery(() => db.focusSessions.toArray()) || [];

  const completedLogs = habitLogs.filter((l) => l.status === 'completed').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalFocusSecs = focusSessions.reduce((sum, s) => sum + (s.verifiedSeconds || 0), 0);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>System Performance Analytics</h2>
        <p className="subtitle">High-precision metrics, habit completion rates, and focus efficiency analytics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TOTAL HABIT LOGS</span>
            <BarChart2 size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{completedLogs}</div>
          <span className="subtitle">Completed habit check-ins</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TASK COMPLETIONS</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{completedTasks} / {tasks.length}</div>
          <span className="subtitle">Tasks completed</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>VERIFIED DEEP WORK</span>
            <ShieldCheck size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{Math.round(totalFocusSecs / 3600)} hrs</div>
          <span className="subtitle">Anti-gaming verified focus</span>
        </div>
      </div>
    </div>
  );
};
