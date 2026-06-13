import type { RiskClass } from "@preventos/domain";
import { RISK_CLASSES } from "@preventos/domain";
import { GUARDS } from "./guards.js";
import { ALL_RULES } from "./lexicon/index.js";
import { normalize } from "./normalize.js";
import type { RiskAssessment, RiskMatch, SafetyRule } from "./types.js";

/**
 * SAFETY INVARIANT 1 (CLAUDE.md): this classifier is deterministic, runs
 * before any LLM, and exposes NO configuration that can disable or weaken a
 * rule. classify(text) is a pure function of its single argument.
 */

interface Span {
  readonly start: number;
  readonly end: number;
}

function globalize(pattern: RegExp): RegExp {
  return pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
}

function collectSpans(patterns: readonly RegExp[], view: string): readonly Span[] {
  const spans: Span[] = [];
  for (const pattern of patterns) {
    for (const m of view.matchAll(globalize(pattern))) {
      spans.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  return spans;
}

function overlaps(a: Span, spans: readonly Span[]): boolean {
  return spans.some((b) => a.start < b.end && b.start < a.end);
}

function ruleMatches(ruleDef: SafetyRule, view: string, guardSpans: readonly Span[]): boolean {
  if (ruleDef.unless?.some((re) => re.test(view))) return false;
  if (ruleDef.requiresAll !== undefined && !ruleDef.requiresAll.every((re) => re.test(view))) {
    return false;
  }
  for (const m of view.matchAll(globalize(ruleDef.pattern))) {
    const span: Span = { start: m.index, end: m.index + m[0].length };
    if (ruleDef.unguarded === true || !overlaps(span, guardSpans)) return true;
  }
  return false;
}

const CLASS_PRIORITY: readonly RiskClass[] = RISK_CLASSES;

/** Deterministic tiered risk classification of one user message. */
export function classify(text: string): RiskAssessment {
  const view = normalize(text);
  const guardSpans = collectSpans(GUARDS, view);

  const matches: RiskMatch[] = [];
  for (const ruleDef of ALL_RULES) {
    if (ruleMatches(ruleDef, view, guardSpans)) {
      matches.push({ ruleId: ruleDef.id, riskClass: ruleDef.riskClass, tier: ruleDef.tier });
    }
  }

  const tier = matches.reduce<0 | 1 | 2>((acc, m) => (m.tier < acc ? m.tier : acc), matches.length > 0 ? 2 : 0);
  const atTier = matches.filter((m) => m.tier === tier);
  const riskClass = CLASS_PRIORITY.find((c) => atTier.some((m) => m.riskClass === c));

  return { tier, riskClass, matches };
}
