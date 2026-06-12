// WP3.1/WP3.2 — UK alcohol units. units = ml × ABV% / 1000 (UK CMO definition).
// Earmarked for extraction into the Steady vertical pack at WPV.3.

export interface Drink {
  readonly volumeMl: number;
  readonly abvPercent: number;
}

export interface DrinkPreset extends Drink {
  readonly id: string;
  readonly label: string;
}

export function drinkUnits(drink: Drink): number {
  if (drink.volumeMl <= 0 || drink.abvPercent <= 0) return 0;
  return (drink.volumeMl * drink.abvPercent) / 1000;
}

export const DRINK_PRESETS: readonly DrinkPreset[] = [
  { id: "pint-beer", label: "Pint of beer (4%)", volumeMl: 568, abvPercent: 4 },
  { id: "pint-strong-beer", label: "Pint of strong beer (5.2%)", volumeMl: 568, abvPercent: 5.2 },
  { id: "bottle-beer", label: "Bottle of beer (5%)", volumeMl: 330, abvPercent: 5 },
  { id: "small-wine", label: "Small glass of wine (125ml, 12%)", volumeMl: 125, abvPercent: 12 },
  { id: "medium-wine", label: "Medium glass of wine (175ml, 13%)", volumeMl: 175, abvPercent: 13 },
  { id: "large-wine", label: "Large glass of wine (250ml, 13%)", volumeMl: 250, abvPercent: 13 },
  { id: "single-spirit", label: "Single spirit (25ml, 40%)", volumeMl: 25, abvPercent: 40 },
  { id: "double-spirit", label: "Double spirit (50ml, 40%)", volumeMl: 50, abvPercent: 40 },
  { id: "alcopop", label: "Alcopop (275ml, 4%)", volumeMl: 275, abvPercent: 4 },
];

/** UK CMO low-risk guideline: not more than 14 units a week, spread over 3+ days. */
export const WEEKLY_LOW_RISK_UNITS = 14;
