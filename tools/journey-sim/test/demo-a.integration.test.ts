import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InjectOptions } from "fastify";
import { buildServer } from "@preventos/api";
import { FakeAuthProvider } from "@preventos/auth";
import { createDb, runMigrations, resetTestDatabase } from "@preventos/db";
import { runDemoA, type HttpCall } from "../src/demo-a.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_journey";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;
let auth: FakeAuthProvider;
let server: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  auth = new FakeAuthProvider();
  server = await buildServer({ db: handle.db, auth, rateLimit: { max: 1000, timeWindowMs: 60_000 } });
});

afterAll(async () => {
  await server.close();
  await handle.pool.end();
});

describe("Demo A — enrol → tick → one arbitrated, budget-respecting contact", () => {
  it("runs end to end through the public API and worker", async () => {
    const call: HttpCall = async (method, path, options = {}) => {
      const injectOptions = {
        method,
        url: path,
        ...(options.body !== undefined ? { payload: options.body as Record<string, unknown> } : {}),
        ...(options.token !== undefined ? { headers: { authorization: `Bearer ${options.token}` } } : {}),
      } as InjectOptions;
      const response = await server.inject(injectOptions);
      return { status: response.statusCode, body: response.json() };
    };

    const result = await runDemoA({
      call,
      issueSession: (token, personId) => auth.issue(token, { kind: "end_user", personRef: personId }),
      db: handle.db,
      pool: handle.pool,
    });

    expect(result.candidateCount).toBeGreaterThanOrEqual(1);
    expect(result.suppressedReasons).toContain("daily budget exhausted");
    expect(result.outboxDispatched).toBeGreaterThanOrEqual(6);
    expect(result.steps.length).toBe(8);
  });
});
