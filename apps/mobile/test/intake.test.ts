import { describe, expect, it } from "vitest";

import {
  emptyIntake,
  intakeReducer,
  intakeStepCount,
  toBfoSection,
} from "../src/core/intake";

const answeredSmoking = () => {
  let s = emptyIntake("smoking");
  s = intakeReducer(s, { type: "answer_hsi", item: "hsi-ttfc", value: 2 });
  s = intakeReducer(s, { type: "answer_hsi", item: "hsi-cpd", value: 1 });
  s = intakeReducer(s, { type: "toggle_trigger", trigger: "morning coffee" });
  s = intakeReducer(s, { type: "toggle_trigger", trigger: "after work" });
  s = intakeReducer(s, { type: "set_readiness", readiness: "ready" });
  s = intakeReducer(s, { type: "set_quit_offset", days: 7 });
  s = intakeReducer(s, { type: "set_spend", cigarettesPerDay: 15, pricePerPack: 12.5 });
  s = intakeReducer(s, { type: "toggle_struggle", struggle: "cravings hit out of nowhere" });
  return s;
};

describe("intake reducer", () => {
  it("is immutable — actions return new state", () => {
    const s0 = emptyIntake("smoking");
    const s1 = intakeReducer(s0, { type: "answer_hsi", item: "hsi-ttfc", value: 3 });
    expect(s0.answers.hsi["hsi-ttfc"]).toBeUndefined();
    expect(s1.answers.hsi["hsi-ttfc"]).toBe(3);
  });

  it("toggling a trigger twice removes it", () => {
    let s = emptyIntake("smoking");
    s = intakeReducer(s, { type: "toggle_trigger", trigger: "stress" });
    s = intakeReducer(s, { type: "toggle_trigger", trigger: "stress" });
    expect(s.answers.triggers).toEqual([]);
  });

  it("keeps the flow inside the 90-second budget (≤8 single-tap steps)", () => {
    expect(intakeStepCount("smoking")).toBeLessThanOrEqual(8);
  });
});

describe("toBfoSection", () => {
  it("produces a BfoSection with HSI instrument score from @preventos/instruments scoring", () => {
    const result = toBfoSection(answeredSmoking());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.vertical).toBe("smoking");
      expect(result.value.instrumentScores["hsi"]).toBe(3);
      expect(result.value.readiness).toBe("ready");
      expect(result.value.triggers).toContain("after work");
      expect(result.value.completeness).toBe(1);
    }
  });

  it("fails when HSI is incomplete — instrument scores are never guessed", () => {
    let s = emptyIntake("smoking");
    s = intakeReducer(s, { type: "set_readiness", readiness: "ready" });
    const result = toBfoSection(s);
    expect(result.ok).toBe(false);
  });

  it("maps struggles to COM-B deficits deterministically", () => {
    const result = toBfoSection(answeredSmoking());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.value.comB.capability.length +
          result.value.comB.opportunity.length +
          result.value.comB.motivation.length,
      ).toBeGreaterThan(0);
    }
  });
});
