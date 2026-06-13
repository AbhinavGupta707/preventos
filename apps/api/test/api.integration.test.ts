import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FakeAuthProvider } from "@preventos/auth";
import { createDb, runMigrations } from "@preventos/db";
import { buildServer } from "../src/server.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_api";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;
let auth: FakeAuthProvider;
let server: Awaited<ReturnType<typeof buildServer>>;

/** Signs up a person over HTTP and issues a fake session for them. */
async function signUp(pseudonym: string): Promise<{ personId: string; token: string }> {
  const response = await server.inject({
    method: "POST",
    url: "/people",
    payload: { pseudonym },
  });
  expect(response.statusCode).toBe(201);
  const { data } = response.json();
  const token = `token-${pseudonym}`;
  auth.issue(token, { kind: "end_user", personRef: data.personId });
  return { personId: data.personId, token };
}

const asUser = (token: string) => ({ authorization: `Bearer ${token}` });

beforeAll(async () => {
  const admin = new pg.Pool({ connectionString: ADMIN_URL, max: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  auth = new FakeAuthProvider();
  server = await buildServer({ db: handle.db, auth, rateLimit: { max: 1000, timeWindowMs: 60_000 } });
});

afterAll(async () => {
  await server.close();
  await handle.pool.end();
});

describe("auth boundary", () => {
  it("rejects requests without a session token", async () => {
    const response = await server.inject({ method: "POST", url: "/enrolments", payload: { vertical: "smoking" } });
    expect(response.statusCode).toBe(401);
  });

  it("rejects an invalid session token", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/plans",
      headers: asUser("no-such-token"),
    });
    expect(response.statusCode).toBe(401);
  });

  it("rejects staff principals on person-scoped routes", async () => {
    auth.issue("staff-token", { kind: "staff", staffId: "s1", role: "advisor" });
    const response = await server.inject({ method: "GET", url: "/plans", headers: asUser("staff-token") });
    expect(response.statusCode).toBe(403);
  });
});

describe("sign-up", () => {
  it("creates a person and publishes person.created", async () => {
    const { personId } = await signUp("api-signup");
    const { rows } = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'person.created' AND person_id = $1",
      [personId],
    );
    expect(rows[0].count).toBe("1");
  });

  it("rejects an empty pseudonym", async () => {
    const response = await server.inject({ method: "POST", url: "/people", payload: { pseudonym: "" } });
    expect(response.statusCode).toBe(400);
  });
});

describe("consent", () => {
  it("grant then check reflects granted; revoke flips it back (deny by default)", async () => {
    const { token } = await signUp("api-consent");
    const before = await server.inject({
      method: "GET",
      url: "/consents/check?purpose=proactive_contact",
      headers: asUser(token),
    });
    expect(before.json().data.granted).toBe(false);

    const grant = await server.inject({
      method: "POST",
      url: "/consents/grant",
      headers: asUser(token),
      payload: { purpose: "proactive_contact" },
    });
    expect(grant.statusCode).toBe(201);

    const after = await server.inject({
      method: "GET",
      url: "/consents/check?purpose=proactive_contact",
      headers: asUser(token),
    });
    expect(after.json().data.granted).toBe(true);

    const revoke = await server.inject({
      method: "POST",
      url: "/consents/revoke",
      headers: asUser(token),
      payload: { purpose: "proactive_contact" },
    });
    expect(revoke.statusCode).toBe(201);

    const final = await server.inject({
      method: "GET",
      url: "/consents/check?purpose=proactive_contact",
      headers: asUser(token),
    });
    expect(final.json().data.granted).toBe(false);
  });

  it("rejects an unknown purpose", async () => {
    const { token } = await signUp("api-consent-bad");
    const response = await server.inject({
      method: "POST",
      url: "/consents/grant",
      headers: asUser(token),
      payload: { purpose: "marketing_spam" },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("enrolment", () => {
  it("requires programme_delivery consent (403 before grant, 201 after)", async () => {
    const { personId, token } = await signUp("api-enrol");
    const blocked = await server.inject({
      method: "POST",
      url: "/enrolments",
      headers: asUser(token),
      payload: { vertical: "smoking" },
    });
    expect(blocked.statusCode).toBe(403);

    await server.inject({
      method: "POST",
      url: "/consents/grant",
      headers: asUser(token),
      payload: { purpose: "programme_delivery" },
    });
    const enrolled = await server.inject({
      method: "POST",
      url: "/enrolments",
      headers: asUser(token),
      payload: { vertical: "smoking" },
    });
    expect(enrolled.statusCode).toBe(201);
    expect(enrolled.json().data.vertical).toBe("smoking");

    const { rows } = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'enrolment.started' AND person_id = $1",
      [personId],
    );
    expect(rows[0].count).toBe("1");
  });

  it("rejects a second active enrolment in the same vertical with 409", async () => {
    const { token } = await signUp("api-enrol-dup");
    await server.inject({
      method: "POST",
      url: "/consents/grant",
      headers: asUser(token),
      payload: { purpose: "programme_delivery" },
    });
    const first = await server.inject({
      method: "POST",
      url: "/enrolments",
      headers: asUser(token),
      payload: { vertical: "alcohol" },
    });
    expect(first.statusCode).toBe(201);
    const second = await server.inject({
      method: "POST",
      url: "/enrolments",
      headers: asUser(token),
      payload: { vertical: "alcohol" },
    });
    expect(second.statusCode).toBe(409);
  });

  it("rejects an unknown vertical", async () => {
    const { token } = await signUp("api-enrol-bad");
    const response = await server.inject({
      method: "POST",
      url: "/enrolments",
      headers: asUser(token),
      payload: { vertical: "gambling" },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("logging", () => {
  async function consentedUser(pseudonym: string) {
    const user = await signUp(pseudonym);
    await server.inject({
      method: "POST",
      url: "/consents/grant",
      headers: asUser(user.token),
      payload: { purpose: "programme_delivery" },
    });
    return user;
  }

  it("drink log writes the entry and publishes drink.logged", async () => {
    const { personId, token } = await consentedUser("api-drink");
    const response = await server.inject({
      method: "POST",
      url: "/logs/drink",
      headers: asUser(token),
      payload: { date: "2026-06-12", units: 2.5, drinkType: "beer" },
    });
    expect(response.statusCode).toBe(201);
    const { rows } = await handle.pool.query("SELECT units FROM core.drink_log_entry WHERE person_id = $1", [
      personId,
    ]);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].units)).toBe(2.5);
    const events = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'drink.logged' AND person_id = $1",
      [personId],
    );
    expect(events.rows[0].count).toBe("1");
  });

  it("rejects negative drink units", async () => {
    const { token } = await consentedUser("api-drink-bad");
    const response = await server.inject({
      method: "POST",
      url: "/logs/drink",
      headers: asUser(token),
      payload: { date: "2026-06-12", units: -1 },
    });
    expect(response.statusCode).toBe(400);
  });

  it("sleep diary log writes the entry and publishes sleep.diary.logged", async () => {
    const { personId, token } = await consentedUser("api-sleep");
    const response = await server.inject({
      method: "POST",
      url: "/logs/sleep-diary",
      headers: asUser(token),
      payload: {
        date: "2026-06-11",
        bedTime: "23:15",
        sleepOnsetLatencyMin: 25,
        wasoMin: 40,
        finalWakeTime: "06:30",
        riseTime: "06:45",
        quality: 3,
      },
    });
    expect(response.statusCode).toBe(201);
    const events = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'sleep.diary.logged' AND person_id = $1",
      [personId],
    );
    expect(events.rows[0].count).toBe("1");
  });

  it("craving log records an inbound contact and publishes contact.received", async () => {
    const { personId, token } = await consentedUser("api-craving");
    const response = await server.inject({ method: "POST", url: "/logs/craving", headers: asUser(token), payload: {} });
    expect(response.statusCode).toBe(201);
    const { rows } = await handle.pool.query(
      "SELECT direction, channel, status FROM core.contact_record WHERE person_id = $1",
      [personId],
    );
    expect(rows[0]).toMatchObject({ direction: "inbound", channel: "app", status: "logged" });
    const events = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'contact.received' AND person_id = $1",
      [personId],
    );
    expect(events.rows[0].count).toBe("1");
  });

  it("blocks logging when programme_delivery consent is revoked", async () => {
    const { token } = await consentedUser("api-log-revoked");
    await server.inject({
      method: "POST",
      url: "/consents/revoke",
      headers: asUser(token),
      payload: { purpose: "programme_delivery" },
    });
    const response = await server.inject({
      method: "POST",
      url: "/logs/drink",
      headers: asUser(token),
      payload: { date: "2026-06-12", units: 1 },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe("plans", () => {
  it("create, read, update (version bump), list, delete — evented", async () => {
    const { personId, token } = await signUp("api-plans");
    const created = await server.inject({
      method: "POST",
      url: "/plans",
      headers: asUser(token),
      payload: { vertical: "smoking", type: "if_then", slots: { trigger: "morning_coffee", response: "gum" } },
    });
    expect(created.statusCode).toBe(201);
    const planId = created.json().data.id;
    expect(created.json().data.version).toBe(1);

    const fetched = await server.inject({ method: "GET", url: `/plans/${planId}`, headers: asUser(token) });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().data.slots.trigger).toBe("morning_coffee");

    const updated = await server.inject({
      method: "PUT",
      url: `/plans/${planId}`,
      headers: asUser(token),
      payload: { slots: { trigger: "morning_coffee", response: "walk" } },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.version).toBe(2);

    const listed = await server.inject({ method: "GET", url: "/plans", headers: asUser(token) });
    expect(listed.json().data).toHaveLength(1);

    const events = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'plan.updated' AND person_id = $1",
      [personId],
    );
    expect(events.rows[0].count).toBe("2");

    const deleted = await server.inject({ method: "DELETE", url: `/plans/${planId}`, headers: asUser(token) });
    expect(deleted.statusCode).toBe(204);
    const gone = await server.inject({ method: "GET", url: `/plans/${planId}`, headers: asUser(token) });
    expect(gone.statusCode).toBe(404);
  });

  it("never exposes another person's plan", async () => {
    const owner = await signUp("api-plan-owner");
    const intruder = await signUp("api-plan-intruder");
    const created = await server.inject({
      method: "POST",
      url: "/plans",
      headers: asUser(owner.token),
      payload: { vertical: "sleep", type: "sleep_window", slots: {} },
    });
    const planId = created.json().data.id;
    const stolen = await server.inject({ method: "GET", url: `/plans/${planId}`, headers: asUser(intruder.token) });
    expect(stolen.statusCode).toBe(404);
    const tampered = await server.inject({
      method: "PUT",
      url: `/plans/${planId}`,
      headers: asUser(intruder.token),
      payload: { slots: { hacked: true } },
    });
    expect(tampered.statusCode).toBe(404);
  });

  it("rejects an unknown plan type", async () => {
    const { token } = await signUp("api-plan-bad");
    const response = await server.inject({
      method: "POST",
      url: "/plans",
      headers: asUser(token),
      payload: { vertical: "smoking", type: "world_domination", slots: {} },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("rate limiting", () => {
  it("returns 429 once the per-window budget is spent", async () => {
    const limited = await buildServer({ db: handle.db, auth, rateLimit: { max: 2, timeWindowMs: 60_000 } });
    try {
      const first = await limited.inject({ method: "GET", url: "/health" });
      const second = await limited.inject({ method: "GET", url: "/health" });
      const third = await limited.inject({ method: "GET", url: "/health" });
      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(third.statusCode).toBe(429);
    } finally {
      await limited.close();
    }
  });
});
