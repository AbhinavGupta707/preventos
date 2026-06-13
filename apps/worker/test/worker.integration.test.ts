import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { grantConsent } from "@preventos/consent";
import { createDb, createEnrolment, createPerson, runMigrations } from "@preventos/db";
import { ruleSetHash, type BurdenConfig } from "@preventos/decisions";
import type { PersonId } from "@preventos/domain";
import { dispatchPending, publish } from "@preventos/events";
import { DEFAULT_RULE_SET } from "../src/ruleset.js";
import { runDecisionTick } from "../src/tick.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_worker";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

/** Tests run in UTC so local time == UTC, no DST ambiguity. */
const TZ = "UTC";
const today = new Date().toISOString().slice(0, 10);
const at = (time: string) => new Date(`${today}T${time}:00Z`);

const RELAXED: BurdenConfig = { maxProactivePerDay: 3, minGapMinutes: 60, quietStart: "22:00", quietEnd: "06:00" };

let handle: ReturnType<typeof createDb>;

async function setupPerson(
  pseudonym: string,
  verticals: readonly string[],
  options: { proactiveConsent?: boolean } = {},
): Promise<string> {
  const person = await createPerson(handle.db, { pseudonym });
  const personId = person.id as PersonId;
  await grantConsent(handle.db, { personId, purpose: "programme_delivery" });
  if (options.proactiveConsent !== false) {
    await grantConsent(handle.db, { personId, purpose: "proactive_contact" });
  }
  for (const vertical of verticals) {
    await createEnrolment(handle.db, {
      personId,
      vertical,
      status: "active",
      stage: "acting",
      enrolledAt: at("00:01"),
    });
  }
  return person.id;
}

const contactsFor = async (personId: string) =>
  (
    await handle.pool.query(
      "SELECT * FROM core.contact_record WHERE person_id = $1 AND direction = 'outbound' ORDER BY occurred_at",
      [personId],
    )
  ).rows;

const decisionsFor = async (personId: string) =>
  (await handle.pool.query("SELECT * FROM core.decision_record WHERE person_id = $1 ORDER BY occurred_at", [personId]))
    .rows;

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

describe("decision tick", () => {
  it("morning anchor: one arbitrated contact with full decision audit", async () => {
    const personId = await setupPerson("tick-happy", ["smoking"]);
    const result = await runDecisionTick(handle.db, {
      ruleSet: DEFAULT_RULE_SET,
      now: at("08:35"),
      timeZone: TZ,
      burden: RELAXED,
    });
    expect(result.sent).toBe(1);

    const contacts = await contactsFor(personId);
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({ direction: "outbound", channel: "push", status: "queued" });
    expect(contacts[0].decision_id).not.toBeNull();

    const decisions = await decisionsFor(personId);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].id).toBe(contacts[0].decision_id);
    expect(decisions[0].vertical).toBe("smoking");
    expect(decisions[0].policy_version).toBe(ruleSetHash(DEFAULT_RULE_SET));
    expect(decisions[0].candidates.length).toBeGreaterThanOrEqual(1);
    expect(decisions[0].chosen_action.kind).toBe("send_atom");
    expect(decisions[0].state_snapshot.pointKeys.length).toBeGreaterThanOrEqual(1);

    const events = await handle.pool.query(
      "SELECT type FROM core.event WHERE person_id = $1 AND type IN ('decision.made','contact.sent') ORDER BY type",
      [personId],
    );
    expect(events.rows.map((row) => row.type)).toEqual(["contact.sent", "decision.made"]);
  });

  it("is idempotent: re-running the same tick decides nothing new", async () => {
    const personId = await setupPerson("tick-idem", ["smoking"]);
    const tick = () =>
      runDecisionTick(handle.db, { ruleSet: DEFAULT_RULE_SET, now: at("08:40"), timeZone: TZ, burden: RELAXED });
    const first = await tick();
    expect(first.sent).toBe(1);
    const second = await tick();
    expect(second.sent).toBe(0);
    expect(await contactsFor(personId)).toHaveLength(1);
    expect(await decisionsFor(personId)).toHaveLength(1);
  });

  it("arbitrates across programmes: two due verticals, one contact, both candidate sets in the audit", async () => {
    const personId = await setupPerson("tick-arb", ["smoking", "alcohol"]);
    const result = await runDecisionTick(handle.db, {
      ruleSet: DEFAULT_RULE_SET,
      now: at("08:45"),
      timeZone: TZ,
      burden: RELAXED,
    });
    expect(result.sent).toBe(1);
    const contacts = await contactsFor(personId);
    expect(contacts).toHaveLength(1);
    const decisions = await decisionsFor(personId);
    expect(decisions).toHaveLength(1);
    const verticals = decisions[0].candidates.map((candidate: { vertical: string }) => candidate.vertical);
    expect(new Set(verticals)).toEqual(new Set(["smoking", "alcohol"]));
    expect(decisions[0].vertical).toBe("smoking");
  });

  it("respects the daily budget: suppressed decision recorded, no contact", async () => {
    const personId = await setupPerson("tick-budget", ["smoking"]);
    const tight: BurdenConfig = { ...RELAXED, maxProactivePerDay: 1 };
    const morning = await runDecisionTick(handle.db, {
      ruleSet: DEFAULT_RULE_SET,
      now: at("08:35"),
      timeZone: TZ,
      burden: tight,
    });
    expect(morning.sent).toBe(1);
    // The tick processes every active person; assertions below are scoped to
    // this person's rows rather than the global tick counters.
    await runDecisionTick(handle.db, {
      ruleSet: DEFAULT_RULE_SET,
      now: at("19:05"),
      timeZone: TZ,
      burden: tight,
    });
    expect(await contactsFor(personId)).toHaveLength(1);
    const decisions = await decisionsFor(personId);
    expect(decisions).toHaveLength(2);
    expect(decisions[1].chosen_action).toMatchObject({ kind: "suppressed", reason: "daily budget exhausted" });
  });

  it("respects quiet hours", async () => {
    const personId = await setupPerson("tick-quiet", ["smoking"]);
    const earlyQuiet: BurdenConfig = { ...RELAXED, quietStart: "18:00", quietEnd: "08:00" };
    await runDecisionTick(handle.db, {
      ruleSet: DEFAULT_RULE_SET,
      now: at("19:05"),
      timeZone: TZ,
      burden: earlyQuiet,
    });
    expect(await contactsFor(personId)).toHaveLength(0);
    const decisions = await decisionsFor(personId);
    expect(decisions[0].chosen_action).toMatchObject({ kind: "suppressed", reason: "quiet hours" });
  });

  it("never sends without proactive_contact consent (deny by default)", async () => {
    const personId = await setupPerson("tick-consent", ["smoking"], { proactiveConsent: false });
    await runDecisionTick(handle.db, {
      ruleSet: DEFAULT_RULE_SET,
      now: at("08:35"),
      timeZone: TZ,
      burden: RELAXED,
    });
    expect(await contactsFor(personId)).toHaveLength(0);
    const decisions = await decisionsFor(personId);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].chosen_action).toMatchObject({ kind: "suppressed", reason: "consent not granted" });
  });

  it("does nothing outside any decision-point window", async () => {
    const personId = await setupPerson("tick-idle", ["smoking"]);
    await runDecisionTick(handle.db, {
      ruleSet: DEFAULT_RULE_SET,
      now: at("14:00"),
      timeZone: TZ,
      burden: RELAXED,
    });
    expect(await decisionsFor(personId)).toHaveLength(0);
  });
});

describe("outbox dispatch loop", () => {
  it("drains pending tick events exactly once", async () => {
    const person = await createPerson(handle.db, { pseudonym: "dispatch-smoke" });
    await publish(handle.db, "person.created", { personId: person.id });
    const seen: string[] = [];
    const handlers = {
      "person.created": (event: { eventId: bigint }) => {
        seen.push(String(event.eventId));
        return Promise.resolve();
      },
    };
    await dispatchPending(handle.pool, handlers);
    const again = await dispatchPending(handle.pool, handlers);
    expect(seen.length).toBeGreaterThanOrEqual(1);
    expect(again.dispatched).toBe(0);
  });
});
