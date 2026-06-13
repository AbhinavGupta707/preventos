import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { checkConsent } from "@preventos/consent";
import { appendDecision, schema, type Db } from "@preventos/db";
import {
  arbitrate,
  canSendProactive,
  decisionPoints,
  DEFAULT_BURDEN,
  evaluateRules,
  type ArbitrationState,
  type BurdenConfig,
  type Candidate,
  type DecisionPoint,
  type RuleSet,
} from "@preventos/decisions";
import type { PersonId, Vertical } from "@preventos/domain";
import { publish } from "@preventos/events";
import { localStamp } from "./local-time.js";

export interface TickOptions {
  readonly ruleSet: RuleSet;
  readonly now?: Date;
  readonly burden?: BurdenConfig;
  readonly timeZone?: string;
  readonly windowMinutes?: number;
}

export interface TickResult {
  readonly people: number;
  readonly sent: number;
  readonly suppressed: number;
}

type EnrolmentRow = typeof schema.enrolment.$inferSelect;
type DecisionRow = typeof schema.decisionRecord.$inferSelect;

const pointKey = (point: DecisionPoint): string => `${point.at}|${point.vertical}|${point.kind}`;

const LOOKBACK_MS = 48 * 60 * 60_000;

/** Rounds-since-served per vertical, derived from the decision audit itself
 *  (newest first): a vertical was "served" by any non-suppressed decision. */
function arbitrationStateFrom(decisions: readonly DecisionRow[]): ArbitrationState {
  const rounds: Partial<Record<Vertical, number>> = {};
  decisions.forEach((decision, index) => {
    const action = decision.chosenAction as { kind?: string };
    const vertical = decision.vertical as Vertical;
    if (action.kind !== undefined && action.kind !== "suppressed" && rounds[vertical] === undefined) {
      rounds[vertical] = index;
    }
  });
  return { roundsSinceServed: rounds };
}

interface PersonTickContext {
  readonly now: Date;
  readonly burden: BurdenConfig;
  readonly timeZone: string;
  readonly windowMinutes: number;
  readonly ruleSet: RuleSet;
}

async function tickPerson(
  db: Db,
  personId: PersonId,
  enrolments: readonly EnrolmentRow[],
  ctx: PersonTickContext,
): Promise<"idle" | "sent" | "suppressed"> {
  const local = localStamp(ctx.now, ctx.timeZone);
  const windowStart = localStamp(new Date(ctx.now.getTime() - ctx.windowMinutes * 60_000), ctx.timeZone);

  const quitPlans = await db
    .select()
    .from(schema.planObject)
    .where(and(eq(schema.planObject.personId, personId), eq(schema.planObject.type, "quit")));
  const quitDateFor = (vertical: string): string | undefined => {
    const slots = quitPlans.find((plan) => plan.vertical === vertical)?.slots as { quitDate?: unknown } | undefined;
    return typeof slots?.quitDate === "string" ? slots.quitDate : undefined;
  };

  const recentDecisions = await db
    .select()
    .from(schema.decisionRecord)
    .where(
      and(
        eq(schema.decisionRecord.personId, personId),
        gte(schema.decisionRecord.occurredAt, new Date(ctx.now.getTime() - LOOKBACK_MS)),
      ),
    )
    .orderBy(desc(schema.decisionRecord.occurredAt))
    .limit(200);
  const decidedKeys = new Set(
    recentDecisions.flatMap((decision) => {
      const snapshot = decision.stateSnapshot as { pointKeys?: unknown };
      return Array.isArray(snapshot.pointKeys) ? (snapshot.pointKeys as string[]) : [];
    }),
  );

  const enrolledVerticals = new Set(enrolments.map((enrolment) => enrolment.vertical));
  const due: { point: DecisionPoint; stage: string }[] = [];
  for (const enrolment of enrolments) {
    const quitDate = quitDateFor(enrolment.vertical);
    const points = decisionPoints(
      {
        vertical: enrolment.vertical as Vertical,
        enrolledOn: localStamp(enrolment.enrolledAt, ctx.timeZone).date,
        ...(quitDate !== undefined ? { quitDate } : {}),
      },
      local.date,
      local.date,
    );
    for (const point of points) {
      if (point.at > windowStart.stamp && point.at <= local.stamp && !decidedKeys.has(pointKey(point))) {
        due.push({ point, stage: enrolment.stage });
      }
    }
  }
  if (due.length === 0) return "idle";

  // Candidates from ALL enrolled programmes' due points, arbitrated once into
  // the single cross-vertical budget (PRD §3.4 [D], §7.2 decision schema).
  const candidateById = new Map<string, Candidate>();
  let policyVersion = "";
  for (const { point, stage } of due) {
    const evaluation = evaluateRules(ctx.ruleSet, {
      kind: point.kind,
      vertical: point.vertical,
      stage,
      date: local.date,
    });
    policyVersion = evaluation.policyVersion;
    for (const candidate of evaluation.candidates) {
      if (enrolledVerticals.has(candidate.vertical)) candidateById.set(candidate.ruleId, candidate);
    }
  }
  const candidates = [...candidateById.values()];
  if (candidates.length === 0) return "idle";

  const chosen = arbitrate(candidates, arbitrationStateFrom(recentDecisions));
  if (chosen === undefined) return "idle";

  const sentTodayRows = await db
    .select({ occurredAt: schema.contactRecord.occurredAt })
    .from(schema.contactRecord)
    .where(
      and(
        eq(schema.contactRecord.personId, personId),
        eq(schema.contactRecord.direction, "outbound"),
        isNotNull(schema.contactRecord.decisionId),
        gte(schema.contactRecord.occurredAt, new Date(ctx.now.getTime() - LOOKBACK_MS)),
      ),
    );
  const sentToday = sentTodayRows
    .map((row) => row.occurredAt)
    .filter((occurredAt) => localStamp(occurredAt, ctx.timeZone).date === local.date);

  const consented = await checkConsent(db, personId, { purpose: "proactive_contact" });
  const gate = consented
    ? canSendProactive(sentToday, ctx.now, local.time, ctx.burden)
    : ({ ok: false, error: "consent not granted" } as const);

  const chosenAction = gate.ok
    ? { kind: chosen.action.kind, ref: chosen.action.ref, ruleId: chosen.ruleId }
    : { kind: "suppressed", reason: gate.error, candidateRuleId: chosen.ruleId };

  const decision = await appendDecision(db, {
    personId,
    vertical: chosen.vertical,
    stateSnapshot: {
      pointKeys: due.map(({ point }) => pointKey(point)),
      localTime: local.stamp,
      windowMinutes: ctx.windowMinutes,
      sentTodayCount: sentToday.length,
    },
    candidates: candidates as unknown as Readonly<Record<string, unknown>>[],
    policyVersion,
    chosenAction,
    randomisationProbability: 1,
  });
  await publish(db, "decision.made", { personId, decisionId: decision.id, vertical: chosen.vertical });

  if (!gate.ok) return "suppressed";

  if (chosen.action.kind === "send_atom") {
    const [contact] = await db
      .insert(schema.contactRecord)
      .values({
        personId,
        direction: "outbound",
        channel: "push",
        contentAtomId: chosen.action.ref,
        decisionId: decision.id,
        status: "queued",
      })
      .returning();
    if (contact === undefined) throw new Error("contact insert returned no row");
    await publish(db, "contact.sent", {
      personId,
      contactId: contact.id,
      channel: "push",
      contentAtomId: chosen.action.ref,
    });
  }
  return "sent";
}

/**
 * One decision-point tick: for every person with an active enrolment, finds
 * decision points due in the tick window, evaluates rules, arbitrates across
 * programmes, applies consent + burden gates, and records the outcome as an
 * auditable DecisionRecord (plus a contact record when a send goes out).
 * Idempotent per decision point — re-ticking the same window decides nothing.
 */
export async function runDecisionTick(db: Db, options: TickOptions): Promise<TickResult> {
  const ctx: PersonTickContext = {
    now: options.now ?? new Date(),
    burden: options.burden ?? DEFAULT_BURDEN,
    timeZone: options.timeZone ?? "Europe/London",
    windowMinutes: options.windowMinutes ?? 60,
    ruleSet: options.ruleSet,
  };
  const active = await db.select().from(schema.enrolment).where(eq(schema.enrolment.status, "active"));
  const byPerson = new Map<string, EnrolmentRow[]>();
  for (const enrolment of active) {
    const list = byPerson.get(enrolment.personId) ?? [];
    byPerson.set(enrolment.personId, [...list, enrolment]);
  }
  let sent = 0;
  let suppressed = 0;
  for (const [personId, enrolments] of byPerson) {
    const outcome = await tickPerson(db, personId as PersonId, enrolments, ctx);
    if (outcome === "sent") sent += 1;
    if (outcome === "suppressed") suppressed += 1;
  }
  return { people: byPerson.size, sent, suppressed };
}
