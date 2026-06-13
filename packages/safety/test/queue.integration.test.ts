import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PersonId } from "@preventos/domain";
import { createDb, createPerson, runMigrations, schema, resetTestDatabase } from "@preventos/db";
import { publish } from "@preventos/events";
import { eq } from "drizzle-orm";
import { claimCase, closeCase, listQueue, openCase, releaseCase, SLA_MINUTES } from "../src/queue.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_safety";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;
let personId: PersonId;
let triggerEventId: bigint;

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  const person = await createPerson(handle.db, { pseudonym: "safety-test", ageBand: "25-34" });
  personId = person.id as PersonId;
  const published = await publish(handle.db, "contact.received", {
    personId,
    contactId: "0e2c7c4e-7c33-4f0a-9a51-111111111111",
    channel: "app",
  });
  triggerEventId = published.eventId;
});

afterAll(async () => {
  await handle.pool.end();
});

async function eventsOfType(type: string) {
  return handle.db.select().from(schema.event).where(eq(schema.event.type, type));
}

describe("escalation queue — SLA clocks", () => {
  it("opens a case with a tier-driven SLA deadline and publishes escalation.opened", async () => {
    const before = Date.now();
    const opened = await openCase(handle.db, { personId, riskClass: "self_harm", tier: 1, triggerEventId });
    expect(opened.state).toBe("open");
    const expectedMs = SLA_MINUTES[1] * 60_000;
    const delta = opened.slaDeadline.getTime() - before;
    expect(delta).toBeGreaterThan(expectedMs - 5_000);
    expect(delta).toBeLessThan(expectedMs + 5_000);

    const events = await eventsOfType("escalation.opened");
    expect(events.some((e) => (e.payload as { caseId: string }).caseId === opened.id)).toBe(true);
  });

  it("tier 2 gets the slower clock", () => {
    expect(SLA_MINUTES[1]).toBeLessThan(SLA_MINUTES[2]);
  });

  it("lists the queue ordered by SLA deadline with overdue flags", async () => {
    const t2 = await openCase(handle.db, { personId, riskClass: "withdrawal_risk", tier: 2, triggerEventId });
    const queue = await listQueue(handle.db);
    expect(queue.length).toBeGreaterThanOrEqual(2);
    const deadlines = queue.map((c) => c.slaDeadline.getTime());
    expect([...deadlines].sort((a, b) => a - b)).toEqual(deadlines);
    expect(queue.every((c) => typeof c.overdue === "boolean")).toBe(true);
    expect(queue.some((c) => c.id === t2.id)).toBe(true);
  });
});

describe("escalation queue — claim/close with immutable audit", () => {
  it("claim -> close happy path, with escalation.closed evented", async () => {
    const c = await openCase(handle.db, { personId, riskClass: "overdose", tier: 1, triggerEventId });
    const claimed = await claimCase(handle.db, c.id, "clinician-anna");
    expect(claimed.state).toBe("claimed");
    expect(claimed.claimedBy).toBe("clinician-anna");

    const closed = await closeCase(handle.db, c.id, "referred-to-gp");
    expect(closed.state).toBe("closed");
    expect(closed.closedDisposition).toBe("referred-to-gp");
    expect(closed.closedAt).toBeInstanceOf(Date);

    const events = await eventsOfType("escalation.closed");
    expect(events.some((e) => (e.payload as { caseId: string }).caseId === c.id)).toBe(true);
  });

  it("cannot claim a case twice (concurrency-safe transition)", async () => {
    const c = await openCase(handle.db, { personId, riskClass: "abuse_dv", tier: 1, triggerEventId });
    await claimCase(handle.db, c.id, "clinician-anna");
    await expect(claimCase(handle.db, c.id, "clinician-bert")).rejects.toThrow(/not open/);
  });

  it("cannot close an unclaimed case", async () => {
    const c = await openCase(handle.db, { personId, riskClass: "acute_medical", tier: 2, triggerEventId });
    await expect(closeCase(handle.db, c.id, "resolved")).rejects.toThrow(/not claimed/);
  });

  it("closed is terminal: no re-claim, no re-close (immutable audit)", async () => {
    const c = await openCase(handle.db, { personId, riskClass: "safeguarding", tier: 1, triggerEventId });
    await claimCase(handle.db, c.id, "clinician-anna");
    await closeCase(handle.db, c.id, "escalated-to-lads");
    await expect(claimCase(handle.db, c.id, "clinician-bert")).rejects.toThrow(/not open/);
    await expect(closeCase(handle.db, c.id, "other")).rejects.toThrow(/not claimed/);
  });

  it("a claimed case can be released back to open", async () => {
    const c = await openCase(handle.db, { personId, riskClass: "self_harm", tier: 2, triggerEventId });
    await claimCase(handle.db, c.id, "clinician-anna");
    const released = await releaseCase(handle.db, c.id);
    expect(released.state).toBe("open");
    expect(released.claimedBy).toBeNull();
  });

  it("closed cases leave the live queue", async () => {
    const c = await openCase(handle.db, { personId, riskClass: "overdose", tier: 2, triggerEventId });
    await claimCase(handle.db, c.id, "clinician-anna");
    await closeCase(handle.db, c.id, "resolved");
    const queue = await listQueue(handle.db);
    expect(queue.some((q) => q.id === c.id)).toBe(false);
  });
});
