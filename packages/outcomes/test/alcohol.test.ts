import { describe, expect, it } from "vitest";
import {
  ALCOHOL_AUDIT_C_DELTA,
  ALCOHOL_DRINKING_DAYS,
  evaluateAuditCDelta,
  evaluateDrinkingDays,
} from "../src/index.js";
import type { AlcoholJourney } from "../src/index.js";

function journey(
  personId: string,
  auditC: AlcoholJourney["auditC"],
  drinkingDays: readonly string[] = [],
): AlcoholJourney {
  return { personId, vertical: "alcohol", ageBand: "45-64", enrolledAt: "2026-01-05", auditC, drinkingDays };
}

describe("AUDIT-C delta", () => {
  it("computes follow-up minus baseline per completer and the completer mean", () => {
    const result = evaluateAuditCDelta(ALCOHOL_AUDIT_C_DELTA, [
      journey("p1", { baseline: 9, followUp4w: 6 }),
      journey("p2", { baseline: 7, followUp4w: 7 }),
      journey("p3", { baseline: 8, followUp4w: null }),
    ]);
    expect(result.perPerson.map((p) => p.delta)).toEqual([-3, 0, null]);
    expect(result.summary).toMatchObject({ n: 3, completers: 2, meanDelta: -1.5, missingFollowUp: 1 });
  });

  it("reports a null mean when nobody completed (no fabricated zero)", () => {
    const result = evaluateAuditCDelta(ALCOHOL_AUDIT_C_DELTA, [
      journey("p1", { baseline: 8, followUp4w: null }),
    ]);
    expect(result.summary.meanDelta).toBeNull();
  });
});

describe("drinking-days trajectory", () => {
  it("buckets drinking days into weeks from enrolment", () => {
    const result = evaluateDrinkingDays(ALCOHOL_DRINKING_DAYS, [
      // enrolment 2026-01-05: week 0 = Jan 5–11, week 1 = Jan 12–18.
      journey("p1", { baseline: 6, followUp4w: 4 }, ["2026-01-05", "2026-01-07", "2026-01-13"]),
    ]);
    const weekly = result.perPerson[0]?.weeklyDrinkingDays;
    expect(weekly?.[0]).toBe(2);
    expect(weekly?.[1]).toBe(1);
    expect(weekly).toHaveLength(ALCOHOL_DRINKING_DAYS.params.weeks);
  });

  it("averages weekly counts across people", () => {
    const result = evaluateDrinkingDays(ALCOHOL_DRINKING_DAYS, [
      journey("p1", { baseline: 6, followUp4w: 4 }, ["2026-01-05", "2026-01-06"]),
      journey("p2", { baseline: 6, followUp4w: 4 }, ["2026-01-07"]),
    ]);
    expect(result.summary.meanByWeek[0]).toBe(1.5);
  });

  it("ignores drinking days outside the observation window", () => {
    const result = evaluateDrinkingDays(ALCOHOL_DRINKING_DAYS, [
      journey("p1", { baseline: 6, followUp4w: 4 }, ["2025-12-25", "2027-01-01"]),
    ]);
    expect(result.perPerson[0]?.weeklyDrinkingDays.every((c) => c === 0)).toBe(true);
  });
});
