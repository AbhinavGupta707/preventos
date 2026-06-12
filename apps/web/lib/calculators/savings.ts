// WP3.1 — savings calculator core. Pure, linear, never negative.

export interface SavingsProjection {
  readonly perDay: number;
  readonly perWeek: number;
  readonly perMonth: number;
  readonly perYear: number;
}

const DAYS_PER_YEAR = 365.25;
const DAYS_PER_MONTH = DAYS_PER_YEAR / 12;

const clampSpend = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0);

export function projectSavings(dailySpend: number): SavingsProjection {
  const perDay = clampSpend(dailySpend);
  return {
    perDay,
    perWeek: perDay * 7,
    perMonth: perDay * DAYS_PER_MONTH,
    perYear: perDay * DAYS_PER_YEAR,
  };
}

export function smokingDailySpend(input: {
  readonly cigarettesPerDay: number;
  readonly pricePerPack: number;
  readonly cigarettesPerPack: number;
}): number {
  if (input.cigarettesPerPack <= 0) return 0;
  return clampSpend((input.cigarettesPerDay / input.cigarettesPerPack) * input.pricePerPack);
}

export function vapingDailySpend(input: { readonly weeklySpend: number }): number {
  return clampSpend(input.weeklySpend / 7);
}

export function alcoholDailySpend(input: {
  readonly drinksPerWeek: number;
  readonly pricePerDrink: number;
}): number {
  return clampSpend((input.drinksPerWeek * input.pricePerDrink) / 7);
}
