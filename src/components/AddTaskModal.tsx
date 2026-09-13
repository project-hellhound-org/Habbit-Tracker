import React, { useState, useEffect } from 'react';
import { db, Task } from '../db/schema';
import { X, Plus, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [frequency, setFrequency] = useState<'once_a_week' | 'daily' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]); // 0=Sun..6=Sat
  const [startDate, setStartDate] = useState(todayStr);

  const daysOfWeek = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 0 },
  ];

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'medium');
      setFrequency(taskToEdit.frequency || 'daily');
      setCustomDays(taskToEdit.customDays || [1, 2, 3, 4, 5]);
      setStartDate(taskToEdit.startDate || todayStr);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setFrequency('daily');
      setCustomDays([1, 2, 3, 4, 5]);
      setStartDate(todayStr);
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayVal: number) => {
    if (customDays.includes(dayVal)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter((d) => d !== dayVal));
      }
    } else {
      setCustomDays([...customDays, dayVal].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      await db.tasks.update(taskToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        startDate,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.tasks.add({
        id: `task-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        status: 'planned',
        priority,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        startDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <Calendar size={18} /> {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button className="btn btn-secondary btn-icon btn-xs" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. System Architecture Security Review, Refactor Components..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Rationale & Scope</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Task objectives, scope, or delivery specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Frequency Selector: Once a week, Daily, or Custom Mon-Sun */}
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${frequency === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setFrequency('daily')}
              >
                Daily
              </button>
              <button
                type="button"
                className={`btn ${frequency === 'once_a_week' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setFrequency('once_a_week')}
              >
                Once a Week
              </button>
              <button
                type="button"
                className={`btn ${frequency === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setFrequency('custom')}
              >
                Custom Days
              </button>
            </div>

            {frequency === 'custom' && (
              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                {daysOfWeek.map((d) => {
                  const selected = customDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: selected ? 'var(--button-primary-bg)' : 'var(--bg-primary)',
                        color: selected ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={14} /> {taskToEdit ? 'Save Task Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
