import { z } from "zod";
import { sha256Hex } from "@preventos/shared";
import { VERTICALS } from "@preventos/domain";

const conditionSchema = z.object({
  field: z.string().min(1),
  op: z.enum(["eq", "neq", "gte", "lte", "in", "has"]),
  value: z.unknown(),
});
export type RuleCondition = z.infer<typeof conditionSchema>;

export const ruleSchema = z.object({
  id: z.string().min(1),
  vertical: z.enum(VERTICALS),
  priority: z.number().int().min(0).max(100),
  /**
   * Safety preemption (e.g. the alcohol dependence hard-stop, invariant 4): an
   * unbypassable rule's candidate is chosen ahead of arbitration and is exempt
   * from the burden governor — a scripted referral is not a discretionary nudge.
   * Reserve for deterministic safety routes only.
   */
  unbypassable: z.boolean().optional(),
  when: z.array(conditionSchema).min(1),
  then: z.object({
    kind: z.enum(["send_atom", "start_sequence", "schedule_check_in", "offer_cross_enrolment"]),
    ref: z.string().min(1),
  }),
});
export type Rule = z.infer<typeof ruleSchema>;

export const ruleSetSchema = z.object({
  version: z.string().min(1),
  rules: z.array(ruleSchema).min(1),
});
export type RuleSet = z.infer<typeof ruleSetSchema>;

/** Evaluation context: flat key/value snapshot of the person's tailored state. */
export type RuleContext = Readonly<Record<string, unknown>>;

function matches(condition: RuleCondition, context: RuleContext): boolean {
  const actual = context[condition.field];
  switch (condition.op) {
    case "eq":
      return actual === condition.value;
    case "neq":
      return actual !== condition.value;
    case "gte":
      return typeof actual === "number" && typeof condition.value === "number" && actual >= condition.value;
    case "lte":
      return typeof actual === "number" && typeof condition.value === "number" && actual <= condition.value;
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(actual);
    case "has":
      return Array.isArray(actual) && actual.includes(condition.value);
  }
}

export interface Candidate {
  readonly ruleId: string;
  readonly vertical: (typeof VERTICALS)[number];
  readonly priority: number;
  readonly unbypassable: boolean;
  readonly action: Rule["then"];
}

export interface Evaluation {
  readonly policyVersion: string;
  readonly candidates: readonly Candidate[];
}

/** Stable content-addressed version: identical rule sets always hash identically. */
export function ruleSetHash(ruleSet: RuleSet): string {
  const canonical = JSON.stringify({
    version: ruleSet.version,
    rules: [...ruleSet.rules].sort((a, b) => a.id.localeCompare(b.id)),
  });
  return `${ruleSet.version}#${sha256Hex(canonical).slice(0, 12)}`;
}

/**
 * Deterministic: same rule set + same context always yields the same
 * candidates in the same order (priority desc, then rule id). This is the
 * replayability guarantee DecisionRecords depend on.
 */
export function evaluateRules(ruleSet: RuleSet, context: RuleContext): Evaluation {
  const candidates = ruleSet.rules
    .filter((rule) => rule.when.every((condition) => matches(condition, context)))
    .map((rule) => ({
      ruleId: rule.id,
      vertical: rule.vertical,
      priority: rule.priority,
      unbypassable: rule.unbypassable ?? false,
      action: rule.then,
    }))
    .sort((a, b) => b.priority - a.priority || a.ruleId.localeCompare(b.ruleId));
  return { policyVersion: ruleSetHash(ruleSet), candidates };
}

export interface ShadowDiff {
  readonly context: RuleContext;
  readonly current: readonly string[];
  readonly proposed: readonly string[];
}

/** Shadow mode: report contexts where a proposed rule set decides differently. */
export function shadowDiff(current: RuleSet, proposed: RuleSet, contexts: readonly RuleContext[]): ShadowDiff[] {
  const diffs: ShadowDiff[] = [];
  for (const context of contexts) {
    const a = evaluateRules(current, context).candidates.map((c) => c.ruleId);
    const b = evaluateRules(proposed, context).candidates.map((c) => c.ruleId);
    if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ context, current: a, proposed: b });
  }
  return diffs;
}
