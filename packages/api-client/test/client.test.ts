import { describe, expect, it } from "vitest";
import { ApiClient } from "../src/client.js";
import type { FetchLike, HttpRequestInit } from "../src/types.js";

interface Recorded {
  url: string;
  init?: HttpRequestInit;
}

/** Builds a fake fetch that records calls and replays a scripted response. */
function fakeFetch(
  reply: (url: string, init?: HttpRequestInit) => { status: number; body?: unknown },
): { fetch: FetchLike; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const fetch: FetchLike = (url, init) => {
    calls.push({ url, ...(init !== undefined ? { init } : {}) });
    const { status, body } = reply(url, init);
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => (body === undefined ? Promise.reject(new Error("no body")) : Promise.resolve(body)),
      text: () => Promise.resolve(JSON.stringify(body ?? "")),
    });
  };
  return { fetch, calls };
}

describe("ApiClient", () => {
  it("unwraps the data envelope on success", async () => {
    const { fetch } = fakeFetch(() => ({ status: 201, body: { data: { personId: "p1", pseudonym: "x" } } }));
    const client = new ApiClient({ baseUrl: "http://api", fetch });
    const res = await client.signUp({ pseudonym: "x" });
    expect(res).toEqual({ ok: true, value: { personId: "p1", pseudonym: "x" } });
  });

  it("maps a non-2xx response to err with the server error message", async () => {
    const { fetch } = fakeFetch(() => ({ status: 403, body: { error: "consent required" } }));
    const client = new ApiClient({ baseUrl: "http://api", fetch, getToken: () => "t" });
    const res = await client.enrol({ vertical: "smoking" });
    expect(res).toEqual({ ok: false, error: { status: 403, message: "consent required" } });
  });

  it("attaches a bearer token on authed routes and refuses without one", async () => {
    const withToken = fakeFetch(() => ({ status: 201, body: { data: {} } }));
    const client = new ApiClient({ baseUrl: "http://api/", fetch: withToken.fetch, getToken: () => "abc" });
    await client.grantConsent({ purpose: "programme_delivery" });
    expect(withToken.calls[0]?.init?.headers?.["authorization"]).toBe("Bearer abc");

    const noToken = fakeFetch(() => ({ status: 201, body: { data: {} } }));
    const anon = new ApiClient({ baseUrl: "http://api", fetch: noToken.fetch });
    const res = await anon.grantConsent({ purpose: "programme_delivery" });
    expect(res.ok).toBe(false);
    expect(noToken.calls).toHaveLength(0); // never hits the network without a token
  });

  it("builds a query string for consent checks and reads the granted flag", async () => {
    const { fetch, calls } = fakeFetch(() => ({ status: 200, body: { data: { granted: true } } }));
    const client = new ApiClient({ baseUrl: "http://api", fetch, getToken: () => "t" });
    const res = await client.checkConsent({ purpose: "proactive_contact" });
    expect(res).toEqual({ ok: true, value: true });
    expect(calls[0]?.url).toBe("http://api/consents/check?purpose=proactive_contact");
  });

  it("returns the sibling safety field alongside the drink-log data", async () => {
    const { fetch } = fakeFetch(() => ({
      status: 201,
      body: { data: { id: "d1", date: "2026-06-13", units: 2 }, safety: { tier: 1, crisis: true, caseId: "c1" } },
    }));
    const client = new ApiClient({ baseUrl: "http://api", fetch, getToken: () => "t" });
    const res = await client.logDrink({ date: "2026-06-13", units: 2, context: "rough day" });
    expect(res.ok && res.value.safety).toEqual({ tier: 1, crisis: true, caseId: "c1" });
  });

  it("creates a Nightshift sleep window through the shared contract", async () => {
    const { fetch, calls } = fakeFetch(() => ({
      status: 201,
      body: {
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
      },
    }));
    const client = new ApiClient({ baseUrl: "http://api", fetch, getToken: () => "t" });
    const res = await client.createSleepWindow({ desiredRiseTime: "07:00", effectiveFrom: "2026-06-08" });
    expect(res).toEqual({
      ok: true,
      value: {
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
    expect(calls[0]?.url).toBe("http://api/sleep/windows");
  });

  it("surfaces a transport failure as status 0", async () => {
    const fetch: FetchLike = () => Promise.reject(new Error("offline"));
    const client = new ApiClient({ baseUrl: "http://api", fetch });
    const res = await client.health();
    expect(res).toEqual({ ok: false, error: { status: 0, message: "offline" } });
  });
});
