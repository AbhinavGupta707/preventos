import { classify, routeCrisis } from "@preventos/safety-core";
import type { CompiledBlocklist } from "@preventos/content";
import type { RiskAssessment } from "@preventos/safety-core";
import { postFilter } from "./fences.js";
import { buildFrame } from "./frames.js";
import { SAFE_FALLBACK, safeSubstitute } from "./messages.js";
import type { CoachLlmProvider } from "./provider.js";
import type { CoachInput, CoachTurn } from "./types.js";

/**
 * One row of the 100% audit log (plan WP6.1). Holds the full decision trail of
 * a turn, including the raw model output, for red-team review and clinical
 * audit. This is erasable personal data — the db-backed sink writes it to
 * `core.coach_interaction`, which GDPR erasure deletes (the safety-of-record on
 * a crisis turn is the retained `escalation_case`, which carries no free text).
 */
export interface CoachLogEntry {
  readonly vertical: string;
  readonly frame: string;
  readonly inboundText: string;
  readonly preTier: 0 | 1 | 2;
  readonly preRiskClass?: string;
  readonly disposition: string;
  readonly llmProvider?: string;
  readonly llmModel?: string;
  readonly llmRawText?: string;
  readonly postViolations: readonly string[];
  readonly finalText?: string;
  readonly crisisFlowId?: string;
  readonly latencyMs: number;
}

/** 100% logging sink. Every turn is recorded before it is returned. */
export interface CoachLogSink {
  record(entry: CoachLogEntry): Promise<void>;
}

export interface CoachDeps {
  readonly provider: CoachLlmProvider;
  /** Compiled claims register (WP10.10), loaded once at the edge and injected. */
  readonly claimsFences: readonly CompiledBlocklist[];
  readonly logSink: CoachLogSink;
  /** Injectable clock for latency + deterministic tests; defaults to Date.now. */
  readonly now?: () => number;
}

function toLogEntry(input: CoachInput, turn: CoachTurn): CoachLogEntry {
  return {
    vertical: input.vertical,
    frame: input.frame,
    inboundText: input.text,
    preTier: turn.preAssessment.tier,
    ...(turn.preAssessment.riskClass !== undefined ? { preRiskClass: turn.preAssessment.riskClass } : {}),
    disposition: turn.disposition,
    ...(turn.llm !== undefined
      ? { llmProvider: turn.llm.provider, llmModel: turn.llm.model, llmRawText: turn.llm.rawText }
      : {}),
    postViolations: turn.postViolations,
    ...(turn.reply.kind === "message"
      ? { finalText: turn.reply.text }
      : { crisisFlowId: turn.reply.flow.flowId }),
    latencyMs: turn.latencyMs,
  };
}

async function llmTurn(
  input: CoachInput,
  deps: CoachDeps,
  preAssessment: RiskAssessment,
  start: number,
  clock: () => number,
): Promise<CoachTurn> {
  const request = buildFrame(input);
  let raw;
  try {
    raw = await deps.provider.generate(request);
  } catch {
    // Fail closed: a provider error/timeout never leaks to the user — a
    // scripted, claim-safe fallback is returned instead.
    return {
      disposition: "fallback",
      reply: { kind: "message", text: SAFE_FALLBACK },
      preAssessment,
      postViolations: [],
      latencyMs: clock() - start,
    };
  }

  const verdict = postFilter(raw.text, deps.claimsFences);
  if (!verdict.allowed) {
    return {
      disposition: "blocked_post_filter",
      reply: { kind: "message", text: safeSubstitute(input.frame) },
      preAssessment,
      postViolations: verdict.violations,
      llm: { provider: deps.provider.name, model: raw.model, rawText: raw.text },
      latencyMs: clock() - start,
    };
  }

  return {
    disposition: "replied",
    reply: { kind: "message", text: raw.text },
    preAssessment,
    postViolations: [],
    llm: { provider: deps.provider.name, model: raw.model, rawText: raw.text },
    latencyMs: clock() - start,
  };
}

/**
 * The policy-enforcement proxy (plan WP6.1) — the single path to the LLM:
 *
 *   deterministic pre-filter (843-case classifier)
 *     tier > 0 → scripted crisis flow; the LLM is BYPASSED; the caller opens an
 *                escalation case (the proxy is db-free).
 *     tier 0   → assemble the spotlighted frame → LLM (provider port)
 *                  → post-filter violation → scripted safe substitute
 *                  → provider error        → scripted fallback
 *                  → otherwise             → the model's reply
 *   → 100% logging, always, before returning.
 *
 * Invariant 1 (CLAUDE.md): the LLM never handles any risk-tier content. The raw
 * model output is never returned to the user un-filtered, and no turn is ever
 * returned without first being logged (logging is awaited; if it throws, the
 * turn throws — there is no un-logged success).
 */
export async function runCoachTurn(input: CoachInput, deps: CoachDeps): Promise<CoachTurn> {
  const clock = deps.now ?? Date.now;
  const start = clock();
  const preAssessment = classify(input.text);

  let turn: CoachTurn;
  if (preAssessment.tier !== 0) {
    const flow = routeCrisis({
      riskClass: preAssessment.riskClass ?? "self_harm",
      tier: preAssessment.tier,
      vertical: input.vertical,
    });
    turn = {
      disposition: "crisis_bypass",
      reply: { kind: "crisis", flow },
      preAssessment,
      postViolations: [],
      latencyMs: clock() - start,
    };
  } else {
    turn = await llmTurn(input, deps, preAssessment, start, clock);
  }

  await deps.logSink.record(toLogEntry(input, turn));
  return turn;
}
