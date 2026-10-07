import {
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  subWeeks, subMonths, subYears,
  format
} from 'date-fns';

export type PeriodKind = 'week' | 'month' | 'year';

export interface PeriodRange {
  start: Date;
  end: Date;
}

export function getPeriodRange(kind: PeriodKind, date: Date = new Date()): PeriodRange {
  switch (kind) {
    case 'week':
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'year':
      return { start: startOfYear(date), end: endOfYear(date) };
  }
}

export function getPreviousPeriodRange(kind: PeriodKind, date: Date = new Date()): PeriodRange {
  let prevDate: Date;
  switch (kind) {
    case 'week':
      prevDate = subWeeks(date, 1);
      return getPeriodRange('week', prevDate);
    case 'month':
      prevDate = subMonths(date, 1);
      return getPeriodRange('month', prevDate);
    case 'year':
      prevDate = subYears(date, 1);
      return getPeriodRange('year', prevDate);
  }
}

export function formatPeriodLabel(kind: PeriodKind, date: Date = new Date()): string {
  switch (kind) {
    case 'week':
      const { start, end } = getPeriodRange('week', date);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'year':
      return format(date, 'yyyy');
  }
}
