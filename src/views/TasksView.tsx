import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { AddTaskModal } from '../components/AddTaskModal';
import { Plus, Trash2, CheckCircle2, Calendar } from 'lucide-react';

export const TasksView: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    await db.tasks.update(id, {
      status: newStatus as any,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
    });
  };

  const handleDeleteTask = async (id: string) => {
    await db.tasks.delete(id);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Tasks & Workload Management</h2>
          <p className="subtitle">Track backlog, active work, critical priorities, and target deadlines.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddTaskModalOpen(true)}>
          <Plus size={14} /> Add Task (Dedicated Panel)
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="subtitle">No tasks created yet. Click Add Task above to create work items.</p>
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
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="subtitle" style={{ fontSize: '0.75rem' }}>Due: {t.dueDate} {t.dueTime || ''}</span>
                <span className="subtitle" style={{ color: t.priority === 'critical' ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{t.priority.toUpperCase()}</span>
                <button className="btn btn-danger btn-icon btn-xs" onClick={() => handleDeleteTask(t.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} />
    </div>
  );
};
