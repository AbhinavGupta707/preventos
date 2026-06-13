import { definitionRef, type OutcomeDefinition } from "./definitions.js";
import { weekIndex, type AlcoholJourney } from "./journeys.js";

type AuditCDeltaDefinition = Extract<OutcomeDefinition, { kind: "alcohol.audit_c_delta" }>;
type DrinkingDaysDefinition = Extract<OutcomeDefinition, { kind: "alcohol.drinking_days" }>;

export interface AuditCDeltaResult {
  readonly definitionRef: string;
  readonly perPerson: readonly { readonly personId: string; readonly delta: number | null }[];
  readonly summary: {
    readonly n: number;
    readonly completers: number;
    readonly meanDelta: number | null;
    readonly missingFollowUp: number;
  };
}

/** AUDIT-C follow-up minus baseline. Completers-only mean; missingness reported, never imputed. */
export function evaluateAuditCDelta(
  def: AuditCDeltaDefinition,
  journeys: readonly AlcoholJourney[],
): AuditCDeltaResult {
  const perPerson = journeys.map((j) => ({
    personId: j.personId,
    delta: j.auditC.followUp4w === null ? null : j.auditC.followUp4w - j.auditC.baseline,
  }));
  const deltas = perPerson
    .map((p) => p.delta)
    .filter((d): d is number => d !== null);
  return {
    definitionRef: definitionRef(def),
    perPerson,
    summary: {
      n: journeys.length,
      completers: deltas.length,
      meanDelta:
        deltas.length === 0 ? null : deltas.reduce((a, b) => a + b, 0) / deltas.length,
      missingFollowUp: journeys.length - deltas.length,
    },
  };
}

export interface DrinkingDaysResult {
  readonly definitionRef: string;
  readonly perPerson: readonly {
    readonly personId: string;
    readonly weeklyDrinkingDays: readonly number[];
  }[];
  readonly summary: { readonly meanByWeek: readonly number[] };
}

/** Drinking days bucketed into weeks from enrolment; days outside the window are ignored. */
export function evaluateDrinkingDays(
  def: DrinkingDaysDefinition,
  journeys: readonly AlcoholJourney[],
): DrinkingDaysResult {
  const { weeks } = def.params;
  const perPerson = journeys.map((j) => {
    const weekly = Array.from({ length: weeks }, () => 0);
    for (const day of j.drinkingDays) {
      const w = weekIndex(j.enrolledAt, day);
      if (w >= 0 && w < weeks) weekly[w] = (weekly[w] ?? 0) + 1;
    }
    return { personId: j.personId, weeklyDrinkingDays: weekly };
  });

  const meanByWeek = Array.from({ length: weeks }, (_, w) =>
    journeys.length === 0
      ? 0
      : perPerson.reduce((sum, p) => sum + (p.weeklyDrinkingDays[w] ?? 0), 0) / journeys.length,
  );
  return { definitionRef: definitionRef(def), perPerson, summary: { meanByWeek } };
}
