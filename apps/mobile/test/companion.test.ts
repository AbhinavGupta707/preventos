import { describe, expect, it } from "vitest";

import { companionTimeOfDay, resolveCompanion } from "../src/core/companion";

const base = { daysWon: 5, hour: 14 } as const;

describe("companion mapper — drives the @preventos/companion engine from app state", () => {
  it("INVARIANT 1 (app layer): a crisis context steps the companion aside — invisible and silent", () => {
    const view = resolveCompanion({ ...base, context: "crisis", milestoneJustReached: true, recentLapse: true });
    // Even with celebratory/lapse flags set, crisis wins: the avatar disappears.
    expect(view.visible).toBe(false);
    expect(view.mood).toBe("stepped_aside");
    expect(view.dialogueSlot).toBeNull();
    expect(view.animation.reduceMotion).toBe(true);
    expect(view.animation.loopSeconds).toBe(0);
  });

  it("home at night rests; home by day after a logged check-in reads happy", () => {
    expect(resolveCompanion({ ...base, context: "home", hour: 23 }).mood).toBe("asleep");
    const day = resolveCompanion({ ...base, context: "home", hour: 10, diaryLoggedToday: true });
    expect(day.mood).toBe("happy");
    expect(day.dialogueSlot).toBe("companion.home.encourage");
  });

  it("a crossed milestone celebrates", () => {
    const view = resolveCompanion({ ...base, context: "home", milestoneJustReached: true });
    expect(view.mood).toBe("celebrating");
    expect(view.dialogueSlot).toBe("companion.milestone.celebrate");
  });

  it("a recent lapse on the coach surface is care, never blame", () => {
    const view = resolveCompanion({ ...base, context: "coach", recentLapse: true });
    expect(view.mood).toBe("concerned");
    expect(view.dialogueSlot).toBe("companion.lapse.care");
  });

  it("SOS co-breathing puts the companion into a paced breathing loop", () => {
    const view = resolveCompanion({ ...base, context: "sos", sosBreathingActive: true });
    expect(view.mood).toBe("breathing");
    expect(view.dialogueSlot).toBe("companion.sos.coregulate");
    expect(view.animation.breathCycleSeconds).toBeGreaterThan(0);
  });

  it("reduced-motion is threaded through to the animation hints", () => {
    expect(resolveCompanion({ ...base, context: "home", reduceMotion: true }).animation.reduceMotion).toBe(true);
    expect(resolveCompanion({ ...base, context: "home", reduceMotion: false }).animation.reduceMotion).toBe(false);
  });

  it("evolution stage and accessories are deterministic in days won (no loot)", () => {
    const sprout = resolveCompanion({ ...base, daysWon: 0, context: "home", hour: 10 });
    expect(sprout.evolutionStageName).toBe("sprout");
    expect(sprout.unlockedAccessories).toEqual([]);

    const explorer = resolveCompanion({ ...base, daysWon: 7, context: "home", hour: 10 });
    expect(explorer.evolutionStageName).toBe("explorer");
    expect(explorer.unlockedAccessories).toEqual(["first-leaf", "scarf", "backpack"]);
  });

  it("maps the local hour to a time-of-day band", () => {
    expect(companionTimeOfDay(3)).toBe("night");
    expect(companionTimeOfDay(8)).toBe("morning");
    expect(companionTimeOfDay(14)).toBe("day");
    expect(companionTimeOfDay(20)).toBe("evening");
    expect(companionTimeOfDay(23)).toBe("night");
  });
});
