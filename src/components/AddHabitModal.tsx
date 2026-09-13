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
  const [category, setCategory] = useState<'Fitness & Health' | 'Learning & Growth' | 'Work & Projects'>('Fitness & Health');
  const [frequencyMode, setFrequencyMode] = useState<'everyday' | 'custom'>('everyday');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // 0=Sun..6=Sat
  const [startDate, setStartDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [amPm, setAmPm] = useState<'AM' | 'PM'>('AM');
  const [difficulty, setDifficulty] = useState('medium');

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
    if (habitToEdit) {
      setName(habitToEdit.name || '');
      setCategory((habitToEdit.category as any) || 'Fitness & Health');
      setFrequencyMode(habitToEdit.frequencyMode || 'everyday');
      setSelectedDays(habitToEdit.selectedDays || [0, 1, 2, 3, 4, 5, 6]);
      setStartDate(habitToEdit.startDate || todayStr);
      setScheduledTime(habitToEdit.startTime || '08:00');
      setAmPm(habitToEdit.amPm || 'AM');
      setDifficulty(habitToEdit.difficulty || 'medium');
    } else {
      setName('');
      setCategory('Fitness & Health');
      setFrequencyMode('everyday');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setStartDate(todayStr);
      setScheduledTime('08:00');
      setAmPm('AM');
      setDifficulty('medium');
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayVal));
      }
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (habitToEdit) {
      await db.habits.update(habitToEdit.id, {
        name: name.trim(),
        category,
        frequencyMode,
        selectedDays: frequencyMode === 'everyday' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays,
        startDate,
        startTime: scheduledTime,
        amPm,
        difficulty,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.habits.add({
        id: `habit-${Date.now()}`,
        name: name.trim(),
        category,
        frequencyMode,
        selectedDays: frequencyMode === 'everyday' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays,
        startDate,
        startTime: scheduledTime,
        amPm,
        color: '#31563D',
        difficulty,
        archived: 0,
        createdAt: new Date().toISOString(),
      });
    }

    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '540px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            <Sparkles size={16} /> {habitToEdit ? 'Edit Habit' : 'Create New Habit'}
          </h3>
          <button className="btn btn-secondary btn-icon btn-xs" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div className="form-group">
            <label className="form-label">Habit Name *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Morning Strength Training, Daily Reading..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="Fitness & Health">Fitness & Health</option>
              <option value="Learning & Growth">Learning & Growth</option>
              <option value="Work & Projects">Work & Projects</option>
            </select>
          </div>

          {/* Consolidated Date Field */}
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

          {/* Time Selector with AM/PM toggle */}
          <div className="form-group">
            <label className="form-label">Scheduled Time & AM/PM</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="time"
                className="form-input"
                style={{ flex: 1 }}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button
                  type="button"
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: amPm === 'AM' ? 'var(--button-primary-bg)' : 'var(--bg-primary)',
                    color: amPm === 'AM' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => setAmPm('AM')}
                >
                  AM
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.45rem 0.85rem',
                    background: amPm === 'PM' ? 'var(--button-primary-bg)' : 'var(--bg-primary)',
                    color: amPm === 'PM' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => setAmPm('PM')}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Frequency Setting: Everyday or Custom Mon-Sun */}
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${frequencyMode === 'everyday' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  setFrequencyMode('everyday');
                  setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
                }}
              >
                Everyday
              </button>
              <button
                type="button"
                className={`btn ${frequencyMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setFrequencyMode('custom')}
              >
                Custom Days
              </button>
            </div>

            {frequencyMode === 'custom' && (
              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                {daysOfWeek.map((d) => {
                  const selected = selectedDays.includes(d.value);
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
              {habitToEdit ? <Save size={14} /> : <Plus size={14} />} {habitToEdit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
