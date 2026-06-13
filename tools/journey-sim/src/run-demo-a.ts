import pg from "pg";
import { buildServer } from "@preventos/api";
import { FakeAuthProvider } from "@preventos/auth";
import { createDb, runMigrations } from "@preventos/db";
import { runDemoA, type HttpCall } from "./demo-a.js";

/**
 * Runtime proof for Demo A against a real Postgres and a real listening HTTP
 * server: `DATABASE_URL=... pnpm --filter @preventos/journey-sim demo`.
 * Recreates the scratch database `preventos_demo_a` on every run.
 */
const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const DEMO_DB = "preventos_demo_a";
const DEMO_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${DEMO_DB}`);

const out = (line: string) => process.stdout.write(`${line}\n`);

const admin = new pg.Pool({ connectionString: ADMIN_URL, max: 1 });
await admin.query(`DROP DATABASE IF EXISTS ${DEMO_DB} WITH (FORCE)`);
await admin.query(`CREATE DATABASE ${DEMO_DB}`);
await admin.end();

const handle = createDb(DEMO_URL);
await runMigrations(handle.pool);

const auth = new FakeAuthProvider();
const server = await buildServer({ db: handle.db, auth });
const address = await server.listen({ port: 0, host: "127.0.0.1" });
out(`api listening at ${address}`);

const call: HttpCall = async (method, path, options = {}) => {
  const response = await fetch(`${address}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(options.token !== undefined ? { authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  return { status: response.status, body: (await response.json()) as { data?: Record<string, unknown> } };
};

try {
  const result = await runDemoA({
    call,
    issueSession: (token, personId) => auth.issue(token, { kind: "end_user", personRef: personId }),
    db: handle.db,
    pool: handle.pool,
  });
  for (const step of result.steps) out(`✓ ${step}`);
  out(`DEMO A PASS — contact ${result.contactId} audited by decision ${result.decisionId}`);
} finally {
  await server.close();
  await handle.pool.end();
}
