import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { grantConsent } from "@preventos/consent";
import { buildCatalog, loadPackDir, type ResolvedAtom } from "@preventos/content";
import { createDb, createEnrolment, createPerson, runMigrations, resetTestDatabase } from "@preventos/db";
import { deriveAlcoholFlags, ruleSetHash, ruleSetSchema, type BurdenConfig, type RuleSet } from "@preventos/decisions";
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

// W3-STEADY fixtures. DEFAULT_RULE_SET already carries the unbypassable dependence
// hard-stop; we add a moderation rule that targets a REAL contraindicated atom
// (alcohol.norm.above.weekly) so the contraindication gate has something to block.
const NORM_MODERATION_RULE = {
  id: "alcohol-norm-moderation",
  vertical: "alcohol",
  priority: 60, // beats the anchors so, absent the hard-stop, it would win arbitration
  when: [
    { field: "kind", op: "eq", value: "morning_anchor" },
    { field: "vertical", op: "eq", value: "alcohol" },
  ],
  then: { kind: "send_atom", ref: "alcohol.norm.above.weekly" },
};
const STEADY_RULES: RuleSet = ruleSetSchema.parse({
  version: "test-steady-1",
  rules: [...DEFAULT_RULE_SET.rules, NORM_MODERATION_RULE],
});
const STEADY_RULES_NO_HARDSTOP: RuleSet = ruleSetSchema.parse({
  version: "test-steady-no-hardstop-1",
  rules: [...DEFAULT_RULE_SET.rules.filter((rule) => rule.id !== "alcohol-dependence-hardstop"), NORM_MODERATION_RULE],
});

let handle: ReturnType<typeof createDb>;
let atomFor: (id: string) => ResolvedAtom | undefined;

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

/** Enrols a person in Steady with a persisted AUDIT-C assessment (score + derived
 *  safety flags), exactly as the enrolment API would on alcohol intake. */
async function setupAlcoholPerson(
  pseudonym: string,
  auditC: number,
  options: { proactiveConsent?: boolean } = {},
): Promise<string> {
  const person = await createPerson(handle.db, { pseudonym });
  const personId = person.id as PersonId;
  await grantConsent(handle.db, { personId, purpose: "programme_delivery" });
  if (options.proactiveConsent !== false) {
    await grantConsent(handle.db, { personId, purpose: "proactive_contact" });
  }
  await createEnrolment(handle.db, {
    personId,
    vertical: "alcohol",
    status: "active",
    stage: "acting",
    enrolledAt: at("00:01"),
    assessment: { instrument: "audit-c", score: auditC, flags: [...deriveAlcoholFlags(auditC)] },
  });
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
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);

  // Real alcohol pack → the same catalog the worker boots with, so the gate is
  // tested against authored contraindications, not a test-local assumption.
  const packDir = fileURLToPath(new URL("../../../content/alcohol", import.meta.url));
  const loaded = await loadPackDir(packDir);
  expect(loaded.errors).toEqual([]);
  const catalog = buildCatalog(loaded.atoms, loaded.sequences);
  if (!catalog.ok) throw new Error(catalog.error);
  atomFor = (id) => catalog.value.byId.get(id);
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

const atomIdsFor = async (personId: string): Promise<readonly (string | null)[]> =>
  (await contactsFor(personId)).map((row) => row.content_atom_id as string | null);

describe("alcohol dependence hard-stop (invariant 4 / E17)", () => {
  it("aligns with the content taxonomy: moderation atoms are contraindicated, the referral is not", () => {
    expect(atomFor("alcohol.norm.above.weekly")?.contraindications).toContain("dependence-flagged");
    expect(atomFor("alcohol.hardstop.screen.main")?.contraindications ?? []).not.toContain("dependence-flagged");
  });

  it("routes a dependence-flagged person to the referral and NEVER the moderation atom — bypassing consent AND budget", async () => {
    // No proactive_contact consent and a zero daily budget: both gates would
    // suppress an ordinary nudge. The unbypassable hard-stop must send anyway.
    const personId = await setupAlcoholPerson("steady-flagged", 12, { proactiveConsent: false });
    const noBudget: BurdenConfig = { maxProactivePerDay: 0, minGapMinutes: 60, quietStart: "22:00", quietEnd: "06:00" };
    await runDecisionTick(handle.db, {
      ruleSet: STEADY_RULES,
      now: at("08:36"),
      timeZone: TZ,
      burden: noBudget,
      atomFor,
    });

    const atomIds = await atomIdsFor(personId);
    expect(atomIds).toContain("alcohol.hardstop.screen.main");
    expect(atomIds).not.toContain("alcohol.norm.above.weekly");

    const decisions = await decisionsFor(personId);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].chosen_action).toMatchObject({
      kind: "send_atom",
      ref: "alcohol.hardstop.screen.main",
      unbypassable: true,
    });
  });

  it("still serves the moderation atom to a non-dependent drinker (the gate does not over-block)", async () => {
    const personId = await setupAlcoholPerson("steady-moderate", 4);
    await runDecisionTick(handle.db, {
      ruleSet: STEADY_RULES,
      now: at("08:37"),
      timeZone: TZ,
      burden: RELAXED,
      atomFor,
    });
    const atomIds = await atomIdsFor(personId);
    expect(atomIds).toContain("alcohol.norm.above.weekly");
    expect(atomIds).not.toContain("alcohol.hardstop.screen.main");
  });

  it("defense in depth: with the hard-stop rule removed, the contraindication gate alone blocks the moderation atom", async () => {
    const personId = await setupAlcoholPerson("steady-defense", 11);
    await runDecisionTick(handle.db, {
      ruleSet: STEADY_RULES_NO_HARDSTOP,
      now: at("08:38"),
      timeZone: TZ,
      burden: RELAXED,
      atomFor,
    });
    expect(await contactsFor(personId)).toHaveLength(0);
    const decisions = await decisionsFor(personId);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].chosen_action).toMatchObject({ kind: "suppressed", reason: "contraindicated" });
  });
});
