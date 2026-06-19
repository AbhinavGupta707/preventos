import { createDb } from "@preventos/db";
import { buildAuthFromEnv } from "./auth-env.js";
import { buildServer } from "./server.js";

/**
 * Boot entry: `pnpm --filter @preventos/api dev`. Auth provider selection is
 * env-driven: Clerk by default; fake only when explicitly selected for local
 * development or dev sessions.
 */
const DATABASE_URL = process.env["DATABASE_URL"];
if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");

const authRuntime = buildAuthFromEnv(process.env);
const { db, pool } = createDb(DATABASE_URL);
const server = await buildServer({
  db,
  pool,
  auth: authRuntime.auth,
  logger: true,
  ...(authRuntime.devSessions !== undefined ? { devSessions: authRuntime.devSessions } : {}),
});
await server.listen({ port: Number(process.env["PORT"] ?? 3001), host: process.env["HOST"] ?? "0.0.0.0" });
