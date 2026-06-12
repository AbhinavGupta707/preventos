import { describe, expect, it } from "vitest";
import { RELAPSE_STATES, daysWon, transitionRelapse } from "../src/relapse.js";

describe("relapse state machine", () => {
  it("recovery path is lapse -> debrief -> plan_repair -> stable", () => {
    expect(transitionRelapse("lapse", "debrief").ok).toBe(true);
    expect(transitionRelapse("debrief", "plan_repair").ok).toBe(true);
    expect(transitionRelapse("plan_repair", "stable").ok).toBe(true);
  });

  it("a lapse can interrupt any state except an in-flight lapse", () => {
    for (const state of RELAPSE_STATES) {
      const result = transitionRelapse(state, "lapse");
      expect(result.ok).toBe(state !== "lapse");
    }
  });

  it("lapse cannot skip the debrief", () => {
    expect(transitionRelapse("lapse", "stable").ok).toBe(false);
    expect(transitionRelapse("lapse", "plan_repair").ok).toBe(false);
  });

  it("every state is reachable and exitable (no orphans, no traps)", () => {
    const reachable = new Set<string>();
    const exitable = new Set<string>();
    for (const from of RELAPSE_STATES) {
      for (const to of RELAPSE_STATES) {
        if (transitionRelapse(from, to).ok) {
          reachable.add(to);
          exitable.add(from);
        }
      }
    }
    for (const state of RELAPSE_STATES) {
      expect(reachable.has(state), `${state} unreachable`).toBe(true);
      expect(exitable.has(state), `${state} is a trap`).toBe(true);
    }
  });
});

describe("daysWon", () => {
  it("counts lapse-free days inclusively", () => {
    expect(daysWon("2026-06-01", "2026-06-10", [])).toBe(10);
  });

  it("a lapse never zeroes the total — it only skips that day", () => {
    expect(daysWon("2026-06-01", "2026-06-10", ["2026-06-05"])).toBe(9);
    expect(daysWon("2026-06-01", "2026-06-10", ["2026-06-05", "2026-06-06"])).toBe(8);
  });

  it("is monotone non-decreasing as days pass, even with repeated lapses", () => {
    const lapses = ["2026-06-03", "2026-06-07", "2026-06-11"];
    let previous = 0;
    for (let d = 1; d <= 14; d++) {
      const today = `2026-06-${String(d).padStart(2, "0")}`;
      const won = daysWon("2026-06-01", today, lapses);
      expect(won).toBeGreaterThanOrEqual(previous);
      previous = won;
    }
  });

  it("handles degenerate inputs", () => {
    expect(daysWon("2026-06-10", "2026-06-01", [])).toBe(0);
    expect(daysWon("garbage", "2026-06-01", [])).toBe(0);
  });
});
