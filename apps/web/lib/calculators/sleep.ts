// WP3.1/WP3.2 — sleep-debt lead magnet + diary metrics.
// Wellbeing framing only (E16); titration engine itself is WPV.4, not here.

export function sleepDebt(input: { readonly needHours: number; readonly sleptHours: readonly number[] }): number {
  if (input.needHours <= 0) return 0;
  return input.sleptHours.reduce((debt, slept) => {
    const shortfall = input.needHours - Math.max(slept, 0);
    return debt + Math.max(shortfall, 0);
  }, 0);
}

/** Percentage of time in bed actually spent asleep, clamped to 0–100. */
export function sleepEfficiency(input: { readonly minutesInBed: number; readonly minutesAsleep: number }): number {
  if (input.minutesInBed <= 0) return 0;
  const ratio = (Math.max(input.minutesAsleep, 0) / input.minutesInBed) * 100;
  return Math.min(Math.round(ratio), 100);
}
