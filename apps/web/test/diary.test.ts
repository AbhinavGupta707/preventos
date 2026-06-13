import { describe, expect, it } from "vitest";
import { sleepEntryMetrics } from "../lib/diary/sleep-entry";
import { dayUnits, weekSummary } from "../lib/diary/drinks";
import type { DrinkEntry } from "../lib/store/types";

describe("sleep entry metrics (4-tap morning check-in)", () => {
  it("computes minutes in bed across midnight", () => {
    const metrics = sleepEntryMetrics({ bedTime: "23:00", getUpTime: "07:00", sleepDelayMin: 30, nightAwakeMin: 30 });
    expect(metrics.minutesInBed).toBe(480);
    expect(metrics.minutesAsleep).toBe(420);
    expect(metrics.efficiencyPercent).toBe(88); // 420/480 = 87.5 → rounds 88
  });

  it("handles a bed time after midnight", () => {
    const metrics = sleepEntryMetrics({ bedTime: "01:30", getUpTime: "08:30", sleepDelayMin: 15, nightAwakeMin: 0 });
    expect(metrics.minutesInBed).toBe(420);
    expect(metrics.minutesAsleep).toBe(405);
  });

  it("never returns negative sleep", () => {
    const metrics = sleepEntryMetrics({ bedTime: "23:00", getUpTime: "23:30", sleepDelayMin: 60, nightAwakeMin: 60 });
    expect(metrics.minutesAsleep).toBe(0);
    expect(metrics.efficiencyPercent).toBe(0);
  });
});

const drink = (date: string, units: number): DrinkEntry => ({
  id: `${date}-${units}-${Math.trunc(units * 10)}`,
  date,
  label: "test drink",
  units,
});

describe("drink log summaries", () => {
  it("sums units for a single day", () => {
    const log = [drink("2026-06-10", 2.3), drink("2026-06-10", 1)];
    expect(dayUnits(log, "2026-06-10")).toBeCloseTo(3.3, 5);
    expect(dayUnits(log, "2026-06-11")).toBe(0);
  });

  it("summarises a week: total units and drink-free days", () => {
    const log = [drink("2026-06-08", 2.3), drink("2026-06-10", 4.6)];
    const summary = weekSummary(log, ["2026-06-08", "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14"]);
    expect(summary.totalUnits).toBeCloseTo(6.9, 5);
    expect(summary.drinkFreeDays).toBe(5);
    expect(summary.overLowRiskGuideline).toBe(false);
  });

  it("flags weeks above the 14-unit low-risk guideline", () => {
    const log = [drink("2026-06-08", 8), drink("2026-06-09", 7)];
    const summary = weekSummary(log, ["2026-06-08", "2026-06-09"]);
    expect(summary.overLowRiskGuideline).toBe(true);
  });
});
