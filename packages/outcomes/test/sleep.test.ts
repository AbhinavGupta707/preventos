import { describe, expect, it } from "vitest";
import { SLEEP_DIARY_TRAJECTORY, evaluateSleepTrajectory } from "../src/index.js";
import type { SleepDiaryEntry, SleepJourney } from "../src/index.js";

function entry(date: string, overrides: Partial<Omit<SleepDiaryEntry, "date">> = {}): SleepDiaryEntry {
  return { date, timeInBedMin: 480, solMin: 30, wasoMin: 40, totalSleepMin: 400, ...overrides };
}

function journey(personId: string, diary: readonly SleepDiaryEntry[]): SleepJourney {
  return { personId, vertical: "sleep", ageBand: "25-44", enrolledAt: "2026-01-05", diary };
}

describe("sleep diary trajectories (SE / SOL / WASO)", () => {
  it("computes weekly means; SE is totalSleep/timeInBed as a percentage", () => {
    const diary = [
      entry("2026-01-05", { totalSleepMin: 360 }), // SE 75%
      entry("2026-01-06", { totalSleepMin: 432 }), // SE 90%
      entry("2026-01-07", { totalSleepMin: 408, solMin: 12, wasoMin: 10 }), // SE 85%
    ];
    const result = evaluateSleepTrajectory(SLEEP_DIARY_TRAJECTORY, [journey("p1", diary)]);
    const week0 = result.perPerson[0]?.weekly[0];
    expect(week0?.se).toBeCloseTo((75 + 90 + 85) / 3, 5);
    expect(week0?.solMin).toBeCloseTo((30 + 30 + 12) / 3, 5);
    expect(week0?.wasoMin).toBeCloseTo((40 + 40 + 10) / 3, 5);
  });

  it("a week with fewer than minDiaryDaysPerWeek entries is null, not a thin estimate", () => {
    const diary = [entry("2026-01-05"), entry("2026-01-06")]; // 2 < 3
    const result = evaluateSleepTrajectory(SLEEP_DIARY_TRAJECTORY, [journey("p1", diary)]);
    expect(result.perPerson[0]?.weekly[0]).toBeNull();
  });

  it("summary averages only people with data for that week", () => {
    const full = [entry("2026-01-05"), entry("2026-01-06"), entry("2026-01-07")];
    const thin = [entry("2026-01-05")];
    const result = evaluateSleepTrajectory(SLEEP_DIARY_TRAJECTORY, [
      journey("p1", full),
      journey("p2", thin),
    ]);
    const week0 = result.summary.meanByWeek[0];
    expect(week0?.se).toBeCloseTo((400 / 480) * 100, 5);
    expect(week0?.contributors).toBe(1);
  });

  it("trajectory length matches the definition's week count", () => {
    const result = evaluateSleepTrajectory(SLEEP_DIARY_TRAJECTORY, [journey("p1", [])]);
    expect(result.perPerson[0]?.weekly).toHaveLength(SLEEP_DIARY_TRAJECTORY.params.weeks);
  });
});
