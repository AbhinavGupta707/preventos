import type { Vertical } from "@preventos/domain";
import type { Candidate } from "./rules.js";

/**
 * Cross-vertical arbitration (PRD §3.4 [D]): one orchestrator ranks competing
 * candidates from all enrolled programmes; no programme may message a person
 * directly. Fairness: a vertical unserved for longer gets a starvation boost,
 * so no enrolled programme is permanently silenced by a louder sibling.
 */
export interface ArbitrationState {
  /** Rounds since each vertical was last chosen (absent = never served). */
  readonly roundsSinceServed: Readonly<Partial<Record<Vertical, number>>>;
}

const STARVATION_BOOST_PER_ROUND = 2;
const NEVER_SERVED_ROUNDS = 5;

export function arbitrate(candidates: readonly Candidate[], state: ArbitrationState): Candidate | undefined {
  if (candidates.length === 0) return undefined;
  const scored = candidates.map((candidate) => {
    const rounds = state.roundsSinceServed[candidate.vertical] ?? NEVER_SERVED_ROUNDS;
    return { candidate, score: candidate.priority + rounds * STARVATION_BOOST_PER_ROUND };
  });
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.candidate.vertical.localeCompare(b.candidate.vertical) ||
      a.candidate.ruleId.localeCompare(b.candidate.ruleId),
  );
  return scored[0]?.candidate;
}

export function nextArbitrationState(state: ArbitrationState, served: Vertical | undefined): ArbitrationState {
  const updated: Partial<Record<Vertical, number>> = {};
  for (const [vertical, rounds] of Object.entries(state.roundsSinceServed) as [Vertical, number][]) {
    updated[vertical] = vertical === served ? 0 : rounds + 1;
  }
  if (served !== undefined && updated[served] === undefined) updated[served] = 0;
  return { roundsSinceServed: updated };
}
