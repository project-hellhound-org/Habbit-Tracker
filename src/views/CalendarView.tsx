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

  const selectedTasks = tasks.filter((t) => {
    const isDueOnDate = t.dueDate === selectedDateStr || t.endDate === selectedDateStr;
    const isCompletedOnDate = t.completedAt && t.completedAt.startsWith(selectedDateStr);
    return isDueOnDate || isCompletedOnDate;
  });

  const selectedHabitLogs = habitLogs.filter((l) => l.date === selectedDateStr);
  const completedHabitCount = selectedHabitLogs.filter((l) => l.status === 'completed').length;
  const totalActiveHabits = habits.length || 1;

  const completedTaskCount = selectedTasks.filter((t) => t.status === 'completed').length;

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="view-container" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
      {/* Calendar Grid Container */}
      <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem' }}>
        <div className="view-header" style={{ paddingBottom: 0 }}>
          <div>
            <h1 className="view-header-title" style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CalendarIcon size={24} style={{ color: 'var(--accent-secondary)' }} /> Task & Habit Calendar
            </h1>
            <p className="view-header-subtitle">
              Visual monthly schedule with date selection and completion tracking.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-icon" onClick={prevMonth}>
              <ChevronLeft size={18} />
            </button>
            <strong style={{ fontSize: '1.1rem', minWidth: '150px', textAlign: 'center', color: 'var(--text-primary)' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </strong>
            <button className="btn btn-secondary btn-icon" onClick={nextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
        </div>

        {/* Month Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');

            const dayTasks = tasks.filter((t) => t.dueDate === dateStr || t.endDate === dateStr);
            const dayHabitLogs = habitLogs.filter((l) => l.date === dateStr && l.status === 'completed');

            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonthDay = isSameMonth(day, currentMonth);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                style={{
                  minHeight: '105px',
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(46, 94, 68, 0.4)' : isCurrentMonthDay ? 'rgba(13, 34, 26, 0.7)' : 'rgba(0,0,0,0.15)',
                  border: isSelected ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                  opacity: isCurrentMonthDay ? 1 : 0.35,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  transition: 'all 200ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {format(day, 'd')}
                  </span>
                  {dayHabitLogs.length > 0 && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-secondary)' }} />
                  )}
                </div>

                {dayTasks.length > 0 && (
                  <span style={{ fontSize: '0.725rem', background: 'rgba(20, 47, 36, 0.9)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dayTasks.length} task(s)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Side Dashboard */}
      <aside className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Date Breakdown</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>

        {/* Analytics Card Summary for Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>HABITS LOGGED</span>
            <strong style={{ display: 'block', fontSize: '1.35rem', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
              {completedHabitCount} / {totalActiveHabits}
            </strong>
          </div>

          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TASKS COMPLETED</span>
            <strong style={{ display: 'block', fontSize: '1.35rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {completedTaskCount} / {selectedTasks.length}
            </strong>
          </div>
        </div>

        {/* Tasks Assigned to Date */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
            <CheckSquare size={16} style={{ color: 'var(--warning)' }} /> Scheduled Tasks ({selectedTasks.length})
          </h4>
          {selectedTasks.length === 0 ? (
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No tasks scheduled for this date.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {selectedTasks.map((t) => (
                <div key={t.id} style={{ padding: '0.65rem 0.85rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--text-primary)', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</strong>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>{t.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits Checked for Date */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
            <Activity size={16} style={{ color: 'var(--accent-secondary)' }} /> Habit Logs ({selectedHabitLogs.length})
          </h4>
          {selectedHabitLogs.length === 0 ? (
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No habit check-ins recorded for this date.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {selectedHabitLogs.map((l) => {
                const habit = habits.find((h) => h.id === l.habitId);
                return (
                  <div key={l.id} style={{ padding: '0.55rem 0.75rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{habit?.name || 'Habit Routine'}</span>
                    <strong style={{ textTransform: 'capitalize', color: 'var(--accent-secondary)' }}>{l.status}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* End-of-Day Review Summary */}
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
            <BookOpen size={16} style={{ color: 'var(--text-secondary)' }} /> Daily Review Reflection
          </h4>
          {dailyReview ? (
            <div style={{ padding: '0.75rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <div>Score Rating: <strong style={{ color: 'var(--accent-secondary)' }}>{dailyReview.rating || 5} / 5 Stars</strong></div>
              {dailyReview.accomplished && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>Wins: {dailyReview.accomplished}</p>}
            </div>
          ) : (
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No daily review entry recorded.</p>
          )}
        </div>
      </aside>
    </div>
  );
};

