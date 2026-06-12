import { describe, expect, it } from "vitest";
import type { DecisionRecord } from "../src/events.js";
import { validateDecisionRecord } from "../src/events.js";
import type { DecisionId, PersonId } from "../src/ids.js";

const valid: DecisionRecord = {
  id: "d1" as DecisionId,
  personId: "p1" as PersonId,
  vertical: "smoking",
  stateSnapshot: { stage: "acting" },
  candidates: [{ atom: "smoking.craving.surf90" }],
  policyVersion: "rules@0.1.0",
  chosenAction: { atom: "smoking.craving.surf90" },
  randomisationProbability: 1,
  occurredAt: new Date("2026-06-12"),
};

describe("validateDecisionRecord", () => {
  it("accepts a deterministic decision (probability 1)", () => {
    expect(validateDecisionRecord(valid).ok).toBe(true);
  });

  it("accepts randomised probabilities within [0, 1]", () => {
    expect(validateDecisionRecord({ ...valid, randomisationProbability: 0 }).ok).toBe(true);
    expect(validateDecisionRecord({ ...valid, randomisationProbability: 0.5 }).ok).toBe(true);
  });

  it("rejects probabilities outside [0, 1] and non-finite values", () => {
    for (const p of [-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(validateDecisionRecord({ ...valid, randomisationProbability: p }).ok).toBe(false);
    }
  });

  it("rejects empty candidate sets and blank policy versions", () => {
    expect(validateDecisionRecord({ ...valid, candidates: [] }).ok).toBe(false);
    expect(validateDecisionRecord({ ...valid, policyVersion: "  " }).ok).toBe(false);
  });
});
