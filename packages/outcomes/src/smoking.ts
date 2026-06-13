import { definitionRef, type OutcomeDefinition } from "./definitions.js";
import type { SmokingJourney } from "./journeys.js";

type SmokingQuitDefinition = Extract<OutcomeDefinition, { kind: "smoking.russell_standard_4w" }>;

export type SmokingQuitStatus = "quit" | "not_quit" | "lost_to_follow_up";

export interface SmokingQuitResult {
  readonly definitionRef: string;
  readonly perPerson: readonly {
    readonly personId: string;
    readonly status: SmokingQuitStatus;
    readonly coVerified: boolean;
  }[];
  readonly summary: {
    readonly n: number;
    readonly quitters: number;
    readonly quitRate: number;
    readonly coVerifiedQuitters: number;
    readonly lostToFollowUp: number;
  };
}

/**
 * Russell-Standard-compatible 4-week quit. ITT denominator: every journey
 * counts; lost to follow-up is a non-quitter. A CO reading at or above the
 * verification threshold overrides self-report.
 */
export function evaluateSmokingQuit(
  def: SmokingQuitDefinition,
  journeys: readonly SmokingJourney[],
): SmokingQuitResult {
  const perPerson = journeys.map((j) => {
    if (!j.followUp4w.reached) {
      return { personId: j.personId, status: "lost_to_follow_up" as const, coVerified: false };
    }
    const { cigarettesAfterGrace, coPpm } = j.followUp4w;
    const selfReportQuit = cigarettesAfterGrace <= def.params.maxCigarettesAfterGrace;
    const coFailed = coPpm !== undefined && coPpm >= def.params.coVerificationPpmMax;
    const quit = selfReportQuit && !coFailed;
    return {
      personId: j.personId,
      status: quit ? ("quit" as const) : ("not_quit" as const),
      coVerified: quit && coPpm !== undefined,
    };
  });

  const quitters = perPerson.filter((p) => p.status === "quit").length;
  return {
    definitionRef: definitionRef(def),
    perPerson,
    summary: {
      n: journeys.length,
      quitters,
      quitRate: journeys.length === 0 ? 0 : quitters / journeys.length,
      coVerifiedQuitters: perPerson.filter((p) => p.coVerified).length,
      lostToFollowUp: perPerson.filter((p) => p.status === "lost_to_follow_up").length,
    },
  };
}
