import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task, Subtask } from '../db/schema';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskContextualDrawer } from '../components/TaskContextualDrawer';
import { Plus, Trash2, Edit3, CheckSquare, Calendar, CheckCircle2, ChevronRight, Flame } from 'lucide-react';

export const TasksView: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const allSubtasks = useLiveQuery(() => db.subtasks.toArray()) || [];

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Contextual Sidebar Drawer State
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'planned' : 'completed';
    await db.tasks.update(id, {
      status: newStatus as any,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });

    // If task is checked manually, mark all its subtasks completed
    if (newStatus === 'completed') {
      const taskSubs = allSubtasks.filter((s) => s.taskId === id);
      await Promise.all(taskSubs.map((s) => db.subtasks.update(s.id, { completed: true })));
    }
  };

  const handleToggleSubtaskInline = async (subtaskId: string, currentCompleted: boolean, parentTaskId: string) => {
    const nextCompleted = !currentCompleted;
    await db.subtasks.update(subtaskId, { completed: nextCompleted });

    // Inspect remaining subtasks for parent task
    const parentSubs = allSubtasks.map((s) => (s.id === subtaskId ? { ...s, completed: nextCompleted } : s)).filter((s) => s.taskId === parentTaskId);
    const allDone = parentSubs.length > 0 && parentSubs.every((s) => s.completed);

    if (allDone) {
      await db.tasks.update(parentTaskId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const parentTask = tasks.find((t) => t.id === parentTaskId);
      if (parentTask?.status === 'completed' && !allDone) {
        await db.tasks.update(parentTaskId, {
          status: 'planned',
          completedAt: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  const handleOpenDrawer = (t: Task) => {
    setSelectedTaskForDrawer(t);
    setIsDrawerOpen(true);
  };

  const handleEditTask = (t: Task) => {
    setTaskToEdit(t);
    setIsAddTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    await db.tasks.delete(id);
    await db.subtasks.where('taskId').equals(id).delete();
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tasks & Subtasks Management</h2>
          <p className="subtitle">
            Define main objectives, manage subtasks incrementally, and trigger full completion state upon satisfying subtasks.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setTaskToEdit(null);
            setIsAddTaskModalOpen(true);
          }}
        >
          <Plus size={14} /> Create Task & Subtasks
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {tasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <CheckSquare size={36} style={{ color: '#8FAF82', margin: '0 auto 0.75rem auto' }} />
            <h3>No Tasks Registered</h3>
            <p className="subtitle" style={{ maxWidth: '400px', margin: '0.3rem auto 1rem auto' }}>
              Create parent tasks and define incremental subtask steps to track progress toward major objectives.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setTaskToEdit(null);
                setIsAddTaskModalOpen(true);
              }}
            >
              <Plus size={14} /> Add First Task
            </button>
          </div>
        ) : (
          tasks.map((t) => {
            const taskSubs = allSubtasks.filter((s) => s.taskId === t.id);
            const completedSubsCount = taskSubs.filter((s) => s.completed).length;
            const subPct = taskSubs.length > 0 ? Math.round((completedSubsCount / taskSubs.length) * 100) : 0;
            const isFullCompletion = taskSubs.length > 0 && completedSubsCount === taskSubs.length;

            return (
              <div
                key={t.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  border: isFullCompletion || t.status === 'completed' ? '1px solid rgba(82, 118, 83, 0.5)' : '1px solid var(--border-color)',
                  background: isFullCompletion || t.status === 'completed' ? 'rgba(20, 47, 36, 0.95)' : 'var(--bg-secondary)',
                }}
              >
                {/* Main Task Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={t.status === 'completed'}
                      onChange={() => handleToggleTaskStatus(t.id, t.status)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#315D43' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          onClick={() => handleOpenDrawer(t)}
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                            color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}
                        >
                          {t.title}
                        </span>
                        {(isFullCompletion || t.status === 'completed') && (
                          <span style={{ fontSize: '0.7rem', color: '#527653', background: 'rgba(82,118,83,0.2)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle2 size={12} /> Full Completion
                          </span>
                        )}
                      </div>
                      {t.description && <div className="subtitle" style={{ fontSize: '0.775rem' }}>{t.description}</div>}
                    </div>
                  </div>

                  {/* Task Card Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: t.priority === 'critical' ? 'var(--danger-bg)' : 'var(--success-bg)',
                        color: t.priority === 'critical' ? 'var(--danger)' : '#8FAF82',
                        border: `1px solid ${t.priority === 'critical' ? 'var(--danger)' : 'var(--border-color)'}`,
                      }}
                    >
                      {t.priority.toUpperCase()}
                    </span>

                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleOpenDrawer(t)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Inspect Drawer <ChevronRight size={14} />
                    </button>

                    <button className="btn btn-secondary btn-icon btn-xs" title="Edit Task" onClick={() => handleEditTask(t)}>
                      <Edit3 size={12} />
                    </button>

                    <button className="btn btn-danger btn-icon btn-xs" title="Delete Task" onClick={() => handleDeleteTask(t.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Subtask Progress & Inline Checklist */}
                {taskSubs.length > 0 && (
                  <div style={{ background: 'rgba(16, 42, 32, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(160, 190, 160, 0.12)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Subtasks Progress ({completedSubsCount}/{taskSubs.length})</span>
                      <strong style={{ color: isFullCompletion ? '#527653' : '#8FAF82' }}>{subPct}%</strong>
                    </div>

                    <div className="progress-bar-track" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${subPct}%`, background: isFullCompletion ? '#527653' : '#8FAF82' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.35rem', marginTop: '0.2rem' }}>
                      {taskSubs.map((st) => (
                        <label
                          key={st.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontSize: '0.775rem',
                            cursor: 'pointer',
                            color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: st.completed ? 'line-through' : 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtaskInline(st.id, st.completed, t.id)}
                            style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#315D43' }}
                          />
                          <span>{st.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation & Edit Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      {/* Contextual Sidebar Drawer */}
      <TaskContextualDrawer
        task={selectedTaskForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEditTask={handleEditTask}
      />
    </div>
  );
};
