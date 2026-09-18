import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Habit } from '../db/schema';
import { ActiveTab } from '../App';
import { AddHabitModal } from '../components/AddHabitModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { Calendar, CheckSquare, Sparkles, Plus, ArrowRight, Activity, Edit3 } from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed').length;

  const handleEditHabit = (h: Habit) => {
    setHabitToEdit(h);
    setIsAddHabitModalOpen(true);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>🌿 Forest Flow Workspace Overview</h2>
          <p className="subtitle">Calm, high-density summary of habit specifications, workload tasks, and daily execution.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setHabitToEdit(null);
              setIsAddHabitModalOpen(true);
            }}
          >
            <Plus size={14} /> Add Habit
          </button>
          <button className="btn btn-secondary" onClick={() => setIsAddTaskModalOpen(true)}>
            <Plus size={14} /> Add Task
          </button>
          <button className="btn btn-primary" onClick={() => setActiveTab('insights')}>
            <Sparkles size={14} /> Ask AI Analyst
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE HABITS</span>
            <Calendar size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{habits.length}</div>
          <span className="subtitle">Tracked routines</span>
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
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>SYSTEM HEALTH</span>
            <Activity size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>100%</div>
          <span className="subtitle">Local IndexedDB Sync</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Active Habit Specifications</h3>
            <button
              className="btn btn-secondary btn-xs"
              onClick={() => {
                setHabitToEdit(null);
                setIsAddHabitModalOpen(true);
              }}
            >
              <Plus size={12} /> Add Habit
            </button>
          </div>
          {habits.length === 0 ? (
            <p className="subtitle">No habits created yet. Click Add Habit to open specification panel.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {habits.slice(0, 5).map((h) => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div>
                    <strong>{h.name}</strong>
                    <div className="subtitle" style={{ fontSize: '0.725rem' }}>{h.category} {h.startTime ? `(${h.startTime} - ${h.endTime})` : ''}</div>
                  </div>
                  <button className="btn btn-secondary btn-icon btn-xs" title="Edit Habit Specifications" onClick={() => handleEditHabit(h)}>
                    <Edit3 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Workload Tasks</h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setIsAddTaskModalOpen(true)}>
              <Plus size={12} /> Add Task
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="subtitle">No pending tasks recorded. Click Add Task to open specification panel.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <span>{t.title}</span>
                  <span className="subtitle" style={{ color: t.priority === 'critical' ? 'var(--danger)' : 'var(--text-muted)' }}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Modals */}
      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => {
          setIsAddHabitModalOpen(false);
          setHabitToEdit(null);
        }}
        habitToEdit={habitToEdit}
      />
      <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} />
    </div>
  );
};
