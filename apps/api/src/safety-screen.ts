import { classify, openCase } from "@preventos/safety";
import type { Db } from "@preventos/db";
import type { PersonId } from "@preventos/domain";

export interface SafetyScreenResult {
  /** Classifier tier scheme: 0 = none, 1 = immediate crisis, 2 = elevated. */
  readonly tier: 0 | 1 | 2;
  readonly crisis: boolean;
  readonly caseId?: string;
}

/**
 * Safety invariant 1 on the SERVER side: any free text a user submits is run
 * through the deterministic classifier before the request returns. A tier-1/2
 * hit opens a human escalation case (off a freshly-published trigger event) so
 * a person is never silently left in crisis. Deterministic, no bypass.
 *
 * `triggerEventId` is the domain event the text arrived with (e.g. the
 * drink.logged / contact.received event), used as the escalation's trigger.
 */
export async function screenInboundText(
  db: Db,
  personId: PersonId,
  text: string | undefined,
  triggerEventId: bigint,
): Promise<SafetyScreenResult> {
  if (text === undefined || text.trim() === "") return { tier: 0, crisis: false };
  const assessment = classify(text);
  if (assessment.tier === 0) return { tier: 0, crisis: false };
  const opened = await openCase(db, {
    personId,
    riskClass: assessment.riskClass ?? "self_harm",
    tier: assessment.tier,
    triggerEventId,
  });
  return { tier: assessment.tier, crisis: true, caseId: opened.id };
}
