// WP3.1 — single source of truth for programme marketing copy.
// Every string here is scanned by scripts/check-copy.mjs against the claims register.
// Headlines marked (approved) come from compliance/claims/claims-register.json approvedLanguage.

export type ProgrammeSlug = "quitkit" | "exhale" | "steady" | "nightshift";

export interface ProgrammeCopy {
  readonly slug: ProgrammeSlug;
  readonly name: string;
  readonly vertical: "smoking" | "vaping" | "alcohol" | "sleep";
  readonly accentVar: string;
  readonly headline: string;
  readonly subhead: string;
  readonly bullets: readonly string[];
  readonly signpost: string;
  readonly toolHref?: string;
  readonly toolLabel?: string;
}

export const PROGRAMMES: readonly ProgrammeCopy[] = [
  {
    slug: "quitkit",
    name: "QuitKit",
    vertical: "smoking",
    accentVar: "--quitkit",
    headline: "Your personal quit plan",
    subhead:
      "Set a quit date, get craving support that's there in the moment, and watch the money you're not spending add up.",
    bullets: [
      "A quit plan shaped around your routines and triggers",
      "In-the-moment craving support, even offline",
      "Milestones that mark every smoke-free day",
      "Savings tracking from day one",
    ],
    signpost:
      "Stop-smoking medicines and nicotine replacement are best discussed with your GP or pharmacist — we'll point you to the right people.",
    toolHref: "/tools/savings-calculator",
    toolLabel: "Try the savings calculator",
  },
  {
    slug: "exhale",
    name: "Exhale",
    vertical: "vaping",
    accentVar: "--exhale",
    headline: "Spend less, breathe easier",
    subhead:
      "Step down at your own pace with a nicotine ladder built around the products you actually use. For adults 18+.",
    bullets: [
      "A step-down ladder matched to your current vape",
      "Craving tools for the moments that catch you out",
      "Spend tracking — see what stepping down saves you",
      "No judgement, no cold-turkey pressure",
    ],
    signpost: "Exhale is for adults who already vape and want to cut down or stop. It is not a stop-smoking switch service.",
    toolHref: "/tools/savings-calculator",
    toolLabel: "Try the savings calculator",
  },
  {
    slug: "steady",
    name: "Steady",
    vertical: "alcohol",
    accentVar: "--steady",
    headline: "Take back control of your drinking",
    subhead:
      "Drink less, feel better. Set your own pace with drink-free days, a simple drink diary, and UK unit tracking.",
    bullets: [
      "A drink diary that takes seconds, not minutes",
      "UK units worked out for you, drink by drink",
      "Drink-free day streaks and weekly check-ins",
      "Plans for the social moments that test you",
    ],
    signpost:
      "If stopping suddenly gives you shakes, sweats or seizures, or you drink first thing to steady yourself, please speak to your GP or call Drinkline on 0300 123 1110 — that needs proper medical support, and this programme is not the right tool on its own.",
  },
  {
    slug: "nightshift",
    name: "Nightshift",
    vertical: "sleep",
    accentVar: "--nightshift",
    headline: "Build a sleep routine that works for you",
    subhead:
      "Feel more rested, night by night. A four-tap morning check-in, a wind-down routine, and a sleep window that adapts to you.",
    bullets: [
      "Morning check-in in four taps",
      "A personal sleep window that adjusts weekly",
      "Wind-down audio and evening routines",
      "Progress you can see, week by week",
    ],
    signpost: "If you're worried about your sleep, speak to your GP.",
    toolHref: "/tools/sleep-debt",
    toolLabel: "Try the sleep-debt calculator",
  },
];

export function programmeBySlug(slug: string): ProgrammeCopy | undefined {
  return PROGRAMMES.find((p) => p.slug === slug);
}

/** Build-time accessor for the static programme pages — missing copy is a build error. */
export function requireProgramme(slug: ProgrammeSlug): ProgrammeCopy {
  const programme = programmeBySlug(slug);
  if (!programme) throw new Error(`programme copy missing: ${slug}`);
  return programme;
}
