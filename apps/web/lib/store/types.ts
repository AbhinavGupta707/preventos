// WP3.2 — local-first app state, zod-validated on every read.
// Server sync arrives with the services assembly (SVC); shapes mirror the domain.
import { z } from "zod";

export const programmeSlugSchema = z.enum(["quitkit", "exhale", "steady", "nightshift"]);
export type AppProgramme = z.infer<typeof programmeSlugSchema>;

export const sleepEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedTime: z.string().regex(/^\d{2}:\d{2}$/),
  getUpTime: z.string().regex(/^\d{2}:\d{2}$/),
  sleepDelayMin: z.number().min(0).max(600),
  nightAwakeMin: z.number().min(0).max(600),
});
export type SleepEntry = z.infer<typeof sleepEntrySchema>;

export const sleepWindowSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  windowStart: z.string().regex(/^\d{2}:\d{2}$/),
  windowEnd: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().positive(),
  decision: z.enum(["initial", "expand", "restrict", "hold"]),
  safetyFloorApplied: z.boolean(),
  signpostRequired: z.boolean(),
  computedFrom: z.record(z.string(), z.unknown()),
});
export type SleepWindow = z.infer<typeof sleepWindowSchema>;

export const drinkEntrySchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().max(80),
  units: z.number().min(0).max(50),
});
export type DrinkEntry = z.infer<typeof drinkEntrySchema>;

export const consentSchema = z.object({
  reminders: z.boolean(),
  analytics: z.boolean(),
  updatedAt: z.string(),
});
export type ConsentState = z.infer<typeof consentSchema>;

export const appStateSchema = z.object({
  version: z.literal(1),
  onboarded: z.boolean(),
  programmes: z.array(programmeSlugSchema),
  quitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dailySpendGbp: z.number().min(0).optional(),
  sleepDiary: z.array(sleepEntrySchema),
  sleepWindow: sleepWindowSchema.optional(),
  drinkLog: z.array(drinkEntrySchema),
  consent: consentSchema,
});
export type AppState = z.infer<typeof appStateSchema>;

/** Deny-by-default: every consent starts false (mirrors @preventos/consent). */
export const initialAppState: AppState = {
  version: 1,
  onboarded: false,
  programmes: [],
  sleepDiary: [],
  drinkLog: [],
  consent: { reminders: false, analytics: false, updatedAt: "" },
};
