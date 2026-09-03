import React, { useState } from 'react';
import { db } from '../db/schema';
import { X, Plus, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('17:00');
  const [timeRange, setTimeRange] = useState('09:00 - 10:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

    await db.tasks.add({
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      status: 'todo',
      priority,
      dueDate,
      dueTime,
      timeRange,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} /> Dedicated Task Creation Panel
          </h3>
          <button className="btn btn-secondary btn-icon btn-xs" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Complete System Vulnerability Audit..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Task details, requirements, or scope..."
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
              <label className="form-label">Target Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Due Time</label>
              <input
                type="time"
                className="form-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time Range</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 09:00 - 11:00"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Mins</label>
              <input
                type="number"
                min={5}
                className="form-input"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. urgent, dev, security"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={14} /> Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
