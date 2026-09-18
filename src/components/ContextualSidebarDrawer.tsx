import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task, Habit, Subtask } from '../db/schema';
import { format } from 'date-fns';
import {
  X,
  CheckSquare,
  Calendar,
  Sparkles,
  BarChart2,
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Clock,
  Tag,
  AlertCircle
} from 'lucide-react';
import { ActiveTab } from '../App';

interface ContextualSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  selectedTaskId?: string | null;
  selectedHabitId?: string | null;
}

export const ContextualSidebarDrawer: React.FC<ContextualSidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  selectedTaskId,
  selectedHabitId,
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const todayIso = format(new Date(), 'yyyy-MM-dd');

  // Queries
  const task = useLiveQuery(
    async () => {
      if (!selectedTaskId) return undefined;
      return await db.tasks.get(selectedTaskId);
    },
    [selectedTaskId]
  );

  const habit = useLiveQuery(
    async () => {
      if (!selectedHabitId) return undefined;
      return await db.habits.get(selectedHabitId);
    },
    [selectedHabitId]
  );

  const subtasks = useLiveQuery(
    async () => {
      if (!selectedTaskId) return [];
      return await db.subtasks.where('taskId').equals(selectedTaskId).sortBy('order');
    },
    [selectedTaskId]
  ) || [];

  const allHabits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const allLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const todayLogs = allLogs.filter((l) => l.date === todayIso && l.status === 'completed');

  const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const dueTodayTasks = allTasks.filter((t) => t.dueDate === todayIso || t.startDate === todayIso);

  // Toggle subtask
  const handleToggleSubtask = async (st: Subtask) => {
    await db.subtasks.update(st.id, { completed: !st.completed });
    if (selectedTaskId) {
      const updatedSubtasks = await db.subtasks.where('taskId').equals(selectedTaskId).toArray();
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
      if (allDone) {
        await db.tasks.update(selectedTaskId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Add subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTaskId) return;
    const count = subtasks.length;
    await db.subtasks.add({
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      taskId: selectedTaskId,
      title: newSubtaskTitle.trim(),
      completed: false,
      order: count + 1,
    });
    setNewSubtaskTitle('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Scrim Overlay */}
      <div className="drawer-scrim" onClick={onClose} />

      {/* Slide-out Sidebar Drawer */}
      <div className="contextual-drawer-right open">
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(143, 175, 130, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-secondary)',
              }}
            >
              {selectedTaskId || activeTab === 'tasks' ? (
                <CheckSquare size={18} />
              ) : selectedHabitId || activeTab === 'habits' ? (
                <Calendar size={18} />
              ) : activeTab === 'analytics' ? (
                <BarChart2 size={18} />
              ) : activeTab === 'insights' ? (
                <Sparkles size={18} />
              ) : (
                <BookOpen size={18} />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {selectedTaskId && task
                  ? 'Task Context'
                  : selectedHabitId && habit
                  ? 'Habit Detail'
                  : activeTab === 'tasks'
                  ? 'Task Execution Sidebar'
                  : activeTab === 'habits'
                  ? 'Habit Logs & Streaks'
                  : activeTab === 'calendar'
                  ? 'Today\'s Agenda'
                  : activeTab === 'analytics'
                  ? 'Performance Snapshot'
                  : 'Contextual Assistant'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Adaptive Contextual Insights
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-icon btn-secondary"
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="drawer-body">
          {/* 1. TASK CONTEXT VIEW */}
          {(selectedTaskId && task) || activeTab === 'tasks' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {task ? (
                <div className="liquid-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background:
                          task.priority === 'critical'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : task.priority === 'high'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(82, 118, 83, 0.2)',
                        color:
                          task.priority === 'critical'
                            ? 'var(--danger)'
                            : task.priority === 'high'
                            ? 'var(--warning)'
                            : 'var(--accent-secondary)',
                      }}
                    >
                      {task.priority} Priority
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Status: <strong style={{ color: 'var(--text-primary)' }}>{task.status}</strong>
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {task.title}
                  </h4>
                  {task.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                      {task.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    {task.dueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} />
                        <span>Due: {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}</span>
                      </div>
                    )}
                    {task.frequency && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Tag size={14} />
                        <span>Freq: {task.frequency}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="liquid-panel">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Tasks Due Today ({dueTodayTasks.length})
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Select any task from the main list to view subtasks and breakdown details here.
                  </p>
                </div>
              )}

              {/* Subtasks Management */}
              {selectedTaskId && (
                <div className="liquid-panel">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtasks ({subtasks.filter(s => s.completed).length} / {subtasks.length})</span>
                  </h4>

                  <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add step / subtask..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary btn-xs">
                      <Plus size={16} />
                      <span>Add</span>
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {subtasks.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No subtasks added yet. Break this objective down into smaller actionable steps!
                      </p>
                    ) : (
                      subtasks.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleToggleSubtask(st)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: st.completed ? 'rgba(82, 118, 83, 0.15)' : 'rgba(13, 34, 26, 0.6)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 180ms ease',
                          }}
                        >
                          {st.completed ? (
                            <CheckCircle2 size={18} style={{ color: 'var(--accent-secondary)' }} />
                          ) : (
                            <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                          )}
                          <span
                            style={{
                              fontSize: '0.85rem',
                              color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: st.completed ? 'line-through' : 'none',
                            }}
                          >
                            {st.title}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : selectedHabitId || activeTab === 'habits' ? (
            /* 2. HABIT CONTEXT VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="liquid-panel">
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {habit ? habit.name : 'Today\'s Habit Execution'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {habit?.description || `${todayLogs.length} of ${allHabits.length} habits logged for today.`}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(13, 34, 26, 0.6)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Daily Rate</span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-secondary)', margin: '0.2rem 0 0 0' }}>
                      {Math.round((todayLogs.length / (allHabits.length || 1)) * 100)}%
                    </h3>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(13, 34, 26, 0.6)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active Habits</span>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0.2rem 0 0 0' }}>
                      {allHabits.length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 3. GENERAL / ANALYTICS / INSIGHTS VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="liquid-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <Flame size={18} style={{ color: 'var(--warning)' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Forest Flow Assistant
                  </h4>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  This contextual drawer automatically presents active subtasks, streak analytics, and task timelines based on what you select.
                </p>
              </div>

              <div className="liquid-panel">
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  System Health & State
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>• Current Tab: <strong style={{ color: 'var(--text-primary)' }}>{activeTab}</strong></div>
                  <div>• Active Database: <strong style={{ color: 'var(--accent-secondary)' }}>Dexie IndexedDB v3</strong></div>
                  <div>• AI Latency: <strong style={{ color: 'var(--accent-secondary)' }}>Optimized (&lt;150ms)</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
