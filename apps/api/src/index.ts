import { FakeAuthProvider } from "@preventos/auth";
import { createDb } from "@preventos/db";
import { buildServer } from "./server.js";

/**
 * Boot entry: `pnpm --filter @preventos/api dev`. Uses the fake auth provider
 * until the Clerk adapter lands (owner-created API keys pending — see
 * PROGRESS.md WP1.5). DEV_SESSION_TOKEN/DEV_SESSION_PERSON_ID seed one
 * end-user session for local journeys.
 */
const DATABASE_URL = process.env["DATABASE_URL"];
if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");

const auth = new FakeAuthProvider();
const devToken = process.env["DEV_SESSION_TOKEN"];
const devPersonId = process.env["DEV_SESSION_PERSON_ID"];
if (devToken !== undefined && devPersonId !== undefined) {
  auth.issue(devToken, { kind: "end_user", personRef: devPersonId });
}

// DEV ONLY: POST /dev/session (Clerk stand-in) is registered only behind this
// flag. Unset in production, so the route never exists there.
const allowDevSessions = process.env["ALLOW_DEV_SESSIONS"] === "true";
const issueDevSession = (personId: string): string => {
  const token = `dev-${personId}`;
  auth.issue(token, { kind: "end_user", personRef: personId });
  return token;
};

const { db } = createDb(DATABASE_URL);
const server = await buildServer({
  db,
  auth,
  logger: true,
  ...(allowDevSessions ? { devSessions: issueDevSession } : {}),
});
await server.listen({ port: Number(process.env["PORT"] ?? 3001), host: "127.0.0.1" });
