import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, Activity, BookOpen, Clock, AlertTriangle } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const dailyReview = useLiveQuery(() => db.dailyReviews.get(selectedDateStr));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter tasks accurately assigned to this specific selected date
  const selectedTasks = tasks.filter((t) => {
    const isDueOnDate = t.dueDate === selectedDateStr || t.endDate === selectedDateStr;
    const isCompletedOnDate = t.completedAt && t.completedAt.startsWith(selectedDateStr);
    return isDueOnDate || isCompletedOnDate;
  });

  const selectedHabitLogs = habitLogs.filter((l) => l.date === selectedDateStr);
  const completedHabitCount = selectedHabitLogs.filter((l) => l.status === 'completed').length;
  const totalActiveHabits = habits.length || 1;
  const habitCompletionPct = Math.round((completedHabitCount / totalActiveHabits) * 100);

  const completedTaskCount = selectedTasks.filter((t) => t.status === 'completed').length;
  const taskCompletionPct = selectedTasks.length > 0 ? Math.round((completedTaskCount / selectedTasks.length) * 100) : 100;

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem' }}>
      {/* Redesigned Dynamic Calendar Grid */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={20} /> Dynamic Task Scheduling Calendar
            </h2>
            <p className="subtitle">Real-time date selection with accurate task and habit completion tracking.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-icon btn-xs" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <strong style={{ fontSize: '0.95rem', minWidth: '130px', textAlign: 'center' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </strong>
            <button className="btn btn-secondary btn-icon btn-xs" onClick={nextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', textAlign: 'center', fontWeight: 600, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
        </div>

        {/* Month Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');

            // Accurate Work Filter for Cell
            const dayTasks = tasks.filter((t) => t.dueDate === dateStr || t.endDate === dateStr);
            const dayHabitLogs = habitLogs.filter((l) => l.date === dateStr && l.status === 'completed');

            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonthDay = isSameMonth(day, currentMonth);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                style={{
                  minHeight: '85px',
                  padding: '0.4rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-elevated)' : isCurrentMonthDay ? 'var(--bg-primary)' : 'rgba(0,0,0,0.15)',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  opacity: isCurrentMonthDay ? 1 : 0.35,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  transition: 'all 0.16s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {format(day, 'd')}
                  </span>
                  {dayHabitLogs.length > 0 && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                  )}
                </div>

                {dayTasks.length > 0 && (
                  <span style={{ fontSize: '0.675rem', background: 'var(--bg-secondary)', padding: '0.1rem 0.35rem', borderRadius: '3px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dayTasks.length} task(s)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Comprehensive Daily Dashboard */}
      <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Daily Dashboard</h3>
          <span className="subtitle">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>

        {/* Analytics Card Summary for Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>HABITS DONE</span>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>{completedHabitCount} / {totalActiveHabits}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>TASKS DONE</span>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>{completedTaskCount} / {selectedTasks.length}</strong>
          </div>
        </div>

        {/* Tasks Assigned to Date */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckSquare size={14} /> Scheduled Tasks ({selectedTasks.length})
          </h4>
          {selectedTasks.length === 0 ? (
            <p className="subtitle">No tasks scheduled for this date.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selectedTasks.map((t) => (
                <div key={t.id} style={{ padding: '0.5rem 0.65rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</strong>
                    <span className="subtitle" style={{ fontSize: '0.675rem', fontWeight: 600 }}>{t.priority.toUpperCase()}</span>
                  </div>
                  {t.dailyTimeLimitMinutes && (
                    <div className="subtitle" style={{ fontSize: '0.7rem', marginTop: '0.15rem' }}>Daily Limit: {t.dailyTimeLimitMinutes / 60}h</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits Checked for Date */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Activity size={14} /> Habit Logs ({selectedHabitLogs.length})
          </h4>
          {selectedHabitLogs.length === 0 ? (
            <p className="subtitle">No habit check-ins recorded for this date.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selectedHabitLogs.map((l) => {
                const habit = habits.find((h) => h.id === l.habitId);
                return (
                  <div key={l.id} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{habit?.name || 'Habit Routine'}</span>
                    <strong style={{ textTransform: 'capitalize' }}>{l.status}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* End-of-Day Review Summary for Date */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <BookOpen size={14} /> Daily Review & Reflection
          </h4>
          {dailyReview ? (
            <div style={{ padding: '0.55rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              <div>Score Rating: <strong>{dailyReview.rating || 5} Stars</strong></div>
              {dailyReview.accomplished && <div className="subtitle" style={{ marginTop: '0.25rem' }}>Wins: {dailyReview.accomplished}</div>}
            </div>
          ) : (
            <p className="subtitle">No daily review entry for this date.</p>
          )}
        </div>
      </aside>
    </div>
  );
};
