/**
 * Deterministic evolution & cosmetic unlocks — keyed ONLY to days-won
 * milestones. No randomness, no variable schedule (anti-loot-box rule, E21).
 */

export interface EvolutionStage {
  readonly stage: number;
  readonly name: string;
  /** Minimum days-won to reach this stage. */
  readonly minDaysWon: number;
  /** Cosmetic unlocked on reaching this stage. */
  readonly accessory?: string;
}

export const EVOLUTION_STAGES: readonly EvolutionStage[] = [
  { stage: 0, name: "sprout", minDaysWon: 0 },
  { stage: 1, name: "hatchling", minDaysWon: 1, accessory: "first-leaf" },
  { stage: 2, name: "fledgling", minDaysWon: 3, accessory: "scarf" },
  { stage: 3, name: "explorer", minDaysWon: 7, accessory: "backpack" },
  { stage: 4, name: "thriving", minDaysWon: 14, accessory: "sun-hat" },
  { stage: 5, name: "flourishing", minDaysWon: 28, accessory: "garden" },
  { stage: 6, name: "luminous", minDaysWon: 90, accessory: "lantern" },
];

export function stageForDaysWon(daysWon: number): EvolutionStage {
  const clamped = Number.isFinite(daysWon) && daysWon > 0 ? Math.floor(daysWon) : 0;
  let current = EVOLUTION_STAGES[0]!;
  for (const stage of EVOLUTION_STAGES) {
    if (clamped >= stage.minDaysWon) current = stage;
  }
  return current;
}

/** Every accessory unlocked at or below the current days-won (cumulative, deterministic). */
export function accessoriesForDaysWon(daysWon: number): readonly string[] {
  const reached = stageForDaysWon(daysWon).stage;
  return EVOLUTION_STAGES.filter((s) => s.stage <= reached && s.accessory !== undefined).map(
    (s) => s.accessory!,
  );
}
