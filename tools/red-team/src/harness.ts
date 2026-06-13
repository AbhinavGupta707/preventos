/**
 * WP7.4 red-team harness: runs the labelled corpus through the WP7.1
 * deterministic classifier and computes the release-blocking metrics.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { classify } from "@preventos/safety";
import type { Category, CorpusCase } from "./corpus.js";
import { CATEGORIES, parseCorpusFile } from "./corpus.js";

export const CORPUS_DIR = join(import.meta.dirname, "..", "corpus");

/** Corpus categories use kebab-case; the classifier emits domain risk classes. */
export const CATEGORY_TO_RISK_CLASS: Readonly<Record<Category, string>> = {
  "self-harm-suicide": "self_harm",
  "abuse-dv": "abuse_dv",
  safeguarding: "safeguarding",
  overdose: "overdose",
  "withdrawal-risk": "withdrawal_risk",
  "acute-medical": "acute_medical",
};

export function loadCorpus(): readonly CorpusCase[] {
  const files = readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".jsonl"));
  const cases: CorpusCase[] = [];
  for (const file of files.sort()) {
    const parsed = parseCorpusFile(file, readFileSync(join(CORPUS_DIR, file), "utf8"));
    if (parsed.errors.length > 0) {
      throw new Error(`corpus invalid: ${parsed.errors.join("; ")}`);
    }
    cases.push(...parsed.cases);
  }
  return cases;
}

export interface CaseResult {
  readonly case: CorpusCase;
  readonly predictedTier: 0 | 1 | 2;
  readonly predictedClass: string | undefined;
}

export interface CategoryReport {
  readonly category: Category;
  readonly tier1Total: number;
  readonly tier1Hits: number;
  readonly tier2Total: number;
  readonly tier2Covered: number; // tier-2 cases classified as tier 1 or 2 (reach a human / scripted path)
  readonly tier0Total: number;
  readonly tier0FalsePositives: number; // tier-0 cases classified as tier 1 or 2
}

export interface EvalReport {
  readonly totalCases: number;
  readonly tier1Recall: number;
  readonly tier1Misses: readonly CaseResult[];
  readonly tier2Covered: number;
  readonly tier2Total: number;
  readonly tier0FalsePositiveRate: number;
  readonly perCategory: readonly CategoryReport[];
  readonly latency: { readonly p50Ms: number; readonly p95Ms: number; readonly maxMs: number };
}

export function evaluate(cases: readonly CorpusCase[]): EvalReport {
  const results: CaseResult[] = [];
  const latencies: number[] = [];
  for (const c of cases) {
    const start = performance.now();
    const assessment = classify(c.text);
    latencies.push(performance.now() - start);
    results.push({ case: c, predictedTier: assessment.tier, predictedClass: assessment.riskClass });
  }

  const perCategory = CATEGORIES.map((category): CategoryReport => {
    const inCat = results.filter((r) => r.case.category === category);
    const t1 = inCat.filter((r) => r.case.tier === 1);
    const t2 = inCat.filter((r) => r.case.tier === 2);
    const t0 = inCat.filter((r) => r.case.tier === 0);
    return {
      category,
      tier1Total: t1.length,
      tier1Hits: t1.filter((r) => r.predictedTier === 1).length,
      tier2Total: t2.length,
      tier2Covered: t2.filter((r) => r.predictedTier >= 1).length,
      tier0Total: t0.length,
      tier0FalsePositives: t0.filter((r) => r.predictedTier >= 1).length,
    };
  });

  const tier1All = results.filter((r) => r.case.tier === 1);
  const tier1Misses = tier1All.filter((r) => r.predictedTier !== 1);
  const tier0All = results.filter((r) => r.case.tier === 0);
  const tier0Fp = tier0All.filter((r) => r.predictedTier >= 1);
  const tier2All = results.filter((r) => r.case.tier === 2);

  const sorted = [...latencies].sort((a, b) => a - b);
  const pick = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;

  return {
    totalCases: results.length,
    tier1Recall: (tier1All.length - tier1Misses.length) / tier1All.length,
    tier1Misses,
    tier2Covered: tier2All.filter((r) => r.predictedTier >= 1).length,
    tier2Total: tier2All.length,
    tier0FalsePositiveRate: tier0Fp.length / tier0All.length,
    perCategory,
    latency: { p50Ms: pick(0.5), p95Ms: pick(0.95), maxMs: sorted[sorted.length - 1] ?? 0 },
  };
}
