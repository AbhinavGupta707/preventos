import type pg from "pg";
import type { Db } from "@preventos/db";
import { ruleSetHash, type BurdenConfig } from "@preventos/decisions";
import { dispatchPending } from "@preventos/events";
import { DEFAULT_RULE_SET, runDecisionTick } from "@preventos/worker";

/** Transport abstraction so the same journey runs over fastify.inject (tests)
 *  and real HTTP (runtime proof script). */
export type HttpCall = (
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  options?: { body?: unknown; token?: string },
) => Promise<{ status: number; body: { data?: Record<string, unknown>; error?: string } }>;

export interface DemoADeps {
  readonly call: HttpCall;
  readonly issueSession: (token: string, personId: string) => void;
  readonly db: Db;
  readonly pool: pg.Pool;
}

export interface DemoAResult {
  readonly personId: string;
  readonly contactId: string;
  readonly decisionId: string;
  readonly candidateCount: number;
  readonly suppressedReasons: readonly string[];
  readonly outboxDispatched: number;
  readonly steps: readonly string[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Demo A failed: ${message}`);
}

const TZ = "UTC";
const BURDEN: BurdenConfig = { maxProactivePerDay: 3, minGapMinutes: 60, quietStart: "22:00", quietEnd: "06:00" };
const today = (): string => new Date().toISOString().slice(0, 10);
const at = (time: string): Date => new Date(`${today()}T${time}:00Z`);

/**
 * Demo A (plan §7 M1): enrol → decision tick → exactly one arbitrated,
 * budget-respecting proactive contact, fully audited via its DecisionRecord.
 * Every step goes through the public API or the worker — no shortcuts into
 * the spine. Throws with a specific message on the first violated invariant.
 */
export async function runDemoA(deps: DemoADeps): Promise<DemoAResult> {
  const { call, issueSession, db, pool } = deps;
  const steps: string[] = [];
  const step = (line: string) => {
    steps.push(line);
  };

  // 1. Sign up + session
  const signUp = await call("POST", "/people", { body: { pseudonym: `demo-a-${today()}` } });
  assert(signUp.status === 201, `sign-up returned ${signUp.status}`);
  const personId = String(signUp.body.data?.["personId"]);
  const token = "demo-a-token";
  issueSession(token, personId);
  step(`person created: ${personId}`);

  // 2. Consents over HTTP
  for (const purpose of ["programme_delivery", "proactive_contact"] as const) {
    const grant = await call("POST", "/consents/grant", { body: { purpose }, token });
    assert(grant.status === 201, `consent grant (${purpose}) returned ${grant.status}`);
  }
  step("consents granted: programme_delivery, proactive_contact");

  // 3. Enrol in QuitKit
  const enrol = await call("POST", "/enrolments", { body: { vertical: "smoking" }, token });
  assert(enrol.status === 201, `enrolment returned ${enrol.status}`);
  step(`enrolled in smoking programme: ${String(enrol.body.data?.["id"])}`);

  // 4. Morning decision tick → exactly one contact, decision-audited
  const morning = await runDecisionTick(db, {
    ruleSet: DEFAULT_RULE_SET,
    now: at("08:35"),
    timeZone: TZ,
    burden: BURDEN,
  });
  assert(morning.sent === 1, `morning tick sent ${morning.sent} contacts, expected 1`);
  const contacts = await pool.query(
    "SELECT * FROM core.contact_record WHERE person_id = $1 AND direction = 'outbound'",
    [personId],
  );
  assert(contacts.rows.length === 1, `expected 1 outbound contact, found ${contacts.rows.length}`);
  const contact = contacts.rows[0];
  assert(contact.channel === "push" && contact.status === "queued", "contact is not a queued push");
  assert(contact.decision_id !== null, "contact has no decision audit link");

  const decisions = await pool.query("SELECT * FROM core.decision_record WHERE id = $1", [contact.decision_id]);
  const decision = decisions.rows[0];
  assert(decision !== undefined, "linked DecisionRecord not found");
  assert(decision.policy_version === ruleSetHash(DEFAULT_RULE_SET), "policy version does not match the rule set");
  assert(decision.candidates.length >= 1, "decision recorded no candidates");
  assert(decision.chosen_action.kind === "send_atom", "chosen action is not send_atom");
  step(`morning anchor contact queued (atom ${String(contact.content_atom_id)}), decision ${String(decision.id)}`);

  // 5. Idempotency: same tick window decides nothing new
  await runDecisionTick(db, { ruleSet: DEFAULT_RULE_SET, now: at("08:35"), timeZone: TZ, burden: BURDEN });
  const recount = await pool.query(
    "SELECT count(*) FROM core.contact_record WHERE person_id = $1 AND direction = 'outbound'",
    [personId],
  );
  assert(recount.rows[0].count === "1", "re-running the tick duplicated the contact");
  step("re-tick is idempotent: still exactly one contact");

  // 6. Budget: evening anchor under a 1/day budget is suppressed, with audit
  await runDecisionTick(db, {
    ruleSet: DEFAULT_RULE_SET,
    now: at("19:05"),
    timeZone: TZ,
    burden: { ...BURDEN, maxProactivePerDay: 1 },
  });
  const audit = await pool.query(
    "SELECT chosen_action FROM core.decision_record WHERE person_id = $1 ORDER BY occurred_at",
    [personId],
  );
  const suppressedReasons = audit.rows
    .filter((row) => row.chosen_action.kind === "suppressed")
    .map((row) => String(row.chosen_action.reason));
  assert(suppressedReasons.includes("daily budget exhausted"), "budget suppression was not audited");
  const finalCount = await pool.query(
    "SELECT count(*) FROM core.contact_record WHERE person_id = $1 AND direction = 'outbound'",
    [personId],
  );
  assert(finalCount.rows[0].count === "1", "budget was not respected — a second contact went out");
  step("evening anchor suppressed by burden governor (daily budget), decision audited");

  // 7. Deny-by-default: a second person without proactive consent never gets contacted
  const second = await call("POST", "/people", { body: { pseudonym: `demo-a-quiet-${today()}` } });
  const quietPersonId = String(second.body.data?.["personId"]);
  issueSession("demo-a-quiet-token", quietPersonId);
  await call("POST", "/consents/grant", { body: { purpose: "programme_delivery" }, token: "demo-a-quiet-token" });
  await call("POST", "/enrolments", { body: { vertical: "smoking" }, token: "demo-a-quiet-token" });
  await runDecisionTick(db, { ruleSet: DEFAULT_RULE_SET, now: at("08:50"), timeZone: TZ, burden: BURDEN });
  const quietContacts = await pool.query(
    "SELECT count(*) FROM core.contact_record WHERE person_id = $1 AND direction = 'outbound'",
    [quietPersonId],
  );
  assert(quietContacts.rows[0].count === "0", "contact sent without proactive_contact consent");
  const quietAudit = await pool.query(
    "SELECT chosen_action FROM core.decision_record WHERE person_id = $1",
    [quietPersonId],
  );
  assert(
    quietAudit.rows.some((row) => row.chosen_action.reason === "consent not granted"),
    "consent suppression was not audited",
  );
  step("no proactive consent → no contact, suppression audited (deny by default)");

  // 8. Outbox dispatcher drains the journey's events exactly once
  const drained = await dispatchPending(pool, {}, { batchSize: 100 });
  const again = await dispatchPending(pool, {}, { batchSize: 100 });
  assert(again.dispatched === 0, "outbox was not drained after dispatch");
  const pending = await pool.query("SELECT count(*) FROM core.outbox WHERE status = 'pending'");
  assert(pending.rows[0].count === "0", "outbox rows left pending after dispatch");
  step(`outbox drained: ${drained.dispatched} events dispatched`);

  return {
    personId,
    contactId: String(contact.id),
    decisionId: String(decision.id),
    candidateCount: decision.candidates.length,
    suppressedReasons,
    outboxDispatched: drained.dispatched,
    steps,
  };
}
