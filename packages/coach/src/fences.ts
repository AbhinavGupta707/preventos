import type { CompiledBlocklist } from "@preventos/content";
import { lintTextClaims } from "@preventos/content";
import { classify } from "@preventos/safety-core";

export interface FenceVerdict {
  readonly allowed: boolean;
  readonly violations: readonly string[];
}

/**
 * Deterministic output post-filter (plan WP6.3). Two independent gates run on
 * the model's OWN output:
 *
 *  1. the 843-case safety classifier, re-applied to the output. If the coach
 *     ever emits risk-tier content (a self-harm method, an overdose amount),
 *     it is blocked. Defence in depth: the model should never, but it cannot be
 *     trusted to never.
 *  2. the governed claims register (WP10.10, safety invariant 5) under the
 *     `coach-fences` scope: no sleep-treatment claims, no alcohol detox
 *     guidance, no medical / efficacy / dosing claims. The patterns live in
 *     compliance/claims, never here, so governance owns the blocklists.
 *
 * On any violation the caller substitutes a scripted safe message; the raw
 * output is logged but never returned to the user.
 */
export function postFilter(
  output: string,
  claimsFences: readonly CompiledBlocklist[],
): FenceVerdict {
  const violations: string[] = [];
  if (classify(output).tier > 0) violations.push("output_risk_content");
  for (const hit of lintTextClaims(claimsFences, output, "coach-fences")) {
    violations.push(`claim:${hit.listId}:${hit.patternId}`);
  }
  return { allowed: violations.length === 0, violations };
}
