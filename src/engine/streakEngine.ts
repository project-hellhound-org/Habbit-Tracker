import { Habit, HabitLog } from '../db/schema';
import {
  format,
  parseISO,
  subDays,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  getDay
} from 'date-fns';

export interface HabitStreakStats {
  currentStreak: number;
  longestStreak: number;
  completionRate30Days: number;
  completionPercentage: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  totalCompletions: number;
  bestDayOfWeek: string;
}

export function isHabitScheduledForDate(habit: Habit, date: Date): boolean {
  if (habit.archived) return false;

  const checkDate = startOfDay(date);
  const startDate = habit.startDate ? startOfDay(parseISO(habit.startDate)) : checkDate;

  if (isBefore(checkDate, startDate)) {
    return false;
  }

  if (habit.endDate) {
    const endDate = startOfDay(parseISO(habit.endDate));
    if (isAfter(checkDate, endDate)) {
      return false;
    }
  }

  if (habit.frequency === 'daily') {
    return true;
  }

  if (habit.frequency === 'custom_days' && habit.customDays) {
    const dayOfWeek = getDay(checkDate);
    return habit.customDays.includes(dayOfWeek);
  }

  return true;
}

export function calculateHabitStats(
  habit: Habit,
  allLogs: HabitLog[],
  referenceDate: Date = new Date(),
  streakSkipRule: 'pause' | 'reset' | 'forgive' | 'break' = 'pause'
): HabitStreakStats {
  const habitLogs = allLogs.filter((l) => l.habitId === habit.id);
  const logMap = new Map<string, HabitLog>();
  habitLogs.forEach((l) => logMap.set(l.date, l));

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  const today = startOfDay(referenceDate);
  const startDate = habit.startDate ? parseISO(habit.startDate) : subDays(today, 365);

  let cur = today;
  let isCurrentPeriod = true;

  while (!isBefore(cur, startDate)) {
    const dateStr = format(cur, 'yyyy-MM-dd');
    const isScheduled = isHabitScheduledForDate(habit, cur);

    if (isScheduled) {
      const log = logMap.get(dateStr);
      const isCompleted = log && (log.status === 'completed' || log.status === 'partial');
      const isSkipped = log && log.status === 'skipped';

      if (isCompleted) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else if (isSkipped && (streakSkipRule === 'pause' || streakSkipRule === 'break' || streakSkipRule === 'forgive')) {
        // Skip preserves streak
      } else {
        if (isCurrentPeriod) {
          if (!isSameDay(cur, today)) {
            currentStreak = runningStreak;
            isCurrentPeriod = false;
          }
        }
        runningStreak = 0;
      }
    }

    cur = subDays(cur, 1);
  }

  if (isCurrentPeriod) {
    currentStreak = runningStreak;
  }

  let completedCount30 = 0;
  let scheduledCount30 = 0;

  for (let i = 0; i < 30; i++) {
    const d = subDays(today, i);
    if (isHabitScheduledForDate(habit, d)) {
      scheduledCount30++;
      const dateStr = format(d, 'yyyy-MM-dd');
      const log = logMap.get(dateStr);
      if (log && (log.status === 'completed' || log.status === 'partial')) {
        completedCount30++;
      }
    }
  }

  const completionRate30Days = scheduledCount30 > 0 ? Math.round((completedCount30 / scheduledCount30) * 100) : 0;
  const dayOfWeekCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  habitLogs.forEach((l) => {
    if (l.status === 'completed' || l.status === 'partial') {
      const dayIdx = getDay(parseISO(l.date));
      dayOfWeekCounts[dayIdx]++;
    }
  });

  let maxDayIdx = 0;
  let maxCount = 0;
  dayOfWeekCounts.forEach((cnt, idx) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      maxDayIdx = idx;
    }
  });

  return {
    currentStreak,
    longestStreak,
    completionRate30Days,
    completionPercentage: completionRate30Days,
    weeklyConsistency: completionRate30Days,
    monthlyConsistency: completionRate30Days,
    totalCompletions: habitLogs.filter((l) => l.status === 'completed' || l.status === 'partial').length,
    bestDayOfWeek: maxCount > 0 ? dayNames[maxDayIdx] : 'N/A',
  };
}
