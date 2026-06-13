import type { RiskClass } from "@preventos/domain";
import type { Db } from "@preventos/db";
import { schema } from "@preventos/db";
import { publish } from "@preventos/events";
import { and, asc, eq, ne } from "drizzle-orm";

/**
 * WP7.3 (service half): escalation queue over core.escalation_case.
 *
 * State machine (mirrors @preventos/domain transitionEscalation):
 *   open -> claimed -> closed (terminal), claimed -> open (release).
 * Transitions are guarded UPDATE ... WHERE state = <expected>, so a lost race
 * surfaces as an error instead of a silent overwrite — closed rows can never
 * be mutated again (immutable audit). Every open/close publishes a catalogue
 * event through the transactional outbox.
 */

/** SLA clocks per tier. Tier 1 = immediate human attention; tier 2 = within a day. */
export const SLA_MINUTES: Readonly<Record<1 | 2, number>> = {
  1: 15,
  2: 24 * 60,
};

export interface OpenCaseInput {
  readonly personId: string;
  readonly riskClass: RiskClass;
  readonly tier: 1 | 2;
  readonly triggerEventId: bigint;
}

type CaseRow = typeof schema.escalationCase.$inferSelect;

export interface QueueEntry extends CaseRow {
  readonly overdue: boolean;
}

export async function openCase(db: Db, input: OpenCaseInput): Promise<CaseRow> {
  const slaDeadline = new Date(Date.now() + SLA_MINUTES[input.tier] * 60_000);
  const [row] = await db
    .insert(schema.escalationCase)
    .values({
      personId: input.personId,
      riskClass: input.riskClass,
      tier: input.tier,
      triggerEventId: input.triggerEventId,
      state: "open",
      slaDeadline,
    })
    .returning();
  if (row === undefined) throw new Error("escalation_case insert returned no row");
  await publish(db, "escalation.opened", {
    personId: input.personId,
    caseId: row.id,
    riskClass: input.riskClass,
    tier: input.tier,
  });
  return row;
}

export async function claimCase(db: Db, caseId: string, claimedBy: string): Promise<CaseRow> {
  const [row] = await db
    .update(schema.escalationCase)
    .set({ state: "claimed", claimedBy })
    .where(and(eq(schema.escalationCase.id, caseId), eq(schema.escalationCase.state, "open")))
    .returning();
  if (row === undefined) throw new Error(`escalation case ${caseId} is not open — cannot claim`);
  return row;
}

export async function releaseCase(db: Db, caseId: string): Promise<CaseRow> {
  const [row] = await db
    .update(schema.escalationCase)
    .set({ state: "open", claimedBy: null })
    .where(and(eq(schema.escalationCase.id, caseId), eq(schema.escalationCase.state, "claimed")))
    .returning();
  if (row === undefined) throw new Error(`escalation case ${caseId} is not claimed — cannot release`);
  return row;
}

export async function closeCase(db: Db, caseId: string, disposition: string): Promise<CaseRow> {
  const [row] = await db
    .update(schema.escalationCase)
    .set({ state: "closed", closedDisposition: disposition, closedAt: new Date() })
    .where(and(eq(schema.escalationCase.id, caseId), eq(schema.escalationCase.state, "claimed")))
    .returning();
  if (row === undefined) throw new Error(`escalation case ${caseId} is not claimed — cannot close`);
  await publish(db, "escalation.closed", {
    personId: row.personId,
    caseId: row.id,
    disposition,
  });
  return row;
}

/** Live queue (open + claimed), most urgent SLA first, with overdue flags. */
export async function listQueue(db: Db): Promise<readonly QueueEntry[]> {
  const rows = await db
    .select()
    .from(schema.escalationCase)
    .where(ne(schema.escalationCase.state, "closed"))
    .orderBy(asc(schema.escalationCase.slaDeadline));
  const now = Date.now();
  return rows.map((row) => ({ ...row, overdue: row.slaDeadline.getTime() < now }));
}
