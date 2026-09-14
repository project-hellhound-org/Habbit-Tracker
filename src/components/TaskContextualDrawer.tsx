import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task, Subtask } from '../db/schema';
import { X, CheckSquare, Plus, Trash2, CheckCircle2, Sparkles, Edit3, Calendar, Flame } from 'lucide-react';

interface TaskContextualDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEditTask: (task: Task) => void;
}

export const TaskContextualDrawer: React.FC<TaskContextualDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onEditTask,
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showFullCompletionCelebration, setShowFullCompletionCelebration] = useState(false);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live Query of Subtasks for the selected parent task
  const subtasks = useLiveQuery(
    async () => {
      if (!task?.id) return [];
      return await db.subtasks.where('taskId').equals(task.id).sortBy('order');
    },
    [task?.id]
  ) || [];

  if (!isOpen || !task) return null;

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const totalSubtasksCount = subtasks.length;
  const completionPct = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;
  const isFullyCompleted = totalSubtasksCount > 0 && completedSubtasksCount === totalSubtasksCount;

  // Toggle individual subtask completion & auto-trigger full completion state
  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;
    await db.subtasks.update(subtaskId, { completed: nextCompleted });

    // Inspect updated subtask states
    const updatedSubtasks = subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: nextCompleted } : s));
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);

    if (allDone) {
      // Mark parent task completed
      await db.tasks.update(task.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setShowFullCompletionCelebration(true);
      setTimeout(() => setShowFullCompletionCelebration(false), 2500);
    } else if (task.status === 'completed' && !allDone) {
      // Revert parent task status if a subtask is unchecked
      await db.tasks.update(task.id, {
        status: 'planned',
        completedAt: null,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task.id) return;
    await db.subtasks.add({
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: task.id,
      title: newSubtaskTitle.trim(),
      completed: false,
      order: subtasks.length,
    });
    setNewSubtaskTitle('');

    // If task was completed, adding an uncompleted subtask resets status to planned
    if (task.status === 'completed') {
      await db.tasks.update(task.id, { status: 'planned', completedAt: null });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await db.subtasks.delete(subtaskId);
  };

  return (
    <>
      {/* Scrim Overlay */}
      <div className="drawer-scrim" onClick={onClose} />

      {/* Contextual Sidebar Drawer (Right Panel) */}
      <aside className={`contextual-drawer-right ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(160, 190, 160, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 42, 32, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={20} style={{ color: '#8FAF82' }} />
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Task Specifications</h3>
          </div>
          <button className="btn btn-secondary btn-icon btn-xs" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Objective Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                {task.title}
              </h2>
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  background: task.priority === 'critical' ? 'var(--danger-bg)' : 'var(--success-bg)',
                  color: task.priority === 'critical' ? 'var(--danger)' : '#8FAF82',
                  border: `1px solid ${task.priority === 'critical' ? 'var(--danger)' : 'var(--border-color)'}`,
                  textTransform: 'uppercase',
                }}
              >
                {task.priority}
              </span>
            </div>

            {task.description && (
              <p className="subtitle" style={{ fontSize: '0.85rem', color: '#C5D6B9', lineHeight: '1.5' }}>
                {task.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={13} /> Start: {task.startDate || 'Today'}
              </span>
              <span>Frequency: {task.frequency || 'Daily'}</span>
            </div>
          </div>

          {/* Full Completion Celebration Banner */}
          {(isFullyCompleted || showFullCompletionCelebration || task.status === 'completed') && (
            <div
              className="splash-reveal"
              style={{
                padding: '0.85rem 1rem',
                background: 'rgba(82, 118, 83, 0.25)',
                border: '1px solid #527653',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#F3F1E7',
              }}
            >
              <Flame size={24} style={{ color: '#F59E0B' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block', color: '#FFFFFF' }}>Primary Objective Satisfied! 🎉</strong>
                <span style={{ fontSize: '0.75rem', color: '#C5D6B9' }}>
                  All subtasks completed — main task marked as 100% completed.
                </span>
              </div>
            </div>
          )}

          {/* Incremental Subtasks Progress Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(16, 42, 32, 0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <CheckSquare size={16} style={{ color: '#8FAF82' }} /> Subtasks Progress
              </h4>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isFullyCompleted ? '#527653' : '#8FAF82' }}>
                {completedSubtasksCount} / {totalSubtasksCount} ({completionPct}%)
              </span>
            </div>

            {/* Subtask Progress Track */}
            <div className="progress-bar-track" style={{ height: '8px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${completionPct}%`,
                  background: isFullyCompleted ? '#527653' : '#8FAF82',
                }}
              />
            </div>

            {/* Subtask Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.3rem' }}>
              {subtasks.length === 0 ? (
                <span className="subtitle" style={{ fontSize: '0.775rem', fontStyle: 'italic' }}>
                  No subtasks defined. Add incremental steps below.
                </span>
              ) : (
                subtasks.map((st) => (
                  <div
                    key={st.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(20, 47, 36, 0.85)',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${st.completed ? 'rgba(82, 118, 83, 0.4)' : 'var(--border-color)'}`,
                      fontSize: '0.825rem',
                      transition: 'all 180ms ease',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        cursor: 'pointer',
                        flex: 1,
                        textDecoration: st.completed ? 'line-through' : 'none',
                        color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id, st.completed)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#315D43' }}
                      />
                      <span>{st.title}</span>
                    </label>

                    <button
                      className="btn btn-danger btn-icon btn-xs"
                      title="Delete Subtask"
                      onClick={() => handleDeleteSubtask(st.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Incremental Subtask Input */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, fontSize: '0.8rem' }}
                placeholder="Add new subtask step..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button className="btn btn-primary btn-xs" onClick={handleAddSubtask}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(160, 190, 160, 0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            background: 'rgba(16, 42, 32, 0.9)',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => {
              onEditTask(task);
              onClose();
            }}
          >
            <Edit3 size={14} /> Edit Task Specification
          </button>

          <button className="btn btn-primary" onClick={onClose}>
            Close Drawer
          </button>
        </div>
      </aside>
    </>
  );
};
