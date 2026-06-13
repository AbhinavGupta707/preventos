import { describe, expect, it } from "vitest";
import { ruleSetSchema, type RuleSet } from "@preventos/decisions";
import { DEFAULT_RULE_SET } from "../src/ruleset.js";
import { assertRuleSetResolvable, loadRefUniverse, resolveRuleSetRefs, type RefUniverse } from "../src/refguard.js";

const universe = (over: Partial<RefUniverse> = {}): RefUniverse => ({
  atomIds: new Set(["smoking.real.atom"]),
  sequenceIds: new Set(["smoking.real.sequence"]),
  outcomeIds: new Set(["smoking.quit.russell_standard_4w"]),
  ...over,
});

const oneRule = (then: { kind: string; ref: string }): RuleSet =>
  ruleSetSchema.parse({
    version: "test-1",
    rules: [{ id: "r1", vertical: "smoking", priority: 50, when: [{ field: "kind", op: "eq", value: "x" }], then }],
  });

describe("resolveRuleSetRefs (pure)", () => {
  it("passes a send_atom ref that exists in the catalog", () => {
    expect(resolveRuleSetRefs(oneRule({ kind: "send_atom", ref: "smoking.real.atom" }), universe())).toEqual([]);
  });

  it("rejects a send_atom ref absent from the catalog, naming the ref and kind", () => {
    const errors = resolveRuleSetRefs(oneRule({ kind: "send_atom", ref: "smoking.ghost" }), universe());
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("smoking.ghost");
    expect(errors[0]).toContain("content atom");
  });

  it("validates schedule_check_in refs against recognised outcome ids", () => {
    const ok = oneRule({ kind: "schedule_check_in", ref: "smoking.quit.russell_standard_4w" });
    const bad = oneRule({ kind: "schedule_check_in", ref: "smoking.no_such_outcome" });
    expect(resolveRuleSetRefs(ok, universe())).toEqual([]);
    expect(resolveRuleSetRefs(bad, universe())).toHaveLength(1);
  });

  it("validates start_sequence refs against sequence ids", () => {
    const ok = oneRule({ kind: "start_sequence", ref: "smoking.real.sequence" });
    const bad = oneRule({ kind: "start_sequence", ref: "smoking.ghost.sequence" });
    expect(resolveRuleSetRefs(ok, universe())).toEqual([]);
    expect(resolveRuleSetRefs(bad, universe())).toHaveLength(1);
  });

  it("validates offer_cross_enrolment refs against known verticals", () => {
    const ok = oneRule({ kind: "offer_cross_enrolment", ref: "alcohol" });
    const bad = oneRule({ kind: "offer_cross_enrolment", ref: "not-a-vertical" });
    expect(resolveRuleSetRefs(ok, universe())).toEqual([]);
    expect(resolveRuleSetRefs(bad, universe())).toHaveLength(1);
  });

  it("reports every dangling ref, not just the first", () => {
    const rs = ruleSetSchema.parse({
      version: "test-multi",
      rules: [
        { id: "a", vertical: "smoking", priority: 10, when: [{ field: "k", op: "eq", value: 1 }], then: { kind: "send_atom", ref: "ghost.1" } },
        { id: "b", vertical: "alcohol", priority: 10, when: [{ field: "k", op: "eq", value: 1 }], then: { kind: "send_atom", ref: "ghost.2" } },
      ],
    });
    expect(resolveRuleSetRefs(rs, universe())).toHaveLength(2);
  });
});

describe("assertRuleSetResolvable (real content catalog + outcome registry — the CI guard)", () => {
  it("loads a real ref universe: hundreds of atoms plus recognised outcomes", async () => {
    const u = await loadRefUniverse();
    expect(u.atomIds.size).toBeGreaterThan(300);
    expect(u.outcomeIds.has("smoking.quit.russell_standard_4w")).toBe(true);
  });

  it("the shipped DEFAULT_RULE_SET resolves cleanly against real content + outcomes", async () => {
    await expect(assertRuleSetResolvable(DEFAULT_RULE_SET)).resolves.toBeUndefined();
  });

  it("fails fast when a rule references a content atom that does not exist", async () => {
    const broken: RuleSet = {
      ...DEFAULT_RULE_SET,
      rules: [
        ...DEFAULT_RULE_SET.rules,
        {
          id: "broken-ref",
          vertical: "smoking",
          priority: 1,
          when: [{ field: "kind", op: "eq", value: "never" }],
          then: { kind: "send_atom", ref: "smoking.does.not.exist" },
        },
      ],
    };
    await expect(assertRuleSetResolvable(broken)).rejects.toThrow(/dangling ref/);
  });
});
