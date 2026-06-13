import type { Vertical } from "@preventos/domain";

/**
 * Journey shapes the outcome evaluators consume. The synthetic fixture cohort
 * and (later) event-store projections both produce these. Dates are ISO
 * calendar dates (YYYY-MM-DD); no free text, no direct identifiers — same
 * erasure invariant as the event catalogue.
 */

export const AGE_BANDS = ["18-24", "25-44", "45-64", "65plus"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

interface JourneyBase {
  readonly personId: string;
  readonly ageBand: AgeBand;
  /** Programme enrolment date — week indices are computed from here. */
  readonly enrolledAt: string;
}

/** 4-week follow-up contact for the Russell-Standard smoking outcome. */
export type SmokingFollowUp =
  | { readonly reached: false }
  | {
      readonly reached: true;
      /** Self-reported cigarettes smoked since the post-quit grace period ended. */
      readonly cigarettesAfterGrace: number;
      /** Expired-air CO reading at follow-up, if a verification was taken. */
      readonly coPpm?: number;
    };

export interface SmokingJourney extends JourneyBase {
  readonly vertical: "smoking";
  readonly quitDate: string;
  readonly followUp4w: SmokingFollowUp;
}

export interface VapingJourney extends JourneyBase {
  readonly vertical: "vaping";
  readonly quitDate: string;
  /** Calendar dates on which any vaping use occurred. */
  readonly useDays: readonly string[];
  /** Whether the day-30 assessment contact was reached (ITT: unreached = not abstinent). */
  readonly assessment30Reached: boolean;
}

export interface AlcoholJourney extends JourneyBase {
  readonly vertical: "alcohol";
  /** AUDIT-C scores (0–12). Follow-up is null when the person was not re-assessed. */
  readonly auditC: { readonly baseline: number; readonly followUp4w: number | null };
  /** Calendar dates on which any drinking occurred. */
  readonly drinkingDays: readonly string[];
}

export interface SleepDiaryEntry {
  readonly date: string;
  readonly timeInBedMin: number;
  /** Sleep-onset latency. */
  readonly solMin: number;
  /** Wake after sleep onset. */
  readonly wasoMin: number;
  readonly totalSleepMin: number;
}

export interface SleepJourney extends JourneyBase {
  readonly vertical: "sleep";
  readonly diary: readonly SleepDiaryEntry[];
}

export type Journey = SmokingJourney | VapingJourney | AlcoholJourney | SleepJourney;

export function journeysFor<V extends Vertical>(
  cohort: readonly Journey[],
  vertical: V,
): readonly Extract<Journey, { vertical: V }>[] {
  return cohort.filter((j): j is Extract<Journey, { vertical: V }> => j.vertical === vertical);
}

/** Whole days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** 0-based week index of `date` relative to `start`; negative if before start. */
export function weekIndex(start: string, date: string): number {
  return Math.floor(daysBetween(start, date) / 7);
}
