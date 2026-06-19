import type { FastifyInstance } from "fastify";
import { checkConsent } from "@preventos/consent";
import type { Db } from "@preventos/db";
import { schema } from "@preventos/db";
import type { PersonId } from "@preventos/domain";
import { publish } from "@preventos/events";
import { pushTokenSchema } from "../schemas.js";

export function registerPushRoutes(app: FastifyInstance, db: Db): void {
  app.post("/push/tokens", async (request, reply) => {
    const input = pushTokenSchema.parse(request.body ?? {});
    const personId = request.personId as PersonId;

    if (!(await checkConsent(db, personId, { purpose: "proactive_contact" }))) {
      return reply.code(403).send({ error: "proactive_contact consent required" });
    }

    const [token] = await db
      .insert(schema.pushToken)
      .values({ personId, token: input.token, platform: input.platform, status: "active" })
      .onConflictDoUpdate({
        target: [schema.pushToken.personId, schema.pushToken.token],
        set: { platform: input.platform, status: "active", updatedAt: new Date() },
      })
      .returning();
    if (token === undefined) throw new Error("push token insert returned no row");

    await publish(db, "push.token_registered", {
      personId,
      tokenId: token.id,
      platform: input.platform,
    });

    return reply.code(201).send({
      data: {
        id: token.id,
        platform: token.platform,
        status: token.status,
        updatedAt: token.updatedAt.toISOString(),
      },
    });
  });
}
