import { and, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Db } from "@preventos/db";
import { schema } from "@preventos/db";
import type { PersonId } from "@preventos/domain";
import { publish } from "@preventos/events";
import { planCreateSchema, planIdSchema, planUpdateSchema } from "../schemas.js";

const view = (row: typeof schema.planObject.$inferSelect) => ({
  id: row.id,
  vertical: row.vertical,
  type: row.type,
  slots: row.slots,
  version: row.version,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export function registerPlanRoutes(app: FastifyInstance, db: Db): void {
  app.post("/plans", async (request, reply) => {
    const input = planCreateSchema.parse(request.body ?? {});
    const personId = request.personId as PersonId;
    const [plan] = await db
      .insert(schema.planObject)
      .values({ personId, vertical: input.vertical, type: input.type, slots: input.slots })
      .returning();
    if (plan === undefined) throw new Error("plan insert returned no row");
    await publish(db, "plan.updated", { personId, planId: plan.id, version: plan.version });
    return reply.code(201).send({ data: view(plan) });
  });

  app.get("/plans", async (request, reply) => {
    const rows = await db
      .select()
      .from(schema.planObject)
      .where(eq(schema.planObject.personId, request.personId));
    return reply.send({ data: rows.map(view) });
  });

  app.get("/plans/:id", async (request, reply) => {
    const params = planIdSchema.parse(request.params);
    const [plan] = await db
      .select()
      .from(schema.planObject)
      .where(and(eq(schema.planObject.id, params.id), eq(schema.planObject.personId, request.personId)));
    if (plan === undefined) return reply.code(404).send({ error: "plan not found" });
    return reply.send({ data: view(plan) });
  });

  app.put("/plans/:id", async (request, reply) => {
    const params = planIdSchema.parse(request.params);
    const input = planUpdateSchema.parse(request.body ?? {});
    const personId = request.personId as PersonId;
    const [plan] = await db
      .update(schema.planObject)
      .set({ slots: input.slots, version: sql`${schema.planObject.version} + 1`, updatedAt: new Date() })
      .where(and(eq(schema.planObject.id, params.id), eq(schema.planObject.personId, personId)))
      .returning();
    if (plan === undefined) return reply.code(404).send({ error: "plan not found" });
    await publish(db, "plan.updated", { personId, planId: plan.id, version: plan.version });
    return reply.send({ data: view(plan) });
  });

  // Deletion is not evented: the catalogue has no plan.deleted type and the
  // events catalogue is spine-owned (separate work package to extend it).
  app.delete("/plans/:id", async (request, reply) => {
    const params = planIdSchema.parse(request.params);
    const [deleted] = await db
      .delete(schema.planObject)
      .where(and(eq(schema.planObject.id, params.id), eq(schema.planObject.personId, request.personId)))
      .returning({ id: schema.planObject.id });
    if (deleted === undefined) return reply.code(404).send({ error: "plan not found" });
    return reply.code(204).send();
  });
}
