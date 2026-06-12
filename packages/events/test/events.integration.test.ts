import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, createPerson, runMigrations } from "@preventos/db";
import { EVENT_SCHEMAS, EVENT_TYPES } from "../src/catalogue.js";
import { dispatchPending } from "../src/dispatch.js";
import { publish } from "../src/publish.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_events";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;
let personId: string;

beforeAll(async () => {
  const admin = new pg.Pool({ connectionString: ADMIN_URL, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  const person = await createPerson(handle.db, { pseudonym: "events-test" });
  personId = person.id;
});

afterAll(async () => {
  await handle.pool.end();
});

describe("catalogue", () => {
  it("every schema is strict — undeclared fields cannot leak into the audit trail", () => {
    for (const type of EVENT_TYPES) {
      const probe = EVENT_SCHEMAS[type].safeParse({ unexpectedField: "leak" });
      expect(probe.success, `${type} accepted an undeclared field`).toBe(false);
    }
  });
});

describe("publish", () => {
  it("rejects invalid payloads and writes nothing", async () => {
    await expect(
      publish(handle.db, "lapse.logged", { personId: "not-a-uuid", enrolmentId: personId, vertical: "smoking" }),
    ).rejects.toThrow();
    const { rows } = await handle.pool.query("SELECT count(*) FROM core.event WHERE type = 'lapse.logged'");
    expect(rows[0].count).toBe("0");
  });

  it("writes event and outbox row atomically", async () => {
    const result = await publish(handle.db, "person.created", { personId });
    const { rows } = await handle.pool.query(
      "SELECT o.topic, o.status, e.type FROM core.outbox o JOIN core.event e ON e.id = o.event_id WHERE o.id = $1",
      [result.outboxId],
    );
    expect(rows[0]).toMatchObject({ topic: "person.created", status: "pending", type: "person.created" });
  });
});

describe("dispatchPending", () => {
  it("dispatches with a handler, exactly once", async () => {
    await publish(handle.db, "plan.updated", { personId, planId: personId, version: 1 });
    const seen: string[] = [];
    const result = await dispatchPending(handle.pool, {
      "plan.updated": (event) => {
        seen.push(String(event.eventId));
        return Promise.resolve();
      },
    });
    expect(seen.length).toBe(1);
    expect(result.dispatched).toBeGreaterThanOrEqual(1);
    const again = await dispatchPending(handle.pool, {
      "plan.updated": (event) => {
        seen.push(String(event.eventId));
        return Promise.resolve();
      },
    });
    expect(again.dispatched).toBe(0);
    expect(seen.length).toBe(1);
  });

  it("retries with backoff on handler failure, then marks failed at maxAttempts", async () => {
    const { outboxId } = await publish(handle.db, "drink.logged", {
      personId,
      entryId: personId,
      date: "2026-06-12",
    });
    const failing = { "drink.logged": () => Promise.reject(new Error("boom")) };
    const first = await dispatchPending(handle.pool, failing, { maxAttempts: 2 });
    expect(first.retried).toBe(1);
    const { rows: afterRetry } = await handle.pool.query("SELECT status, attempts FROM core.outbox WHERE id = $1", [
      outboxId,
    ]);
    expect(afterRetry[0]).toMatchObject({ status: "pending", attempts: 1 });
    const futureNow = new Date(Date.now() + 10 * 60 * 1000);
    const second = await dispatchPending(handle.pool, failing, { maxAttempts: 2, now: futureNow });
    expect(second.failed).toBe(1);
    const { rows: afterFail } = await handle.pool.query("SELECT status FROM core.outbox WHERE id = $1", [outboxId]);
    expect(afterFail[0].status).toBe("failed");
  });
});
