import React, { useState } from 'react';
import { db } from '../db/schema';
import { X, Plus, Calendar, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom_days'>('daily');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('times');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [difficulty, setDifficulty] = useState('medium');
  const [startDate, setStartDate] = useState(todayStr);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await db.habits.add({
      id: `habit-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      frequency,
      targetDaysPerWeek: 7,
      targetValue: Number(targetValue) || 1,
      unit,
      timeOfDay,
      color: '#ffffff',
      difficulty,
      archived: 0,
      createdAt: new Date().toISOString(),
      startDate,
    });

    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} /> Dedicated Habit Creation Panel
          </h3>
          <button className="btn btn-secondary btn-icon btn-xs" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="form-group">
            <label className="form-label">Habit Name *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Daily Code Audit, Meditation..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Purpose</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Describe the routine or target goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Personal">Personal & Mindset</option>
                <option value="Health">Health & Fitness</option>
                <option value="Tech">Cybersecurity & Tech</option>
                <option value="Learning">Learning & Growth</option>
                <option value="Work">Work & Projects</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Time Range of Day</label>
              <select className="form-select" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value as any)}>
                <option value="morning">Morning (6AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 10PM)</option>
                <option value="anytime">Anytime / Flexible</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Target Quantity</label>
              <input
                type="number"
                min={1}
                className="form-input"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit</label>
              <input
                type="text"
                className="form-input"
                placeholder="times, mins, pages..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={14} /> Create Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
