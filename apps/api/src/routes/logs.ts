import type { FastifyInstance, FastifyReply } from "fastify";
import { checkConsent } from "@preventos/consent";
import type { Db } from "@preventos/db";
import { schema } from "@preventos/db";
import type { PersonId } from "@preventos/domain";
import { publish } from "@preventos/events";
import { compact, cravingLogSchema, drinkLogSchema, sleepDiarySchema } from "../schemas.js";
import { screenInboundText } from "../safety-screen.js";

async function requireProgrammeDelivery(db: Db, personId: PersonId, reply: FastifyReply): Promise<boolean> {
  if (await checkConsent(db, personId, { purpose: "programme_delivery" })) return true;
  await reply.code(403).send({ error: "programme_delivery consent required" });
  return false;
}

export function registerLogRoutes(app: FastifyInstance, db: Db): void {
  app.post("/logs/drink", async (request, reply) => {
    const input = compact(drinkLogSchema.parse(request.body ?? {}));
    const personId = request.personId as PersonId;
    if (!(await requireProgrammeDelivery(db, personId, reply))) return reply;
    const [entry] = await db
      .insert(schema.drinkLogEntry)
      .values({
        personId,
        date: input.date,
        units: String(input.units),
        ...(input.drinkType !== undefined ? { drinkType: input.drinkType } : {}),
        ...(input.context !== undefined ? { context: input.context } : {}),
      })
      .returning();
    if (entry === undefined) throw new Error("drink log insert returned no row");
    const logged = await publish(db, "drink.logged", { personId, entryId: entry.id, date: input.date });
    // Safety invariant 1: any free text the user submitted is classified before
    // we respond; a tier-1/2 hit opens a human escalation case off this event.
    const safety = await screenInboundText(db, personId, input.context, logged.eventId);
    return reply
      .code(201)
      .send({ data: { id: entry.id, date: entry.date, units: Number(entry.units) }, safety });
  });

  app.post("/logs/sleep-diary", async (request, reply) => {
    const input = compact(sleepDiarySchema.parse(request.body ?? {}));
    const personId = request.personId as PersonId;
    if (!(await requireProgrammeDelivery(db, personId, reply))) return reply;
    const [entry] = await db
      .insert(schema.sleepDiaryEntry)
      .values({
        personId,
        date: input.date,
        bedTime: input.bedTime,
        sleepOnsetLatencyMin: input.sleepOnsetLatencyMin,
        wasoMin: input.wasoMin,
        finalWakeTime: input.finalWakeTime,
        riseTime: input.riseTime,
        ...(input.wakeCount !== undefined ? { wakeCount: input.wakeCount } : {}),
        ...(input.quality !== undefined ? { quality: input.quality } : {}),
      })
      .returning();
    if (entry === undefined) throw new Error("sleep diary insert returned no row");
    await publish(db, "sleep.diary.logged", { personId, entryId: entry.id, date: input.date });
    return reply.code(201).send({ data: { id: entry.id, date: entry.date } });
  });

  /** A rescue-button press is a user-initiated inbound contact; richer craving
   *  detail (intensity, trigger) lands with the BFO/trigger-log schema (WS2). */
  app.post("/logs/craving", async (request, reply) => {
    const input = cravingLogSchema.parse(request.body ?? {});
    const personId = request.personId as PersonId;
    if (!(await requireProgrammeDelivery(db, personId, reply))) return reply;
    const [contact] = await db
      .insert(schema.contactRecord)
      .values({ personId, direction: "inbound", channel: input.channel, status: "logged" })
      .returning();
    if (contact === undefined) throw new Error("contact insert returned no row");
    await publish(db, "contact.received", { personId, contactId: contact.id, channel: input.channel });
    return reply.code(201).send({ data: { id: contact.id, occurredAt: contact.occurredAt } });
  });
}
