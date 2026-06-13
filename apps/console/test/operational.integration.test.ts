import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDb,
  createEnrolment,
  createPerson,
  recordFunnelEvent,
  recordWaitlistSignup,
  runMigrations,
  resetTestDatabase,
} from "@preventos/db";
import { publish } from "@preventos/events";
import { getMarketingFunnel } from "../lib/marketing";
import { getOperationalSummary } from "../lib/operational";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_console";
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

describe("console operational summary reads real events", () => {
  it("returns configured:false when no DATABASE_URL is set", async () => {
    const saved = process.env["DATABASE_URL"];
    delete process.env["DATABASE_URL"];
    try {
      const summary = await getOperationalSummary();
      expect(summary.configured).toBe(false);
      expect(summary.people).toBe(0);
    } finally {
      if (saved !== undefined) process.env["DATABASE_URL"] = saved;
    }
  });

  it("aggregates live rows from the real backbone (people, enrolments, events, decisions, contacts)", async () => {
    const person = await createPerson(handle.db, { pseudonym: "console-live" });
    await createEnrolment(handle.db, {
      personId: person.id,
      vertical: "smoking",
      status: "active",
      stage: "ready",
    });
    await publish(handle.db, "person.created", { personId: person.id });
    await publish(handle.db, "enrolment.started", {
      personId: person.id,
      enrolmentId: person.id,
      vertical: "smoking",
    });
    const triggerEvent = await publish(handle.db, "contact.received", {
      personId: person.id,
      contactId: person.id,
      channel: "app",
    });

    // Two decisions: one sent, one suppressed — seeded directly to keep the
    // console test independent of the decision-validation schema.
    await handle.pool.query(
      `INSERT INTO core.decision_record
         (person_id, vertical, state_snapshot, candidates, policy_version, chosen_action, randomisation_probability)
       VALUES ($1,'smoking','{}'::jsonb,'[]'::jsonb,'test',$2::jsonb,1),
              ($1,'smoking','{}'::jsonb,'[]'::jsonb,'test',$3::jsonb,1)`,
      [
        person.id,
        JSON.stringify({ kind: "send_atom", ref: "smoking.morning" }),
        JSON.stringify({ kind: "suppressed", reason: "daily budget exhausted" }),
      ],
    );

    await handle.pool.query(
      "INSERT INTO core.contact_record (person_id, direction, channel, status) VALUES ($1,'outbound','push','queued'),($1,'inbound','app','logged')",
      [person.id],
    );
    await handle.pool.query(
      "INSERT INTO core.escalation_case (person_id, risk_class, tier, trigger_event_id, sla_deadline, state) VALUES ($1,'self_harm',1,$2, now() + interval '1 hour','open')",
      [person.id, triggerEvent.eventId.toString()],
    );

    const saved = process.env["DATABASE_URL"];
    process.env["DATABASE_URL"] = TEST_URL;
    let summary;
    try {
      summary = await getOperationalSummary();
    } finally {
      if (saved !== undefined) process.env["DATABASE_URL"] = saved;
    }

    expect(summary.configured).toBe(true);
    expect(summary.error).toBeUndefined();
    expect(summary.people).toBe(1);
    expect(summary.activeEnrolments).toEqual([{ vertical: "smoking", count: 1 }]);
    expect(summary.decisions).toEqual({ total: 2, sent: 1, suppressed: 1 });
    expect(summary.contacts).toEqual({ outboundQueued: 1, outboundSent: 0, inbound: 1 });
    expect(summary.openEscalations).toBe(1);
    const eventTypes = summary.eventsByType.map((row) => row.type);
    expect(eventTypes).toContain("person.created");
    expect(eventTypes).toContain("enrolment.started");
  });
});

describe("console marketing funnel reads the isolated marketing schema (WP8.2)", () => {
  it("returns configured:false when no DATABASE_URL is set", async () => {
    const saved = process.env["DATABASE_URL"];
    delete process.env["DATABASE_URL"];
    try {
      const funnel = await getMarketingFunnel();
      expect(funnel.configured).toBe(false);
      expect(funnel.waitlistTotal).toBe(0);
    } finally {
      if (saved !== undefined) process.env["DATABASE_URL"] = saved;
    }
  });

  it("aggregates per-programme waitlist counts and conversion events", async () => {
    await recordWaitlistSignup(handle.db, { email: "w1@example.com", programme: "quitkit" });
    await recordWaitlistSignup(handle.db, { email: "w2@example.com", programme: "quitkit" });
    await recordWaitlistSignup(handle.db, { email: "w3@example.com", programme: "nightshift" });
    await recordFunnelEvent(handle.db, { name: "waitlist_joined", path: "/", properties: {} });
    await recordFunnelEvent(handle.db, { name: "sleep_debt_calculated", path: "/tools", properties: { debt: 12 } });

    const saved = process.env["DATABASE_URL"];
    process.env["DATABASE_URL"] = TEST_URL;
    let funnel;
    try {
      funnel = await getMarketingFunnel();
    } finally {
      if (saved !== undefined) process.env["DATABASE_URL"] = saved;
    }

    expect(funnel.configured).toBe(true);
    expect(funnel.error).toBeUndefined();
    expect(funnel.waitlistTotal).toBe(3);
    const byProgramme = Object.fromEntries(funnel.waitlist.map((w) => [w.programme, w.count]));
    expect(byProgramme["quitkit"]).toBe(2);
    expect(byProgramme["nightshift"]).toBe(1);
    const eventNames = funnel.events.map((e) => e.name);
    expect(eventNames).toContain("waitlist_joined");
    expect(eventNames).toContain("sleep_debt_calculated");
  });
});
