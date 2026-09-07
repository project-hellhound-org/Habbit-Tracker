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

  // Start & End Date/Time Selection Column
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState('17:00');

  // Daily Time Allocation Limit Field
  const [dailyTimeLimitHours, setDailyTimeLimitHours] = useState<number>(2);

  // Dedicated Completion Time (Duration) Field
  const [completionHours, setCompletionHours] = useState<number>(2);
  const [completionMinutes, setCompletionMinutes] = useState<number>(30);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const totalDurationMinutes = (Number(completionHours) || 0) * 60 + (Number(completionMinutes) || 0);

    await db.tasks.add({
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      status: 'planned',
      priority,
      startDate,
      startTime,
      endDate,
      endTime,
      dueDate: endDate,
      dueTime: endTime,
      dailyTimeLimitMinutes: Number(dailyTimeLimitHours) * 60,
      completionTimeMinutes: totalDurationMinutes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
            <Calendar size={18} /> Dedicated Task Creation Specification
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
              placeholder="e.g. Architecture Security Review, System Optimization..."
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

          <div className="form-group">
            <label className="form-label">Priority Level</label>
            <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
          </div>

          {/* Start and End Date/Time Selection Column */}
          <div style={{ padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={14} /> Start & End Schedule Window Column
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Daily Time Allocation Limit */}
          <div className="form-group">
            <label className="form-label">Daily Time Allocation Limit (Hours per Day)</label>
            <input
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              className="form-input"
              value={dailyTimeLimitHours}
              onChange={(e) => setDailyTimeLimitHours(Number(e.target.value))}
            />
          </div>

          {/* Dedicated Completion Time (Duration) */}
          <div className="form-group">
            <label className="form-label">Completion Time (Duration)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span className="subtitle" style={{ fontSize: '0.75rem' }}>Hours</span>
                <input
                  type="number"
                  min={0}
                  max={24}
                  className="form-input"
                  value={completionHours}
                  onChange={(e) => setCompletionHours(Number(e.target.value))}
                />
              </div>

              <div>
                <span className="subtitle" style={{ fontSize: '0.75rem' }}>Minutes</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="form-input"
                  value={completionMinutes}
                  onChange={(e) => setCompletionMinutes(Number(e.target.value))}
                />
              </div>
            </div>
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
