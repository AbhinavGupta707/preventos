import type { FastifyInstance } from "fastify";
import { checkConsent, grantConsent, revokeConsent } from "@preventos/consent";
import type { Db } from "@preventos/db";
import type { PersonId } from "@preventos/domain";
import { compact, consentChangeSchema, consentCheckSchema } from "../schemas.js";

export function registerConsentRoutes(app: FastifyInstance, db: Db): void {
  app.post("/consents/grant", async (request, reply) => {
    const input = compact(consentChangeSchema.parse(request.body ?? {}));
    const row = await grantConsent(db, { ...input, personId: request.personId as PersonId });
    return reply.code(201).send({ data: { purpose: row.purpose, action: row.action, occurredAt: row.occurredAt } });
  });

  app.post("/consents/revoke", async (request, reply) => {
    const input = compact(consentChangeSchema.parse(request.body ?? {}));
    const row = await revokeConsent(db, { ...input, personId: request.personId as PersonId });
    return reply.code(201).send({ data: { purpose: row.purpose, action: row.action, occurredAt: row.occurredAt } });
  });

  app.get("/consents/check", async (request, reply) => {
    const scope = compact(consentCheckSchema.parse(request.query ?? {}));
    const granted = await checkConsent(db, request.personId as PersonId, scope);
    return reply.send({ data: { granted } });
  });
}
