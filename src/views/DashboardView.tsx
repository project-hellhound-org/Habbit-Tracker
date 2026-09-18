import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Habit, Task } from '../db/schema';
import { ActiveTab } from '../App';
import { AddHabitModal } from '../components/AddHabitModal';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskContextualDrawer } from '../components/TaskContextualDrawer';
import {
  Calendar,
  CheckSquare,
  Sparkles,
  Plus,
  ArrowRight,
  Activity,
  Edit3,
  Leaf,
  Trees,
  Flame,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const subtasks = useLiveQuery(() => db.subtasks.toArray()) || [];

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = habitLogs.filter((l) => l.date === todayIso && l.status === 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < todayIso && t.status !== 'completed').length;

  const totalHabitsCount = habits.length || 1;
  const todayProgressPct = habits.length > 0 ? Math.min(Math.round((todayLogs.length / totalHabitsCount) * 100), 100) : 100;

  const handleEditHabit = (h: Habit) => {
    setHabitToEdit(h);
    setIsAddHabitModalOpen(true);
  };

  const handleOpenTaskDrawer = (t: Task) => {
    setSelectedTaskForDrawer(t);
    setIsDrawerOpen(true);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Editorial Forest Flow Hero Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 47, 36, 0.95) 0%, rgba(24, 56, 42, 0.9) 100%)',
          border: '1px solid rgba(160, 190, 160, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '580px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8FAF82', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            <Trees size={16} /> FOREST FLOW WORKSPACE
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F3F1E7', letterSpacing: '-0.03em', fontFamily: 'var(--font-serif)', margin: 0, lineHeight: 1.2 }}>
            Calm, focused, & modern productivity surrounded by nature.
          </h1>
          <p className="subtitle" style={{ color: '#C5D6B9', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Track habits, orchestrate workload subtasks, and review daily progress with local IndexedDB privacy.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              className="btn btn-primary"
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
            <button className="btn btn-paper" onClick={() => setActiveTab('insights')}>
              <Sparkles size={14} /> AI Assistant
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 42, 32, 0.7)', border: '1px solid rgba(160, 190, 160, 0.2)', padding: '1.25rem 1.75rem', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.725rem', color: '#8FAF82', fontWeight: 700, letterSpacing: '0.05em' }}>TODAY'S EXECUTION</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F3F1E7', marginTop: '0.2rem' }}>{todayProgressPct}%</div>
          <div className="progress-bar-track" style={{ width: '120px', height: '6px', marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${todayProgressPct}%`, background: '#527653' }} />
          </div>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8FAF82', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>ACTIVE ROUTINES</span>
            <Leaf size={16} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F3F1E7' }}>{habits.length}</div>
          <span className="subtitle">Tracked habit specifications</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8FAF82', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>TASK WORKLOAD</span>
            <CheckSquare size={16} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F3F1E7' }}>
            {completedTasks} / {tasks.length}
          </div>
          <span className="subtitle" style={{ color: overdueTasks > 0 ? 'var(--danger)' : '#C5D6B9' }}>
            {overdueTasks > 0 ? `${overdueTasks} Overdue Tasks` : '0 Overdue Tasks'}
          </span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8FAF82', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>SYSTEM HEALTH</span>
            <Activity size={16} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#F3F1E7' }}>100%</div>
          <span className="subtitle">Local IndexedDB Engine</span>
        </div>
      </div>

      {/* Main Content Split View (Active Habits & Tasks) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Active Habits Section */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F3F1E7' }}>
              <Leaf size={16} style={{ color: '#8FAF82' }} /> Habit Specifications
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('habits')}>
              View All <ArrowRight size={12} />
            </button>
          </div>

          {habits.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="subtitle">No habit specifications registered yet.</p>
              <button
                className="btn btn-primary btn-xs"
                style={{ marginTop: '0.75rem' }}
                onClick={() => {
                  setHabitToEdit(null);
                  setIsAddHabitModalOpen(true);
                }}
              >
                <Plus size={12} /> Add First Habit
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {habits.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    background: '#102A20',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#F3F1E7', display: 'block' }}>{h.name}</strong>
                    <span className="subtitle" style={{ fontSize: '0.725rem', color: '#C5D6B9' }}>
                      {h.category} {h.startTime ? `• ${h.startTime} ${h.amPm || ''}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8FAF82', background: 'rgba(82, 118, 83, 0.2)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                      {h.frequencyMode === 'everyday' ? 'Everyday' : 'Custom'}
                    </span>
                    <button className="btn btn-secondary btn-icon btn-xs" title="Edit Specification" onClick={() => handleEditHabit(h)}>
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workload Tasks Section */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F3F1E7' }}>
              <CheckSquare size={16} style={{ color: '#F59E0B' }} /> Pending Tasks & Subtasks
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('tasks')}>
              View All <ArrowRight size={12} />
            </button>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p className="subtitle">No pending tasks recorded.</p>
              <button className="btn btn-primary btn-xs" style={{ marginTop: '0.75rem' }} onClick={() => setIsAddTaskModalOpen(true)}>
                <Plus size={12} /> Add First Task
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {tasks.slice(0, 5).map((t) => {
                const taskSubs = subtasks.filter((s) => s.taskId === t.id);
                const completedSubs = taskSubs.filter((s) => s.completed).length;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTaskDrawer(t)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      background: '#102A20',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <strong style={{ color: t.status === 'completed' ? 'var(--text-muted)' : '#F3F1E7', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                        {t.title}
                      </strong>
                      {taskSubs.length > 0 && (
                        <span className="subtitle" style={{ display: 'block', fontSize: '0.725rem', color: '#8FAF82' }}>
                          Subtasks: {completedSubs}/{taskSubs.length} completed
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          background: t.priority === 'critical' ? 'var(--danger-bg)' : 'rgba(82, 118, 83, 0.2)',
                          color: t.priority === 'critical' ? 'var(--danger)' : '#8FAF82',
                        }}
                      >
                        {t.priority}
                      </span>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals & Drawers */}
      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => {
          setIsAddHabitModalOpen(false);
          setHabitToEdit(null);
        }}
        habitToEdit={habitToEdit}
      />
      <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} />
      <TaskContextualDrawer
        task={selectedTaskForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEditTask={() => {
          setIsDrawerOpen(false);
          setIsAddTaskModalOpen(true);
        }}
      />
    </div>
  );
};
