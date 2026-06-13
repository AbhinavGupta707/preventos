import { describe, expect, it } from "vitest";
import { companionView } from "../src/engine.js";
import { accessoriesForDaysWon, stageForDaysWon } from "../src/stages.js";
import type { CompanionSnapshot } from "../src/types.js";

const base: CompanionSnapshot = { context: "home", daysWon: 5, timeOfDay: "day" };

describe("companionView — ethical invariants (E21)", () => {
  it("STEPS ASIDE in a crisis: not visible, silent, no animation — even mid-celebration", () => {
    const view = companionView({
      ...base,
      context: "crisis",
      milestoneJustReached: true,
      sosBreathingActive: true,
    });
    expect(view.mood).toBe("stepped_aside");
    expect(view.visible).toBe(false);
    expect(view.dialogueSlot).toBeNull();
    expect(view.animation.loopSeconds).toBe(0);
  });

  it("a lapse is met with CARE, never punishment, and never resets days-won", () => {
    const view = companionView({ ...base, context: "coach", recentLapse: true, daysWon: 12 });
    expect(view.mood).toBe("concerned");
    expect(view.dialogueSlot).toBe("companion.lapse.care");
    // days-won-derived stage is unaffected by the lapse
    expect(view.evolutionStage).toBe(stageForDaysWon(12).stage);
    // no mood encodes disappointment/blame
    expect(["stepped_aside", "concerned", "idle", "happy", "asleep", "breathing", "celebrating"]).toContain(
      view.mood,
    );
  });

  it("co-regulates during an active SOS breathing exercise (calm 10s cycle)", () => {
    const view = companionView({ ...base, context: "sos", sosBreathingActive: true });
    expect(view.mood).toBe("breathing");
    expect(view.animation.breathCycleSeconds).toBe(10);
    expect(view.dialogueSlot).toBe("companion.sos.coregulate");
  });

  it("returns dialogue SLOT IDS, never literal copy (copy stays clinically governed)", () => {
    for (const context of ["onboarding", "home", "sos", "coach"] as const) {
      const view = companionView({ ...base, context, recentLapse: context === "coach" });
      if (view.dialogueSlot !== null) {
        expect(view.dialogueSlot).toMatch(/^companion\.[a-z-]+(\.[a-z-]+)+$/);
        // a slot id is short and dotted — never a sentence
        expect(view.dialogueSlot).not.toMatch(/\s/);
      }
    }
  });
});

describe("companionView — mood selection priority", () => {
  it("crisis > breathing > milestone > lapse > dormancy", () => {
    expect(companionView({ ...base, context: "crisis", recentLapse: true }).mood).toBe("stepped_aside");
    expect(companionView({ ...base, context: "sos", sosBreathingActive: true, milestoneJustReached: true }).mood).toBe(
      "breathing",
    );
    expect(companionView({ ...base, milestoneJustReached: true, recentLapse: true }).mood).toBe("celebrating");
    expect(companionView({ ...base, recentLapse: true, dormantDays: 9 }).mood).toBe("concerned");
  });

  it("sleeps at night on the home surface, is happy on an engaged day, else idle", () => {
    expect(companionView({ ...base, timeOfDay: "night" }).mood).toBe("asleep");
    expect(companionView({ ...base, diaryLoggedToday: true }).mood).toBe("happy");
    expect(companionView({ ...base }).mood).toBe("idle");
  });

  it("welcomes back gently after dormancy (concern, not guilt)", () => {
    const view = companionView({ ...base, dormantDays: 5 });
    expect(view.mood).toBe("concerned");
    expect(view.dialogueSlot).toBe("companion.welcome-back.gentle");
  });
});

describe("evolution & cosmetics — deterministic, days-won only (no loot)", () => {
  it("stage is monotonic in days-won", () => {
    let prev = -1;
    for (let d = 0; d <= 120; d++) {
      const stage = stageForDaysWon(d).stage;
      expect(stage).toBeGreaterThanOrEqual(prev);
      prev = stage;
    }
  });

  it("accessories accumulate at fixed milestones and are identical for identical days-won", () => {
    expect(accessoriesForDaysWon(0)).toEqual([]);
    expect(accessoriesForDaysWon(7)).toEqual(["first-leaf", "scarf", "backpack"]);
    expect(accessoriesForDaysWon(7)).toEqual(accessoriesForDaysWon(7));
    expect(accessoriesForDaysWon(1000)).toContain("lantern");
  });

  it("handles degenerate days-won safely", () => {
    expect(stageForDaysWon(-5).stage).toBe(0);
    expect(stageForDaysWon(Number.NaN).stage).toBe(0);
  });
});
