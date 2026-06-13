import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FakeAuthProvider } from "@preventos/auth";
import { createDb, resetTestDatabase, runMigrations } from "@preventos/db";
import { funnelEventSchema, waitlistSignupSchema } from "../src/schemas.js";
import { buildServer } from "../src/server.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_api_marketing";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;
let server: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  server = await buildServer({
    db: handle.db,
    auth: new FakeAuthProvider(),
    rateLimit: { max: 1000, timeWindowMs: 60_000 },
  });
});

afterAll(async () => {
  await server.close();
  await handle.pool.end();
});

describe("marketing endpoints (WP8.2) — public, allow-list gated", () => {
  it("POST /marketing/waitlist persists to the isolated marketing schema (no auth)", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/marketing/waitlist",
      payload: { email: "joiner@example.com", programme: "steady" },
    });
    expect(res.statusCode).toBe(201);

    const rows = await handle.pool.query<{ email: string; programme: string }>(
      "SELECT email, programme FROM marketing.waitlist_signup WHERE email = 'joiner@example.com'",
    );
    expect(rows.rows[0]).toEqual({ email: "joiner@example.com", programme: "steady" });
  });

  it("POST /marketing/events persists a coded funnel event", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/marketing/events",
      payload: { name: "savings_calculated", path: "/tools/savings-calculator", properties: { saved: 480 } },
    });
    expect(res.statusCode).toBe(201);

    const rows = await handle.pool.query<{ name: string }>(
      "SELECT name FROM marketing.funnel_event WHERE name = 'savings_calculated'",
    );
    expect(rows.rows).toHaveLength(1);
  });

  it("rejects an unknown event name (allow-list) and a bad email", async () => {
    const badEvent = await server.inject({
      method: "POST",
      url: "/marketing/events",
      payload: { name: "exfiltrate_everything", path: "/" },
    });
    expect(badEvent.statusCode).toBe(400);

    const badEmail = await server.inject({
      method: "POST",
      url: "/marketing/waitlist",
      payload: { email: "not-an-email", programme: "quitkit" },
    });
    expect(badEmail.statusCode).toBe(400);
  });

  it("rejects non-coded property values at the boundary (free text / nested data)", async () => {
    // The privacy control: properties must be short scalars — no nested objects,
    // no oversized free-text dumps, no smuggled identifiers.
    const nested = await server.inject({
      method: "POST",
      url: "/marketing/events",
      payload: { name: "waitlist_joined", path: "/", properties: { profile: { dob: "1990-01-01" } } },
    });
    expect(nested.statusCode).toBe(400);

    const oversized = await server.inject({
      method: "POST",
      url: "/marketing/events",
      payload: { name: "waitlist_joined", path: "/", properties: { note: "x".repeat(300) } },
    });
    expect(oversized.statusCode).toBe(400);
  });
});

describe("marketing schema (the authoritative privacy allow-list)", () => {
  it("waitlist accepts only the programme enum and a valid email", () => {
    expect(waitlistSignupSchema.safeParse({ email: "a@b.com", programme: "nightshift" }).success).toBe(true);
    expect(waitlistSignupSchema.safeParse({ email: "a@b.com" }).success).toBe(true); // defaults to unsure
    expect(waitlistSignupSchema.safeParse({ email: "a@b.com", programme: "diagnosis" }).success).toBe(false);
    expect(waitlistSignupSchema.safeParse({ email: "a@b.com", extra: "x" }).success).toBe(false); // strict
  });

  it("funnel rejects free text, nested values, and too many keys", () => {
    expect(
      funnelEventSchema.safeParse({ name: "waitlist_joined", path: "/", properties: { k: "ok", n: 1 } }).success,
    ).toBe(true);
    expect(
      funnelEventSchema.safeParse({ name: "waitlist_joined", path: "/", properties: { o: { a: 1 } } }).success,
    ).toBe(false);
    expect(
      funnelEventSchema.safeParse({ name: "waitlist_joined", path: "/", properties: { x: "y".repeat(101) } }).success,
    ).toBe(false);
    const many = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, i]));
    expect(funnelEventSchema.safeParse({ name: "waitlist_joined", path: "/", properties: many }).success).toBe(false);
  });
});
