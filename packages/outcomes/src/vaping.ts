import { definitionRef, type OutcomeDefinition } from "./definitions.js";
import { daysBetween, type VapingJourney } from "./journeys.js";

type PointPrevalenceDefinition = Extract<OutcomeDefinition, { kind: "vaping.point_prevalence" }>;

export interface VapingAbstinenceResult {
  readonly definitionRef: string;
  readonly perPerson: readonly { readonly personId: string; readonly abstinent: boolean }[];
  readonly summary: { readonly n: number; readonly abstinent: number; readonly rate: number };
}

/**
 * Point-prevalence abstinence assessed at `assessmentDay` after the quit
 * date: abstinent iff no use-day falls inside the trailing window
 * (assessmentDay − windowDays, assessmentDay]. ITT: an unreached assessment
 * counts as not abstinent.
 */
export function evaluateVapingPointPrevalence(
  def: PointPrevalenceDefinition,
  journeys: readonly VapingJourney[],
): VapingAbstinenceResult {
  const { assessmentDay, windowDays } = def.params;
  const perPerson = journeys.map((j) => {
    if (!j.assessment30Reached) return { personId: j.personId, abstinent: false };
    const usedInWindow = j.useDays.some((day) => {
      const d = daysBetween(j.quitDate, day);
      return d > assessmentDay - windowDays && d <= assessmentDay;
    });
    return { personId: j.personId, abstinent: !usedInWindow };
  });

  const abstinent = perPerson.filter((p) => p.abstinent).length;
  return {
    definitionRef: definitionRef(def),
    perPerson,
    summary: {
      n: journeys.length,
      abstinent,
      rate: journeys.length === 0 ? 0 : abstinent / journeys.length,
    },
  };
}
