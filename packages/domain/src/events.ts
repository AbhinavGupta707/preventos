import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import type { DecisionId, PersonId } from "./ids.js";
import type { Vertical } from "./verticals.js";

/** Append-only platform event. Payload schemas are owned by their emitting package. */
export interface EventRecord {
  readonly id: bigint;
  readonly type: string;
  readonly personId?: PersonId;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

/** MRT-ready by construction (PRD §7.2): probability is recorded even when deterministic. */
export interface DecisionRecord {
  readonly id: DecisionId;
  readonly personId: PersonId;
  readonly vertical: Vertical;
  readonly stateSnapshot: Readonly<Record<string, unknown>>;
  readonly candidates: readonly Readonly<Record<string, unknown>>[];
  readonly policyVersion: string;
  readonly chosenAction: Readonly<Record<string, unknown>>;
  readonly randomisationProbability: number;
  readonly occurredAt: Date;
}

export function validateDecisionRecord(record: DecisionRecord): Result<DecisionRecord, string> {
  if (!Number.isFinite(record.randomisationProbability)) {
    return err("randomisationProbability must be a finite number");
  }
  if (record.randomisationProbability < 0 || record.randomisationProbability > 1) {
    return err("randomisationProbability must be within [0, 1]");
  }
  if (record.candidates.length === 0) {
    return err("a decision must record at least one candidate action");
  }
  if (record.policyVersion.trim() === "") {
    return err("policyVersion is required for replayability");
  }
  return ok(record);
}
