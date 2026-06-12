import { describe, expect, it } from "vitest";
import {
  EXPERIMENT_SURFACES,
  MANDATORY_GUARDRAIL,
  assignVariant,
  parseExperiment,
} from "../src/index.js";

const VALID = {
  key: "content.morning_message_tone",
  version: 1,
  surface: "content_variant",
  variants: [
    { name: "control", weight: 1 },
    { name: "warm", weight: 1 },
  ],
  guardrails: [MANDATORY_GUARDRAIL, "retention.d7"],
};

describe("experiment definitions — safety excluded by construction", () => {
  it("accepts a valid experiment", () => {
    expect(() => parseExperiment(VALID)).not.toThrow();
  });

  it("the surface vocabulary contains no safety/crisis/escalation surface at all", () => {
    for (const surface of EXPERIMENT_SURFACES) {
      expect(surface).not.toMatch(/safety|crisis|escalation|risk/);
    }
  });

  it("rejects any surface outside the vocabulary (e.g. a crisis flow)", () => {
    expect(() => parseExperiment({ ...VALID, surface: "crisis_flow" })).toThrow();
    expect(() => parseExperiment({ ...VALID, surface: "safety_banner" })).toThrow();
  });

  it("rejects experiment keys in reserved safety namespaces", () => {
    for (const ns of ["safety", "crisis", "escalation", "risk"]) {
      expect(() => parseExperiment({ ...VALID, key: `${ns}.copy_test` })).toThrow();
    }
  });

  it("requires the escalation-rate guardrail on every experiment", () => {
    expect(() => parseExperiment({ ...VALID, guardrails: ["retention.d7"] })).toThrow();
    expect(() => parseExperiment({ ...VALID, guardrails: [] })).toThrow();
  });

  it("rejects unknown guardrail metrics and single-variant experiments", () => {
    expect(() => parseExperiment({ ...VALID, guardrails: [MANDATORY_GUARDRAIL, "made.up"] })).toThrow();
    expect(() => parseExperiment({ ...VALID, variants: [{ name: "control", weight: 1 }] })).toThrow();
  });
});

describe("deterministic assignment", () => {
  const experiment = parseExperiment(VALID);

  it("same person + same experiment version → same variant, always", () => {
    for (const personId of ["a", "b", "c-123", "00000000-0000-4000-8000-000000000001"]) {
      const first = assignVariant(experiment, personId);
      for (let i = 0; i < 5; i += 1) {
        expect(assignVariant(experiment, personId)).toBe(first);
      }
    }
  });

  it("splits roughly by weight (50/50 within ±5% over 2000 people)", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i += 1) {
      const v = assignVariant(experiment, `person-${i}`);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    expect(counts.get("control")).toBeGreaterThan(900);
    expect(counts.get("control")).toBeLessThan(1100);
  });

  it("respects unequal weights (90/10 within tolerance)", () => {
    const skewed = parseExperiment({
      ...VALID,
      key: "content.skewed_test",
      variants: [
        { name: "control", weight: 9 },
        { name: "treat", weight: 1 },
      ],
    });
    let treat = 0;
    for (let i = 0; i < 2000; i += 1) {
      if (assignVariant(skewed, `person-${i}`) === "treat") treat += 1;
    }
    expect(treat).toBeGreaterThan(120);
    expect(treat).toBeLessThan(280);
  });

  it("bumping the version reshuffles assignments", () => {
    const v2 = parseExperiment({ ...VALID, version: 2 });
    let moved = 0;
    for (let i = 0; i < 200; i += 1) {
      if (assignVariant(experiment, `person-${i}`) !== assignVariant(v2, `person-${i}`)) moved += 1;
    }
    expect(moved).toBeGreaterThan(0);
  });
});
