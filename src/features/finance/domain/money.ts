export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

export function formatMoney(amountMinor: number, currency: CurrencyCode): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  });
  return formatter.format(toDisplayAmount(amountMinor));
}

export function formatSignedMoney(amountMinor: number, currency: CurrencyCode): string {
  const formatted = formatMoney(Math.abs(amountMinor), currency);
  if (amountMinor < 0) {
    return `-${formatted}`;
  }
  return `+${formatted}`;
}

export function addMoney(a: number, b: number): number {
  return a + b;
}

export function subtractMoney(a: number, b: number): number {
  return a - b;
}

export function toMinorUnits(displayAmount: number): number {
  return Math.round(displayAmount * 100);
}

export function toDisplayAmount(minorUnits: number): number {
  return minorUnits / 100;
}
