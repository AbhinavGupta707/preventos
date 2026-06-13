import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Db } from "@preventos/db";
import { createPerson } from "@preventos/db";
import { publish } from "@preventos/events";
import { devSessionSchema } from "../schemas.js";

/** Mints a working session token for a person. Backed by the FakeAuthProvider
 *  in dev; production uses the Clerk adapter and never registers this route. */
export type DevSessionIssuer = (personId: string) => string;

/**
 * DEV ONLY. Registered solely when `buildServer` is given a `devSessions`
 * issuer, which apps/api wires only behind ALLOW_DEV_SESSIONS=true. It is the
 * local stand-in for Clerk sign-up + login: a fresh client calls it once to get
 * a real person + bearer token, then drives the rest of the journey over the
 * normal authed routes. Unauthenticated by design (there is no session yet);
 * because it is unregistered in production, it cannot be reached there.
 */
export function registerDevRoutes(app: FastifyInstance, db: Db, issue: DevSessionIssuer): void {
  app.post("/dev/session", async (request, reply) => {
    const input = devSessionSchema.parse(request.body ?? {});
    const pseudonym = input.pseudonym ?? `dev-${randomUUID()}`;
    const person = await createPerson(db, { pseudonym });
    await publish(db, "person.created", { personId: person.id });
    const token = issue(person.id);
    return reply.code(201).send({ data: { personId: person.id, token } });
  });
}
