import type { FastifyInstance } from "fastify";
import type { Db } from "@preventos/db";
import { recordFunnelEvent, recordWaitlistSignup } from "@preventos/db";
import { funnelEventSchema, waitlistSignupSchema } from "../schemas.js";

/**
 * Public marketing endpoints (WP8.2). Unauthenticated by design — a waitlist
 * signup happens before any account exists — but rate-limited by the global
 * limiter and gated by the authoritative allow-list schemas (the privacy
 * control). Data lands in the isolated `marketing` schema, never the clinical
 * core. The web `.data/*.ndjson` sinks forward here when PREVENTOS_API_URL is
 * configured (offline NDJSON remains the dev fallback).
 */
export function registerMarketingRoutes(app: FastifyInstance, db: Db): void {
  app.post("/marketing/waitlist", async (request, reply) => {
    const input = waitlistSignupSchema.parse(request.body ?? {});
    await recordWaitlistSignup(db, { email: input.email, programme: input.programme });
    return reply.code(201).send({ data: { ok: true } });
  });

  app.post("/marketing/events", async (request, reply) => {
    const input = funnelEventSchema.parse(request.body ?? {});
    await recordFunnelEvent(db, { name: input.name, path: input.path, properties: input.properties });
    return reply.code(201).send({ data: { ok: true } });
  });
}
