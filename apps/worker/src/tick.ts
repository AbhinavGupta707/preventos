import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { checkConsent } from "@preventos/consent";
import { isContraindicated, type ResolvedAtom } from "@preventos/content";
import { appendDecision, schema, type Db } from "@preventos/db";
import {
  arbitrate,
  canSendProactive,
  decisionPoints,
  DEFAULT_BURDEN,
  deriveAlcoholFlags,
  evaluateRules,
  mandatoryCandidate,
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
  /**
   * Resolves a content atom id to its resolved atom, for the invariant-4
   * contraindication gate. `main.ts` supplies a catalog-backed resolver and fails
   * closed at boot if the catalog is missing. Absent here, unknown atoms are
   * treated as non-contraindicated — a dependence-flagged person is still
   * protected by the unbypassable hard-stop that preempts before any send.
   */
  readonly atomFor?: (atomId: string) => ResolvedAtom | undefined;
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
  readonly atomFor: (atomId: string) => ResolvedAtom | undefined;
}

/**
 * Invariant-4 contraindication gate: an atom is blocked when it resolves to a
 * content atom contraindicated for one of the person's assessment flags. Unknown
 * atoms (e.g. placeholder anchor refs absent from the catalog) are not known
 * moderation content, so they pass — a dependence-flagged person is routed away
 * from them by the unbypassable hard-stop before such an atom is ever chosen.
 */
function atomBlockedForFlags(
  atomFor: (atomId: string) => ResolvedAtom | undefined,
  atomId: string,
  flags: readonly string[],
): boolean {
  if (flags.length === 0) return false;
  const atom = atomFor(atomId);
  return atom !== undefined && isContraindicated(atom, flags);
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

  // Assessment flags + AUDIT-C score drive the alcohol dependence hard-stop
  // (invariant 4). Stored flags are authoritative; the score is re-derived too so
  // a flagged person stays protected even if a row predates flag persistence.
  const assessmentFlags = new Set<string>();
  let auditScore: number | undefined;
  for (const enrolment of enrolments) {
    const assessment = enrolment.assessment;
    if (assessment === null) continue;
    for (const flag of assessment.flags) assessmentFlags.add(flag);
    if (enrolment.vertical === "alcohol") {
      auditScore = assessment.score;
      for (const flag of deriveAlcoholFlags(assessment.score)) assessmentFlags.add(flag);
    }
  }
  const personFlags = [...assessmentFlags];

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
      flags: personFlags,
      ...(auditScore !== undefined ? { auditScore } : {}),
    });
    policyVersion = evaluation.policyVersion;
    for (const candidate of evaluation.candidates) {
      if (enrolledVerticals.has(candidate.vertical)) candidateById.set(candidate.ruleId, candidate);
    }
  }
  const candidates = [...candidateById.values()];
  if (candidates.length === 0) return "idle";

  // Safety preemption (invariant 4 / E17): an unbypassable hard-stop candidate is
  // delivered ahead of arbitration AND the burden governor — a scripted referral
  // is core programme delivery, not a discretionary nudge, and a priority-100 rule
  // can otherwise still lose arbitration to a never-served sibling's starvation
  // boost. So an AUDIT-C-flagged person is always routed to the referral.
  const mandatory = mandatoryCandidate(candidates);
  const chosen = mandatory ?? arbitrate(candidates, arbitrationStateFrom(recentDecisions));
  if (chosen === undefined) return "idle";

  let chosenAction: Readonly<Record<string, unknown>>;
  let send: boolean;
  let sentTodayCount = 0;

  if (mandatory !== undefined) {
    chosenAction = { kind: chosen.action.kind, ref: chosen.action.ref, ruleId: chosen.ruleId, unbypassable: true };
    send = true;
  } else if (chosen.action.kind === "send_atom" && atomBlockedForFlags(ctx.atomFor, chosen.action.ref, personFlags)) {
    // Defense in depth: a moderation atom contraindicated for a dependence-flagged
    // person is never delivered, regardless of burden or consent.
    chosenAction = { kind: "suppressed", reason: "contraindicated", candidateRuleId: chosen.ruleId, flags: personFlags };
    send = false;
  } else {
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
    sentTodayCount = sentToday.length;

    const consented = await checkConsent(db, personId, { purpose: "proactive_contact" });
    const gate = consented
      ? canSendProactive(sentToday, ctx.now, local.time, ctx.burden)
      : ({ ok: false, error: "consent not granted" } as const);
    chosenAction = gate.ok
      ? { kind: chosen.action.kind, ref: chosen.action.ref, ruleId: chosen.ruleId }
      : { kind: "suppressed", reason: gate.error, candidateRuleId: chosen.ruleId };
    send = gate.ok;
  }

  const decision = await appendDecision(db, {
    personId,
    vertical: chosen.vertical,
    stateSnapshot: {
      pointKeys: due.map(({ point }) => pointKey(point)),
      localTime: local.stamp,
      windowMinutes: ctx.windowMinutes,
      sentTodayCount,
    },
    candidates: candidates as unknown as Readonly<Record<string, unknown>>[],
    policyVersion,
    chosenAction,
    randomisationProbability: 1,
  });
  await publish(db, "decision.made", { personId, decisionId: decision.id, vertical: chosen.vertical });

  if (!send) return "suppressed";

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
    atomFor: options.atomFor ?? (() => undefined),
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
