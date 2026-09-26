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

  // Generate 30-Day Activity Heatmap Data
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dStr = format(d, 'yyyy-MM-dd');
    const logs = habitLogs.filter((l) => l.date === dStr && l.status === 'completed');
    const dayTasks = tasks.filter((t) => t.dueDate === dStr || t.endDate === dStr);
    const dayCompletedTasks = tasks.filter((t) => (t.dueDate === dStr || t.endDate === dStr || t.completedAt?.startsWith(dStr)) && t.status === 'completed');
    
    const hPct = habits.length > 0 ? (logs.length / habits.length) * 100 : 0;
    const tPct = dayTasks.length > 0 ? (dayCompletedTasks.length / dayTasks.length) * 100 : dayCompletedTasks.length > 0 ? 80 : 0;
    const score = Math.min(Math.round(habits.length > 0 ? (hPct * 0.5 + tPct * 0.5) : tPct), 100);

    return { date: d, dateStr: dStr, score, logsCount: logs.length, tasksCount: dayCompletedTasks.length };
  });

  const getHeatmapBg = (score: number) => {
    if (score === 0) return 'rgba(13, 34, 26, 0.6)';
    if (score <= 30) return '#556B60';
    if (score <= 60) return '#E6A817';
    if (score <= 80) return '#E86A33';
    return '#429867';
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Integrated Full-Width Activity Heatmap Bar */}
      <div className="liquid-panel flip-card-item" style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} style={{ color: 'var(--accent-secondary)' }} /> Integrated Activity Heatmap Matrix
            </h3>
            <p className="subtitle" style={{ fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
              Monitor daily task completion & habit activity intensity in real time. Click any block to select date.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#556B60' }} /> Low (1-30%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#E6A817' }} /> Medium (31-60%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#E86A33' }} /> High (61-80%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#429867' }} /> Optimal (81-100%)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: '0.4rem', overflowX: 'auto', padding: '0.35rem 0' }}>
          {heatmapDays.map((h) => {
            const isSel = isSameDay(h.date, selectedDate);
            return (
              <div
                key={h.dateStr}
                onClick={() => setSelectedDate(h.date)}
                title={`${format(h.date, 'MMM d, yyyy')}: ${h.score}% intensity score (${h.logsCount} habits, ${h.tasksCount} tasks)`}
                style={{
                  height: '42px',
                  borderRadius: '6px',
                  background: getHeatmapBg(h.score),
                  border: isSel ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  transition: 'all 150ms ease',
                  boxShadow: isSel ? '0 0 12px rgba(255,255,255,0.45)' : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.18)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {format(h.date, 'd')}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main High-Spacious Calendar & Side Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.75rem' }}>
        {/* Calendar Grid Container */}
        <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', padding: '2rem' }}>
          <div className="view-header" style={{ paddingBottom: 0 }}>
            <div>
              <h1 className="view-header-title" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CalendarIcon size={26} style={{ color: 'var(--accent-secondary)' }} /> Task & Habit Schedule Calendar
              </h1>
              <p className="view-header-subtitle" style={{ fontSize: '0.925rem' }}>
                Integrated schedule workstation with embedded completion intensity heatmaps.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <button className="btn btn-secondary btn-icon" onClick={prevMonth} style={{ width: '40px', height: '40px' }}>
                <ChevronLeft size={20} />
              </button>
              <strong style={{ fontSize: '1.2rem', minWidth: '160px', textAlign: 'center', color: 'var(--text-primary)' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </strong>
              <button className="btn btn-secondary btn-icon" onClick={nextMonth} style={{ width: '40px', height: '40px' }}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.65rem', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>

          {/* Month Grid with Integrated Dynamic Heatmap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.65rem' }}>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');

              const dayTasks = tasks.filter((t) => t.dueDate === dateStr || t.endDate === dateStr);
              const dayHabitLogs = habitLogs.filter((l) => l.date === dateStr && l.status === 'completed');
              const dayCompletedTasks = tasks.filter((t) => (t.dueDate === dateStr || t.endDate === dateStr || t.completedAt?.startsWith(dateStr)) && t.status === 'completed');

              const hPct = habits.length > 0 ? (dayHabitLogs.length / habits.length) * 100 : 0;
              const tPct = dayTasks.length > 0 ? (dayCompletedTasks.length / dayTasks.length) * 100 : dayCompletedTasks.length > 0 ? 80 : 0;
              const dayScore = Math.min(Math.round(habits.length > 0 ? (hPct * 0.5 + tPct * 0.5) : tPct), 100);

              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonthDay = isSameMonth(day, currentMonth);

              const getCellBackground = () => {
                if (!isCurrentMonthDay) return 'rgba(0,0,0,0.15)';
                if (isSelected) return 'linear-gradient(135deg, rgba(46, 94, 68, 0.85) 0%, rgba(22, 58, 41, 0.95) 100%)';
                if (dayScore === 0) return 'rgba(13, 34, 26, 0.7)';
                if (dayScore <= 30) return 'linear-gradient(135deg, rgba(85, 107, 96, 0.38) 0%, rgba(13, 34, 26, 0.8) 100%)';
                if (dayScore <= 60) return 'linear-gradient(135deg, rgba(230, 168, 23, 0.32) 0%, rgba(13, 34, 26, 0.8) 100%)';
                if (dayScore <= 80) return 'linear-gradient(135deg, rgba(232, 106, 51, 0.38) 0%, rgba(13, 34, 26, 0.8) 100%)';
                return 'linear-gradient(135deg, rgba(66, 152, 103, 0.45) 0%, rgba(13, 34, 26, 0.8) 100%)';
              };

              const getHeatBadgeColor = () => {
                if (dayScore === 0) return 'rgba(255,255,255,0.1)';
                if (dayScore <= 30) return '#556B60';
                if (dayScore <= 60) return '#E6A817';
                if (dayScore <= 80) return '#E86A33';
                return '#429867';
              };

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    minHeight: '120px',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: getCellBackground(),
                    border: isSelected ? '2.5px solid var(--accent-secondary)' : dayScore > 0 ? `1.5px solid ${getHeatBadgeColor()}88` : '1px solid var(--border-color)',
                    opacity: isCurrentMonthDay ? 1 : 0.35,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    transition: 'all 200ms ease',
                    boxShadow: isSelected ? '0 0 16px rgba(87, 185, 120, 0.35)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: isSelected ? 800 : 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {format(day, 'd')}
                    </span>
                    {dayScore > 0 && (
                      <span style={{ fontSize: '0.675rem', padding: '0.15rem 0.45rem', borderRadius: '10px', background: getHeatBadgeColor(), color: '#FFFFFF', fontWeight: 800 }}>
                        {dayScore}%
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {dayHabitLogs.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#57B978', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#57B978' }} /> {dayHabitLogs.length} habit(s)
                      </span>
                    )}
                    {dayTasks.length > 0 && (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(7, 26, 19, 0.85)', padding: '0.2rem 0.5rem', borderRadius: '5px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                        {dayTasks.length} task(s)
                      </span>
                    )}
                  </div>
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
    </div>
  );
};

