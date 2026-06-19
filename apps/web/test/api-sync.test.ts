import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  apiConfigured,
  deleteAccountInApi,
  exportAccountDataToApi,
  resetApiSessionForTest,
  syncResultPayload,
  syncToApi,
} from "../lib/api";

interface Call {
  method: string;
  path: string;
  body: Record<string, unknown> | undefined;
}

const realFetch = globalThis.fetch;
let calls: Call[] = [];

function stubApi(): void {
  globalThis.fetch = ((url: string, init?: { method?: string; body?: string }) => {
    const path = url.replace("http://api", "");
    calls.push({
      method: init?.method ?? "GET",
      path,
      body: init?.body !== undefined ? (JSON.parse(init.body) as Record<string, unknown>) : undefined,
    });
    const reply = (status: number, body: unknown) =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
      });
    if (path === "/dev/session") return reply(201, { data: { personId: "p1", token: "t1" } });
    if (path === "/plans") return reply(201, { data: { id: "pl1", version: 1 } });
    if (path === "/enrolments") return reply(201, { data: { id: "e1" } });
    if (path.startsWith("/consents")) return reply(201, { data: { purpose: "x", action: "granted" } });
    if (path === "/logs/drink") return reply(201, { data: { id: "d1", date: "2026-06-13", units: 2 }, safety: { tier: 0, crisis: false } });
    if (path === "/logs/sleep-diary") return reply(201, { data: { id: "s1", date: "2026-06-13" } });
    if (path === "/me/export") return reply(200, { data: { person: { id: "p1" }, identity: null } });
    if (path === "/me") return reply(204, undefined);
    if (path === "/sleep/windows") {
      return reply(201, {
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
    return reply(404, { error: "not found" });
  }) as typeof globalThis.fetch;
}

beforeEach(() => {
  calls = [];
  resetApiSessionForTest();
  process.env["PREVENTOS_API_URL"] = "http://api";
  process.env["ALLOW_DEV_SESSIONS"] = "true";
  stubApi();
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env["PREVENTOS_API_URL"];
  delete process.env["ALLOW_DEV_SESSIONS"];
});

describe("web → apps/api sync proxy", () => {
  it("is a no-op (synced:false) when PREVENTOS_API_URL is unset", async () => {
    delete process.env["PREVENTOS_API_URL"];
    expect(apiConfigured()).toBe(false);
    const res = await syncToApi({ action: "drink", date: "2026-06-13", units: 2 });
    expect(res).toEqual({ synced: false });
    expect(calls).toHaveLength(0);
  });

  it("logs a drink: dev session then POST /logs/drink with the safety-screened context", async () => {
    const res = await syncToApi({
      action: "drink",
      date: "2026-06-13",
      units: 2.5,
      label: "Pint of lager",
      context: "after work",
    });
    expect(res.synced).toBe(true);
    expect(calls.map((c) => c.path)).toEqual(["/dev/session", "/logs/drink"]);
    expect(calls[1]?.body).toEqual({
      date: "2026-06-13",
      units: 2.5,
      drinkType: "Pint of lager",
      context: "after work",
    });
  });

  it("uses a provided Clerk bearer token without creating a dev session", async () => {
    const res = await syncToApi({ action: "drink", date: "2026-06-13", units: 2.5 }, "clerk-jwt");
    expect(res.synced).toBe(true);
    expect(calls.map((c) => c.path)).toEqual(["/logs/drink"]);
  });

  it("does not call /dev/session unless explicitly allowed", async () => {
    delete process.env["ALLOW_DEV_SESSIONS"];
    const res = await syncToApi({ action: "drink", date: "2026-06-13", units: 2.5 });
    expect(res).toEqual({ synced: false, error: "Authentication required." });
    expect(calls).toHaveLength(0);
  });

  it("exports and deletes account data with a Clerk bearer token", async () => {
    const exported = await exportAccountDataToApi("clerk-jwt");
    const deleted = await deleteAccountInApi("clerk-jwt");

    expect(exported).toEqual({ ok: true, value: { person: { id: "p1" }, identity: null } });
    expect(deleted).toEqual({ ok: true, value: undefined });
    expect(calls.map((c) => c.path)).toEqual(["/me/export", "/me"]);
  });

  it("keeps account data-rights dev sessions explicitly gated", async () => {
    delete process.env["ALLOW_DEV_SESSIONS"];
    const exported = await exportAccountDataToApi();

    expect(exported).toEqual({ ok: false, error: { status: 401, message: "Authentication required." } });
    expect(calls).toHaveLength(0);
  });

  it("enrols: consent → enrolment → quit plan for a smoking programme with a quit date", async () => {
    const res = await syncToApi({
      action: "enrol",
      programmes: ["quitkit"],
      reminders: true,
      analytics: false,
      quitDate: "2026-06-20",
    });
    expect(res.synced).toBe(true);
    expect(calls.map((c) => c.path)).toEqual([
      "/dev/session",
      "/consents/grant", // programme_delivery
      "/consents/grant", // proactive_contact (reminders on)
      "/enrolments",
      "/plans",
    ]);
    expect(calls[3]?.body).toEqual({ vertical: "smoking" });
    expect(calls[4]?.body).toMatchObject({ vertical: "smoking", type: "quit", slots: { quitDate: "2026-06-20" } });
  });

  it("toggles a consent purpose via grant/revoke", async () => {
    await syncToApi({ action: "consent", key: "analytics", value: true });
    expect(calls.at(-1)?.path).toBe("/consents/grant");
    resetApiSessionForTest();
    calls = [];
    await syncToApi({ action: "consent", key: "reminders", value: false });
    expect(calls.at(-1)?.path).toBe("/consents/revoke");
  });

  it("requests a Nightshift sleep window from the API", async () => {
    const res = await syncToApi({
      action: "sleepWindow",
      desiredRiseTime: "07:00",
      effectiveFrom: "2026-06-18",
      safetySensitiveOccupation: false,
      excessiveDaytimeSleepiness: false,
    });
    expect(res.synced).toBe(true);
    expect(res.sleepWindow).toMatchObject({ windowStart: "23:30", windowEnd: "07:00", durationMin: 450 });
    expect(calls.map((c) => c.path)).toEqual(["/dev/session", "/sleep/windows"]);
    expect(calls[1]?.body).toEqual({
      desiredRiseTime: "07:00",
      effectiveFrom: "2026-06-18",
      safetySensitiveOccupation: false,
      excessiveDaytimeSleepiness: false,
    });
  });

  it("keeps the sleep-window result in the route response payload", () => {
    const payload = syncResultPayload({
      synced: true,
      sleepWindow: {
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
    expect(payload).toMatchObject({ synced: true, sleepWindow: { windowStart: "23:30", windowEnd: "07:00" } });
  });
});
