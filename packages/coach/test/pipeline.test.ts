import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { compileClaimsRegister, loadClaimsRegister } from "@preventos/content";
import type { CompiledBlocklist } from "@preventos/content";
import { FakeCoachProvider, FireworksCoachProvider, SAFE_FALLBACK, runCoachTurn } from "../src/index.js";
import type { CoachInput, CoachLogEntry, CoachLogSink } from "../src/index.js";

const REGISTER = fileURLToPath(new URL("../../../compliance/claims/claims-register.json", import.meta.url));

class RecordingSink implements CoachLogSink {
  readonly entries: CoachLogEntry[] = [];
  async record(entry: CoachLogEntry): Promise<void> {
    this.entries.push(entry);
  }
}

let fences: readonly CompiledBlocklist[];
beforeAll(async () => {
  fences = compileClaimsRegister(await loadClaimsRegister(REGISTER));
});

function baseInput(text: string, overrides: Partial<CoachInput> = {}): CoachInput {
  return { text, vertical: "smoking", frame: "general", context: {}, ...overrides };
}

/** Deterministic monotonic clock so latencyMs is stable and positive. */
function tickingClock(): () => number {
  let t = 1000;
  return () => (t += 5);
}

describe("runCoachTurn — policy-enforcement proxy", () => {
  it("tier-0: assembles a frame, calls the LLM, returns and logs the reply", async () => {
    const provider = new FakeCoachProvider(() => "Sounds like a solid plan.");
    const sink = new RecordingSink();
    const turn = await runCoachTurn(baseInput("tough day but I didn't smoke"), {
      provider,
      claimsFences: fences,
      logSink: sink,
      now: tickingClock(),
    });
    expect(turn.disposition).toBe("replied");
    expect(turn.reply).toEqual({ kind: "message", text: "Sounds like a solid plan." });
    expect(provider.calls).toHaveLength(1);
    expect(sink.entries).toHaveLength(1);
    expect(sink.entries[0]).toMatchObject({
      disposition: "replied",
      llmProvider: "fake",
      llmRawText: "Sounds like a solid plan.",
      finalText: "Sounds like a solid plan.",
      preTier: 0,
    });
    expect(sink.entries[0]?.latencyMs).toBeGreaterThan(0);
  });

  it("tier-1 crisis: BYPASSES the LLM and routes to a scripted crisis flow", async () => {
    const provider = new FakeCoachProvider();
    const sink = new RecordingSink();
    const turn = await runCoachTurn(baseInput("I'm going to kill myself tonight", { vertical: "sleep" }), {
      provider,
      claimsFences: fences,
      logSink: sink,
    });
    expect(turn.disposition).toBe("crisis_bypass");
    expect(turn.reply.kind).toBe("crisis");
    // Invariant 1: the LLM never sees risk content — provably never called.
    expect(provider.calls).toHaveLength(0);
    expect(turn.llm).toBeUndefined();
    expect(sink.entries[0]).toMatchObject({ disposition: "crisis_bypass", preTier: 1, preRiskClass: "self_harm" });
    expect(sink.entries[0]?.crisisFlowId).toBe("crisis.self_harm.t1.sleep");
    expect(sink.entries[0]?.llmRawText).toBeUndefined();
  });

  it("tier-2 elevated risk: also bypasses the LLM", async () => {
    const provider = new FakeCoachProvider();
    const sink = new RecordingSink();
    const turn = await runCoachTurn(baseInput("I've thought about suicide most days this week"), {
      provider,
      claimsFences: fences,
      logSink: sink,
    });
    expect(turn.disposition).toBe("crisis_bypass");
    expect(turn.preAssessment.tier).toBe(2);
    expect(provider.calls).toHaveLength(0);
  });

  it("tier-1 and tier-2 bypass Fireworks when it is configured", async () => {
    const fetchCalls: string[] = [];
    const provider = new FireworksCoachProvider({
      apiKey: "test-fireworks-key",
      fetch: (url) => {
        fetchCalls.push(url);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
              choices: [{ message: { content: "This should never be reached." } }],
            }),
          ),
        );
      },
    });
    const sink = new RecordingSink();

    const tier1 = await runCoachTurn(baseInput("I'm going to kill myself tonight"), {
      provider,
      claimsFences: fences,
      logSink: sink,
    });
    const tier2 = await runCoachTurn(baseInput("I've thought about suicide most days this week"), {
      provider,
      claimsFences: fences,
      logSink: sink,
    });

    expect(tier1.disposition).toBe("crisis_bypass");
    expect(tier1.preAssessment.tier).toBe(1);
    expect(tier1.llm).toBeUndefined();
    expect(tier2.disposition).toBe("crisis_bypass");
    expect(tier2.preAssessment.tier).toBe(2);
    expect(tier2.llm).toBeUndefined();
    expect(fetchCalls).toHaveLength(0);
    expect(sink.entries).toHaveLength(2);
    expect(sink.entries.map((entry) => entry.llmProvider)).toEqual([undefined, undefined]);
  });

  it("post-filter: a forbidden model claim is blocked and replaced with a safe substitute", async () => {
    const provider = new FakeCoachProvider(() => "Our app treats insomnia and is clinically proven.");
    const sink = new RecordingSink();
    const turn = await runCoachTurn(baseInput("can't sleep again", { vertical: "sleep", frame: "sleep_window_explainer" }), {
      provider,
      claimsFences: fences,
      logSink: sink,
    });
    expect(turn.disposition).toBe("blocked_post_filter");
    expect(turn.postViolations.length).toBeGreaterThan(0);
    if (turn.reply.kind === "message") {
      expect(turn.reply.text).not.toContain("treats insomnia");
      expect(turn.reply.text).toBe(
        "Let's come back to your wind-down routine. Keeping your mornings steady and winding down calmly gives your sleep the best chance, night by night.",
      );
    }
    // raw output retained for audit, never returned to the user
    expect(sink.entries[0]?.llmRawText).toContain("treats insomnia");
    expect(sink.entries[0]?.disposition).toBe("blocked_post_filter");
  });

  it("provider failure: fails closed to a scripted fallback, still logged", async () => {
    const provider = new FakeCoachProvider(() => {
      throw new Error("upstream 529 overloaded");
    });
    const sink = new RecordingSink();
    const turn = await runCoachTurn(baseInput("hello there"), { provider, claimsFences: fences, logSink: sink });
    expect(turn.disposition).toBe("fallback");
    expect(turn.reply).toEqual({ kind: "message", text: SAFE_FALLBACK });
    expect(turn.llm).toBeUndefined();
    expect(sink.entries).toHaveLength(1);
    expect(sink.entries[0]?.disposition).toBe("fallback");
  });

  it("100% logging: a logging failure fails the whole turn (no un-logged success)", async () => {
    const provider = new FakeCoachProvider();
    const sink: CoachLogSink = { record: () => Promise.reject(new Error("db down")) };
    await expect(
      runCoachTurn(baseInput("hi"), { provider, claimsFences: fences, logSink: sink }),
    ).rejects.toThrow();
  });
});
