import { HabitLog, Task, FocusSession } from '../db/schema';
import { format, subDays } from 'date-fns';

export interface DailyTrendPoint {
  dateStr: string;
  displayLabel: string;
  habitCompletionPct: number;
  taskCompletionCount: number;
  focusMinutes: number;
}

export function generate30DayAnalyticsTrend(
  habitLogs: HabitLog[],
  tasks: Task[],
  focusSessions: FocusSession[]
): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = [];

  for (let i = 29; i >= 0; i--) {
    const dateObj = subDays(new Date(), i);
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    const displayLabel = format(dateObj, 'MMM d');

    // Habit completion % for this day
    const dayLogs = habitLogs.filter((l) => l.date === dateStr);
    const completedCount = dayLogs.filter((l) => l.status === 'completed').length;
    const habitCompletionPct = dayLogs.length > 0 ? Math.round((completedCount / dayLogs.length) * 100) : 0;

    // Task completions on this day
    const completedTasksOnDay = tasks.filter(
      (t) => t.status === 'completed' && t.completedAt && t.completedAt.startsWith(dateStr)
    ).length;

    // Focus minutes on this day
    const daySessions = focusSessions.filter(
      (f) => f.startTimestamp && f.startTimestamp.startsWith(dateStr) && f.status === 'completed'
    );
    const focusMinutes = Math.round(
      daySessions.reduce((sum, s) => sum + (s.verifiedSeconds || 0), 0) / 60
    );

    points.push({
      dateStr,
      displayLabel,
      habitCompletionPct,
      taskCompletionCount: completedTasksOnDay,
      focusMinutes,
    });
  }

  return points;
}
