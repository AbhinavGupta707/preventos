import { z } from "zod";
import { COACH_FRAMES } from "@preventos/coach";
import {
  AGE_BANDS,
  CONSENT_PURPOSES,
  NATIONS,
  PLAN_TYPES,
  READINESS_STAGES,
  SEXES,
  VERTICALS,
} from "@preventos/domain";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "expected HH:MM");

export const signUpSchema = z
  .object({
    pseudonym: z.string().min(1).max(200),
    ageBand: z.enum(AGE_BANDS).optional(),
    sex: z.enum(SEXES).optional(),
    language: z.string().min(2).max(35).optional(),
    nation: z.enum(NATIONS).optional(),
  })
  .strict();

/** Dev-only session bootstrap (POST /dev/session). Pseudonym optional — the
 *  route generates one when absent. Never registered in production. */
export const devSessionSchema = z
  .object({
    pseudonym: z.string().min(1).max(200).optional(),
  })
  .strict();

export const enrolSchema = z
  .object({
    vertical: z.enum(VERTICALS),
    stage: z.enum(READINESS_STAGES).default("ready"),
    /**
     * AUDIT-C consumption score (0–12), captured at alcohol intake. Drives the
     * deterministic dependence hard-stop (invariant 4); ignored for non-alcohol
     * enrolments. The AUDIT-C questions render verbatim from @preventos/instruments
     * (invariant 2) — only the resulting score is submitted here.
     */
    auditC: z.number().int().min(0).max(12).optional(),
  })
  .strict();

export const consentChangeSchema = z
  .object({
    purpose: z.enum(CONSENT_PURPOSES),
    signal: z.string().min(1).max(100).optional(),
    recipient: z.string().min(1).max(100).optional(),
    evidence: z.record(z.unknown()).optional(),
  })
  .strict();

export const consentCheckSchema = z.object({
  purpose: z.enum(CONSENT_PURPOSES),
  signal: z.string().min(1).max(100).optional(),
  recipient: z.string().min(1).max(100).optional(),
});

export const drinkLogSchema = z
  .object({
    date: isoDate,
    units: z.number().positive().max(100),
    drinkType: z.string().min(1).max(100).optional(),
    context: z.string().min(1).max(100).optional(),
  })
  .strict();

export const sleepDiarySchema = z
  .object({
    date: isoDate,
    bedTime: hhmm,
    sleepOnsetLatencyMin: z.number().int().min(0).max(1440),
    wasoMin: z.number().int().min(0).max(1440),
    wakeCount: z.number().int().min(0).max(50).optional(),
    finalWakeTime: hhmm,
    riseTime: hhmm,
    quality: z.number().int().min(1).max(5).optional(),
  })
  .strict();

export const sleepWindowSchema = z
  .object({
    desiredRiseTime: hhmm,
    effectiveFrom: isoDate,
    safetySensitiveOccupation: z.boolean().default(false),
    excessiveDaytimeSleepiness: z.boolean().default(false),
  })
  .strict();

export const cravingLogSchema = z
  .object({
    channel: z.enum(["app", "web"]).default("app"),
  })
  .strict();

export const planCreateSchema = z
  .object({
    vertical: z.enum(VERTICALS),
    type: z.enum(PLAN_TYPES),
    slots: z.record(z.unknown()).default({}),
  })
  .strict();

export const planUpdateSchema = z
  .object({
    slots: z.record(z.unknown()),
  })
  .strict();

export const planIdSchema = z.object({ id: z.string().uuid() });

export const coachMessageSchema = z
  .object({
    vertical: z.enum(VERTICALS),
    frame: z.enum(COACH_FRAMES),
    text: z.string().min(1).max(4000),
    channel: z.enum(["app", "web"]).default("app"),
    context: z
      .object({
        daysWon: z.number().int().min(0).max(100_000).optional(),
        streakActive: z.boolean().optional(),
        enrolledVerticals: z.array(z.enum(VERTICALS)).max(4).optional(),
        lastLapseVertical: z.enum(VERTICALS).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const pushTokenSchema = z
  .object({
    token: z.string().min(10).max(500),
    platform: z.enum(["ios", "android", "web"]),
  })
  .strict();

// ---- marketing (WP8.2) — the AUTHORITATIVE privacy allow-list ----
// apps/api is the store of record; these schemas are the single enforced control
// that keeps the marketing funnel free of free text, identifiers, and
// special-category data. See compliance/privacy/marketing-funnel-privacy-audit.md.

export const WAITLIST_PROGRAMMES = ["quitkit", "exhale", "steady", "nightshift", "unsure"] as const;
export const FUNNEL_EVENT_NAMES = [
  "waitlist_joined",
  "savings_calculated",
  "sleep_debt_calculated",
  "programme_page_cta_clicked",
] as const;

export const waitlistSignupSchema = z
  .object({
    email: z.string().trim().email().max(254),
    programme: z.enum(WAITLIST_PROGRAMMES).default("unsure"),
  })
  .strict();

/** Coded property values only — a short string or a number. Structurally cannot
 *  carry free text (≤100 chars), nested objects/arrays, or identifiers. */
const funnelPropertyValue = z.union([z.string().max(100), z.number()]);

export const funnelEventSchema = z
  .object({
    name: z.enum(FUNNEL_EVENT_NAMES),
    path: z.string().max(200),
    properties: z
      .record(funnelPropertyValue)
      .default({})
      .refine((p) => Object.keys(p).length <= 10, "too many properties"),
  })
  .strict();

type Compact<T> = { [K in keyof T]: Exclude<T[K], undefined> };

/** Drops undefined-valued keys so zod-optional output satisfies exactOptionalPropertyTypes. */
export function compact<T extends object>(obj: T): Compact<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Compact<T>;
}
