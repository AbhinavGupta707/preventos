import { describe, expect, it } from "vitest";
import {
  ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD,
  DEPENDENCE_FLAG,
  deriveAlcoholFlags,
  evaluateRules,
  mandatoryCandidate,
  ruleSetSchema,
  type RuleSet,
} from "../src/index.js";

describe("deriveAlcoholFlags (invariant 4 / E17)", () => {
  it("flags at and above the AUDIT-C possible-dependence threshold", () => {
    expect(deriveAlcoholFlags(ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD)).toEqual([DEPENDENCE_FLAG]);
    expect(deriveAlcoholFlags(12)).toEqual([DEPENDENCE_FLAG]);
  });

  it("does not flag below threshold or when no score is present", () => {
    expect(deriveAlcoholFlags(ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD - 1)).toEqual([]);
    expect(deriveAlcoholFlags(0)).toEqual([]);
    expect(deriveAlcoholFlags(undefined)).toEqual([]);
  });

  it("threshold is the AUDIT-C possible-dependence band (>=11): higher-risk (<=10) stays moderation-eligible (E17)", () => {
    expect(ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD).toBe(11);
    expect(deriveAlcoholFlags(10)).toEqual([]);
  });
});

const HARDSTOP_SET: RuleSet = ruleSetSchema.parse({
  version: "test-hardstop-1",
  rules: [
    {
      id: "alcohol-dependence-hardstop",
      vertical: "alcohol",
      priority: 100,
      unbypassable: true,
      when: [
        { field: "vertical", op: "eq", value: "alcohol" },
        { field: "auditScore", op: "gte", value: ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD },
      ],
      then: { kind: "send_atom", ref: "alcohol.hardstop.screen.main" },
    },
    {
      id: "alcohol-moderation-norm",
      vertical: "alcohol",
      priority: 40,
      when: [{ field: "vertical", op: "eq", value: "alcohol" }],
      then: { kind: "send_atom", ref: "alcohol.norm.above.weekly" },
    },
  ],
});

describe("unbypassable hard-stop routing", () => {
  it("fires the hard-stop only at/above threshold and marks it unbypassable", () => {
    const flagged = evaluateRules(HARDSTOP_SET, { vertical: "alcohol", auditScore: 12 });
    const hardstop = flagged.candidates.find((c) => c.ruleId === "alcohol-dependence-hardstop");
    expect(hardstop?.unbypassable).toBe(true);
    expect(hardstop?.priority).toBe(100);

    const moderate = evaluateRules(HARDSTOP_SET, { vertical: "alcohol", auditScore: 5 });
    expect(moderate.candidates.find((c) => c.ruleId === "alcohol-dependence-hardstop")).toBeUndefined();
    expect(moderate.candidates.find((c) => c.ruleId === "alcohol-moderation-norm")).toBeDefined();
  });

  it("mandatoryCandidate preempts with the highest-priority unbypassable candidate", () => {
    const { candidates } = evaluateRules(HARDSTOP_SET, { vertical: "alcohol", auditScore: 12 });
    const mandatory = mandatoryCandidate(candidates);
    expect(mandatory?.ruleId).toBe("alcohol-dependence-hardstop");
    expect(mandatory?.action.ref).toBe("alcohol.hardstop.screen.main");
  });

  it("mandatoryCandidate returns undefined when nothing is unbypassable", () => {
    const { candidates } = evaluateRules(HARDSTOP_SET, { vertical: "alcohol", auditScore: 5 });
    expect(mandatoryCandidate(candidates)).toBeUndefined();
  });

  it("ordinary rules default to bypassable", () => {
    const { candidates } = evaluateRules(HARDSTOP_SET, { vertical: "alcohol", auditScore: 5 });
    expect(candidates.every((c) => c.unbypassable === false)).toBe(true);
  });
});
