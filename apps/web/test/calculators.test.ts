import { describe, expect, it } from "vitest";
import { projectSavings, smokingDailySpend, vapingDailySpend, alcoholDailySpend } from "../lib/calculators/savings";
import { drinkUnits, DRINK_PRESETS } from "../lib/calculators/units";
import { sleepDebt, sleepEfficiency } from "../lib/calculators/sleep";

describe("savings calculator", () => {
  it("computes smoking daily spend from cigarettes/day and pack price", () => {
    // 20/day at £15 per pack of 20 → £15/day
    expect(smokingDailySpend({ cigarettesPerDay: 20, pricePerPack: 15, cigarettesPerPack: 20 })).toBe(15);
    expect(smokingDailySpend({ cigarettesPerDay: 10, pricePerPack: 15, cigarettesPerPack: 20 })).toBe(7.5);
  });

  it("computes vaping daily spend from weekly spend", () => {
    expect(vapingDailySpend({ weeklySpend: 21 })).toBe(3);
  });

  it("computes alcohol daily spend from weekly drinks and price", () => {
    expect(alcoholDailySpend({ drinksPerWeek: 14, pricePerDrink: 5 })).toBe(10);
  });

  it("projects savings linearly over horizons", () => {
    const projection = projectSavings(10);
    expect(projection.perWeek).toBe(70);
    expect(projection.perMonth).toBeCloseTo(304.4, 1); // 365.25/12 days
    expect(projection.perYear).toBeCloseTo(3652.5, 1);
  });

  it("never returns negative savings", () => {
    expect(projectSavings(-5).perYear).toBe(0);
    expect(smokingDailySpend({ cigarettesPerDay: -1, pricePerPack: 15, cigarettesPerPack: 20 })).toBe(0);
  });
});

describe("UK drink units (published examples)", () => {
  // units = ml × ABV% / 1000 — checked against NHS published examples
  it("pint of 4% beer ≈ 2.3 units", () => {
    expect(drinkUnits({ volumeMl: 568, abvPercent: 4 })).toBeCloseTo(2.3, 1);
  });
  it("175ml glass of 13% wine ≈ 2.3 units", () => {
    expect(drinkUnits({ volumeMl: 175, abvPercent: 13 })).toBeCloseTo(2.3, 1);
  });
  it("25ml single 40% spirit = 1 unit", () => {
    expect(drinkUnits({ volumeMl: 25, abvPercent: 40 })).toBe(1);
  });
  it("330ml 5% bottle = 1.65 units (NHS displays 1.7)", () => {
    expect(drinkUnits({ volumeMl: 330, abvPercent: 5 })).toBe(1.65);
  });
  it("presets carry valid volume and ABV", () => {
    for (const preset of DRINK_PRESETS) {
      expect(preset.volumeMl).toBeGreaterThan(0);
      expect(preset.abvPercent).toBeGreaterThan(0);
      expect(drinkUnits(preset)).toBeGreaterThan(0);
    }
  });
  it("zero or negative input yields zero units", () => {
    expect(drinkUnits({ volumeMl: 0, abvPercent: 40 })).toBe(0);
    expect(drinkUnits({ volumeMl: -10, abvPercent: 40 })).toBe(0);
  });
});

describe("sleep-debt calculator", () => {
  it("sums nightly shortfall against the need", () => {
    // need 8h, slept 6h every night for 7 nights → 14h debt
    const nights = Array.from({ length: 7 }, () => 6);
    expect(sleepDebt({ needHours: 8, sleptHours: nights })).toBe(14);
  });

  it("nights above need do not create negative debt", () => {
    expect(sleepDebt({ needHours: 8, sleptHours: [9, 10, 8] })).toBe(0);
  });

  it("mixed nights only count shortfalls", () => {
    expect(sleepDebt({ needHours: 8, sleptHours: [6, 9, 7] })).toBe(3);
  });
});

describe("sleep efficiency (diary metric)", () => {
  it("computes asleep/in-bed percentage", () => {
    // in bed 8h, asleep 6h → 75%
    expect(sleepEfficiency({ minutesInBed: 480, minutesAsleep: 360 })).toBe(75);
  });
  it("clamps to 0–100 on bad input", () => {
    expect(sleepEfficiency({ minutesInBed: 0, minutesAsleep: 100 })).toBe(0);
    expect(sleepEfficiency({ minutesInBed: 100, minutesAsleep: 200 })).toBe(100);
  });
});
