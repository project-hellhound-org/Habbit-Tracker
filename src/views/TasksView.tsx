import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Task } from '../db/schema';
import { AddTaskModal } from '../components/AddTaskModal';
import { Plus, Trash2, Edit3, Clock, Calendar } from 'lucide-react';

export const TasksView: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'planned' : 'completed';
    await db.tasks.update(id, {
      status: newStatus as any,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
    });
  };

  const handleEditTask = (t: Task) => {
    setTaskToEdit(t);
    setIsAddTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    await db.tasks.delete(id);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Tasks & Workload Management</h2>
          <p className="subtitle">Track tasks, custom frequency targets, priority levels, and edit details post-creation.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setTaskToEdit(null);
            setIsAddTaskModalOpen(true);
          }}
        >
          <Plus size={14} /> Create Task
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p className="subtitle">No tasks created yet. Click Create Task above to add work items.</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={t.status === 'completed'}
                  onChange={() => handleToggleTaskStatus(t.id, t.status)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div>
                  <span style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 600 }}>
                    {t.title}
                  </span>
                  {t.description && <div className="subtitle" style={{ fontSize: '0.725rem' }}>{t.description}</div>}
                  <div className="subtitle" style={{ fontSize: '0.7rem', marginTop: '0.15rem' }}>
                    Start Date: {t.startDate || 'Today'} | Frequency: {t.frequency || 'Daily'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="subtitle" style={{ color: t.priority === 'critical' ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{t.priority.toUpperCase()}</span>
                <button className="btn btn-secondary btn-icon btn-xs" title="Edit Task" onClick={() => handleEditTask(t)}>
                  <Edit3 size={12} />
                </button>
                <button className="btn btn-danger btn-icon btn-xs" title="Delete Task" onClick={() => handleDeleteTask(t.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
