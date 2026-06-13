import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FakeAuthProvider } from "@preventos/auth";
import { FakeCoachProvider } from "@preventos/coach";
import type { LlmRequest } from "@preventos/coach";
import { compileClaimsRegister, loadClaimsRegister } from "@preventos/content";
import { createDb, runMigrations, resetTestDatabase } from "@preventos/db";
import { buildServer } from "../src/server.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_coach";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);
const REGISTER = fileURLToPath(new URL("../../../compliance/claims/claims-register.json", import.meta.url));

let handle: ReturnType<typeof createDb>;
let auth: FakeAuthProvider;
let server: Awaited<ReturnType<typeof buildServer>>;
let provider: FakeCoachProvider;

/** Sentinels let one fake provider exercise every disposition by request text. */
function responder(request: LlmRequest): string {
  const last = request.messages[request.messages.length - 1]?.content ?? "";
  if (last.includes("FORCE_ERROR")) throw new Error("forced provider error");
  if (last.includes("MAKE_BAD_CLAIM")) return "Honestly, our app treats insomnia and is clinically proven.";
  return "That's a meaningful step. What feels manageable next?";
}

const asUser = (token: string) => ({ authorization: `Bearer ${token}` });

async function readyUser(pseudonym: string): Promise<{ personId: string; token: string }> {
  const res = await server.inject({ method: "POST", url: "/people", payload: { pseudonym } });
  const personId = res.json().data.personId;
  const token = `t-${pseudonym}`;
  auth.issue(token, { kind: "end_user", personRef: personId });
  await server.inject({
    method: "POST",
    url: "/consents/grant",
    headers: asUser(token),
    payload: { purpose: "programme_delivery" },
  });
  return { personId, token };
}

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  auth = new FakeAuthProvider();
  provider = new FakeCoachProvider(responder);
  const claimsFences = compileClaimsRegister(await loadClaimsRegister(REGISTER));
  server = await buildServer({
    db: handle.db,
    auth,
    rateLimit: { max: 1000, timeWindowMs: 60_000 },
    coach: { provider, claimsFences },
  });
});

afterAll(async () => {
  await server.close();
  await handle.pool.end();
});

describe("POST /coach/messages — policy-enforcement proxy", () => {
  it("401 without a session token", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/coach/messages",
      payload: { vertical: "smoking", frame: "general", text: "hi" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("403 without programme_delivery consent", async () => {
    const created = await server.inject({ method: "POST", url: "/people", payload: { pseudonym: "coach-noconsent" } });
    const personId = created.json().data.personId;
    auth.issue("t-noconsent", { kind: "end_user", personRef: personId });
    const res = await server.inject({
      method: "POST",
      url: "/coach/messages",
      headers: asUser("t-noconsent"),
      payload: { vertical: "smoking", frame: "general", text: "hi" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("tier-0: replies via the LLM, writes the 100% log row + an inbound contact", async () => {
    const { personId, token } = await readyUser("coach-reply");
    const res = await server.inject({
      method: "POST",
      url: "/coach/messages",
      headers: asUser(token),
      payload: { vertical: "smoking", frame: "craving_rescue", text: "craving hit me hard after lunch" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.disposition).toBe("replied");
    expect(res.json().data.message).toContain("manageable");

    const log = await handle.pool.query(
      "SELECT disposition, pre_tier, llm_raw_text, final_text FROM core.coach_interaction WHERE person_id = $1",
      [personId],
    );
    expect(log.rowCount).toBe(1);
    expect(log.rows[0]).toMatchObject({ disposition: "replied", pre_tier: 0 });
    expect(log.rows[0].llm_raw_text).toContain("manageable");

    const contact = await handle.pool.query(
      "SELECT count(*) FROM core.contact_record WHERE person_id = $1 AND direction = 'inbound'",
      [personId],
    );
    expect(contact.rows[0].count).toBe("1");
  });

  it("crisis: BYPASSES the LLM, opens an escalation case, returns the scripted flow", async () => {
    const { personId, token } = await readyUser("coach-crisis");
    const before = provider.calls.length;
    const res = await server.inject({
      method: "POST",
      url: "/coach/messages",
      headers: asUser(token),
      payload: { vertical: "sleep", frame: "general", text: "I can't anymore, I'm going to kill myself tonight" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.disposition).toBe("crisis_bypass");
    expect(JSON.stringify(res.json().data.crisis)).toContain("999");
    // the LLM was provably not called for this request (invariant 1)
    expect(provider.calls.length).toBe(before);

    const cases = await handle.pool.query("SELECT tier, state FROM core.escalation_case WHERE person_id = $1", [
      personId,
    ]);
    expect(cases.rowCount).toBe(1);
    expect(cases.rows[0]).toMatchObject({ tier: 1, state: "open" });

    const log = await handle.pool.query(
      "SELECT disposition, llm_raw_text, crisis_flow_id FROM core.coach_interaction WHERE person_id = $1",
      [personId],
    );
    expect(log.rows[0].disposition).toBe("crisis_bypass");
    expect(log.rows[0].llm_raw_text).toBeNull();
    expect(log.rows[0].crisis_flow_id).toBe("crisis.self_harm.t1.sleep");
  });

  it("post-filter: a forbidden model claim is blocked; user gets a safe substitute, raw is logged", async () => {
    const { personId, token } = await readyUser("coach-block");
    const res = await server.inject({
      method: "POST",
      url: "/coach/messages",
      headers: asUser(token),
      payload: { vertical: "sleep", frame: "sleep_window_explainer", text: "tell me how this works MAKE_BAD_CLAIM" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.disposition).toBe("blocked_post_filter");
    expect(res.json().data.message).not.toContain("treats insomnia");

    const log = await handle.pool.query(
      "SELECT disposition, llm_raw_text, post_violations FROM core.coach_interaction WHERE person_id = $1",
      [personId],
    );
    expect(log.rows[0].disposition).toBe("blocked_post_filter");
    expect(log.rows[0].llm_raw_text).toContain("treats insomnia");
    expect(log.rows[0].post_violations.length).toBeGreaterThan(0);
  });

  it("provider failure: fails closed to a scripted fallback", async () => {
    const { token } = await readyUser("coach-fallback");
    const res = await server.inject({
      method: "POST",
      url: "/coach/messages",
      headers: asUser(token),
      payload: { vertical: "smoking", frame: "general", text: "hello FORCE_ERROR" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.disposition).toBe("fallback");
    expect(res.json().data.message).toContain("trouble responding");
  });

  it("rejects an unknown frame (400)", async () => {
    const { token } = await readyUser("coach-badframe");
    const res = await server.inject({
      method: "POST",
      url: "/coach/messages",
      headers: asUser(token),
      payload: { vertical: "smoking", frame: "jailbreak_mode", text: "hi" },
    });
    expect(res.statusCode).toBe(400);
  });
});
