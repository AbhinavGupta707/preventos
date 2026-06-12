// WP3.2 — diary→metrics maths for the morning check-in.
// Mirrors the diary metric definitions destined for WPV.4; no titration here.
import { sleepEfficiency } from "../calculators/sleep";

export interface SleepEntryMetrics {
  readonly minutesInBed: number;
  readonly minutesAsleep: number;
  readonly efficiencyPercent: number;
}

const MINUTES_PER_DAY = 24 * 60;

function parseClock(value: string): number {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function sleepEntryMetrics(entry: {
  readonly bedTime: string;
  readonly getUpTime: string;
  readonly sleepDelayMin: number;
  readonly nightAwakeMin: number;
}): SleepEntryMetrics {
  const bed = parseClock(entry.bedTime);
  const getUp = parseClock(entry.getUpTime);
  const minutesInBed = getUp > bed ? getUp - bed : getUp + MINUTES_PER_DAY - bed;
  const minutesAsleep = Math.max(minutesInBed - entry.sleepDelayMin - entry.nightAwakeMin, 0);
  return {
    minutesInBed,
    minutesAsleep,
    efficiencyPercent: sleepEfficiency({ minutesInBed, minutesAsleep }),
  };
}
