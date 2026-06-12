import type { PersonId } from "./ids.js";

/** Morning 4-tap sleep diary entry. Times are local-time ISO strings ("HH:MM"). */
export interface SleepDiaryEntry {
  readonly id: string;
  readonly personId: PersonId;
  readonly date: string;
  readonly bedTime: string;
  readonly sleepOnsetLatencyMin: number;
  readonly wasoMin: number;
  readonly wakeCount?: number;
  readonly finalWakeTime: string;
  readonly riseTime: string;
  readonly quality?: 1 | 2 | 3 | 4 | 5;
  readonly createdAt: Date;
}

/**
 * One titration step of the prescribed sleep window. Versioned and append-only:
 * every adjustment is auditable (plan §4.2). Computation rules live in the
 * Nightshift pack (WPV.4), not here.
 */
export interface SleepWindow {
  readonly id: string;
  readonly personId: PersonId;
  readonly version: number;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly computedFrom: Readonly<Record<string, unknown>>;
  readonly effectiveFrom: string;
  readonly createdAt: Date;
}

export interface DrinkLogEntry {
  readonly id: string;
  readonly personId: PersonId;
  readonly date: string;
  readonly units: number;
  readonly drinkType?: string;
  readonly context?: string;
  readonly loggedAt: Date;
}
