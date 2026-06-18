import { describe, expect, it } from "vitest";
import type { FetchLike, HttpRequestInit } from "@preventos/api-client";
import { FetchApi } from "../src/api/fetch";

interface Call {
  readonly method: string;
  readonly path: string;
  readonly body?: Record<string, unknown>;
}

/** Fake fetch that records (method, path) and replies per route. `enrolStatus`
 *  lets a test force a 409 on enrolment. */
function harness(enrolStatus = 201): { fetch: FetchLike; calls: Call[] } {
  const calls: Call[] = [];
  const fetch: FetchLike = (url, init?: HttpRequestInit) => {
    const path = url.replace("http://api", "");
    const method = init?.method ?? "GET";
    calls.push({
      method,
      path,
      ...(init?.body !== undefined ? { body: JSON.parse(init.body) as Record<string, unknown> } : {}),
    });
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
    if (path === "/logs/sleep-diary") return route(201, { data: { id: "s1", date: "2026-06-18" } });
    if (path === "/me/export") return route(200, { data: { person: { id: "p1" }, identity: null } });
    if (path === "/me") return route(204, {});
    if (path === "/sleep/windows") {
      return route(201, {
        data: {
          id: "w1",
          version: 1,
          windowStart: "23:30",
          windowEnd: "07:00",
          durationMin: 450,
          decision: "initial",
          safetyFloorApplied: false,
          signpostRequired: false,
          computedFrom: { rule: "initial_mean_sleep_plus_buffer" },
        },
      });
    }
    return route(404, { error: "not found" });
  };
  return { fetch, calls };
}

describe("FetchApi adapter", () => {
  it("enrolJourney drives session → consents → enrolment → quit plan in order", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch, allowDevSessions: true });
    const res = await api.enrolJourney({ vertical: "smoking", quitDate: "2026-06-20", stage: "ready" });
    expect(res.ok).toBe(true);
    expect(calls.map(({ method, path }) => ({ method, path }))).toEqual([
      { method: "POST", path: "/dev/session" },
      { method: "POST", path: "/consents/grant" },
      { method: "POST", path: "/consents/grant" },
      { method: "POST", path: "/enrolments" },
      { method: "POST", path: "/plans" },
    ]);
  });

  it("treats a 409 on enrolment as success (idempotent re-intake)", async () => {
    const { fetch } = harness(409);
    const api = new FetchApi({ baseUrl: "http://api", fetch, allowDevSessions: true });
    const res = await api.enrolJourney({ vertical: "smoking", quitDate: "2026-06-20" });
    expect(res.ok).toBe(true);
  });

  it("caches the session — a second call does not re-create a dev session", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch, allowDevSessions: true });
    await api.ensureSession();
    await api.logCraving();
    expect(calls.filter((c) => c.path === "/dev/session")).toHaveLength(1);
    expect(calls.at(-1)).toMatchObject({ method: "POST", path: "/logs/craving" });
  });

  it("logs a sleep diary entry through the live API adapter", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch, allowDevSessions: true });
    const res = await api.logSleepDiary({
      date: "2026-06-18",
      bedTime: "23:00",
      sleepOnsetLatencyMin: 20,
      wasoMin: 30,
      finalWakeTime: "06:45",
      riseTime: "07:00",
    });
    expect(res.ok).toBe(true);
    expect(calls.map((c) => c.path)).toEqual(["/dev/session", "/logs/sleep-diary"]);
    expect(calls.at(-1)?.body).toMatchObject({ date: "2026-06-18", riseTime: "07:00" });
  });

  it("requests a Nightshift sleep window through the live API adapter", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch, allowDevSessions: true });
    const res = await api.createSleepWindow({ desiredRiseTime: "07:00", effectiveFrom: "2026-06-18" });
    expect(res.ok && res.value).toMatchObject({ windowStart: "23:30", windowEnd: "07:00", durationMin: 450 });
    expect(calls.map((c) => c.path)).toEqual(["/dev/session", "/sleep/windows"]);
    expect(calls.at(-1)?.body).toEqual({ desiredRiseTime: "07:00", effectiveFrom: "2026-06-18" });
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

  it("uses a Clerk token provider without calling /dev/session", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch, getAuthToken: () => "clerk-jwt" });
    const res = await api.logCraving();
    expect(res.ok).toBe(true);
    expect(calls.map((c) => c.path)).toEqual(["/logs/craving"]);
  });

  it("exports and deletes account data through the live API when authenticated", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch, getAuthToken: () => "clerk-jwt" });

    const exported = await api.exportAccountData();
    const deleted = await api.deleteAccount();

    expect(exported).toEqual({ ok: true, value: { person: { id: "p1" }, identity: null } });
    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(calls.map((c) => c.path)).toEqual(["/me/export", "/me"]);
  });

  it("fails closed without a Clerk token or explicit dev-session allowance", async () => {
    const { fetch, calls } = harness();
    const api = new FetchApi({ baseUrl: "http://api", fetch });
    const res = await api.logCraving();
    expect(res).toEqual({ ok: false, error: "authenticated session required" });
    expect(calls).toHaveLength(0);
  });
});
