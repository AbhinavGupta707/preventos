// WP W3-WIRE — the contract for syncing web-app actions to apps/api. Pure zod,
// no server imports, so both the client helper and the server proxy share it.
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^\d{2}:\d{2}$/);

export const syncActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("enrol"),
    programmes: z.array(z.enum(["quitkit", "exhale", "steady", "nightshift"])).min(1),
    quitDate: isoDate.optional(),
    reminders: z.boolean(),
    analytics: z.boolean(),
  }),
  z.object({
    action: z.literal("drink"),
    date: isoDate,
    units: z.number().positive().max(100),
    label: z.string().max(100).optional(),
    context: z.string().max(100).optional(),
  }),
  z.object({
    action: z.literal("sleep"),
    date: isoDate,
    bedTime: hhmm,
    getUpTime: hhmm,
    sleepDelayMin: z.number().min(0).max(1440),
    nightAwakeMin: z.number().min(0).max(1440),
  }),
  z.object({
    action: z.literal("sleepWindow"),
    desiredRiseTime: hhmm,
    effectiveFrom: isoDate,
    safetySensitiveOccupation: z.boolean(),
    excessiveDaytimeSleepiness: z.boolean(),
  }),
  z.object({
    action: z.literal("consent"),
    key: z.enum(["reminders", "analytics"]),
    value: z.boolean(),
  }),
]);

export type SyncAction = z.infer<typeof syncActionSchema>;
