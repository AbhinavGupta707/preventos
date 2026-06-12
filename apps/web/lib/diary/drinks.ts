// WP3.2 — drink-log summaries. Unit maths lives in lib/calculators/units.ts;
// both are earmarked for the Steady vertical pack at WPV.3.
import { WEEKLY_LOW_RISK_UNITS } from "../calculators/units";
import type { DrinkEntry } from "../store/types";

export interface WeekSummary {
  readonly totalUnits: number;
  readonly drinkFreeDays: number;
  readonly overLowRiskGuideline: boolean;
}

export function dayUnits(log: readonly DrinkEntry[], date: string): number {
  return log.filter((entry) => entry.date === date).reduce((total, entry) => total + entry.units, 0);
}

export function weekSummary(log: readonly DrinkEntry[], dates: readonly string[]): WeekSummary {
  const totalUnits = dates.reduce((total, date) => total + dayUnits(log, date), 0);
  const drinkFreeDays = dates.filter((date) => dayUnits(log, date) === 0).length;
  return {
    totalUnits,
    drinkFreeDays,
    overLowRiskGuideline: totalUnits > WEEKLY_LOW_RISK_UNITS,
  };
}

/** The seven ISO dates ending today (local time). */
export function lastSevenDates(today = new Date()): readonly string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return day.toISOString().slice(0, 10);
  });
}
