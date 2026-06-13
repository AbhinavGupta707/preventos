import { describe, expect, it } from "vitest";

import { crossedMilestones, MILESTONE_DAYS } from "../src/core/streaks";
import { dailySpend, totalSavings } from "../src/core/savings";

describe("savings rail (cross-programme)", () => {
  it("computes daily spend per programme", () => {
    // 15 cigarettes/day at £12.50 per pack of 20 → £9.375/day
    expect(dailySpend({ vertical: "smoking", cigarettesPerDay: 15, pricePerPack: 12.5 })).toBeCloseTo(9.375);
    expect(dailySpend({ vertical: "vaping", weeklySpend: 21 })).toBeCloseTo(3);
  });

  it("sums across programmes weighted by days won (property: sum of parts)", () => {
    const profiles = [
      { profile: { vertical: "smoking" as const, cigarettesPerDay: 20, pricePerPack: 12.5 }, daysWon: 10 },
      { profile: { vertical: "vaping" as const, weeklySpend: 14 }, daysWon: 5 },
    ];
    const total = totalSavings(profiles);
    const parts = profiles.map((p) => dailySpend(p.profile) * p.daysWon);
    expect(total).toBeCloseTo(parts[0]! + parts[1]!);
  });

  it("property: savings are non-negative and zero days won → zero", () => {
    for (let cpd = 0; cpd <= 60; cpd += 7) {
      for (let price = 0; price <= 25; price += 5) {
        const spend = dailySpend({ vertical: "smoking", cigarettesPerDay: cpd, pricePerPack: price });
        expect(spend).toBeGreaterThanOrEqual(0);
        expect(totalSavings([{ profile: { vertical: "smoking", cigarettesPerDay: cpd, pricePerPack: price }, daysWon: 0 }])).toBe(0);
      }
    }
  });
});

describe("milestones fire exactly once", () => {
  it("returns thresholds crossed since last seen", () => {
    expect(crossedMilestones(2, 7)).toEqual([3, 7]);
    expect(crossedMilestones(0, 1)).toEqual([1]);
  });

  it("property: re-applying with the same values yields nothing (exactly-once)", () => {
    for (const m of MILESTONE_DAYS) {
      expect(crossedMilestones(m, m)).toEqual([]);
    }
    expect(crossedMilestones(7, 7)).toEqual([]);
    expect(crossedMilestones(7, 6)).toEqual([]); // days won is monotone; never re-fire backwards
  });
});
