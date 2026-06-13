import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, createPerson, runMigrations } from "@preventos/db";
import { dispatchPending, publish } from "@preventos/events";
import { makeAuditHandlers } from "../src/handlers.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_worker_handlers";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;

beforeAll(async () => {
  const admin = new pg.Pool({ connectionString: ADMIN_URL, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
});

afterAll(async () => {
  await handle.pool.end();
});

interface LogCall {
  readonly level: "info" | "warn";
  readonly obj: { type: string };
}

describe("worker audit handlers consume the outbox (events are not write-only)", () => {
  it("invokes a handler for every dispatched event and drains the outbox exactly once", async () => {
    const person = await createPerson(handle.db, { pseudonym: "worker-handlers" });
    await publish(handle.db, "person.created", { personId: person.id });
    await publish(handle.db, "drink.logged", { personId: person.id, entryId: randomUUID(), date: "2026-06-13" });
    await publish(handle.db, "escalation.opened", {
      personId: person.id,
      caseId: randomUUID(),
      riskClass: "self_harm",
      tier: 1,
    });

    const calls: LogCall[] = [];
    const logger = {
      info: (obj: unknown) => calls.push({ level: "info", obj: obj as { type: string } }),
      warn: (obj: unknown) => calls.push({ level: "warn", obj: obj as { type: string } }),
    };

    const first = await dispatchPending(handle.pool, makeAuditHandlers(logger));
    expect(first.dispatched).toBe(3);
    expect(first.failed).toBe(0);
    expect(calls).toHaveLength(3); // every event reached a handler

    // Safety-relevant event escalates to the WARN stream; routine events log info.
    expect(calls.filter((c) => c.level === "warn").map((c) => c.obj.type)).toEqual(["escalation.opened"]);
    expect(calls.filter((c) => c.level === "info").map((c) => c.obj.type).sort()).toEqual([
      "drink.logged",
      "person.created",
    ]);

    // Consumed once: a second pass dispatches nothing and the outbox is empty.
    const second = await dispatchPending(handle.pool, makeAuditHandlers(logger));
    expect(second.dispatched).toBe(0);
    const pending = await handle.pool.query("SELECT count(*) FROM core.outbox WHERE status = 'pending'");
    expect(pending.rows[0].count).toBe("0");
  });
});
