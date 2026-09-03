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
  subMonths,
  parseISO
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, Clock, BookOpen, AlertCircle } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.where('date').equals(selectedDateStr).toArray()) || [];
  const focusSessions = useLiveQuery(() => db.focusSessions.toArray()) || [];
  const dailyReview = useLiveQuery(() => db.dailyReviews.get(selectedDateStr));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const selectedTasks = tasks.filter((t) => t.dueDate === selectedDateStr);
  const selectedFocus = focusSessions.filter((f) => f.startTimestamp && f.startTimestamp.startsWith(selectedDateStr));

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
      {/* Main Interactive Calendar Grid */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Task Scheduling & Historical Inspector</h2>
            <p className="subtitle">Select any date to view scheduled tasks, habit check-ins, and focus logs.</p>
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
            const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonthDay = isSameMonth(day, currentMonth);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                style={{
                  minHeight: '80px',
                  padding: '0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-elevated)' : isCurrentMonthDay ? 'var(--bg-primary)' : 'rgba(0,0,0,0.2)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  opacity: isCurrentMonthDay ? 1 : 0.4,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {format(day, 'd')}
                </span>

                {dayTasks.length > 0 && (
                  <span style={{ fontSize: '0.675rem', background: 'var(--bg-secondary)', padding: '0.1rem 0.3rem', borderRadius: '3px', border: '1px solid var(--border-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dayTasks.length} task(s)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Inspector Sidebar for Selected Date */}
      <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Inspection: {format(selectedDate, 'EEEE, MMM d')}</h3>
          <span className="subtitle">Historical records logged for this day</span>
        </div>

        {/* Tasks for Date */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckSquare size={14} /> Scheduled Tasks ({selectedTasks.length})
          </h4>
          {selectedTasks.length === 0 ? (
            <p className="subtitle">No tasks due on this date.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selectedTasks.map((t) => (
                <div key={t.id} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <strong style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</strong>
                  <div className="subtitle" style={{ fontSize: '0.7rem' }}>Priority: {t.priority}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habit Logs for Date */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CalendarIcon size={14} /> Habit Logs ({habitLogs.length})
          </h4>
          {habitLogs.length === 0 ? (
            <p className="subtitle">No habit logs recorded for this date.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {habitLogs.map((l) => {
                const habit = habits.find((h) => h.id === l.habitId);
                return (
                  <div key={l.id} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{habit?.name || 'Habit'}</span>
                    <strong style={{ textTransform: 'capitalize' }}>{l.status}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Focus Time for Date */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={14} /> Verified Focus ({selectedFocus.length} sessions)
          </h4>
          {selectedFocus.length === 0 ? (
            <p className="subtitle">0 focus sessions recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selectedFocus.map((f) => (
                <div key={f.id} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <span>{f.mode} ({Math.round((f.verifiedSeconds || 0) / 60)}m verified)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Reflection Journal Entry */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <BookOpen size={14} /> Journal Reflection
          </h4>
          {dailyReview ? (
            <div style={{ padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              <div>Rating: <strong>{dailyReview.rating || 5} Stars</strong></div>
              {dailyReview.accomplished && <div className="subtitle">Wins: {dailyReview.accomplished}</div>}
            </div>
          ) : (
            <p className="subtitle">No daily review logged for this date.</p>
          )}
        </div>
      </aside>
    </div>
  );
};
