import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import type { EscalationCaseId, PersonId } from "./ids.js";

export const RISK_CLASSES = [
  "self_harm",
  "abuse_dv",
  "safeguarding",
  "overdose",
  "withdrawal_risk",
  "acute_medical",
] as const;
export type RiskClass = (typeof RISK_CLASSES)[number];

export const ESCALATION_STATES = ["open", "claimed", "closed"] as const;
export type EscalationState = (typeof ESCALATION_STATES)[number];

export interface EscalationCase {
  readonly id: EscalationCaseId;
  readonly personId: PersonId;
  readonly riskClass: RiskClass;
  readonly tier: 1 | 2 | 3;
  readonly triggerEventId: bigint;
  readonly state: EscalationState;
  readonly slaDeadline: Date;
  readonly claimedBy?: string;
  readonly closedDisposition?: string;
  readonly createdAt: Date;
  readonly closedAt?: Date;
}

const ALLOWED: ReadonlyMap<EscalationState, readonly EscalationState[]> = new Map([
  ["open", ["claimed"]],
  ["claimed", ["closed", "open"]],
  ["closed", []],
]);

/** Closed cases are terminal and immutable — there is no path out of `closed`. */
export function transitionEscalation(
  current: EscalationState,
  next: EscalationState,
): Result<EscalationState, string> {
  const allowed = ALLOWED.get(current) ?? [];
  if (!allowed.includes(next)) {
    return err(`illegal escalation transition: ${current} -> ${next}`);
  }
  return ok(next);
}
