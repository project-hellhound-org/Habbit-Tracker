import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Habit, SubHabit, SubHabitLog } from '../db/schema';
import { calculateHabitStats } from '../engine/streakEngine';
import { AddHabitModal } from '../components/AddHabitModal';
import { Plus, CheckCircle, XCircle, SkipForward, Trash2, Edit3, Flame, Clock, Calendar, BarChart2, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export const HabitsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const subHabits = useLiveQuery(() => db.subHabits.filter(sh => !sh.archived).toArray()) || [];
  const subHabitLogs = useLiveQuery(() => db.subHabitLogs.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));

  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [expandedHabits, setExpandedHabits] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedHabits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = habitLogs.filter((l) => l.date === todayStr && l.status === 'completed');

  const totalHabitsCount = habits.length || 1;
  const overallPct = habits.length > 0 ? Math.round((todayLogs.length / totalHabitsCount) * 100) : 0;

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

  const handleLogSubHabit = async (subHabit: SubHabit, status: 'completed' | 'partial' | 'skipped') => {
    const existing = await db.subHabitLogs.where('[subHabitId+date]').equals([subHabit.id, todayStr]).first();
    if (existing) {
      await db.subHabitLogs.update(existing.id, { status, loggedAt: new Date().toISOString(), value: status === 'completed' ? 1 : 0 });
    } else {
      await db.subHabitLogs.add({
        id: `shlog-${Date.now()}`,
        subHabitId: subHabit.id,
        habitId: subHabit.habitId,
        date: todayStr,
        status,
        value: status === 'completed' ? 1 : 0,
        loggedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="view-container">
      {/* Header Bar */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Habit Consistency Specifications</h1>
          <p className="view-header-subtitle">
            Track daily execution, 30-day consistency heatmaps, and customize routine timing.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setHabitToEdit(null);
            setIsAddHabitModalOpen(true);
          }}
        >
          <Plus size={16} /> Add Habit Specification
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="stat-badge-grid">
        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ACTIVE ROUTINES</span>
            <Calendar size={18} />
          </div>
          <div className="hero-stat-number">{habits.length}</div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Active tracked habits
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>TODAY'S LOGGED</span>
            <CheckCircle size={18} />
          </div>
          <div className="hero-stat-number">
            {todayLogs.length} <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {habits.length}</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--accent-secondary)', marginTop: '0.2rem', display: 'block' }}>
            {overallPct}% daily completion rate
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>STREAK SYSTEM</span>
            <Flame size={18} />
          </div>
          <div className="hero-stat-number" style={{ color: 'var(--warning)' }}>
            Active
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Streak freeze rule: {settings?.streakSkipRule || 'pause'}
          </span>
        </div>
      </div>

      {/* Habit Cards Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {habits.length === 0 ? (
          <div className="liquid-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              No habits specified yet. Click <strong>Add Habit Specification</strong> above to create your first routine.
            </p>
          </div>
        ) : (
          habits.map((h) => {
            const stats = calculateHabitStats(h, habitLogs, new Date(), settings?.streakSkipRule || 'pause');
            const todayLog = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr);
            const habitSubHabits = subHabits.filter(sh => sh.habitId === h.id).sort((a, b) => a.order - b.order);
            const hasSubHabits = habitSubHabits.length > 0;
            const completedSubHabits = habitSubHabits.filter(sh => {
              const log = subHabitLogs.find(l => l.subHabitId === sh.id && l.date === todayStr);
              return log?.status === 'completed';
            }).length;

            return (
              <div
                key={h.id}
                className="liquid-panel flip-card-item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      {hasSubHabits && (
                        <button 
                          className="btn btn-secondary btn-icon" 
                          style={{ padding: '0.2rem', background: 'transparent', border: 'none' }}
                          onClick={() => toggleExpand(h.id)}
                        >
                          {expandedHabits[h.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      )}
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{h.name}</h3>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: 'rgba(82, 118, 83, 0.2)',
                          color: 'var(--accent-secondary)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {h.category}
                      </span>
                      {h.startTime && (
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} /> {h.startTime} {h.amPm || ''} {h.endTime ? `- ${h.endTime}` : ''}
                        </span>
                      )}
                      {hasSubHabits && (
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          {completedSubHabits} / {habitSubHabits.length} sub-habits done
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div>Current Streak: <strong style={{ color: 'var(--warning)' }}>🔥 {stats.currentStreak} days</strong></div>
                      <div>Longest: <strong style={{ color: 'var(--text-primary)' }}>{stats.longestStreak} days</strong></div>
                      <div>30d Rate: <strong style={{ color: 'var(--accent-secondary)' }}>{stats.completionRate30Days}%</strong></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                      className={`btn ${todayLog?.status === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleLogHabit(h.id, 'completed')}
                    >
                      <CheckCircle size={15} /> Done
                    </button>
                    <button
                      className={`btn ${todayLog?.status === 'skipped' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleLogHabit(h.id, 'skipped')}
                    >
                      <SkipForward size={15} /> Skip
                    </button>
                    <button
                      className={`btn ${todayLog?.status === 'failed' ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => handleLogHabit(h.id, 'failed')}
                    >
                      <XCircle size={15} /> Missed
                    </button>
                    <button className="btn btn-secondary btn-icon" title="Edit Habit Specifications" onClick={() => handleEditHabit(h)}>
                      <Edit3 size={15} />
                    </button>
                    <button className="btn btn-danger btn-icon" title="Delete Habit" onClick={() => handleDeleteHabit(h.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>30-Day Consistency Progress</span>
                    <span>{stats.completionRate30Days}%</span>
                  </div>
                  <div className="progress-bar-track" style={{ height: '7px' }}>
                    <div className="progress-bar-fill" style={{ width: `${stats.completionRate30Days}%` }} />
                  </div>
                </div>

                {/* Sub-habits section */}
                {hasSubHabits && expandedHabits[h.id] && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    background: 'rgba(13, 34, 26, 0.65)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      Sub-Habits
                    </h4>
                    {habitSubHabits.map(sh => {
                      const shLog = subHabitLogs.find(l => l.subHabitId === sh.id && l.date === todayStr);
                      return (
                        <div key={sh.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{sh.name}</span>
                            {sh.description && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sh.description}</span>}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {sh.targetValue && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                                Target: {sh.targetValue} {sh.unit}
                              </span>
                            )}
                            <button
                              className={`btn ${shLog?.status === 'completed' ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                              style={{ padding: '0.4rem' }}
                              onClick={() => handleLogSubHabit(sh, 'completed')}
                              title="Mark Done"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              className={`btn ${shLog?.status === 'skipped' ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                              style={{ padding: '0.4rem' }}
                              onClick={() => handleLogSubHabit(sh, 'skipped')}
                              title="Skip"
                            >
                              <SkipForward size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

