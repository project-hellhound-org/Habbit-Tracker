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
  ChevronRight,
  Clock,
  Target
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
    <div className="view-container">
      {/* Editorial Hero Banner */}
      <div
        className="hero-stat-card flip-card-item"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            <Trees size={18} /> FOREST FLOW PRODUCTIVITY DESKTOP
          </div>
          <h1 style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontFamily: 'var(--font-serif)', margin: 0, lineHeight: 1.2 }}>
            Calm, focused, & modern productivity surrounded by nature.
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.65rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Orchestrate daily routines, track task subtasks, and analyze performance with high-precision local IndexedDB privacy.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setHabitToEdit(null);
                setIsAddHabitModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Habit
            </button>
            <button className="btn btn-secondary" onClick={() => setIsAddTaskModalOpen(true)}>
              <Plus size={16} /> Add Task
            </button>
            <button className="btn btn-paper" onClick={() => setActiveTab('insights')}>
              <Sparkles size={16} /> AI Analyst
            </button>
          </div>
        </div>

        {/* Circular Progress Gauge Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(13, 34, 26, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-glow)',
            padding: '1.5rem 2.25rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>
            TODAY'S EXECUTION
          </span>
          <div className="hero-stat-number" style={{ marginTop: '0.25rem', color: 'var(--accent-secondary)' }}>
            {todayProgressPct}%
          </div>
          <div className="progress-bar-track" style={{ width: '140px', height: '8px', marginTop: '0.65rem' }}>
            <div className="progress-bar-fill" style={{ width: `${todayProgressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Prominent Smart AI Insight Engine Command Banner */}
      <div
        className="liquid-panel flip-card-item"
        onClick={() => setActiveTab('insights')}
        style={{
          padding: '1.6rem 2rem',
          background: 'linear-gradient(135deg, rgba(16, 47, 34, 0.95) 0%, rgba(22, 58, 41, 0.85) 100%)',
          border: '1.5px solid var(--accent-primary)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 30px rgba(47, 143, 91, 0.22)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 200ms ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 6px 18px rgba(87, 185, 120, 0.35)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                Smart AI Insight Engine
              </strong>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(87, 185, 120, 0.2)', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                &lt; 5s Fast Streaming
              </span>
            </div>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Real-time cognitive pattern evaluation, focus metrics diagnostic, and habit streak optimization copilot.
            </p>
          </div>
        </div>
        <button className="btn btn-primary" style={{ gap: '0.5rem', padding: '0.75rem 1.4rem', fontSize: '0.925rem', whiteSpace: 'nowrap' }}>
          Launch Insight Engine <ArrowRight size={16} />
        </button>
      </div>

      {/* Overview Metric Badges Grid */}
      <div className="stat-badge-grid">
        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>ACTIVE ROUTINES</span>
            <Leaf size={18} />
          </div>
          <div className="hero-stat-number">{habits.length}</div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Tracked habit specifications
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>TASK WORKLOAD</span>
            <CheckSquare size={18} />
          </div>
          <div className="hero-stat-number">
            {completedTasks} <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {tasks.length}</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: overdueTasks > 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: '0.2rem', display: 'block', fontWeight: overdueTasks > 0 ? 700 : 400 }}>
            {overdueTasks > 0 ? `⚠️ ${overdueTasks} Overdue Tasks` : '✓ 0 Overdue Tasks'}
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>SYSTEM ENGINE</span>
            <Activity size={18} />
          </div>
          <div className="hero-stat-number">100%</div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            IndexedDB offline latency &lt;5ms
          </span>
        </div>
      </div>

      {/* Main Content Split View (Active Habits & Tasks) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Active Habits Section */}
        <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Leaf size={18} style={{ color: 'var(--accent-secondary)' }} /> Habit Specifications
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('habits')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          {habits.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No habit specifications registered yet.</p>
              <button
                className="btn btn-primary btn-xs"
                style={{ marginTop: '0.85rem' }}
                onClick={() => {
                  setHabitToEdit(null);
                  setIsAddHabitModalOpen(true);
                }}
              >
                <Plus size={14} /> Add First Habit
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {habits.slice(0, 6).map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                    background: 'rgba(13, 34, 26, 0.65)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block' }}>{h.name}</strong>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <span>{h.category}</span>
                      {h.startTime && <span>• <Clock size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {h.startTime} {h.amPm || ''}</span>}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.725rem', color: 'var(--accent-secondary)', background: 'rgba(82, 118, 83, 0.2)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                      {h.frequencyMode === 'everyday' ? 'Everyday' : 'Custom'}
                    </span>
                    <button className="btn btn-secondary btn-icon btn-xs" title="Edit Specification" onClick={() => handleEditHabit(h)}>
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workload Tasks Section */}
        <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <CheckSquare size={18} style={{ color: 'var(--warning)' }} /> Workload Tasks & Subtasks
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('tasks')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No pending tasks recorded.</p>
              <button className="btn btn-primary btn-xs" style={{ marginTop: '0.85rem' }} onClick={() => setIsAddTaskModalOpen(true)}>
                <Plus size={14} /> Add First Task
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {tasks.slice(0, 6).map((t) => {
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
                      padding: '0.8rem 1rem',
                      background: 'rgba(13, 34, 26, 0.65)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                        {t.title}
                      </strong>
                      {taskSubs.length > 0 && (
                        <span style={{ display: 'block', fontSize: '0.775rem', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
                          Subtasks: {completedSubs}/{taskSubs.length} completed
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          background: t.priority === 'critical' ? 'var(--danger-bg)' : 'rgba(82, 118, 83, 0.2)',
                          color: t.priority === 'critical' ? 'var(--danger)' : 'var(--accent-secondary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.priority}
                      </span>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
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

