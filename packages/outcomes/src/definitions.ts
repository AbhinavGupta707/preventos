import { sha256Hex } from "@preventos/shared";
import { z } from "zod";

/**
 * Versioned, machine-readable outcome definitions (plan WP8.1). Definitions
 * are plain data validated by schema; evaluators dispatch on `kind`. A
 * content-addressed ref (`id@version#hash`) pins every evaluation to the
 * exact parameters that produced it — same idiom as the rules-engine policy
 * hash. Sleep SCI is deliberately absent: deferred pending license (WP10.4).
 */

const id = z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/);
const version = z.number().int().positive();
const title = z.string().min(1);

export const outcomeDefinitionSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("smoking.russell_standard_4w"),
      id,
      version,
      title,
      vertical: z.literal("smoking"),
      params: z
        .object({
          assessmentDay: z.number().int().positive(),
          graceDays: z.number().int().nonnegative(),
          maxCigarettesAfterGrace: z.number().int().nonnegative(),
          coVerificationPpmMax: z.number().positive(),
          // ITT is part of the definition's identity, not an evaluator option.
          lostToFollowUpIsNonQuitter: z.literal(true),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("vaping.point_prevalence"),
      id,
      version,
      title,
      vertical: z.literal("vaping"),
      params: z
        .object({
          assessmentDay: z.number().int().positive(),
          windowDays: z.number().int().positive(),
          lostToFollowUpIsAbstinent: z.literal(false),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("alcohol.audit_c_delta"),
      id,
      version,
      title,
      vertical: z.literal("alcohol"),
      params: z
        .object({
          followUpWeek: z.number().int().positive(),
          scaleMin: z.number().int(),
          scaleMax: z.number().int(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("alcohol.drinking_days"),
      id,
      version,
      title,
      vertical: z.literal("alcohol"),
      params: z.object({ weeks: z.number().int().positive() }).strict(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("sleep.diary_trajectory"),
      id,
      version,
      title,
      vertical: z.literal("sleep"),
      params: z
        .object({
          weeks: z.number().int().positive(),
          minDiaryDaysPerWeek: z.number().int().positive(),
        })
        .strict(),
    })
    .strict(),
]);

export type OutcomeDefinition = z.infer<typeof outcomeDefinitionSchema>;

export const SMOKING_RUSSELL_4W = {
  kind: "smoking.russell_standard_4w",
  id: "smoking.quit.russell_standard_4w",
  version: 1,
  title: "4-week quit (Russell-Standard-compatible, intention-to-treat)",
  vertical: "smoking",
  params: {
    assessmentDay: 28,
    graceDays: 14,
    maxCigarettesAfterGrace: 5,
    coVerificationPpmMax: 10,
    lostToFollowUpIsNonQuitter: true,
  },
} as const satisfies OutcomeDefinition;

export const VAPING_PP7 = {
  kind: "vaping.point_prevalence",
  id: "vaping.abstinence.pp7",
  version: 1,
  title: "7-day point-prevalence vaping abstinence at day 30",
  vertical: "vaping",
  params: { assessmentDay: 30, windowDays: 7, lostToFollowUpIsAbstinent: false },
} as const satisfies OutcomeDefinition;

export const VAPING_PP30 = {
  kind: "vaping.point_prevalence",
  id: "vaping.abstinence.pp30",
  version: 1,
  title: "30-day point-prevalence vaping abstinence at day 30",
  vertical: "vaping",
  params: { assessmentDay: 30, windowDays: 30, lostToFollowUpIsAbstinent: false },
} as const satisfies OutcomeDefinition;

export const ALCOHOL_AUDIT_C_DELTA = {
  kind: "alcohol.audit_c_delta",
  id: "alcohol.audit_c.delta_4w",
  version: 1,
  title: "AUDIT-C change from baseline at 4 weeks (completers)",
  vertical: "alcohol",
  params: { followUpWeek: 4, scaleMin: 0, scaleMax: 12 },
} as const satisfies OutcomeDefinition;

export const ALCOHOL_DRINKING_DAYS = {
  kind: "alcohol.drinking_days",
  id: "alcohol.drinking_days.weekly_8w",
  version: 1,
  title: "Drinking days per week over 8 weeks",
  vertical: "alcohol",
  params: { weeks: 8 },
} as const satisfies OutcomeDefinition;

export const SLEEP_DIARY_TRAJECTORY = {
  kind: "sleep.diary_trajectory",
  id: "sleep.diary.se_sol_waso_8w",
  version: 1,
  title: "Diary-derived SE / SOL / WASO weekly trajectory over 8 weeks",
  vertical: "sleep",
  params: { weeks: 8, minDiaryDaysPerWeek: 3 },
} as const satisfies OutcomeDefinition;

export const OUTCOME_DEFINITIONS: readonly OutcomeDefinition[] = [
  SMOKING_RUSSELL_4W,
  VAPING_PP7,
  VAPING_PP30,
  ALCOHOL_AUDIT_C_DELTA,
  ALCOHOL_DRINKING_DAYS,
  SLEEP_DIARY_TRAJECTORY,
];

/**
 * Outcome refs the platform RECOGNISES but does not yet EVALUATE. The smoking
 * pack's outcome prompts (PRD §5.1 outcome set) commit to follow-up measures
 * whose clinical parameters are signed off in the WP10.3 parameter sheet, not
 * invented here. Listing their canonical ids lets content `outcome_ref` and
 * rule-set `schedule_check_in` refs resolve through one namespace while keeping
 * the evaluator-backed OUTCOME_DEFINITIONS honest about what can actually be
 * computed today. When WP10.3 lands params, the id graduates into a real
 * OutcomeDefinition and drops out of this list.
 */
export const DECLARED_OUTCOME_REFS: readonly string[] = [
  "smoking.quit.point_prevalence_7d",
  "smoking.quit.russell_standard_12w",
  "smoking.quit.russell_standard_6m",
  "smoking.consumption.cigs_per_day",
];

/**
 * The single set of outcome ids a ref may point at: every evaluable definition
 * plus every declared-pending ref. Both the worker boot guard and
 * `content:validate` reject refs outside this set, so a typo or a dangling
 * reference fails fast rather than silently mis-routing an outcome.
 */
export const OUTCOME_REF_IDS: ReadonlySet<string> = new Set<string>([
  ...OUTCOME_DEFINITIONS.map((d) => d.id),
  ...DECLARED_OUTCOME_REFS,
]);

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonicalise(v)]),
    );
  }
  return value;
}

/** Content-addressed ref: identical definitions always hash identically. */
export function definitionRef(def: OutcomeDefinition): string {
  const digest = sha256Hex(JSON.stringify(canonicalise(def))).slice(0, 12);
  return `${def.id}@${def.version}#${digest}`;
}

/** Look up a definition by `id@version`. Returns null when unknown. */
export function getDefinition(idAtVersion: string): OutcomeDefinition | null {
  return (
    OUTCOME_DEFINITIONS.find((d) => `${d.id}@${d.version}` === idAtVersion) ?? null
  );
}
