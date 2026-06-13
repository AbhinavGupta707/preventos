import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ApiClient } from "@preventos/api-client";
import { FakeAuthProvider } from "@preventos/auth";
import { createDb, runMigrations, resetTestDatabase } from "@preventos/db";
import { buildServer } from "../src/server.js";

/**
 * End-to-end proof of the SHARED client (@preventos/api-client) against the
 * REAL server over REAL HTTP and a REAL Postgres — the exact contract that
 * mobile (FetchApi) and web both depend on. Drives the Demo-A journey: dev
 * session → consents → enrolment → quit plan → logs, asserting both the
 * client's typed results and the rows that landed in the database.
 */
const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_api_client";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;
let auth: FakeAuthProvider;
let server: Awaited<ReturnType<typeof buildServer>>;
let baseUrl: string;
let token: string | undefined;
let client: ApiClient;

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  auth = new FakeAuthProvider();
  server = await buildServer({
    db: handle.db,
    auth,
    rateLimit: { max: 1000, timeWindowMs: 60_000 },
    devSessions: (personId) => {
      const issued = `tkn-${personId}`;
      auth.issue(issued, { kind: "end_user", personRef: personId });
      return issued;
    },
  });
  baseUrl = await server.listen({ port: 0, host: "127.0.0.1" });
  client = new ApiClient({ baseUrl, getToken: () => token });
});

afterAll(async () => {
  await server.close();
  await handle.pool.end();
});

describe("api-client ↔ api over real HTTP", () => {
  it("bootstraps a dev session and drives the full Demo-A journey", async () => {
    const session = await client.createDevSession("client-journey");
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    token = session.value.token;
    const { personId } = session.value;

    expect((await client.health()).ok).toBe(true);

    for (const purpose of ["programme_delivery", "proactive_contact"] as const) {
      const grant = await client.grantConsent({ purpose });
      expect(grant.ok).toBe(true);
    }
    expect(await client.checkConsent({ purpose: "proactive_contact" })).toEqual({ ok: true, value: true });

    const enrol = await client.enrol({ vertical: "smoking" });
    expect(enrol.ok && enrol.value.vertical).toBe("smoking");

    const plan = await client.createPlan({ vertical: "smoking", type: "quit", slots: { quitDate: "2026-06-20" } });
    expect(plan.ok && plan.value.version).toBe(1);

    const plans = await client.listPlans();
    expect(plans.ok && plans.value).toHaveLength(1);

    const craving = await client.logCraving("app");
    expect(craving.ok).toBe(true);

    // Server-side rows reflect the journey.
    const enrolments = await handle.pool.query(
      "SELECT vertical, status FROM core.enrolment WHERE person_id = $1",
      [personId],
    );
    expect(enrolments.rows).toEqual([{ vertical: "smoking", status: "active" }]);
    const contacts = await handle.pool.query(
      "SELECT direction, channel, status FROM core.contact_record WHERE person_id = $1",
      [personId],
    );
    expect(contacts.rows[0]).toMatchObject({ direction: "inbound", channel: "app", status: "logged" });
  });

  it("classifies inbound free text server-side and opens an escalation case (invariant 1)", async () => {
    const session = await client.createDevSession("client-safety");
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    token = session.value.token;
    await client.grantConsent({ purpose: "programme_delivery" });

    const crisis = await client.logDrink({
      date: "2026-06-13",
      units: 4,
      context: "drinking because I want to kill myself tonight",
    });
    expect(crisis.ok && crisis.value.safety).toMatchObject({ tier: 1, crisis: true });

    const benign = await client.logDrink({ date: "2026-06-13", units: 2, context: "after work with friends" });
    expect(benign.ok && benign.value.safety).toMatchObject({ tier: 0, crisis: false });

    const cases = await handle.pool.query(
      "SELECT state FROM core.escalation_case WHERE person_id = $1",
      [session.value.personId],
    );
    expect(cases.rows).toEqual([{ state: "open" }]);
  });

  it("propagates server errors as typed failures (consent gate → 403)", async () => {
    const session = await client.createDevSession("client-noconsent");
    if (!session.ok) throw new Error("dev session failed");
    token = session.value.token;
    const blocked = await client.enrol({ vertical: "smoking" });
    expect(blocked).toEqual({ ok: false, error: { status: 403, message: "programme_delivery consent required before enrolment" } });
  });

  it("does NOT expose POST /dev/session when the dev issuer is unconfigured", async () => {
    const prodLike = await buildServer({ db: handle.db, auth, rateLimit: { max: 1000, timeWindowMs: 60_000 } });
    try {
      const res = await prodLike.inject({ method: "POST", url: "/dev/session", payload: {} });
      expect(res.statusCode).toBe(404);
    } finally {
      await prodLike.close();
    }
  });
});
