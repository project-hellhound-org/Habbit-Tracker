import React, { useState, useEffect } from 'react';
import { db, Habit } from '../db/schema';
import { X, Plus, Save, Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, habitToEdit }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Fitness & Health' | 'Learning & Growth' | 'Work & Projects'>('Fitness & Health');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom_days'>('daily');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [difficulty, setDifficulty] = useState('medium');

  // Mini Calendar Inspection State
  const [previewMonth, setPreviewMonth] = useState(new Date());

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name || '');
      setDescription(habitToEdit.description || '');
      setCategory((habitToEdit.category as any) || 'Fitness & Health');
      setFrequency(habitToEdit.frequency || 'daily');
      setStartDate(habitToEdit.startDate || todayStr);
      setEndDate(habitToEdit.endDate || '');
      setStartTime(habitToEdit.startTime || '08:00');
      setEndTime(habitToEdit.endTime || '09:00');
      setDifficulty(habitToEdit.difficulty || 'medium');
    } else {
      setName('');
      setDescription('');
      setCategory('Fitness & Health');
      setFrequency('daily');
      setStartDate(todayStr);
      setEndDate('');
      setStartTime('08:00');
      setEndTime('09:00');
      setDifficulty('medium');
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (habitToEdit) {
      await db.habits.update(habitToEdit.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        frequency,
        startDate,
        endDate: endDate || undefined,
        startTime,
        endTime,
        difficulty,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.habits.add({
        id: `habit-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        category,
        frequency,
        targetDaysPerWeek: 7,
        startDate,
        endDate: endDate || undefined,
        startTime,
        endTime,
        color: '#ffffff',
        difficulty,
        archived: 0,
        createdAt: new Date().toISOString(),
      });
    }

    onClose();
  };

  // Embedded Calendar View Days calculation
  const mStart = startOfMonth(previewMonth);
  const mEnd = endOfMonth(previewMonth);
  const previewDays = eachDayOfInterval({ start: mStart, end: mEnd });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '680px', display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.25rem', background: 'var(--bg-secondary)' }}>
        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Sparkles size={16} /> {habitToEdit ? 'Edit Habit Specification' : 'Add Habit Specification'}
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Habit Name *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Daily Strength Training, Deep Reading..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Core Purpose</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Habit rationale and execution guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                <option value="Fitness & Health">Fitness & Health</option>
                <option value="Learning & Growth">Learning & Growth</option>
                <option value="Work & Projects">Work & Projects</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-select" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                <option value="daily">Everyday (Daily)</option>
                <option value="weekly">Weekly Target</option>
              </select>
            </div>
          </div>

          {/* Flexible Scheduling Option: Specific Start and End Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Scheduled Start Time</label>
              <input
                type="time"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled End Time</label>
              <input
                type="time"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Start Date & End Date (Defined Completion Timeline) */}
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
              <label className="form-label">End Date (Completion Timeline)</label>
              <input
                type="date"
                className="form-input"
                placeholder="Optional completion end date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {habitToEdit ? <Save size={14} /> : <Plus size={14} />} {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>

        {/* Embedded Mini Calendar Preview Panel */}
        <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CalendarIcon size={14} /> Timeline View
            </h4>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>{format(previewMonth, 'MMM yyyy')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {previewDays.map((d) => {
              const dStr = format(d, 'yyyy-MM-dd');
              const isStart = dStr === startDate;
              const isEnd = dStr === endDate;
              const inRange = endDate && dStr >= startDate && dStr <= endDate;

              return (
                <div
                  key={dStr}
                  style={{
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.675rem',
                    borderRadius: '2px',
                    background: isStart || isEnd ? 'var(--accent-primary)' : inRange ? 'var(--bg-elevated)' : 'transparent',
                    color: isStart || isEnd ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    fontWeight: isStart || isEnd ? 700 : 400,
                  }}
                >
                  {format(d, 'd')}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
            {endDate ? `Active range: ${startDate} to ${endDate}` : `Ongoing starting ${startDate}`}
          </div>
        </div>
      </div>
    </div>
  );
};
