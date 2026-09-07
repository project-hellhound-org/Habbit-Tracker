import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Habit } from '../db/schema';
import { calculateHabitStats } from '../engine/streakEngine';
import { AddHabitModal } from '../components/AddHabitModal';
import { Plus, CheckCircle, XCircle, SkipForward, Trash2, Edit3, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const HabitsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleEditHabit = (h: Habit) => {
    setHabitToEdit(h);
    setIsAddHabitModalOpen(true);
  };

  const handleLogHabit = async (habitId: string, status: 'completed' | 'partial' | 'skipped' | 'failed') => {
    const existing = await db.habitLogs.where('[habitId+date]').equals([habitId, todayStr]).first();
    if (existing) {
      await db.habitLogs.update(existing.id, { status, loggedAt: new Date().toISOString() });
    } else {
      await db.habitLogs.add({
        id: `log-${Date.now()}`,
        habitId,
        date: todayStr,
        status,
        value: status === 'completed' ? 1 : 0,
        loggedAt: new Date().toISOString(),
      });
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (confirm('Delete this habit specification?')) {
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Habit Consistency Specifications</h2>
          <p className="subtitle">Track habit execution, streak heatmaps, and edit specification settings.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setHabitToEdit(null);
            setIsAddHabitModalOpen(true);
          }}
        >
          <Plus size={14} /> Add Habit Specification
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {habits.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p className="subtitle">No habits specified yet. Click Add Habit Specification above to create your first routine.</p>
          </div>
        ) : (
          habits.map((h) => {
            const stats = calculateHabitStats(h, habitLogs, new Date(), settings?.streakSkipRule || 'pause');
            const todayLog = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr);

            return (
              <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem' }}>{h.name}</h4>
                    <span className="subtitle" style={{ fontSize: '0.725rem', background: 'var(--bg-primary)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{h.category}</span>
                    {h.startTime && <span className="subtitle" style={{ fontSize: '0.725rem' }}>({h.startTime} - {h.endTime})</span>}
                  </div>
                  <div className="subtitle" style={{ marginTop: '0.25rem' }}>
                    Current Streak: <strong>{stats.currentStreak} days</strong> | Longest: {stats.longestStreak} days | 30d Consistency: {stats.completionRate30Days}%
                    {h.endDate && <span> | Timeline End: {h.endDate}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className={`btn btn-xs ${todayLog?.status === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleLogHabit(h.id, 'completed')}
                  >
                    <CheckCircle size={12} /> Done
                  </button>
                  <button
                    className={`btn btn-xs ${todayLog?.status === 'skipped' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleLogHabit(h.id, 'skipped')}
                  >
                    <SkipForward size={12} /> Skip
                  </button>
                  <button
                    className={`btn btn-xs ${todayLog?.status === 'failed' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => handleLogHabit(h.id, 'failed')}
                  >
                    <XCircle size={12} /> Missed
                  </button>
                  <button className="btn btn-secondary btn-icon btn-xs" title="Edit Habit Specifications" onClick={() => handleEditHabit(h)}>
                    <Edit3 size={12} />
                  </button>
                  <button className="btn btn-danger btn-icon btn-xs" title="Delete Habit" onClick={() => handleDeleteHabit(h.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => {
          setIsAddHabitModalOpen(false);
          setHabitToEdit(null);
        }}
        habitToEdit={habitToEdit}
      />
    </div>
  );
};
