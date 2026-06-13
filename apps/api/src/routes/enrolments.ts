import type { FastifyInstance } from "fastify";
import { checkConsent } from "@preventos/consent";
import type { Db, EnrolmentAssessment } from "@preventos/db";
import { createEnrolment } from "@preventos/db";
import { deriveAlcoholFlags } from "@preventos/decisions";
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
    // AUDIT-C at alcohol intake → persist the assessment + derived safety flags.
    // The flag decision is recorded at intake time (auditable) and is what the
    // worker reads to enforce the dependence hard-stop (invariant 4 / E17).
    const assessment: EnrolmentAssessment | undefined =
      input.vertical === "alcohol" && input.auditC !== undefined
        ? { instrument: "audit-c", score: input.auditC, flags: [...deriveAlcoholFlags(input.auditC)] }
        : undefined;
    const enrolment = await createEnrolment(db, {
      personId,
      vertical: input.vertical,
      status: "active",
      stage: input.stage,
      ...(assessment !== undefined ? { assessment } : {}),
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
