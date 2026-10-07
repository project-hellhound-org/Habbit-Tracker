import { isWithinInterval, parseISO, eachDayOfInterval, format, startOfDay, endOfDay } from 'date-fns';

export interface FinTransaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amountMinor: number;
  currency: string;
  categoryId?: string;
  occurredAt: string;
}

export function summarize(transactions: FinTransaction[], periodStart: Date, periodEnd: Date) {
  let incomeMinor = 0;
  let expensesMinor = 0;

  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    const date = parseISO(t.occurredAt);
    if (isWithinInterval(date, { start: startOfDay(periodStart), end: endOfDay(periodEnd) })) {
      if (t.type === 'income') {
        incomeMinor += t.amountMinor;
      } else if (t.type === 'expense') {
        expensesMinor += t.amountMinor;
      }
    }
  }

  const savingsMinor = incomeMinor - expensesMinor;
  const savingsRate = incomeMinor > 0 ? (savingsMinor / incomeMinor) * 100 : 0;

  return { incomeMinor, expensesMinor, savingsMinor, savingsRate };
}

export function comparePeriods(
  current: { incomeMinor: number; expensesMinor: number; savingsMinor: number; savingsRate: number },
  previous: { incomeMinor: number; expensesMinor: number; savingsMinor: number; savingsRate: number } | null
) {
  if (!previous) {
    return { incomeDelta: null, expenseDelta: null, savingsDelta: null, rateDelta: null };
  }

  const calcDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : (curr < 0 ? -100 : 0);
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  return {
    incomeDelta: calcDelta(current.incomeMinor, previous.incomeMinor),
    expenseDelta: calcDelta(current.expensesMinor, previous.expensesMinor),
    savingsDelta: calcDelta(current.savingsMinor, previous.savingsMinor),
    rateDelta: current.savingsRate - previous.savingsRate,
  };
}

export function groupByDayAndCategory(
  transactions: FinTransaction[],
  periodStart: Date,
  periodEnd: Date,
  categoryIds: string[]
) {
  const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
  
  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayData: Record<string, any> = { date: dayStr, totalExpense: 0 };
    
    categoryIds.forEach(id => {
      dayData[id] = 0;
    });

    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const tDate = parseISO(t.occurredAt);
      if (format(tDate, 'yyyy-MM-dd') === dayStr) {
        if (t.categoryId && categoryIds.includes(t.categoryId)) {
          dayData[t.categoryId] += t.amountMinor;
        }
        dayData.totalExpense += t.amountMinor;
      }
    });

    return dayData;
  });
}

export function categoryBreakdown(transactions: FinTransaction[]) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const total = expenses.reduce((sum, t) => sum + t.amountMinor, 0);
  
  if (total === 0) return [];

  const categoryTotals = new Map<string, number>();
  expenses.forEach(t => {
    const catId = t.categoryId || 'uncategorized';
    categoryTotals.set(catId, (categoryTotals.get(catId) || 0) + t.amountMinor);
  });

  const exactPercents = Array.from(categoryTotals.entries()).map(([categoryId, amountMinor]) => ({
    categoryId,
    amountMinor,
    exactPercent: (amountMinor / total) * 100
  }));

  let totalRounded = 0;
  const roundedData = exactPercents.map(item => {
    const rounded = Math.floor(item.exactPercent);
    totalRounded += rounded;
    return { ...item, percent: rounded, remainder: item.exactPercent - rounded };
  });

  roundedData.sort((a, b) => b.remainder - a.remainder);
  
  let diff = 100 - totalRounded;
  for (let i = 0; i < diff && i < roundedData.length; i++) {
    roundedData[i].percent += 1;
  }

  return roundedData.map(({ categoryId, amountMinor, percent }) => ({ categoryId, amountMinor, percent }));
}

export function cumulativeDailySeries(transactions: FinTransaction[], periodStart: Date, periodEnd: Date) {
  const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
  let cumIncome = 0;
  let cumExpense = 0;

  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    transactions.forEach(t => {
      if (t.type === 'transfer') return;
      const tDateStr = format(parseISO(t.occurredAt), 'yyyy-MM-dd');
      
      if (tDateStr === dayStr) {
        if (t.type === 'income') cumIncome += t.amountMinor;
        if (t.type === 'expense') cumExpense += t.amountMinor;
      }
    });

    return {
      date: dayStr,
      cumulativeIncome: cumIncome,
      cumulativeExpense: cumExpense,
    };
  });
}
