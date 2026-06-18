import { describe, expect, it } from "vitest";
import { recommendSleepWindow, type SleepTitrationDiaryEntry } from "../src/index.js";

const week = (overrides: Partial<SleepTitrationDiaryEntry> = {}): SleepTitrationDiaryEntry[] =>
  Array.from({ length: 7 }, (_, index) => ({
    date: `2026-06-${String(index + 1).padStart(2, "0")}`,
    bedTime: "23:00",
    riseTime: "07:00",
    sleepOnsetLatencyMin: 20,
    wasoMin: 40,
    ...overrides,
  }));

describe("Nightshift sleep-window titration", () => {
  it("creates an initial window from mean sleep plus a buffer, clamped to the signed-off floor", () => {
    const rec = recommendSleepWindow(week(), {}, { desiredRiseTime: "07:00", effectiveFrom: "2026-06-08" });

    expect(rec.decision).toBe("initial");
    expect(rec.durationMin).toBe(420 + 30);
    expect(rec.windowStart).toBe("23:30");
    expect(rec.windowEnd).toBe("07:00");
    expect(rec.computedFrom.rule).toBe("initial_mean_sleep_plus_buffer");
  });

  it("requires enough diary evidence before the first window", () => {
    expect(() =>
      recommendSleepWindow(week().slice(0, 3), {}, { desiredRiseTime: "07:00", effectiveFrom: "2026-06-08" }),
    ).toThrow("initial sleep titration requires at least 5 diary entries");
  });

  it("expands by one step after a high-efficiency week", () => {
    const rec = recommendSleepWindow(
      week({ sleepOnsetLatencyMin: 10, wasoMin: 20 }),
      {},
      { desiredRiseTime: "07:00", effectiveFrom: "2026-06-15" },
      { durationMin: 450 },
    );

    expect(rec.computedFrom.sleepEfficiency).toBe(94);
    expect(rec.decision).toBe("expand");
    expect(rec.durationMin).toBe(465);
    expect(rec.windowStart).toBe("23:15");
  });

  it("restricts by one step after a low-efficiency week but never below the floor", () => {
    const rec = recommendSleepWindow(
      week({ sleepOnsetLatencyMin: 90, wasoMin: 90 }),
      {},
      { desiredRiseTime: "06:30", effectiveFrom: "2026-06-15" },
      { durationMin: 420 },
    );

    expect(rec.computedFrom.sleepEfficiency).toBe(63);
    expect(rec.decision).toBe("restrict");
    expect(rec.durationMin).toBe(405);
    expect(rec.windowStart).toBe("23:45");
  });

  it("holds when diary evidence is too thin", () => {
    const rec = recommendSleepWindow(
      week().slice(0, 3),
      {},
      { desiredRiseTime: "07:00", effectiveFrom: "2026-06-15" },
      { durationMin: 450 },
    );

    expect(rec.decision).toBe("hold");
    expect(rec.durationMin).toBe(450);
    expect(rec.computedFrom.rule).toBe("hold_insufficient_diary_days");
  });

  it("applies a safety floor and signpost for safety-sensitive or sleepy users", () => {
    const rec = recommendSleepWindow(
      week({ sleepOnsetLatencyMin: 90, wasoMin: 90 }),
      { safetySensitiveOccupation: true },
      { desiredRiseTime: "06:00", effectiveFrom: "2026-06-15" },
      { durationMin: 390 },
    );

    expect(rec.safetyFloorApplied).toBe(true);
    expect(rec.signpostRequired).toBe(true);
    expect(rec.durationMin).toBe(480);
    expect(rec.windowStart).toBe("22:00");
  });

  it("does not restrict further when excessive daytime sleepiness is reported", () => {
    const rec = recommendSleepWindow(
      week({ sleepOnsetLatencyMin: 90, wasoMin: 90 }),
      { excessiveDaytimeSleepiness: true },
      { desiredRiseTime: "06:00", effectiveFrom: "2026-06-15" },
      { durationMin: 510 },
    );

    expect(rec.decision).toBe("hold");
    expect(rec.durationMin).toBe(510);
    expect(rec.computedFrom.rule).toBe("hold_excessive_daytime_sleepiness");
  });
});
