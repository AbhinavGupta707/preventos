import { describe, expect, it } from "vitest";
import { VAPING_PP7, VAPING_PP30, evaluateVapingPointPrevalence } from "../src/index.js";
import type { VapingJourney } from "../src/index.js";

function journey(
  personId: string,
  useDays: readonly string[],
  assessment30Reached = true,
): VapingJourney {
  return {
    personId,
    vertical: "vaping",
    ageBand: "18-24",
    enrolledAt: "2026-01-05",
    quitDate: "2026-01-05",
    useDays,
    assessment30Reached,
  };
}

describe("vaping point-prevalence abstinence", () => {
  // quitDate 2026-01-05, assessment day 30 → 2026-02-04.
  // 7-day window: days 24–30 (2026-01-29 .. 2026-02-04); 30-day window: days 1–30.
  it("use inside the window breaks abstinence; outside it does not", () => {
    const early = journey("p1", ["2026-01-15"]); // day 10
    const late = journey("p2", ["2026-02-01"]); // day 27
    const clean = journey("p3", []);

    const pp7 = evaluateVapingPointPrevalence(VAPING_PP7, [early, late, clean]);
    expect(pp7.perPerson.map((p) => p.abstinent)).toEqual([true, false, true]);
    expect(pp7.summary).toMatchObject({ n: 3, abstinent: 2, rate: 2 / 3 });

    const pp30 = evaluateVapingPointPrevalence(VAPING_PP30, [early, late, clean]);
    expect(pp30.perPerson.map((p) => p.abstinent)).toEqual([false, false, true]);
    expect(pp30.summary).toMatchObject({ n: 3, abstinent: 1, rate: 1 / 3 });
  });

  it("ITT: unreached assessment counts as not abstinent", () => {
    const result = evaluateVapingPointPrevalence(VAPING_PP7, [journey("p1", [], false)]);
    expect(result.perPerson[0]?.abstinent).toBe(false);
    expect(result.summary).toMatchObject({ n: 1, abstinent: 0 });
  });

  it("use before the quit date never counts against the 30-day window", () => {
    const result = evaluateVapingPointPrevalence(VAPING_PP30, [journey("p1", ["2026-01-03"])]);
    expect(result.perPerson[0]?.abstinent).toBe(true);
  });
});
