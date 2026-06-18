import { describe, expect, it } from "vitest";

import {
  durationLabel,
  minutesBetween,
  sleepDiaryEntriesNeeded,
  sleepDiaryMetrics,
  sleepWindowStatus,
  toSleepDiaryInput,
  toSleepWindowInput,
  type MobileSleepDiaryEntry,
} from "../src/core/sleepDiary";

const entry: MobileSleepDiaryEntry = {
  date: "2026-06-18",
  bedTime: "23:00",
  getUpTime: "07:00",
  sleepDelayMin: 30,
  nightAwakeMin: 30,
};

describe("mobile Nightshift sleep diary", () => {
  it("computes diary metrics across midnight", () => {
    expect(minutesBetween("23:00", "07:00")).toBe(480);
    expect(sleepDiaryMetrics(entry)).toEqual({
      minutesInBed: 480,
      minutesAsleep: 420,
      efficiencyPercent: 88,
    });
  });

  it("maps the four-field mobile form to the API diary contract", () => {
    expect(toSleepDiaryInput(entry)).toEqual({
      date: "2026-06-18",
      bedTime: "23:00",
      sleepOnsetLatencyMin: 30,
      wasoMin: 30,
      finalWakeTime: "07:00",
      riseTime: "07:00",
    });
  });

  it("keeps safety-sensitive and sleepiness flags in the sleep-window request", () => {
    expect(
      toSleepWindowInput("07:00", "2026-06-18", {
        safetySensitiveOccupation: true,
        excessiveDaytimeSleepiness: true,
      }),
    ).toEqual({
      desiredRiseTime: "07:00",
      effectiveFrom: "2026-06-18",
      safetySensitiveOccupation: true,
      excessiveDaytimeSleepiness: true,
    });
  });

  it("requires five diary entries before the first sleep-window request", () => {
    expect(sleepDiaryEntriesNeeded([], 5)).toBe(5);
    expect(sleepDiaryEntriesNeeded([entry, { ...entry, date: "2026-06-19" }], 5)).toBe(3);
    expect(sleepDiaryEntriesNeeded(Array.from({ length: 5 }, (_, index) => ({ ...entry, date: `2026-06-2${index}` })), 5)).toBe(0);
  });

  it("uses wellbeing language for window status copy", () => {
    const status = sleepWindowStatus({
      id: "w1",
      version: 1,
      windowStart: "23:30",
      windowEnd: "07:00",
      durationMin: 450,
      decision: "initial",
      safetyFloorApplied: true,
      signpostRequired: true,
      computedFrom: {},
    });
    expect(status).toContain("Gentler window");
    expect(`${status} ${durationLabel(450)}`).not.toMatch(/treat|insomnia|therapy|restriction/i);
  });
});
