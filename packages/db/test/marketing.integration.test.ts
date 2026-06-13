import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDb,
  funnelCountsByName,
  recordFunnelEvent,
  recordWaitlistSignup,
  resetTestDatabase,
  runMigrations,
  waitlistCountsByProgramme,
} from "../src/index.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_marketing";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
});

afterAll(async () => {
  await handle.pool.end();
});

describe("marketing store (WP8.2)", () => {
  it("lives in the isolated `marketing` schema with no FK to core.person", async () => {
    const tables = await handle.pool.query<{ table_schema: string }>(
      "SELECT table_schema FROM information_schema.tables WHERE table_name IN ('waitlist_signup','funnel_event')",
    );
    expect(tables.rows.every((r) => r.table_schema === "marketing")).toBe(true);

    // A lead is not a person: signups insert with zero rows in core.person.
    await recordWaitlistSignup(handle.db, { email: "lead@example.com", programme: "steady" });
    const people = await handle.pool.query<{ count: string }>("SELECT count(*) FROM core.person");
    expect(Number(people.rows[0]?.count)).toBe(0);

    const fks = await handle.pool.query<{ count: string }>(
      `SELECT count(*) FROM information_schema.table_constraints
       WHERE table_schema='marketing' AND constraint_type='FOREIGN KEY'`,
    );
    expect(Number(fks.rows[0]?.count)).toBe(0);
  });

  it("records waitlist signups and aggregates per programme", async () => {
    await recordWaitlistSignup(handle.db, { email: "a@example.com", programme: "quitkit" });
    await recordWaitlistSignup(handle.db, { email: "b@example.com", programme: "quitkit" });
    // (one "steady" already inserted by the isolation test)

    const counts = await waitlistCountsByProgramme(handle.db);
    const byProgramme = Object.fromEntries(counts.map((c) => [c.programme, c.count]));
    expect(byProgramme["quitkit"]).toBe(2);
    expect(byProgramme["steady"]).toBe(1);
    expect(counts.every((c) => typeof c.count === "number")).toBe(true);
  });

  it("records funnel events and aggregates by name", async () => {
    await recordFunnelEvent(handle.db, { name: "waitlist_joined", path: "/", properties: { programme: "quitkit" } });
    await recordFunnelEvent(handle.db, { name: "savings_calculated", path: "/tools", properties: { saved: 520 } });
    await recordFunnelEvent(handle.db, { name: "savings_calculated", path: "/tools", properties: {} });

    const counts = await funnelCountsByName(handle.db);
    const byName = Object.fromEntries(counts.map((c) => [c.name, c.count]));
    expect(byName["savings_calculated"]).toBe(2);
    expect(byName["waitlist_joined"]).toBe(1);
  });
});
