export type SleepSafetyProfile = {
  readonly safetySensitiveOccupation?: boolean;
  readonly excessiveDaytimeSleepiness?: boolean;
};

export type SleepTitrationDiaryEntry = {
  readonly date: string;
  readonly bedTime: string;
  readonly riseTime: string;
  readonly sleepOnsetLatencyMin: number;
  readonly wasoMin: number;
};

export type SleepWindowRecommendation = {
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly durationMin: number;
  readonly effectiveFrom: string;
  readonly decision: "initial" | "expand" | "restrict" | "hold";
  readonly safetyFloorApplied: boolean;
  readonly signpostRequired: boolean;
  readonly computedFrom: {
    readonly diaryDates: readonly string[];
    readonly diaryDays: number;
    readonly meanTimeInBedMin: number;
    readonly meanTotalSleepMin: number;
    readonly sleepEfficiency: number;
    readonly previousDurationMin?: number;
    readonly minWindowMin: number;
    readonly rule: string;
  };
};

export type SleepTitrationOptions = {
  readonly desiredRiseTime: string;
  readonly effectiveFrom: string;
  readonly minDiaryDays?: number;
  readonly standardMinWindowMin?: number;
  readonly safetyMinWindowMin?: number;
  readonly maxWindowMin?: number;
  readonly adjustmentStepMin?: number;
};

export const DEFAULT_SLEEP_TITRATION_MIN_DIARY_DAYS = 5;
const DEFAULT_STANDARD_MIN_WINDOW_MIN = 390; // provisional: 6h30, pending WP10.3 sign-off
const DEFAULT_SAFETY_MIN_WINDOW_MIN = 480; // safety-sensitive floor, pending WP10.3 sign-off
const DEFAULT_MAX_WINDOW_MIN = 540;
const DEFAULT_STEP_MIN = 15;

function parseHHMM(value: string): number {
  const parts = value.split(":").map(Number);
  const h = parts[0];
  const m = parts[1];
  if (
    h === undefined ||
    m === undefined ||
    !Number.isInteger(h) ||
    !Number.isInteger(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    throw new Error(`invalid HH:MM time: ${value}`);
  }
  return h * 60 + m;
}

function formatHHMM(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function minutesBetween(start: string, end: string): number {
  const startMin = parseHHMM(start);
  const endMin = parseHHMM(end);
  return endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
}

export function sleepWindowDurationMin(windowStart: string, windowEnd: string): number {
  return minutesBetween(windowStart, windowEnd);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function diaryStats(entries: readonly SleepTitrationDiaryEntry[]) {
  const rows = entries.map((entry) => {
    const timeInBedMin = minutesBetween(entry.bedTime, entry.riseTime);
    const totalSleepMin = Math.max(timeInBedMin - entry.sleepOnsetLatencyMin - entry.wasoMin, 0);
    return { entry, timeInBedMin, totalSleepMin };
  });
  const meanTimeInBedMin = Math.round(mean(rows.map((row) => row.timeInBedMin)));
  const meanTotalSleepMin = Math.round(mean(rows.map((row) => row.totalSleepMin)));
  const sleepEfficiency = Math.round((meanTotalSleepMin / meanTimeInBedMin) * 100);
  return { rows, meanTimeInBedMin, meanTotalSleepMin, sleepEfficiency };
}

export function recommendSleepWindow(
  entries: readonly SleepTitrationDiaryEntry[],
  safety: SleepSafetyProfile,
  options: SleepTitrationOptions,
  previous?: { readonly durationMin: number },
): SleepWindowRecommendation {
  if (entries.length === 0) throw new Error("sleep titration requires at least one diary entry");

  const minDiaryDays = options.minDiaryDays ?? DEFAULT_SLEEP_TITRATION_MIN_DIARY_DAYS;
  const stepMin = options.adjustmentStepMin ?? DEFAULT_STEP_MIN;
  const maxWindowMin = options.maxWindowMin ?? DEFAULT_MAX_WINDOW_MIN;
  const safetyFloorApplied = safety.safetySensitiveOccupation === true || safety.excessiveDaytimeSleepiness === true;
  const minWindowMin = safetyFloorApplied
    ? (options.safetyMinWindowMin ?? DEFAULT_SAFETY_MIN_WINDOW_MIN)
    : (options.standardMinWindowMin ?? DEFAULT_STANDARD_MIN_WINDOW_MIN);
  const signpostRequired = safetyFloorApplied;
  const stats = diaryStats(entries);

  let decision: SleepWindowRecommendation["decision"] = "hold";
  let durationMin: number;
  let rule: string;

  if (previous === undefined) {
    if (entries.length < minDiaryDays) {
      throw new Error(`initial sleep titration requires at least ${minDiaryDays} diary entries`);
    }
    decision = "initial";
    durationMin = clamp(roundToStep(stats.meanTotalSleepMin + 30, stepMin), minWindowMin, maxWindowMin);
    rule = "initial_mean_sleep_plus_buffer";
  } else if (entries.length < minDiaryDays || safety.excessiveDaytimeSleepiness === true) {
    durationMin = clamp(previous.durationMin, minWindowMin, maxWindowMin);
    rule = entries.length < minDiaryDays ? "hold_insufficient_diary_days" : "hold_excessive_daytime_sleepiness";
  } else if (stats.sleepEfficiency >= 90) {
    decision = "expand";
    durationMin = clamp(previous.durationMin + stepMin, minWindowMin, maxWindowMin);
    rule = "expand_high_efficiency";
  } else if (stats.sleepEfficiency < 85) {
    decision = "restrict";
    durationMin = clamp(previous.durationMin - stepMin, minWindowMin, maxWindowMin);
    if (durationMin === minWindowMin && previous.durationMin <= minWindowMin) decision = "hold";
    rule = "restrict_low_efficiency";
  } else {
    durationMin = clamp(previous.durationMin, minWindowMin, maxWindowMin);
    rule = "hold_mid_band_efficiency";
  }

  const windowEnd = options.desiredRiseTime;
  const windowStart = formatHHMM(parseHHMM(windowEnd) - durationMin);

  return {
    windowStart,
    windowEnd,
    durationMin,
    effectiveFrom: options.effectiveFrom,
    decision,
    safetyFloorApplied,
    signpostRequired,
    computedFrom: {
      diaryDates: entries.map((entry) => entry.date),
      diaryDays: entries.length,
      meanTimeInBedMin: stats.meanTimeInBedMin,
      meanTotalSleepMin: stats.meanTotalSleepMin,
      sleepEfficiency: stats.sleepEfficiency,
      ...(previous !== undefined ? { previousDurationMin: previous.durationMin } : {}),
      minWindowMin,
      rule,
    },
  };
}
