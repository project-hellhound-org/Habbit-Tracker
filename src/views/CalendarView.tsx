import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Habit, Task, HabitLog, DailyReview } from '../db/schema';
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
  addDays,
  subDays,
  startOfDay,
  endOfDay,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Activity,
  BookOpen,
  Clock,
  CheckCircle2,
  List,
  CalendarDays,
  Grid,
  Filter,
  Plus
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const dailyReview = useLiveQuery(() => db.dailyReviews.get(selectedDateStr));

  // Date boundaries for Month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Date boundaries for Week view
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Compute activity intensity for a specific day
  const getDayActivity = (day: Date) => {
    const dStr = format(day, 'yyyy-MM-dd');
    const dayHabitLogs = habitLogs.filter((l) => l.date === dStr && l.status === 'completed');
    const dayTasks = tasks.filter((t) => t.dueDate === dStr || t.endDate === dStr);
    const dayCompletedTasks = tasks.filter(
      (t) => (t.dueDate === dStr || t.endDate === dStr || t.completedAt?.startsWith(dStr)) && t.status === 'completed'
    );

    const hPct = habits.length > 0 ? (dayHabitLogs.length / habits.length) * 100 : 0;
    const tPct = dayTasks.length > 0 ? (dayCompletedTasks.length / dayTasks.length) * 100 : dayCompletedTasks.length > 0 ? 80 : 0;
    const score = Math.min(Math.round(habits.length > 0 ? hPct * 0.5 + tPct * 0.5 : tPct), 100);

    return {
      score,
      habitLogsCount: dayHabitLogs.length,
      tasksCount: dayTasks.length,
      completedTasksCount: dayCompletedTasks.length,
    };
  };

  // Monochromatic Heatmap Intensity Color (Lightness/opacity variations of semantic green/gray)
  const getHeatmapStyle = (score: number, isSelected: boolean, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      return {
        background: 'rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.05)',
        opacity: 0.3,
      };
    }

    if (isSelected) {
      return {
        background: 'rgba(49, 86, 61, 0.95)',
        border: '2px solid var(--accent-secondary)',
        boxShadow: '0 0 14px rgba(82, 118, 83, 0.4)',
        opacity: 1,
      };
    }

    if (score === 0) {
      return {
        background: 'rgba(13, 34, 26, 0.92)',
        border: '1px solid var(--border-color)',
        opacity: 1,
      };
    } else if (score <= 30) {
      return {
        background: 'rgba(25, 55, 38, 0.92)',
        border: '1px solid rgba(82, 118, 83, 0.3)',
        opacity: 1,
      };
    } else if (score <= 60) {
      return {
        background: 'rgba(35, 72, 49, 0.94)',
        border: '1px solid rgba(82, 118, 83, 0.5)',
        opacity: 1,
      };
    } else if (score <= 80) {
      return {
        background: 'rgba(45, 90, 60, 0.96)',
        border: '1px solid rgba(82, 118, 83, 0.7)',
        opacity: 1,
      };
    } else {
      return {
        background: 'rgba(55, 110, 72, 0.98)',
        border: '1px solid var(--accent-secondary)',
        opacity: 1,
      };
    }
  };

  // Inspector selected date details
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
  const todayClick = () => {
    const t = new Date();
    setCurrentMonth(t);
    setSelectedDate(t);
  };

  const handleHabitToggle = async (habitId: string) => {
    const existing = await db.habitLogs.where('[habitId+date]').equals([habitId, selectedDateStr]).first();
    if (existing) {
      const nextStatus = existing.status === 'completed' ? 'failed' : 'completed';
      await db.habitLogs.update(existing.id, { status: nextStatus, loggedAt: new Date().toISOString() });
    } else {
      await db.habitLogs.add({
        id: `log-${Date.now()}`,
        habitId,
        date: selectedDateStr,
        status: 'completed',
        value: 1,
        loggedAt: new Date().toISOString(),
      });
    }
  };

  const handleTaskToggle = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    await db.tasks.update(task.id, {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Calendar Header Bar */}
      <div
        className="liquid-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--bg-secondary)',
          opacity: 0.94,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="view-header-title" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CalendarIcon size={24} style={{ color: 'var(--accent-secondary)' }} /> Temporal Calendar Workstation
            </h1>
            <p className="view-header-subtitle" style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Monochromatic month grid with integrated daily completion heatmap intensity matrix.
            </p>
          </div>

          {/* Header Controls: Month Nav, Today, View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button className="btn btn-secondary btn-icon" onClick={prevMonth} title="Previous Month">
                <ChevronLeft size={18} />
              </button>
              <strong style={{ fontSize: '1.1rem', minWidth: '150px', textAlign: 'center', color: 'var(--text-primary)' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </strong>
              <button className="btn btn-secondary btn-icon" onClick={nextMonth} title="Next Month">
                <ChevronRight size={18} />
              </button>
            </div>

            <button className="btn btn-secondary" onClick={todayClick} style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}>
              Today
            </button>

            {/* View Selector */}
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button
                className={`btn ${calendarView === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', border: 'none', borderRadius: 0 }}
                onClick={() => setCalendarView('month')}
              >
                Month
              </button>
              <button
                className={`btn ${calendarView === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', border: 'none', borderRadius: 0 }}
                onClick={() => setCalendarView('week')}
              >
                Week
              </button>
              <button
                className={`btn ${calendarView === 'day' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', border: 'none', borderRadius: 0 }}
                onClick={() => setCalendarView('day')}
              >
                Day
              </button>
              <button
                className={`btn ${calendarView === 'agenda' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', border: 'none', borderRadius: 0 }}
                onClick={() => setCalendarView('agenda')}
              >
                Agenda
              </button>
            </div>
          </div>
        </div>

        {/* Compact Monochromatic Heatmap Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Heatmap Matrix:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(13, 34, 26, 0.92)', border: '1px solid var(--border-color)' }} /> 0% (Neutral)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(25, 55, 38, 0.92)' }} /> 1–30% Subtle
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(35, 72, 49, 0.94)' }} /> 31–60% Medium
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(45, 90, 60, 0.96)' }} /> 61–80% High
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(55, 110, 72, 0.98)' }} /> 81–100% Optimal
          </span>
        </div>
      </div>

      {/* Main Grid + Date Breakdown Inspector (72% / 28% Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: '72% 28%', gap: '1.25rem', alignItems: 'start' }}>
        {/* Calendar Visualization Layer */}
        <div className="liquid-panel" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', opacity: 0.94 }}>
          {/* MONTH VIEW */}
          {calendarView === 'month' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Days of Week Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
              </div>

              {/* Month Calendar Grid with Integrated Heatmap Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {monthDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const act = getDayActivity(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonthDay = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const cellStyle = getHeatmapStyle(act.score, isSelected, isCurrentMonthDay);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      style={{
                        minHeight: '105px',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: cellStyle.background,
                        border: cellStyle.border,
                        boxShadow: cellStyle.boxShadow || 'none',
                        opacity: cellStyle.opacity,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {/* Top Row: Day Number (left) & Completion % Badge (right) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: isToday || isSelected ? 800 : 700, color: isToday ? 'var(--accent-secondary)' : isSelected ? '#ffffff' : 'var(--text-primary)' }}>
                          {format(day, 'd')} {isToday && <span style={{ fontSize: '0.65rem', color: 'var(--accent-secondary)' }}>(Today)</span>}
                        </span>
                        {act.score > 0 && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.4)', color: 'var(--accent-secondary)', border: '1px solid var(--border-color)' }}>
                            {act.score}%
                          </span>
                        )}
                      </div>

                      {/* Small Habit & Task Metadata */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.4rem' }}>
                        {act.habitLogsCount > 0 && (
                          <span style={{ fontSize: '0.725rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                            ● {act.habitLogsCount} habits
                          </span>
                        )}
                        {act.tasksCount > 0 && (
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            □ {act.completedTasksCount}/{act.tasksCount} tasks
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {calendarView === 'week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const act = getDayActivity(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(49, 86, 61, 0.95)' : 'rgba(13, 34, 26, 0.7)',
                        border: isSelected ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{format(day, 'EEE')}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isToday ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>{format(day, 'd')}</div>
                      </div>

                      <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div>Habits: <strong style={{ color: 'var(--accent-secondary)' }}>{act.habitLogsCount}</strong></div>
                        <div>Tasks: <strong style={{ color: 'var(--text-primary)' }}>{act.completedTasksCount}/{act.tasksCount}</strong></div>
                        {act.score > 0 && <div>Score: <strong style={{ color: 'var(--accent-secondary)' }}>{act.score}%</strong></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {calendarView === 'day' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Detailed Day Schedule — {format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => {
                  const hourStr = `${hour < 10 ? '0' : ''}${hour}:00`;
                  const hourHabits = habits.filter((h) => h.startTime?.startsWith(hourStr.slice(0, 2)));
                  return (
                    <div key={hour} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ width: '70px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{hourStr}</div>
                      <div style={{ flex: 1 }}>
                        {hourHabits.length > 0 ? (
                          hourHabits.map((hh) => (
                            <span key={hh.id} style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                              • {hh.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Free slot</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AGENDA VIEW */}
          {calendarView === 'agenda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Agenda List Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasks.slice(0, 10).map((t) => (
                  <div key={t.id} style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {t.dueDate || 'Unscheduled'}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(82, 118, 83, 0.2)', color: 'var(--accent-secondary)', borderRadius: 'var(--radius-sm)' }}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Breakdown Inspector (28% Right Column) */}
        <aside className="liquid-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-secondary)', opacity: 0.94 }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>Date Breakdown Inspector</h3>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{format(selectedDate, 'EEEE, MMM d, yyyy')}</span>
          </div>

          {/* Quick Stats Cards for Selected Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(13, 34, 26, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>HABITS LOGGED</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
                {completedHabitCount} / {totalActiveHabits}
              </strong>
            </div>

            <div style={{ background: 'rgba(13, 34, 26, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>TASKS DONE</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {completedTaskCount} / {selectedTasks.length}
              </strong>
            </div>
          </div>

          {/* Habits Section with Interactive Complete Toggle */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 700 }}>
              Habits Scheduled Today
            </h4>
            {habits.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No active habits defined.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {habits.map((h) => {
                  const isLogged = selectedHabitLogs.some((l) => l.habitId === h.id && l.status === 'completed');
                  return (
                    <div
                      key={h.id}
                      style={{
                        padding: '0.55rem 0.75rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-primary)', textDecoration: isLogged ? 'line-through' : 'none' }}>{h.name}</span>
                      <button
                        className={`btn ${isLogged ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleHabitToggle(h.id)}
                      >
                        {isLogged ? '✓ Done' : 'Check'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scheduled Tasks for Date */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 700 }}>
              Scheduled Tasks ({selectedTasks.length})
            </h4>
            {selectedTasks.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No tasks assigned for this date.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {selectedTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '0.55rem 0.75rem',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</span>
                    <button
                      className={`btn ${t.status === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => handleTaskToggle(t)}
                    >
                      {t.status === 'completed' ? '✓ Done' : 'Complete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Review Integration */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 700 }}>
              Daily Review Reflection
            </h4>
            {dailyReview ? (
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                <div>Productivity Score: <strong style={{ color: 'var(--accent-secondary)' }}>{dailyReview.rating || 5} / 5</strong></div>
                {dailyReview.accomplished && <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-secondary)' }}>{dailyReview.accomplished}</p>}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No daily review entry logged for this date.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
