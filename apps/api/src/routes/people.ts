import type { FastifyInstance } from "fastify";
import type { Db } from "@preventos/db";
import { createPerson } from "@preventos/db";
import { publish } from "@preventos/events";
import { compact, signUpSchema } from "../schemas.js";

/** Public sign-up: creates the pseudonymous person core. Identity attachment
 *  (Clerk user id, phone, email) arrives via the auth provider, not here. */
export function registerPeopleRoutes(app: FastifyInstance, db: Db): void {
  app.post("/people", async (request, reply) => {
    const input = compact(signUpSchema.parse(request.body ?? {}));
    const person = await createPerson(db, input);
    await publish(db, "person.created", { personId: person.id });
    return reply.code(201).send({ data: { personId: person.id, pseudonym: person.pseudonym } });
  });
}
