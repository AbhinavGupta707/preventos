import { describe, expect, it } from "vitest";
import type { RuleSet } from "../src/rules.js";
import { evaluateRules, ruleSetHash, ruleSetSchema, shadowDiff } from "../src/rules.js";

const ruleSet: RuleSet = {
  version: "0.1.0",
  rules: [
    {
      id: "smoking.craving.high",
      vertical: "smoking",
      priority: 80,
      when: [{ field: "cravingLogged", op: "eq", value: true }],
      then: { kind: "start_sequence", ref: "smoking.craving.surf90" },
    },
    {
      id: "smoking.friday.drinking",
      vertical: "smoking",
      priority: 60,
      when: [
        { field: "dayOfWeek", op: "eq", value: "friday" },
        { field: "triggers", op: "has", value: "drinking" },
      ],
      then: { kind: "send_atom", ref: "smoking.risk.drinking-tonight" },
    },
    {
      id: "sleep.diary.nudge",
      vertical: "sleep",
      priority: 40,
      when: [{ field: "diaryMissedDays", op: "gte", value: 2 }],
      then: { kind: "send_atom", ref: "sleep.diary.gentle-nudge" },
    },
  ],
};

describe("rules engine", () => {
  it("schema rejects malformed rules", () => {
    expect(ruleSetSchema.safeParse({ version: "x", rules: [] }).success).toBe(false);
    expect(
      ruleSetSchema.safeParse({
        version: "x",
        rules: [{ id: "r", vertical: "gambling", priority: 1, when: [], then: { kind: "send_atom", ref: "a" } }],
      }).success,
    ).toBe(false);
  });

  it("evaluation is deterministic: identical inputs produce byte-identical results", () => {
    const context = { cravingLogged: true, dayOfWeek: "friday", triggers: ["drinking"], diaryMissedDays: 3 };
    const a = evaluateRules(ruleSet, context);
    const b = evaluateRules(ruleSet, context);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.candidates.map((c) => c.ruleId)).toEqual([
      "smoking.craving.high",
      "smoking.friday.drinking",
      "sleep.diary.nudge",
    ]);
  });

  it("condition operators behave: eq/neq/gte/lte/in/has", () => {
    const none = evaluateRules(ruleSet, { cravingLogged: false, dayOfWeek: "monday", diaryMissedDays: 0 });
    expect(none.candidates).toEqual([]);
    const fridayOnly = evaluateRules(ruleSet, { dayOfWeek: "friday", triggers: ["drinking"] });
    expect(fridayOnly.candidates.map((c) => c.ruleId)).toEqual(["smoking.friday.drinking"]);
  });

  it("hash is stable across rule ordering and changes when a rule changes", () => {
    const reordered: RuleSet = { ...ruleSet, rules: [...ruleSet.rules].reverse() };
    expect(ruleSetHash(reordered)).toBe(ruleSetHash(ruleSet));
    const changed: RuleSet = {
      ...ruleSet,
      rules: ruleSet.rules.map((r) => (r.id === "sleep.diary.nudge" ? { ...r, priority: 41 } : r)),
    };
    expect(ruleSetHash(changed)).not.toBe(ruleSetHash(ruleSet));
  });

  it("shadow diff reports only contexts that decide differently", () => {
    const proposed: RuleSet = {
      ...ruleSet,
      rules: ruleSet.rules.filter((r) => r.id !== "sleep.diary.nudge"),
    };
    const contexts = [{ diaryMissedDays: 3 }, { diaryMissedDays: 0 }];
    const diffs = shadowDiff(ruleSet, proposed, contexts);
    expect(diffs.length).toBe(1);
    expect(diffs[0]?.current).toEqual(["sleep.diary.nudge"]);
    expect(diffs[0]?.proposed).toEqual([]);
  });
});
