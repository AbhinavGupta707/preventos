import { sql } from "drizzle-orm";
import { jsonb, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Db } from "./client.js";

/**
 * Marketing schema (WP8.2) — waitlist leads + a coded conversion funnel, held
 * separately from `core`/`identity`. No FK to core.person: these are pre-account
 * leads, structurally isolated from clinical data (see migration 0006 and the
 * privacy audit in compliance/privacy/marketing-funnel-privacy-audit.md).
 */
export const marketing = pgSchema("marketing");

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const waitlistSignup = marketing.table("waitlist_signup", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  programme: text("programme").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const funnelEvent = marketing.table("funnel_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  properties: jsonb("properties").notNull().default({}),
  receivedAt: ts("received_at").notNull().defaultNow(),
});

type NewWaitlistSignup = typeof waitlistSignup.$inferInsert;
type NewFunnelEvent = typeof funnelEvent.$inferInsert;

export async function recordWaitlistSignup(db: Db, row: NewWaitlistSignup) {
  const [created] = await db.insert(waitlistSignup).values(row).returning();
  if (created === undefined) throw new Error("waitlist signup insert returned no row");
  return created;
}

export async function recordFunnelEvent(db: Db, row: NewFunnelEvent) {
  const [created] = await db.insert(funnelEvent).values(row).returning();
  if (created === undefined) throw new Error("funnel event insert returned no row");
  return created;
}

export interface ProgrammeCount {
  readonly programme: string;
  readonly count: number;
}

export interface EventCount {
  readonly name: string;
  readonly count: number;
}

/** Per-programme waitlist counts (coded aggregate, no per-lead data). */
export async function waitlistCountsByProgramme(db: Db): Promise<readonly ProgrammeCount[]> {
  const rows = await db
    .select({ programme: waitlistSignup.programme, count: sql<number>`count(*)::int` })
    .from(waitlistSignup)
    .groupBy(waitlistSignup.programme)
    .orderBy(waitlistSignup.programme);
  return rows.map((r) => ({ programme: r.programme, count: Number(r.count) }));
}

/** Funnel event counts by name (coded aggregate). */
export async function funnelCountsByName(db: Db): Promise<readonly EventCount[]> {
  const rows = await db
    .select({ name: funnelEvent.name, count: sql<number>`count(*)::int` })
    .from(funnelEvent)
    .groupBy(funnelEvent.name)
    .orderBy(funnelEvent.name);
  return rows.map((r) => ({ name: r.name, count: Number(r.count) }));
}
