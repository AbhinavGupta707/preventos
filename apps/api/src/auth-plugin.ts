import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthPort } from "@preventos/auth";

declare module "fastify" {
  interface FastifyRequest {
    /** Pseudonymous person id of the authenticated end user. Set by the auth hook. */
    personId: string;
  }
}

/**
 * Bearer-token guard for person-scoped routes. Resolves the session through
 * the provider-agnostic auth port (FakeAuthProvider in dev/test; the Clerk
 * adapter slots in once owner-created API keys exist). Staff sessions are
 * rejected here — staff act through the console surface, never through
 * person-scoped APIs.
 */
export function makeAuthenticate(auth: AuthPort) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = request.headers.authorization;
    if (header === undefined || !header.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "missing bearer token" });
    }
    const verified = await auth.verifySession(header.slice("Bearer ".length));
    if (!verified.ok) {
      return reply.code(401).send({ error: "invalid session" });
    }
    if (verified.value.kind !== "end_user") {
      return reply.code(403).send({ error: "person-scoped route requires an end-user session" });
    }
    request.personId = verified.value.personRef;
  };
}
