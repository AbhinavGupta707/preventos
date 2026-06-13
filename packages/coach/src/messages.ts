import type { CoachFrame } from "./types.js";

/**
 * Scripted, verbatim coach messages for when the LLM path does not yield a
 * usable reply — provider error (`fallback`) or a blocked output
 * (`blocked_post_filter`). The model never generates these, and they are
 * written to pass the post-filter themselves (asserted in fences.test.ts), so a
 * substitution can never itself smuggle a claim violation through.
 */
export const SAFE_FALLBACK =
  "I'm having a little trouble responding right now, but I'm still here. Give it another go in a moment — and the tools on your dashboard are always available.";

const SUBSTITUTE: Readonly<Record<CoachFrame, string>> = {
  general:
    "I'm not able to help with that one well enough right now. If something is weighing on you, your dashboard has tools that can help, and you can always speak to your GP.",
  craving_rescue:
    "Let's stay with the craving instead. It will pass — try the urge-surfing timer or a few slow breaths, and notice the wave rise and fall.",
  drink_diary_debrief:
    "Let's keep this simple and kind. One day doesn't undo your progress — log what happened without judgement, and we'll pick the next small step together.",
  sleep_window_explainer:
    "Let's come back to your wind-down routine. Keeping your mornings steady and winding down calmly gives your sleep the best chance, night by night.",
  taper_check_in:
    "Let's focus on your step-down plan. Going at your own pace is exactly right — what felt manageable this week, and what felt harder?",
};

export function safeSubstitute(frame: CoachFrame): string {
  return SUBSTITUTE[frame];
}
