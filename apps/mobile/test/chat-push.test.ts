import { describe, expect, it } from "vitest";

import { classifyOutbound, chatReducer, emptyChat } from "../src/core/chat";
import { canPromptOs, choreographyReducer, initialChoreography } from "../src/core/pushChoreography";

describe("deterministic crisis gate — invariant 1: runs before any LLM, no bypass", () => {
  const crisisTexts = [
    "I want to kill myself",
    "i've been thinking about ending my life",
    "I just want to die",
    "thinking of hurting myself tonight",
    "SUICIDE is on my mind",
  ];

  for (const text of crisisTexts) {
    it(`flags tier-1: "${text.slice(0, 30)}…"`, () => {
      expect(classifyOutbound(text)).toBe("tier1");
    });
  }

  const elevatedSafetyTexts = [
    "I need to detox from alcohol at home tonight",
    "I get shakes and sweats when I try to stop drinking",
    "I think I'm dependent on alcohol but want to cut down by myself",
  ];

  for (const text of elevatedSafetyTexts) {
    it(`routes elevated risk before coach: "${text.slice(0, 30)}…"`, () => {
      const next = chatReducer(emptyChat(), { type: "send", text });
      expect(classifyOutbound(text)).toBe("tier1");
      expect(next.pendingCoachRequest).toBeNull();
      expect(next.crisisActive).toBe(true);
      expect(next.messages).toEqual([]);
    });
  }

  it("does not flag ordinary coaching messages", () => {
    expect(classifyOutbound("I'm dying for a cigarette right now")).toBe("none");
    expect(classifyOutbound("these cravings are killing me")).toBe("none");
    expect(classifyOutbound("help me get through tonight")).toBe("none");
  });

  it("tier-1 message NEVER reaches the coach — reducer routes to crisis instead", () => {
    const next = chatReducer(emptyChat(), { type: "send", text: "I want to kill myself" });
    expect(next.pendingCoachRequest).toBeNull();
    expect(next.crisisActive).toBe(true);
    // the user's words are not echoed into the transcript for the LLM path
    expect(next.messages.some((m) => m.role === "coach")).toBe(false);
  });

  it("normal message produces a pending coach request", () => {
    const next = chatReducer(emptyChat(), { type: "send", text: "I keep slipping after dinner" });
    expect(next.pendingCoachRequest).toBe("I keep slipping after dinner");
    expect(next.crisisActive).toBe(false);
  });

  it("streams tokens immutably into the open coach message", () => {
    let s = chatReducer(emptyChat(), { type: "send", text: "hello coach" });
    s = chatReducer(s, { type: "stream_token", token: "One " });
    const before = s.messages.length;
    s = chatReducer(s, { type: "stream_token", token: "step." });
    s = chatReducer(s, { type: "stream_end" });
    expect(s.messages.length).toBe(before);
    expect(s.messages.at(-1)?.text).toBe("One step.");
    expect(s.messages.at(-1)?.streaming).toBe(false);
  });

  it("server-side crisis bypass clears the pending coach turn without a coach reply", () => {
    let s = chatReducer(emptyChat(), { type: "send", text: "server caught this as risk" });
    expect(s.pendingCoachRequest).toBe("server caught this as risk");
    s = chatReducer(s, { type: "server_crisis" });
    expect(s.pendingCoachRequest).toBeNull();
    expect(s.crisisActive).toBe(true);
    expect(s.messages).toEqual([]);
  });
});

describe("push permission choreography — primer before OS prompt, denial respected", () => {
  it("never allows the OS prompt before the primer is accepted", () => {
    expect(canPromptOs(initialChoreography)).toBe(false);
    const primed = choreographyReducer(initialChoreography, "primer_accepted");
    expect(canPromptOs(primed)).toBe(true);
  });

  it("primer declined → deferred, OS prompt still off the table", () => {
    const s = choreographyReducer(initialChoreography, "primer_declined");
    expect(s.stage).toBe("deferred");
    expect(canPromptOs(s)).toBe(false);
  });

  it("OS denial is terminal for prompting — only settings can change it", () => {
    let s = choreographyReducer(initialChoreography, "primer_accepted");
    s = choreographyReducer(s, "os_denied");
    expect(s.stage).toBe("denied");
    expect(canPromptOs(s)).toBe(false);
    expect(choreographyReducer(s, "primer_accepted").stage).toBe("denied");
  });

  it("OS grant completes the choreography", () => {
    let s = choreographyReducer(initialChoreography, "primer_accepted");
    s = choreographyReducer(s, "os_granted");
    expect(s.stage).toBe("granted");
  });
});
