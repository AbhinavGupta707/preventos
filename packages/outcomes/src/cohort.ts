import {
  ALCOHOL_AUDIT_C_DELTA,
  ALCOHOL_DRINKING_DAYS,
  SLEEP_DIARY_TRAJECTORY,
  SMOKING_RUSSELL_4W,
  VAPING_PP7,
  VAPING_PP30,
} from "./definitions.js";
import { evaluateAuditCDelta, evaluateDrinkingDays } from "./alcohol.js";
import { evaluateSleepTrajectory } from "./sleep.js";
import { evaluateSmokingQuit } from "./smoking.js";
import { evaluateVapingPointPrevalence } from "./vaping.js";
import { journeysFor, type AgeBand, type Journey } from "./journeys.js";
import type { Vertical } from "@preventos/domain";

/** Evaluate every registered outcome definition against a cohort. */
export function evaluateCohort(cohort: readonly Journey[]) {
  return {
    smoking: {
      quit: evaluateSmokingQuit(SMOKING_RUSSELL_4W, journeysFor(cohort, "smoking")),
    },
    vaping: {
      pp7: evaluateVapingPointPrevalence(VAPING_PP7, journeysFor(cohort, "vaping")),
      pp30: evaluateVapingPointPrevalence(VAPING_PP30, journeysFor(cohort, "vaping")),
    },
    alcohol: {
      auditCDelta: evaluateAuditCDelta(ALCOHOL_AUDIT_C_DELTA, journeysFor(cohort, "alcohol")),
      drinkingDays: evaluateDrinkingDays(ALCOHOL_DRINKING_DAYS, journeysFor(cohort, "alcohol")),
    },
    sleep: {
      trajectory: evaluateSleepTrajectory(SLEEP_DIARY_TRAJECTORY, journeysFor(cohort, "sleep")),
    },
  };
}

export type CohortResults = ReturnType<typeof evaluateCohort>;

export interface EvidenceGroup {
  /** `${vertical}:${ageBand}` — also the suppression key for @preventos/auth k-anonymity. */
  readonly key: string;
  readonly vertical: Vertical;
  readonly ageBand: AgeBand;
  readonly count: number;
  readonly headline: { readonly label: string; readonly value: number };
}

function headlineFor(vertical: Vertical, members: readonly Journey[]): EvidenceGroup["headline"] {
  switch (vertical) {
    case "smoking":
      return {
        label: "4-week quit rate (Russell Standard, ITT)",
        value: evaluateSmokingQuit(SMOKING_RUSSELL_4W, journeysFor(members, "smoking")).summary
          .quitRate,
      };
    case "vaping":
      return {
        label: "30-day point-prevalence abstinence",
        value: evaluateVapingPointPrevalence(VAPING_PP30, journeysFor(members, "vaping")).summary
          .rate,
      };
    case "alcohol":
      return {
        label: "Mean AUDIT-C change at 4 weeks (completers)",
        // Skeleton: 0 when a subgroup has no completers; revisit with real data plumbing.
        value:
          evaluateAuditCDelta(ALCOHOL_AUDIT_C_DELTA, journeysFor(members, "alcohol")).summary
            .meanDelta ?? 0,
      };
    case "sleep": {
      const byWeek = evaluateSleepTrajectory(SLEEP_DIARY_TRAJECTORY, journeysFor(members, "sleep"))
        .summary.meanByWeek;
      const finalWeek = [...byWeek].reverse().find((w) => w !== null);
      return { label: "Sleep efficiency, final observed week (%)", value: finalWeek?.se ?? 0 };
    }
  }
}

/**
 * Raw vertical × age-band aggregate groups. NOT suppressed — callers serving
 * humans must pass these through @preventos/auth suppressSmallGroups first.
 */
export function buildEvidenceGroups(cohort: readonly Journey[]): readonly EvidenceGroup[] {
  const byKey = new Map<string, Journey[]>();
  for (const journey of cohort) {
    const key = `${journey.vertical}:${journey.ageBand}`;
    byKey.set(key, [...(byKey.get(key) ?? []), journey]);
  }
  return [...byKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, members]) => {
      const first = members[0] as Journey;
      return {
        key,
        vertical: first.vertical,
        ageBand: first.ageBand,
        count: members.length,
        headline: headlineFor(first.vertical, members),
      };
    });
}
