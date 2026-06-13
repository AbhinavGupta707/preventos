import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { AuthPort } from "@preventos/auth";
import type { Db } from "@preventos/db";
import { makeAuthenticate } from "./auth-plugin.js";
import { registerConsentRoutes } from "./routes/consents.js";
import { registerDevRoutes, type DevSessionIssuer } from "./routes/dev.js";
import { registerEnrolmentRoutes } from "./routes/enrolments.js";
import { registerLogRoutes } from "./routes/logs.js";
import { registerPeopleRoutes } from "./routes/people.js";
import { registerPlanRoutes } from "./routes/plans.js";

export interface ServerDeps {
  readonly db: Db;
  readonly auth: AuthPort;
  readonly rateLimit?: { readonly max: number; readonly timeWindowMs: number };
  readonly logger?: boolean;
  /** DEV ONLY. When set, registers POST /dev/session. Unset in production. */
  readonly devSessions?: DevSessionIssuer;
}

/** Walks the cause chain for a Postgres error code (drizzle wraps pg errors). */
function pgCode(error: unknown): string | undefined {
  let current: unknown = error;
  while (current instanceof Error) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^\d\d[0-9A-Z]{3}$/.test(code)) return code;
    current = current.cause;
  }
  return undefined;
}

export async function buildServer(deps: ServerDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: deps.logger ?? false });
  app.decorateRequest("personId", "");

  await app.register(rateLimit, {
    max: deps.rateLimit?.max ?? 120,
    timeWindow: deps.rateLimit?.timeWindowMs ?? 60_000,
  });

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "invalid input",
        details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }
    const code = pgCode(error);
    if (code === "23505" || code === "23P01") {
      return reply.code(409).send({ error: "conflicts with existing state" });
    }
    const statusCode = error instanceof Error ? (error as { statusCode?: unknown }).statusCode : undefined;
    if (typeof statusCode === "number" && statusCode < 500) {
      return reply.code(statusCode).send({ error: error instanceof Error ? error.message : "request failed" });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "internal error" });
  });

  app.get("/health", () => ({ data: { status: "ok" } }));
  registerPeopleRoutes(app, deps.db);
  if (deps.devSessions !== undefined) registerDevRoutes(app, deps.db, deps.devSessions);

  await app.register((scope) => {
    scope.addHook("preHandler", makeAuthenticate(deps.auth));
    registerConsentRoutes(scope, deps.db);
    registerEnrolmentRoutes(scope, deps.db);
    registerLogRoutes(scope, deps.db);
    registerPlanRoutes(scope, deps.db);
  });

  return app;
}
