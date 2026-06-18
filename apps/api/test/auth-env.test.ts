import { describe, expect, it } from "vitest";
import { buildAuthFromEnv } from "../src/auth-env.js";

function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { ...overrides };
}

describe("auth env selection", () => {
  it("selects Clerk by default and fails closed when Clerk keys are absent", () => {
    expect(() => buildAuthFromEnv(env({}))).toThrow("CLERK_SECRET_KEY is required for Clerk auth");
  });

  it("requires the publishable key alongside the Clerk secret key", () => {
    expect(() => buildAuthFromEnv(env({ CLERK_SECRET_KEY: "sk_test" }))).toThrow(
      "CLERK_PUBLISHABLE_KEY is required for Clerk auth",
    );
  });

  it("builds Clerk auth from beta/prod env and does not expose dev session issuing", () => {
    const runtime = buildAuthFromEnv(
      env({
        PREVENTOS_AUTH_PROVIDER: "clerk",
        CLERK_SECRET_KEY: "sk_test",
        CLERK_PUBLISHABLE_KEY: "pk_test",
        CLERK_JWT_AUDIENCE: "preventos-api,preventos-console",
        CLERK_AUTHORIZED_PARTIES: "https://app.preventos.example, https://console.preventos.example",
        ALLOW_DEV_SESSIONS: "true",
      }),
    );
    expect(runtime.provider).toBe("clerk");
    expect(runtime.devSessions).toBeUndefined();
  });

  it("selects fake only when explicitly requested and gates /dev/session separately", async () => {
    const seeded = buildAuthFromEnv(
      env({
        PREVENTOS_AUTH_PROVIDER: "fake",
        DEV_SESSION_TOKEN: "dev-token",
        DEV_SESSION_PERSON_ID: "11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(seeded.provider).toBe("fake");
    expect(seeded.devSessions).toBeUndefined();
    await expect(seeded.auth.verifySession("dev-token")).resolves.toMatchObject({ ok: true });

    const withDevRoute = buildAuthFromEnv(env({ ALLOW_DEV_SESSIONS: "true" }));
    expect(withDevRoute.provider).toBe("fake");
    expect(withDevRoute.devSessions).toBeTypeOf("function");
  });

  it("rejects unknown provider names", () => {
    expect(() => buildAuthFromEnv(env({ PREVENTOS_AUTH_PROVIDER: "demo" }))).toThrow(
      "PREVENTOS_AUTH_PROVIDER must be 'fake' or 'clerk'",
    );
  });
});
