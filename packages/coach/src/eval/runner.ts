import type { Vertical } from "@preventos/domain";
import type { CompiledBlocklist } from "@preventos/content";
import { runCoachTurn } from "../pipeline.js";
import type { CoachDeps, CoachLogSink } from "../pipeline.js";
import type { CoachLlmProvider } from "../provider.js";
import { scoreMiAdherence } from "./mi-rubric.js";
import type { MiScore } from "./mi-rubric.js";
import { MI_CORPUS } from "./corpora.js";
import type { MiCase } from "./corpora.js";

export interface MiCaseResult {
  readonly id: string;
  readonly vertical: Vertical;
  readonly frame: string;
  readonly reply: string;
  readonly score: MiScore;
}

export interface MiRate {
  readonly adherent: number;
  readonly total: number;
  readonly rate: number;
}

export interface MiEvalReport {
  readonly overall: MiRate;
  readonly byVertical: Readonly<Partial<Record<Vertical, MiRate>>>;
  readonly results: readonly MiCaseResult[];
  /** The non-adherent cases (id + failed dimensions) for quick triage. */
  readonly failures: readonly { readonly id: string; readonly vertical: Vertical; readonly violations: readonly string[] }[];
}

export interface MiEvalDeps {
  readonly provider: CoachLlmProvider;
  readonly claimsFences: readonly CompiledBlocklist[];
  readonly cases?: readonly MiCase[];
  /** Deterministic clock passed through to the pipeline (optional). */
  readonly now?: () => number;
}

/** Logging is irrelevant to the eval; a no-op sink keeps the pipeline contract. */
const NOOP_SINK: CoachLogSink = { record: () => Promise.resolve() };

function rate(adherent: number, total: number): MiRate {
  return { adherent, total, rate: total === 0 ? 0 : adherent / total };
}

/**
 * WP6.2 — run the coach over the MI corpus and judge each reply. Every case runs
 * the full pre→LLM→post pipeline (so the post-filter's effect on adherence is
 * measured, not bypassed). Returns per-vertical and overall adherence rates plus
 * the failing cases. Provider-agnostic: pass the Fake provider for a free CI gate,
 * or a real provider to measure a live model with the same rubric.
 */
export async function runMiEval(deps: MiEvalDeps): Promise<MiEvalReport> {
  const cases = deps.cases ?? MI_CORPUS;
  const coachDeps: CoachDeps = {
    provider: deps.provider,
    claimsFences: deps.claimsFences,
    logSink: NOOP_SINK,
    ...(deps.now !== undefined ? { now: deps.now } : {}),
  };

  const results: MiCaseResult[] = [];
  for (const c of cases) {
    const turn = await runCoachTurn(
      { text: c.userText, vertical: c.vertical, frame: c.frame, context: {} },
      coachDeps,
    );
    const reply = turn.reply.kind === "message" ? turn.reply.text : "";
    results.push({ id: c.id, vertical: c.vertical, frame: c.frame, reply, score: scoreMiAdherence(reply) });
  }

  const byVertical: Partial<Record<Vertical, MiRate>> = {};
  for (const vertical of [...new Set(cases.map((c) => c.vertical))]) {
    const subset = results.filter((r) => r.vertical === vertical);
    byVertical[vertical] = rate(subset.filter((r) => r.score.adherent).length, subset.length);
  }

  return {
    overall: rate(results.filter((r) => r.score.adherent).length, results.length),
    byVertical,
    results,
    failures: results
      .filter((r) => !r.score.adherent)
      .map((r) => ({ id: r.id, vertical: r.vertical, violations: r.score.violations })),
  };
}
