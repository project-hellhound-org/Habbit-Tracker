export function budgetUsage(limitMinor: number, spentMinor: number) {
  const remainingMinor = limitMinor - spentMinor;
  let percent = 0;
  if (limitMinor > 0) {
    percent = (spentMinor / limitMinor) * 100;
  }
  
  let state: 'ok' | 'warn' | 'over' = 'ok';
  if (percent > 100) {
    state = 'over';
  } else if (percent >= 80) {
    state = 'warn';
  }

  return { percent, remainingMinor, state };
}
