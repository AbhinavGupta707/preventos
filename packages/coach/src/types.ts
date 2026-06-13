import type { Vertical } from "@preventos/domain";
import type { CrisisFlow, RiskAssessment } from "@preventos/safety-core";

/**
 * Vertical-specialised session frames (plan WP6.2). The frame selects the
 * coach's persona note and is recorded on every interaction for audit.
 */
export const COACH_FRAMES = [
  "general",
  "craving_rescue",
  "drink_diary_debrief",
  "sleep_window_explainer",
  "taper_check_in",
] as const;
export type CoachFrame = (typeof COACH_FRAMES)[number];

/**
 * Minimised, PII-free state the coach may condition on. No names, no direct
 * identifiers — only coded programme state (plan §4.3 safety isolation: the
 * model sees an assembled, minimised context, never the data layer).
 */
export interface CoachContext {
  readonly daysWon?: number;
  readonly streakActive?: boolean;
  readonly enrolledVerticals?: readonly Vertical[];
  readonly lastLapseVertical?: Vertical;
}

export interface CoachHistoryTurn {
  readonly role: "user" | "coach";
  readonly text: string;
}

export interface CoachInput {
  /** Untrusted free text from the person. */
  readonly text: string;
  readonly vertical: Vertical;
  readonly frame: CoachFrame;
  readonly context: CoachContext;
  readonly history?: readonly CoachHistoryTurn[];
}

export type CoachDisposition = "replied" | "crisis_bypass" | "blocked_post_filter" | "fallback";

export type CoachReply =
  | { readonly kind: "message"; readonly text: string }
  | { readonly kind: "crisis"; readonly flow: CrisisFlow };

export interface CoachTurn {
  readonly disposition: CoachDisposition;
  readonly reply: CoachReply;
  /** The deterministic pre-filter result (always present, drives the bypass). */
  readonly preAssessment: RiskAssessment;
  /** Post-filter fence ids that fired (empty unless disposition is blocked). */
  readonly postViolations: readonly string[];
  /** Present only when the LLM was actually called (never on crisis bypass). */
  readonly llm?: { readonly provider: string; readonly model: string; readonly rawText: string };
  readonly latencyMs: number;
}
