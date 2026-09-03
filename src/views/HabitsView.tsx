import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { calculateHabitStats } from '../engine/streakEngine';
import { AddHabitModal } from '../components/AddHabitModal';
import { Plus, CheckCircle, XCircle, SkipForward, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const HabitsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

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
    if (confirm('Delete this habit?')) {
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
    }
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Habit Consistency Engine</h2>
          <p className="subtitle">Track streaks, completion consistency percentages, and daily progress.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddHabitModalOpen(true)}>
          <Plus size={14} /> Add Habit (Dedicated Panel)
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {habits.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="subtitle">No habits created yet. Click Add Habit above to create your first routine.</p>
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
                    {h.timeOfDay && <span className="subtitle" style={{ fontSize: '0.7rem' }}>({h.timeOfDay})</span>}
                  </div>
                  <div className="subtitle" style={{ marginTop: '0.25rem' }}>
                    Current Streak: <strong>{stats.currentStreak} days</strong> | Longest: {stats.longestStreak} days | 30d Consistency: {stats.completionRate30Days}%
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
                  <button className="btn btn-danger btn-icon btn-xs" onClick={() => handleDeleteHabit(h.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddHabitModal isOpen={isAddHabitModalOpen} onClose={() => setIsAddHabitModalOpen(false)} />
    </div>
  );
};
