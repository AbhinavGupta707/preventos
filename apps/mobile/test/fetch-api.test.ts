import { describe, expect, it } from "vitest";
import type { FetchLike, HttpRequestInit } from "@preventos/api-client";
import { FetchApi } from "../src/api/fetch";

interface Call {
  readonly method: string;
  readonly path: string;
}

/** Fake fetch that records (method, path) and replies per route. `enrolStatus`
 *  lets a test force a 409 on enrolment. */
function harness(enrolStatus = 201): { fetch: FetchLike; calls: Call[] } {
  const calls: Call[] = [];
  const fetch: FetchLike = (url, init?: HttpRequestInit) => {
    const path = url.replace("http://api", "");
    const method = init?.method ?? "GET";
    calls.push({ method, path });
    const route = (status: number, body: unknown) =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
      });
    if (path === "/dev/session") return route(201, { data: { personId: "p1", token: "t1" } });
    if (path === "/enrolments") return route(enrolStatus, enrolStatus === 201 ? { data: { id: "e1" } } : { error: "conflicts with existing state" });
    if (path.startsWith("/consents")) return route(201, { data: { purpose: "x", action: "granted" } });
    if (path === "/plans") return route(201, { data: { id: "pl1", version: 1 } });
    if (path === "/logs/craving") return route(201, { data: { id: "c1", occurredAt: "now" } });
    return route(404, { error: "not found" });
  };
  return { fetch, calls };
}

describe("FetchApi adapter", () => {
  it("enrolJourney drives session → consents → enrolment → quit plan in order", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch });
    const res = await api.enrolJourney({ vertical: "smoking", quitDate: "2026-06-20", stage: "ready" });
    expect(res.ok).toBe(true);
    expect(calls).toEqual([
      { method: "POST", path: "/dev/session" },
      { method: "POST", path: "/consents/grant" },
      { method: "POST", path: "/consents/grant" },
      { method: "POST", path: "/enrolments" },
      { method: "POST", path: "/plans" },
    ]);
  });

  it("treats a 409 on enrolment as success (idempotent re-intake)", async () => {
    const { fetch } = harness(409);
    const api = new FetchApi({ baseUrl: "http://api", fetch });
    const res = await api.enrolJourney({ vertical: "smoking", quitDate: "2026-06-20" });
    expect(res.ok).toBe(true);
  });

  it("caches the session — a second call does not re-create a dev session", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch });
    await api.ensureSession();
    await api.logCraving();
    expect(calls.filter((c) => c.path === "/dev/session")).toHaveLength(1);
    expect(calls.at(-1)).toEqual({ method: "POST", path: "/logs/craving" });
  });

  it("falls back to preview (no throw) for endpoints that don't exist yet", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch });
    const tokens: string[] = [];
    const coach = await api.streamCoachReply("hi", (t) => tokens.push(t));
    expect(coach.ok).toBe(true);
    expect(tokens.join("")).not.toHaveLength(0);
    expect(calls).toHaveLength(0); // never hit the network
  });
});
