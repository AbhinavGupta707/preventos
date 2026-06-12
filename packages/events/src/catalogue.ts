import { z } from "zod";
import { RISK_CLASSES, VERTICALS } from "@preventos/domain";

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Erasure invariant (plan WP1.3): event payloads carry identifiers and coded
 * values ONLY — never free text and never direct identifiers (phone, email,
 * postcode). Append-only audit rows survive erasure precisely because of this
 * rule; every schema is .strict() so undeclared fields cannot leak in. A test
 * enforces strictness across the catalogue.
 */
export const EVENT_SCHEMAS = {
  "person.created": z.object({ personId: uuid }).strict(),
  "enrolment.started": z.object({ personId: uuid, enrolmentId: uuid, vertical: z.enum(VERTICALS) }).strict(),
  "enrolment.status_changed": z
    .object({ personId: uuid, enrolmentId: uuid, from: z.string(), to: z.string() })
    .strict(),
  "consent.changed": z
    .object({
      personId: uuid,
      purpose: z.string(),
      action: z.enum(["granted", "revoked"]),
      signal: z.string().optional(),
      recipient: z.string().optional(),
    })
    .strict(),
  "contact.sent": z
    .object({ personId: uuid, contactId: uuid, channel: z.string(), contentAtomId: z.string().optional() })
    .strict(),
  "contact.received": z.object({ personId: uuid, contactId: uuid, channel: z.string() }).strict(),
  "decision.made": z.object({ personId: uuid, decisionId: uuid, vertical: z.enum(VERTICALS) }).strict(),
  "lapse.logged": z.object({ personId: uuid, enrolmentId: uuid, vertical: z.enum(VERTICALS) }).strict(),
  "escalation.opened": z
    .object({ personId: uuid, caseId: uuid, riskClass: z.enum(RISK_CLASSES), tier: z.number().int().min(1).max(3) })
    .strict(),
  "escalation.closed": z.object({ personId: uuid, caseId: uuid, disposition: z.string() }).strict(),
  "outcome.recorded": z
    .object({ personId: uuid, outcomeId: uuid, vertical: z.enum(VERTICALS), definitionId: z.string() })
    .strict(),
  "sleep.diary.logged": z.object({ personId: uuid, entryId: uuid, date: isoDate }).strict(),
  "sleep.window.adjusted": z.object({ personId: uuid, windowId: uuid, version: z.number().int() }).strict(),
  "drink.logged": z.object({ personId: uuid, entryId: uuid, date: isoDate }).strict(),
  "plan.updated": z.object({ personId: uuid, planId: uuid, version: z.number().int() }).strict(),
  "person.erased": z.object({ personId: uuid }).strict(),
} as const;

export type EventType = keyof typeof EVENT_SCHEMAS;
export type EventPayload<T extends EventType> = z.infer<(typeof EVENT_SCHEMAS)[T]>;

export const EVENT_TYPES = Object.keys(EVENT_SCHEMAS) as readonly EventType[];
