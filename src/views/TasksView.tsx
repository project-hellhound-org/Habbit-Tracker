import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const TasksView: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await db.tasks.add({
      id: `task-${Date.now()}`,
      title: title.trim(),
      status: 'todo',
      priority,
      dueDate,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setTitle('');
  };

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
      <div>
        <h2>Tasks & Workload Management</h2>
        <p className="subtitle">Track backlog, active work, critical priorities, and target deadlines.</p>
      </div>

      <div className="glass-card">
        <h3>Add Work Item</h3>
        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
          <input
            type="date"
            className="form-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Plus size={14} /> Add Task
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tasks.map((t) => (
          <div key={t.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                checked={t.status === 'completed'}
                onChange={() => handleToggleTaskStatus(t.id, t.status)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {t.title}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="subtitle" style={{ fontSize: '0.75rem' }}>Due: {t.dueDate}</span>
              <span className="subtitle" style={{ color: t.priority === 'critical' ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{t.priority.toUpperCase()}</span>
              <button className="btn btn-danger btn-icon btn-xs" onClick={() => handleDeleteTask(t.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
