import type { ConsentRecord, DecisionRecord } from "@preventos/domain";
import { validateDecisionRecord } from "@preventos/domain";
import { desc, eq } from "drizzle-orm";
import type { Db } from "./client.js";
import {
  consentRecord,
  decisionRecord,
  enrolment,
  event,
  person,
  personIdentity,
  sleepDiaryEntry,
  sleepWindow,
} from "./schema.js";

type NewPerson = typeof person.$inferInsert;
type NewIdentity = typeof personIdentity.$inferInsert;
type NewEnrolment = typeof enrolment.$inferInsert;
type NewEvent = typeof event.$inferInsert;
type NewSleepWindow = typeof sleepWindow.$inferInsert;

export async function createPerson(db: Db, row: NewPerson) {
  const [created] = await db.insert(person).values(row).returning();
  if (created === undefined) throw new Error("person insert returned no row");
  return created;
}

export async function attachIdentity(db: Db, row: NewIdentity) {
  const [created] = await db.insert(personIdentity).values(row).returning();
  if (created === undefined) throw new Error("identity insert returned no row");
  return created;
}

export async function createEnrolment(db: Db, row: NewEnrolment) {
  const [created] = await db.insert(enrolment).values(row).returning();
  if (created === undefined) throw new Error("enrolment insert returned no row");
  return created;
}

export async function appendConsent(db: Db, row: Omit<ConsentRecord, "occurredAt"> & { occurredAt?: Date }) {
  const [created] = await db
    .insert(consentRecord)
    .values({
      personId: row.personId,
      purpose: row.purpose,
      signal: row.signal,
      recipient: row.recipient,
      action: row.action,
      evidence: row.evidence,
      ...(row.occurredAt !== undefined ? { occurredAt: row.occurredAt } : {}),
    })
    .returning();
  if (created === undefined) throw new Error("consent insert returned no row");
  return created;
}

export async function consentHistoryFor(db: Db, personId: string) {
  return db.select().from(consentRecord).where(eq(consentRecord.personId, personId));
}

export async function appendEvent(db: Db, row: NewEvent) {
  const [created] = await db.insert(event).values(row).returning();
  if (created === undefined) throw new Error("event insert returned no row");
  return created;
}

/** Domain validation runs before the row ever reaches the database. */
export async function appendDecision(db: Db, record: Omit<DecisionRecord, "id" | "occurredAt">) {
  const checked = validateDecisionRecord({
    ...record,
    id: "pending" as DecisionRecord["id"],
    occurredAt: new Date(),
  });
  if (!checked.ok) throw new Error(`invalid decision record: ${checked.error}`);
  const [created] = await db
    .insert(decisionRecord)
    .values({
      personId: record.personId,
      vertical: record.vertical,
      stateSnapshot: record.stateSnapshot,
      candidates: record.candidates,
      policyVersion: record.policyVersion,
      chosenAction: record.chosenAction,
      randomisationProbability: record.randomisationProbability,
    })
    .returning();
  if (created === undefined) throw new Error("decision insert returned no row");
  return created;
}

export async function appendSleepWindow(db: Db, row: NewSleepWindow) {
  const [created] = await db.insert(sleepWindow).values(row).returning();
  if (created === undefined) throw new Error("sleep window insert returned no row");
  return created;
}

export async function latestSleepWindowFor(db: Db, personId: string) {
  const [latest] = await db
    .select()
    .from(sleepWindow)
    .where(eq(sleepWindow.personId, personId))
    .orderBy(desc(sleepWindow.version))
    .limit(1);
  return latest;
}

export async function recentSleepDiaryEntriesFor(db: Db, personId: string, limit = 7) {
  const recent = await db
    .select()
    .from(sleepDiaryEntry)
    .where(eq(sleepDiaryEntry.personId, personId))
    .orderBy(desc(sleepDiaryEntry.date))
    .limit(limit);
  return [...recent].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
