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

export const enrolSchema = z
  .object({
    vertical: z.enum(VERTICALS),
    stage: z.enum(READINESS_STAGES).default("ready"),
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

type Compact<T> = { [K in keyof T]: Exclude<T[K], undefined> };

/** Drops undefined-valued keys so zod-optional output satisfies exactOptionalPropertyTypes. */
export function compact<T extends object>(obj: T): Compact<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Compact<T>;
}
