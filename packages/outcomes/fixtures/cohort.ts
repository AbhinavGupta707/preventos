import type {
  AgeBand,
  AlcoholJourney,
  Journey,
  SleepDiaryEntry,
  SleepJourney,
  SmokingFollowUp,
  SmokingJourney,
  VapingJourney,
} from "../src/journeys.js";

/**
 * 50-journey synthetic fixture cohort. Fully deterministic and hand-checkable:
 * scenario counts are explicit so expected aggregates can be derived on paper
 * (see cohort.test.ts). One group — vaping × 65plus, n=2 — is deliberately
 * below the k=5 anonymity threshold to prove dashboard suppression.
 *
 * Expected aggregates:
 *   smoking  n=16 — 7 quit (5 CO-verified), 5 over-limit, 1 CO-fail, 3 lost → ITT rate 7/16
 *   vaping   n=12 — pp7 6/12, pp30 3/12 (2 unreached count as using)
 *   alcohol  n=12 — 9 completers, deltas sum −9 → mean −1.0; 3 missing follow-up
 *   sleep    n=10 — SE/SOL/WASO improve monotonically week 0 → 7
 */

const ENROLLED = "2026-01-05";
const SMOKING_QUIT_DATE = "2026-01-12";

function isoPlus(base: string, days: number): string {
  return new Date(Date.parse(base) + days * 86_400_000).toISOString().slice(0, 10);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// --- smoking: 16 journeys -------------------------------------------------

const SMOKING_BANDS: readonly AgeBand[] = [
  ...Array.from({ length: 5 }, () => "18-24" as const),
  ...Array.from({ length: 6 }, () => "25-44" as const),
  ...Array.from({ length: 5 }, () => "45-64" as const),
];

function smokingFollowUp(index: number): SmokingFollowUp {
  if (index <= 5) return { reached: true, cigarettesAfterGrace: 0, coPpm: 4 }; // quit, verified ×5
  if (index <= 7) return { reached: true, cigarettesAfterGrace: 2 }; // quit, self-report ×2
  if (index <= 12) return { reached: true, cigarettesAfterGrace: 12 }; // over limit ×5
  if (index === 13) return { reached: true, cigarettesAfterGrace: 2, coPpm: 15 }; // CO fail ×1
  return { reached: false }; // lost to follow-up ×3
}

const smoking: readonly SmokingJourney[] = Array.from({ length: 16 }, (_, i) => ({
  personId: `fixture-smoking-${pad(i + 1)}`,
  vertical: "smoking",
  ageBand: SMOKING_BANDS[i] as AgeBand,
  enrolledAt: ENROLLED,
  quitDate: SMOKING_QUIT_DATE,
  followUp4w: smokingFollowUp(i + 1),
}));

// --- vaping: 12 journeys ---------------------------------------------------

const VAPING_BANDS: readonly AgeBand[] = [
  ...Array.from({ length: 5 }, () => "18-24" as const),
  ...Array.from({ length: 5 }, () => "25-44" as const),
  "65plus",
  "65plus",
];

function vapingScenario(index: number): Pick<VapingJourney, "useDays" | "assessment30Reached"> {
  if (index <= 3) return { useDays: [], assessment30Reached: true }; // abstinent pp7+pp30 ×3
  if (index <= 6) return { useDays: [isoPlus(ENROLLED, 10)], assessment30Reached: true }; // pp7 only ×3
  if (index <= 10) return { useDays: [isoPlus(ENROLLED, 27)], assessment30Reached: true }; // neither ×4
  return { useDays: [], assessment30Reached: false }; // lost ×2
}

const vaping: readonly VapingJourney[] = Array.from({ length: 12 }, (_, i) => ({
  personId: `fixture-vaping-${pad(i + 1)}`,
  vertical: "vaping",
  ageBand: VAPING_BANDS[i] as AgeBand,
  enrolledAt: ENROLLED,
  quitDate: ENROLLED,
  ...vapingScenario(i + 1),
}));

// --- alcohol: 12 journeys --------------------------------------------------

const AUDIT_BASELINES = [7, 8, 9, 6, 7, 8, 9, 10, 6, 8, 9, 7] as const;
const AUDIT_DELTAS = [-3, -2, -2, -1, -1, -1, 0, 0, 1] as const; // mean −1.0; persons 10–12 missing

function drinkingDaysFor(index: number): readonly string[] {
  const weeklyCounts =
    index <= 6 ? [4, 4, 3, 3, 2, 2, 1, 1] : [5, 4, 4, 3, 3, 2, 2, 1];
  return weeklyCounts.flatMap((count, week) =>
    Array.from({ length: count }, (_, k) => isoPlus(ENROLLED, week * 7 + k)),
  );
}

const alcohol: readonly AlcoholJourney[] = Array.from({ length: 12 }, (_, i) => {
  const delta = AUDIT_DELTAS[i];
  const baseline = AUDIT_BASELINES[i] as number;
  return {
    personId: `fixture-alcohol-${pad(i + 1)}`,
    vertical: "alcohol",
    ageBand: i < 6 ? "25-44" : "45-64",
    enrolledAt: ENROLLED,
    auditC: { baseline, followUp4w: delta === undefined ? null : baseline + delta },
    drinkingDays: drinkingDaysFor(i + 1),
  };
});

// --- sleep: 10 journeys ----------------------------------------------------

function sleepEntry(personIndex: number, day: number): SleepDiaryEntry {
  const solMin = Math.max(10, 45 - Math.round(day * 0.5)) + (personIndex % 3);
  const wasoMin = Math.max(10, 50 - Math.round(day * 0.55));
  return {
    date: isoPlus(ENROLLED, day),
    timeInBedMin: 480,
    solMin,
    wasoMin,
    totalSleepMin: 480 - solMin - wasoMin - 15,
  };
}

function sleepDiary(personIndex: number): readonly SleepDiaryEntry[] {
  // Person 10 logs only 2 entries in week 7 → that week is null for them.
  const days =
    personIndex === 10
      ? [...Array.from({ length: 49 }, (_, d) => d), 49, 50]
      : Array.from({ length: 56 }, (_, d) => d);
  return days.map((d) => sleepEntry(personIndex, d));
}

const sleep: readonly SleepJourney[] = Array.from({ length: 10 }, (_, i) => ({
  personId: `fixture-sleep-${pad(i + 1)}`,
  vertical: "sleep",
  ageBand: i < 5 ? "25-44" : "45-64",
  enrolledAt: ENROLLED,
  diary: sleepDiary(i + 1),
}));

export const SYNTHETIC_COHORT: readonly Journey[] = [
  ...smoking,
  ...vaping,
  ...alcohol,
  ...sleep,
];
