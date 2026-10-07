import { addDays, addWeeks, addMonths, addYears, isAfter, getDaysInMonth, setDate } from 'date-fns';

export type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RRule {
  freq: Freq;
  interval?: number;
  count?: number;
  until?: Date;
}

export function parseRRule(rruleStr: string): RRule {
  const parts = rruleStr.split(';');
  const result: any = {};
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'FREQ') result.freq = value as Freq;
    if (key === 'INTERVAL') result.interval = parseInt(value, 10);
    if (key === 'COUNT') result.count = parseInt(value, 10);
    if (key === 'UNTIL') {
      const year = parseInt(value.slice(0, 4));
      const month = parseInt(value.slice(4, 6)) - 1;
      const day = parseInt(value.slice(6, 8));
      result.until = new Date(year, month, day);
    }
  }
  
  return result as RRule;
}

export function generateRRuleOptions(freq: Freq, interval: number = 1): string {
  return `FREQ=${freq};INTERVAL=${interval}`;
}

export function nextOccurrences(rrule: RRule, startDate: Date, limit: number = 10): Date[] {
  const occurrences: Date[] = [startDate];
  let current = startDate;
  const interval = rrule.interval || 1;
  const maxCount = rrule.count ? Math.min(rrule.count, limit) : limit;

  while (occurrences.length < maxCount) {
    let next: Date;
    
    switch (rrule.freq) {
      case 'DAILY':
        next = addDays(current, interval);
        break;
      case 'WEEKLY':
        next = addWeeks(current, interval);
        break;
      case 'MONTHLY':
        next = addMonths(current, interval);
        const targetDay = startDate.getDate();
        const daysInNextMonth = getDaysInMonth(next);
        if (targetDay > daysInNextMonth) {
          next = setDate(next, daysInNextMonth);
        } else {
          next = setDate(next, targetDay);
        }
        break;
      case 'YEARLY':
        next = addYears(current, interval);
        break;
      default:
        throw new Error(`Unsupported FREQ: ${rrule.freq}`);
    }

    if (rrule.until && isAfter(next, rrule.until)) {
      break;
    }

    occurrences.push(next);
    current = next;
  }

  return occurrences;
}
