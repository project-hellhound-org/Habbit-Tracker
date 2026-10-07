import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CalendarItem } from '../db/schema';
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
  addWeeks,
  subWeeks,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Activity,
  BookOpen,
  Clock,
  Plus,
  Grid,
  Columns,
} from 'lucide-react';
import { WeekGrid } from '../components/calendar/WeekGrid';
import { QuickCreatePopover } from '../components/calendar/QuickCreatePopover';

export const CalendarView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Quick create popover state
  const [popoverDate, setPopoverDate] = useState<Date | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Queries
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const dailyReview = useLiveQuery(() => db.dailyReviews.get(selectedDateStr));
  const calendarItems = useLiveQuery(() => db.calendarItems.toArray()) || [];

  const monthStart = startOfMonth(currentDate);
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

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  // Generate 30-Day Activity Heatmap Data
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dStr = format(d, 'yyyy-MM-dd');
    const logs = habitLogs.filter((l) => l.date === dStr && l.status === 'completed');
    const dayTasks = tasks.filter((t) => t.dueDate === dStr || t.endDate === dStr);
    const dayCompletedTasks = tasks.filter(
      (t) => (t.dueDate === dStr || t.endDate === dStr || t.completedAt?.startsWith(dStr)) && t.status === 'completed'
    );

    const hPct = habits.length > 0 ? (logs.length / habits.length) * 100 : 0;
    const tPct = dayTasks.length > 0 ? (dayCompletedTasks.length / dayTasks.length) * 100 : dayCompletedTasks.length > 0 ? 80 : 0;
    const score = Math.min(Math.round(habits.length > 0 ? hPct * 0.5 + tPct * 0.5 : tPct), 100);

    return { date: d, dateStr: dStr, score, logsCount: logs.length, tasksCount: dayCompletedTasks.length };
  });

  const getHeatmapBg = (score: number) => {
    if (score === 0) return 'rgba(13, 34, 26, 0.6)';
    if (score <= 30) return '#556B60';
    if (score <= 60) return '#E6A817';
    if (score <= 80) return '#E86A33';
    return '#429867';
  };

  const handleSaveDraftEvent = async (eventData: any) => {
    const newItem: CalendarItem = {
      id: `cal-${Date.now()}`,
      title: eventData.title || 'Untitled Event',
      type: eventData.type,
      start: eventData.start.toISOString(),
      end: eventData.end.toISOString(),
      allDay: false,
      rrule: eventData.rrule || undefined,
      description: eventData.desc || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.calendarItems.add(newItem);
    setPopoverDate(null);
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative' }}>
      {/* Popover overlay if draft created */}
      {popoverDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QuickCreatePopover initialDate={popoverDate} onClose={() => setPopoverDate(null)} onSave={handleSaveDraftEvent} />
        </div>
      )}

      {/* Integrated Full-Width Activity Heatmap Bar */}
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
              >
                {format(h.date, 'd')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Spacious Calendar & Side Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.75rem' }}>
        {/* Calendar Main Container */}
        <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem', minHeight: '650px' }}>
          <div className="view-header" style={{ paddingBottom: 0 }}>
            <div>
              <h1 className="view-header-title" style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CalendarIcon size={24} style={{ color: 'var(--accent-secondary)' }} /> Schedule Workstation
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* View Switcher Toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                <button
                  onClick={() => setViewMode('month')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: viewMode === 'month' ? 'var(--accent-primary)' : 'transparent',
                    color: viewMode === 'month' ? '#FFF' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <Grid size={15} /> Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: viewMode === 'week' ? 'var(--accent-primary)' : 'transparent',
                    color: viewMode === 'week' ? '#FFF' : 'var(--text-secondary)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <Columns size={15} /> Week Grid
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-icon" onClick={prevPeriod} style={{ width: '36px', height: '36px' }}>
                  <ChevronLeft size={18} />
                </button>
                <strong style={{ fontSize: '1.1rem', minWidth: '150px', textAlign: 'center', color: 'var(--text-primary)' }}>
                  {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d")}
                </strong>
                <button className="btn btn-secondary btn-icon" onClick={nextPeriod} style={{ width: '36px', height: '36px' }}>
                  <ChevronRight size={18} />
                </button>
              </div>

              <button className="btn btn-primary" onClick={() => setPopoverDate(selectedDate)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                <Plus size={16} /> New Event
              </button>
            </div>
          </div>

          {/* Render Mode */}
          {viewMode === 'month' ? (
            <>
              {/* Days of Week Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
              </div>

              {/* Month Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');

                  const dayTasks = tasks.filter((t) => t.dueDate === dateStr || t.endDate === dateStr);
                  const dayHabitLogs = habitLogs.filter((l) => l.date === dateStr && l.status === 'completed');
                  const dayCompletedTasks = tasks.filter((t) => (t.dueDate === dateStr || t.endDate === dateStr || t.completedAt?.startsWith(dateStr)) && t.status === 'completed');

                  const hPct = habits.length > 0 ? (dayHabitLogs.length / habits.length) * 100 : 0;
                  const tPct = dayTasks.length > 0 ? (dayCompletedTasks.length / dayTasks.length) * 100 : dayCompletedTasks.length > 0 ? 80 : 0;
                  const dayScore = Math.min(Math.round(habits.length > 0 ? hPct * 0.5 + tPct * 0.5 : tPct), 100);

                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonthDay = isSameMonth(day, currentDate);

                  const getCellBackground = () => {
                    if (!isCurrentMonthDay) return 'rgba(0,0,0,0.15)';
                    if (isSelected) return 'linear-gradient(135deg, rgba(46, 94, 68, 0.85) 0%, rgba(22, 58, 41, 0.95) 100%)';
                    if (dayScore === 0) return 'rgba(13, 34, 26, 0.7)';
                    if (dayScore <= 30) return 'linear-gradient(135deg, rgba(85, 107, 96, 0.38) 0%, rgba(13, 34, 26, 0.8) 100%)';
                    if (dayScore <= 60) return 'linear-gradient(135deg, rgba(230, 168, 23, 0.32) 0%, rgba(13, 34, 26, 0.8) 100%)';
                    if (dayScore <= 80) return 'linear-gradient(135deg, rgba(232, 106, 51, 0.38) 0%, rgba(13, 34, 26, 0.8) 100%)';
                    return 'linear-gradient(135deg, rgba(66, 152, 103, 0.45) 0%, rgba(13, 34, 26, 0.8) 100%)';
                  };

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      style={{
                        minHeight: '110px',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        background: getCellBackground(),
                        border: isSelected ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                        opacity: isCurrentMonthDay ? 1 : 0.35,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: isSelected ? 800 : 700, color: 'var(--text-primary)' }}>
                          {format(day, 'd')}
                        </span>
                        {dayScore > 0 && (
                          <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '8px', background: '#429867', color: '#FFF', fontWeight: 800 }}>
                            {dayScore}%
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {dayHabitLogs.length > 0 && (
                          <span style={{ fontSize: '0.7rem', color: '#57B978', fontWeight: 700 }}>
                            ✓ {dayHabitLogs.length} habit(s)
                          </span>
                        )}
                        {dayTasks.length > 0 && (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(7, 26, 19, 0.85)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dayTasks.length} task(s)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, minHeight: '550px' }}>
              <WeekGrid
                items={calendarItems}
                currentDate={currentDate}
                weekStartDay={1}
                onCreateDraft={(d) => setPopoverDate(d)}
                onSelectItem={(item) => console.log('Selected calendar item:', item)}
                onUpdateItem={(item) => db.calendarItems.put(item)}
              />
            </div>
          )}
        </div>

        {/* Selected Date Side Breakdown */}
        <aside className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Date Breakdown</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>HABITS LOGGED</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
                {completedHabitCount} / {totalActiveHabits}
              </strong>
            </div>

            <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TASKS COMPLETED</span>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {completedTaskCount} / {selectedTasks.length}
              </strong>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <CheckSquare size={15} style={{ color: 'var(--warning)' }} /> Scheduled Tasks ({selectedTasks.length})
            </h4>
            {selectedTasks.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No tasks scheduled for this date.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {selectedTasks.map((t) => (
                  <div key={t.id} style={{ padding: '0.6rem 0.75rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--text-primary)', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <Activity size={15} style={{ color: 'var(--accent-secondary)' }} /> Habit Logs ({selectedHabitLogs.length})
            </h4>
            {selectedHabitLogs.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No habit check-ins recorded for this date.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {selectedHabitLogs.map((l) => {
                  const habit = habits.find((h) => h.id === l.habitId);
                  return (
                    <div key={l.id} style={{ padding: '0.5rem 0.75rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{habit?.name || 'Habit Routine'}</span>
                      <strong style={{ textTransform: 'capitalize', color: 'var(--accent-secondary)' }}>{l.status}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
