import type { FastifyInstance } from "fastify";
import { runCoachTurn } from "@preventos/coach";
import type { CoachLogSink } from "@preventos/coach";
import { checkConsent } from "@preventos/consent";
import type { Db } from "@preventos/db";
import { schema } from "@preventos/db";
import type { PersonId } from "@preventos/domain";
import { publish } from "@preventos/events";
import { openCase } from "@preventos/safety";
import type { CoachConfig } from "../coach-deps.js";
import { coachMessageSchema, compact } from "../schemas.js";

/**
 * The coach proxy endpoint (plan §4.1: "Fastify: domain APIs, coach proxy").
 * The single HTTP entry to the LLM. Consent-gated; every turn goes through the
 * `@preventos/coach` policy pipeline (deterministic pre-filter → LLM →
 * post-filter, 100% logged). The db-backed pieces live here: the inbound
 * contact + its event (the escalation trigger), the coach_interaction log sink,
 * and opening the human escalation case on a crisis bypass.
 */
export function registerCoachRoutes(app: FastifyInstance, db: Db, coach: CoachConfig): void {
  app.post("/coach/messages", async (request, reply) => {
    const input = compact(coachMessageSchema.parse(request.body ?? {}));
    const personId = request.personId as PersonId;
    if (!(await checkConsent(db, personId, { purpose: "programme_delivery" }))) {
      return reply.code(403).send({ error: "programme_delivery consent required" });
    }

    // The inbound coach message is an inbound contact; its event is the trigger
    // a crisis escalation hangs off (mirrors /logs/craving + screenInboundText).
    const [contact] = await db
      .insert(schema.contactRecord)
      .values({ personId, direction: "inbound", channel: input.channel, status: "logged" })
      .returning();
    if (contact === undefined) throw new Error("coach contact insert returned no row");
    const published = await publish(db, "contact.received", {
      personId,
      contactId: contact.id,
      channel: input.channel,
    });

    // 100% logging sink → core.coach_interaction (awaited inside runCoachTurn).
    const logSink: CoachLogSink = {
      record: async (entry) => {
        await db.insert(schema.coachInteraction).values({
          personId,
          vertical: entry.vertical,
          frame: entry.frame,
          inboundText: entry.inboundText,
          preTier: entry.preTier,
          disposition: entry.disposition,
          postViolations: [...entry.postViolations],
          latencyMs: entry.latencyMs,
          ...(entry.preRiskClass !== undefined ? { preRiskClass: entry.preRiskClass } : {}),
          ...(entry.llmProvider !== undefined ? { llmProvider: entry.llmProvider } : {}),
          ...(entry.llmModel !== undefined ? { llmModel: entry.llmModel } : {}),
          ...(entry.llmRawText !== undefined ? { llmRawText: entry.llmRawText } : {}),
          ...(entry.finalText !== undefined ? { finalText: entry.finalText } : {}),
          ...(entry.crisisFlowId !== undefined ? { crisisFlowId: entry.crisisFlowId } : {}),
        });
      },
    };

    const turn = await runCoachTurn(
      {
        text: input.text,
        vertical: input.vertical,
        frame: input.frame,
        context: input.context ? compact(input.context) : {},
      },
      { provider: coach.provider, claimsFences: coach.claimsFences, logSink },
    );

    if (turn.disposition === "crisis_bypass" && turn.reply.kind === "crisis") {
      const tier = turn.preAssessment.tier;
      // Open the human escalation case (db side of the bypass — the LLM was
      // already provably skipped inside runCoachTurn).
      if (tier === 1 || tier === 2) {
        await openCase(db, {
          personId,
          riskClass: turn.preAssessment.riskClass ?? "self_harm",
          tier,
          triggerEventId: published.eventId,
        });
      }
      return reply.code(200).send({
        data: {
          disposition: turn.disposition,
          crisis: {
            flowId: turn.reply.flow.flowId,
            steps: turn.reply.flow.steps,
            resources: turn.reply.flow.resources,
          },
        },
      });
    }

    const message = turn.reply.kind === "message" ? turn.reply.text : "";
    return reply.code(200).send({ data: { disposition: turn.disposition, message } });
  });
}
