import { describe, expect, it } from "vitest";
import { ESCALATION_STATES, transitionEscalation } from "../src/escalation.js";

describe("transitionEscalation", () => {
  it("allows open -> claimed, claimed -> closed, and claimed -> open (release)", () => {
    expect(transitionEscalation("open", "claimed").ok).toBe(true);
    expect(transitionEscalation("claimed", "closed").ok).toBe(true);
    expect(transitionEscalation("claimed", "open").ok).toBe(true);
  });

  it("closed is terminal: no transition out of closed is legal", () => {
    for (const next of ESCALATION_STATES) {
      expect(transitionEscalation("closed", next).ok).toBe(false);
    }
  });

  it("rejects skipping the claim step and self-transitions", () => {
    expect(transitionEscalation("open", "closed").ok).toBe(false);
    for (const state of ESCALATION_STATES) {
      expect(transitionEscalation(state, state).ok).toBe(false);
    }
  });
});
