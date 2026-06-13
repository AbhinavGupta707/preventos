import type { RiskClass } from "@preventos/domain";

/**
 * Classifier tier scheme (matches the red-team corpus rubric, WP7.1c):
 *   1 — immediate risk: deterministic crisis flow, the LLM is bypassed.
 *   2 — elevated risk: human review within SLA, sensitive scripted handling.
 *   0 — no risk detected.
 */
export type RiskTier = 0 | 1 | 2;

export interface RiskMatch {
  readonly ruleId: string;
  readonly riskClass: RiskClass;
  readonly tier: 1 | 2;
}

export interface RiskAssessment {
  readonly tier: RiskTier;
  /** Dominant risk class at the assessed tier (RISK_CLASSES priority order). */
  readonly riskClass: RiskClass | undefined;
  readonly matches: readonly RiskMatch[];
}

/**
 * One deterministic lexicon rule. `pattern` runs against the normalized view;
 * `requiresAll` must all hold somewhere in the text (conjunctive context);
 * `unless` vetoes the rule entirely; `unguarded` exempts the rule from the
 * global idiom guards (span-overlap suppression).
 */
export interface SafetyRule {
  readonly id: string;
  readonly riskClass: RiskClass;
  readonly tier: 1 | 2;
  readonly pattern: RegExp;
  readonly requiresAll?: readonly RegExp[];
  readonly unless?: readonly RegExp[];
  readonly unguarded?: boolean;
}

interface RuleOpts {
  readonly requiresAll?: readonly RegExp[];
  readonly unless?: readonly RegExp[];
  readonly unguarded?: boolean;
}

export function rule(
  id: string,
  riskClass: RiskClass,
  tier: 1 | 2,
  pattern: RegExp,
  opts: RuleOpts = {},
): SafetyRule {
  return { id, riskClass, tier, pattern, ...opts };
}
