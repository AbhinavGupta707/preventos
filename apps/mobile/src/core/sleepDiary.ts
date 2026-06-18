import type { SleepDiaryInput, SleepWindowInput, SleepWindowView } from "@preventos/api-client";

export interface MobileSleepDiaryEntry {
  readonly date: string;
  readonly bedTime: string;
  readonly getUpTime: string;
  readonly sleepDelayMin: number;
  readonly nightAwakeMin: number;
}

export interface SleepDiaryMetrics {
  readonly minutesInBed: number;
  readonly minutesAsleep: number;
  readonly efficiencyPercent: number;
}

export interface SleepSafetyFlags {
  readonly safetySensitiveOccupation: boolean;
  readonly excessiveDaytimeSleepiness: boolean;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseHHMM(value: string): number | null {
  if (!HHMM.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours === undefined || minutes === undefined) return null;
  return hours * 60 + minutes;
}

export function isValidHHMM(value: string): boolean {
  return parseHHMM(value) !== null;
}

export function minutesBetween(start: string, end: string): number {
  const startMin = parseHHMM(start);
  const endMin = parseHHMM(end);
  if (startMin === null || endMin === null) return 0;
  return endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
}

export function sleepDiaryMetrics(entry: MobileSleepDiaryEntry): SleepDiaryMetrics {
  const minutesInBed = minutesBetween(entry.bedTime, entry.getUpTime);
  const minutesAsleep = Math.max(minutesInBed - entry.sleepDelayMin - entry.nightAwakeMin, 0);
  const efficiencyPercent = minutesInBed === 0 ? 0 : Math.min(100, Math.round((minutesAsleep / minutesInBed) * 100));
  return { minutesInBed, minutesAsleep, efficiencyPercent };
}

export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function sleepDiaryEntriesNeeded(entries: readonly MobileSleepDiaryEntry[], minimum = 5): number {
  return Math.max(minimum - entries.length, 0);
}

export function toSleepDiaryInput(entry: MobileSleepDiaryEntry): SleepDiaryInput {
  return {
    date: entry.date,
    bedTime: entry.bedTime,
    sleepOnsetLatencyMin: Math.round(entry.sleepDelayMin),
    wasoMin: Math.round(entry.nightAwakeMin),
    finalWakeTime: entry.getUpTime,
    riseTime: entry.getUpTime,
  };
}

export function toSleepWindowInput(
  desiredRiseTime: string,
  effectiveFrom: string,
  flags: SleepSafetyFlags,
): SleepWindowInput {
  return {
    desiredRiseTime,
    effectiveFrom,
    safetySensitiveOccupation: flags.safetySensitiveOccupation,
    excessiveDaytimeSleepiness: flags.excessiveDaytimeSleepiness,
  };
}

export function sleepWindowStatus(window: SleepWindowView): string {
  if (window.signpostRequired) {
    return "Gentler window used because alertness matters in your day.";
  }
  if (window.decision === "expand") return "Window gently expanded from recent diary patterns.";
  if (window.decision === "restrict") return "Window gently tightened from recent diary patterns.";
  if (window.decision === "hold") return "Window held steady from recent diary patterns.";
  return "First window calculated from recent diary patterns.";
}
