import { definitionRef, type OutcomeDefinition } from "./definitions.js";
import { weekIndex, type SleepDiaryEntry, type SleepJourney } from "./journeys.js";

type SleepTrajectoryDefinition = Extract<OutcomeDefinition, { kind: "sleep.diary_trajectory" }>;

export interface SleepWeekMetrics {
  /** Sleep efficiency: totalSleep / timeInBed, as a percentage. */
  readonly se: number;
  readonly solMin: number;
  readonly wasoMin: number;
}

export interface SleepTrajectoryResult {
  readonly definitionRef: string;
  readonly perPerson: readonly {
    readonly personId: string;
    readonly weekly: readonly (SleepWeekMetrics | null)[];
  }[];
  readonly summary: {
    readonly meanByWeek: readonly ((SleepWeekMetrics & { readonly contributors: number }) | null)[];
  };
}

function mean(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weekMetrics(entries: readonly SleepDiaryEntry[]): SleepWeekMetrics {
  return {
    se: mean(entries.map((e) => (e.totalSleepMin / e.timeInBedMin) * 100)),
    solMin: mean(entries.map((e) => e.solMin)),
    wasoMin: mean(entries.map((e) => e.wasoMin)),
  };
}

/**
 * Diary-derived SE/SOL/WASO weekly trajectories. A week with fewer than
 * minDiaryDaysPerWeek entries yields null — no thin estimates. (SCI deferred
 * pending license, WP10.4.)
 */
export function evaluateSleepTrajectory(
  def: SleepTrajectoryDefinition,
  journeys: readonly SleepJourney[],
): SleepTrajectoryResult {
  const { weeks, minDiaryDaysPerWeek } = def.params;
  const perPerson = journeys.map((j) => {
    const weekly = Array.from({ length: weeks }, (_, w) => {
      const entries = j.diary.filter((e) => weekIndex(j.enrolledAt, e.date) === w);
      return entries.length >= minDiaryDaysPerWeek ? weekMetrics(entries) : null;
    });
    return { personId: j.personId, weekly };
  });

  const meanByWeek = Array.from({ length: weeks }, (_, w) => {
    const present = perPerson
      .map((p) => p.weekly[w])
      .filter((m): m is SleepWeekMetrics => m !== null && m !== undefined);
    if (present.length === 0) return null;
    return {
      se: mean(present.map((m) => m.se)),
      solMin: mean(present.map((m) => m.solMin)),
      wasoMin: mean(present.map((m) => m.wasoMin)),
      contributors: present.length,
    };
  });

  return { definitionRef: definitionRef(def), perPerson, summary: { meanByWeek } };
}
