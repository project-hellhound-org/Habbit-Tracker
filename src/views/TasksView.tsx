import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task, Subtask } from '../db/schema';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskContextualDrawer } from '../components/TaskContextualDrawer';
import { Plus, Trash2, Edit3, CheckSquare, Calendar, CheckCircle2, ChevronRight, Flame, AlertTriangle, Layers } from 'lucide-react';

export const TasksView: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const allSubtasks = useLiveQuery(() => db.subtasks.toArray()) || [];

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Contextual Sidebar Drawer State
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const criticalTasksCount = tasks.filter((t) => t.priority === 'critical' && t.status !== 'completed').length;
  const completedSubtasksCount = allSubtasks.filter((s) => s.completed).length;
  const totalSubtasksCount = allSubtasks.length || 1;
  const subtasksOverallPct = allSubtasks.length > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 100;

  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'planned' : 'completed';
    await db.tasks.update(id, {
      status: newStatus as any,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });

    if (newStatus === 'completed') {
      const taskSubs = allSubtasks.filter((s) => s.taskId === id);
      await Promise.all(taskSubs.map((s) => db.subtasks.update(s.id, { completed: true })));
    }
  };

  const handleToggleSubtaskInline = async (subtaskId: string, currentCompleted: boolean, parentTaskId: string) => {
    const nextCompleted = !currentCompleted;
    await db.subtasks.update(subtaskId, { completed: nextCompleted });

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
    <div className="view-container">
      {/* Header Bar */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Tasks & Subtasks Management</h1>
          <p className="view-header-subtitle">
            Organize main objectives, manage subtask steps, and automatically trigger completion.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setTaskToEdit(null);
            setIsAddTaskModalOpen(true);
          }}
        >
          <Plus size={16} /> Create Task & Subtasks
        </button>
      </div>

      {/* Summary Stat Badges */}
      <div className="stat-badge-grid">
        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>WORKLOAD OBJECTIVES</span>
            <CheckSquare size={18} />
          </div>
          <div className="hero-stat-number">{tasks.length}</div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Total active parent tasks
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>COMPLETED TASKS</span>
            <CheckCircle2 size={18} />
          </div>
          <div className="hero-stat-number">
            {completedTasksCount} <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {tasks.length}</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--accent-secondary)', marginTop: '0.2rem', display: 'block' }}>
            Finished objectives
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>SUBTASKS PROGRESS</span>
            <Layers size={18} />
          </div>
          <div className="hero-stat-number" style={{ color: 'var(--accent-secondary)' }}>
            {subtasksOverallPct}%
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            {completedSubtasksCount} of {allSubtasks.length} subtasks done
          </span>
        </div>
      </div>

      {/* Task Cards Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tasks.length === 0 ? (
          <div className="liquid-panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
            <CheckSquare size={40} style={{ color: 'var(--accent-secondary)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Tasks Registered</h3>
            <p style={{ maxWidth: '440px', margin: '0.5rem auto 1.25rem auto', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Create parent tasks and define incremental subtask steps to track progress toward major objectives.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setTaskToEdit(null);
                setIsAddTaskModalOpen(true);
              }}
            >
              <Plus size={16} /> Add First Task
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
                className="liquid-panel flip-card-item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.5rem',
                  border: isFullCompletion || t.status === 'completed' ? '1px solid var(--border-glow)' : '1px solid var(--border-color)',
                }}
              >
                {/* Main Task Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
                    <input
                      type="checkbox"
                      checked={t.status === 'completed'}
                      onChange={() => handleToggleTaskStatus(t.id, t.status)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span
                          onClick={() => handleOpenDrawer(t)}
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                            color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}
                        >
                          {t.title}
                        </span>
                        {(isFullCompletion || t.status === 'completed') && (
                          <span style={{ fontSize: '0.725rem', color: 'var(--accent-secondary)', background: 'rgba(82, 118, 83, 0.25)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} /> Full Completion
                          </span>
                        )}
                      </div>
                      {t.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>{t.description}</p>}
                    </div>
                  </div>

                  {/* Task Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: t.priority === 'critical' ? 'var(--danger-bg)' : 'rgba(82, 118, 83, 0.2)',
                        color: t.priority === 'critical' ? 'var(--danger)' : 'var(--accent-secondary)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t.priority}
                    </span>

                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleOpenDrawer(t)}
                    >
                      Inspect Drawer <ChevronRight size={15} />
                    </button>

                    <button className="btn btn-secondary btn-icon" title="Edit Task" onClick={() => handleEditTask(t)}>
                      <Edit3 size={15} />
                    </button>

                    <button className="btn btn-danger btn-icon" title="Delete Task" onClick={() => handleDeleteTask(t.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Subtasks Progress & Inline Checklist */}
                {taskSubs.length > 0 && (
                  <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Subtasks Progress ({completedSubsCount}/{taskSubs.length})</span>
                      <strong style={{ color: isFullCompletion ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>{subPct}%</strong>
                    </div>

                    <div className="progress-bar-track" style={{ height: '7px' }}>
                      <div className="progress-bar-fill" style={{ width: `${subPct}%` }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginTop: '0.35rem' }}>
                      {taskSubs.map((st) => (
                        <label
                          key={st.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem',
                            fontSize: '0.825rem',
                            cursor: 'pointer',
                            color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: st.completed ? 'line-through' : 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtaskInline(st.id, st.completed, t.id)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
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

