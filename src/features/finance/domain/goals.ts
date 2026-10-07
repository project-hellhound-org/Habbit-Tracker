import { differenceInMonths } from 'date-fns';

export function goalProgress(currentMinor: number, targetMinor: number, targetDate?: Date, now: Date = new Date()) {
  const remainingMinor = Math.max(0, targetMinor - currentMinor);
  let percent = 0;
  
  if (targetMinor > 0) {
    percent = (currentMinor / targetMinor) * 100;
  }

  let requiredMonthlyMinor = 0;
  if (targetDate && remainingMinor > 0) {
    const monthsLeft = Math.max(1, differenceInMonths(targetDate, now));
    requiredMonthlyMinor = Math.ceil(remainingMinor / monthsLeft);
  }

  return { percent, remainingMinor, requiredMonthlyMinor };
}
