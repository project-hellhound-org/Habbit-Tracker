import { HabitLog, Task } from '../db/schema';
import { format, subDays } from 'date-fns';

/**
 * Calculates the accurate real-time consecutive day streak based on completion activity.
 */
export function calculateCurrentStreak(
  habitLogs: HabitLog[],
  tasks: Task[],
  availableFreezes: number = 0
): { currentStreak: number; freezeEarned: number; isFreezeShieldActive: boolean } {
  const completedDatesSet = new Set<string>();

  // Collect habit completion dates
  habitLogs.forEach((log) => {
    if (log.status === 'completed' && log.date) {
      completedDatesSet.add(log.date);
    }
  });

  // Collect task completion dates
  tasks.forEach((task) => {
    if (task.status === 'completed' && task.completedAt) {
      const dateStr = task.completedAt.slice(0, 10);
      if (dateStr && dateStr.length === 10) {
        completedDatesSet.add(dateStr);
      }
    }
  });

  if (completedDatesSet.size === 0) {
    return { currentStreak: 0, freezeEarned: 0, isFreezeShieldActive: false };
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  let checkDate = new Date();
  let unusedFreezes = availableFreezes;
  let isFreezeShieldActive = false;

  // Determine starting date for streak counting (today if active, else yesterday or check freeze)
  if (!completedDatesSet.has(todayStr)) {
    if (completedDatesSet.has(yesterdayStr)) {
      checkDate = subDays(new Date(), 1);
    } else if (unusedFreezes > 0) {
      // Shield missed today/yesterday using earned freeze
      unusedFreezes--;
      isFreezeShieldActive = true;
      checkDate = subDays(new Date(), 1);
    } else {
      return { currentStreak: 0, freezeEarned: 0, isFreezeShieldActive: false };
    }
  }

  let streakCount = 0;
  let missedDaysInARow = 0;

  while (true) {
    const currentCheckStr = format(checkDate, 'yyyy-MM-dd');
    if (completedDatesSet.has(currentCheckStr)) {
      streakCount++;
      missedDaysInARow = 0;
      checkDate = subDays(checkDate, 1);
    } else {
      // 1 missed day shield protection if streak freeze item is available
      if (unusedFreezes > 0 && missedDaysInARow === 0) {
        unusedFreezes--;
        isFreezeShieldActive = true;
        missedDaysInARow++;
        checkDate = subDays(checkDate, 1); // skip missed day and continue
      } else {
        break;
      }
    }
  }

  // Earn 1 streak freeze for every 5 consecutive days of activity
  const freezeEarned = Math.floor(streakCount / 5);

  return {
    currentStreak: streakCount,
    freezeEarned,
    isFreezeShieldActive,
  };
}

/**
 * Calculates streak and consistency statistics for an individual habit.
 */
export function calculateHabitStats(
  habit: any,
  habitLogs: HabitLog[],
  currentDate: Date = new Date(),
  streakSkipRule: string = 'pause'
): { currentStreak: number; longestStreak: number; completionRate30Days: number } {
  const habitLogsForHabit = habitLogs.filter((l) => l.habitId === habit.id);
  const completedDates = new Set(
    habitLogsForHabit.filter((l) => l.status === 'completed').map((l) => l.date)
  );

  const todayStr = format(currentDate, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(currentDate, 1), 'yyyy-MM-dd');

  // Compute current streak
  let checkDate = currentDate;
  if (!completedDates.has(todayStr)) {
    if (completedDates.has(yesterdayStr)) {
      checkDate = subDays(currentDate, 1);
    } else {
      checkDate = currentDate;
    }
  }

  let currentStreak = 0;
  if (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
    while (true) {
      const dStr = format(checkDate, 'yyyy-MM-dd');
      if (completedDates.has(dStr)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  }

  // Compute longest streak
  let longestStreak = currentStreak;
  let tempStreak = 0;
  for (let i = 0; i < 365; i++) {
    const dStr = format(subDays(currentDate, i), 'yyyy-MM-dd');
    if (completedDates.has(dStr)) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Compute 30-day completion rate
  let completedCount30 = 0;
  for (let i = 0; i < 30; i++) {
    const dStr = format(subDays(currentDate, i), 'yyyy-MM-dd');
    if (completedDates.has(dStr)) {
      completedCount30++;
    }
  }
  const completionRate30Days = Math.round((completedCount30 / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    completionRate30Days,
  };
}
