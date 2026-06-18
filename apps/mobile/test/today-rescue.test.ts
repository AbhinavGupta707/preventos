import { describe, expect, it } from "vitest";

import { nextBestAction } from "../src/core/nextBestAction";
import { rescueMode } from "../src/core/rescue";

const base = {
  enrolledVerticals: ["smoking" as const],
  pendingDebrief: false,
  checkinDoneToday: false,
  hasIfThenPlan: true,
  daysUntilQuitDate: 3,
};

describe("nextBestAction — one card across all programmes, never per-programme feeds", () => {
  it("returns exactly one action", () => {
    const action = nextBestAction({ ...base, enrolledVerticals: ["smoking", "vaping", "sleep"] });
    expect(Array.isArray(action)).toBe(false);
    expect(action.id).toBeTruthy();
  });

  it("lapse debrief outranks everything", () => {
    const action = nextBestAction({ ...base, pendingDebrief: true, checkinDoneToday: false });
    expect(action.kind).toBe("debrief");
  });

  it("check-in outranks countdown; plan creation fills the gap", () => {
    expect(nextBestAction({ ...base }).kind).toBe("checkin");
    expect(nextBestAction({ ...base, checkinDoneToday: true }).kind).toBe("countdown");
    expect(
      nextBestAction({ ...base, checkinDoneToday: true, daysUntilQuitDate: undefined, hasIfThenPlan: false }).kind,
    ).toBe("make_plan");
  });

  it("routes Nightshift users to the sleep diary instead of the generic check-in", () => {
    const action = nextBestAction({
      ...base,
      enrolledVerticals: ["sleep"],
      checkinDoneToday: false,
      daysUntilQuitDate: undefined,
    });
    expect(action.kind).toBe("sleep_diary");
    expect(action.route).toBe("/sleep-diary");
    expect(`${action.title} ${action.body}`).not.toMatch(/treat|insomnia|therapy|restriction/i);
  });

  it("always returns a steady-state action when nothing is pending", () => {
    const action = nextBestAction({
      ...base,
      checkinDoneToday: true,
      daysUntilQuitDate: undefined,
      hasIfThenPlan: true,
    });
    expect(action.kind).toBe("encourage");
  });
});

describe("rescueMode — context-aware by time and enrolments", () => {
  it("sleep enrolment at night → can't-sleep mode", () => {
    expect(rescueMode(["smoking", "sleep"], 23)).toBe("cant_sleep");
    expect(rescueMode(["sleep"], 2)).toBe("cant_sleep");
  });

  it("smoking by day → craving; vaping-only → urge", () => {
    expect(rescueMode(["smoking", "sleep"], 14)).toBe("craving");
    expect(rescueMode(["vaping"], 14)).toBe("urge");
    expect(rescueMode(["vaping"], 23)).toBe("urge");
  });

  it("defaults to craving when nothing is enrolled (rescue is never unavailable)", () => {
    expect(rescueMode([], 12)).toBe("craving");
  });
});
