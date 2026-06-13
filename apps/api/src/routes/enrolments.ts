import type { FastifyInstance } from "fastify";
import { checkConsent } from "@preventos/consent";
import type { Db } from "@preventos/db";
import { createEnrolment } from "@preventos/db";
import type { PersonId } from "@preventos/domain";
import { publish } from "@preventos/events";
import { enrolSchema } from "../schemas.js";

export function registerEnrolmentRoutes(app: FastifyInstance, db: Db): void {
  app.post("/enrolments", async (request, reply) => {
    const input = enrolSchema.parse(request.body ?? {});
    const personId = request.personId as PersonId;
    if (!(await checkConsent(db, personId, { purpose: "programme_delivery" }))) {
      return reply.code(403).send({ error: "programme_delivery consent required before enrolment" });
    }
    const enrolment = await createEnrolment(db, {
      personId,
      vertical: input.vertical,
      status: "active",
      stage: input.stage,
    });
    await publish(db, "enrolment.started", { personId, enrolmentId: enrolment.id, vertical: input.vertical });
    return reply.code(201).send({
      data: {
        id: enrolment.id,
        vertical: enrolment.vertical,
        status: enrolment.status,
        stage: enrolment.stage,
        enrolledAt: enrolment.enrolledAt,
      },
    });
  });
}
