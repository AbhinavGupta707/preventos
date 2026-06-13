import type { BfoSection } from "@preventos/domain";
import type { Result } from "@preventos/shared";

import type { NextAction, TodayContext } from "../core/nextBestAction";

/**
 * Typed client port to the PreventOS backend (WP2.x). The app talks only to
 * this interface; `MockApi` implements it until SVC (apps/api) lands, at which
 * point a fetch-backed adapter replaces the mock with zero screen changes.
 */
export interface ApiPort {
  /** Persist an intake-produced BFO section (server merges into the person's BFO). */
  submitBfoSection(section: BfoSection): Promise<Result<void, string>>;

  /** Server-side arbitration decides the today surface; mock computes locally. */
  getNextBestAction(ctx: TodayContext): Promise<Result<NextAction, string>>;

  /**
   * Stream a coach reply token-by-token. Callers MUST run the deterministic
   * crisis gate (`classifyOutbound`) before calling this — the chat reducer
   * enforces that by never producing a coach request for tier-1 text.
   */
  streamCoachReply(message: string, onToken: (token: string) => void): Promise<Result<void, string>>;

  /** Register an Expo push token once permission is granted. */
  registerPushToken(token: string): Promise<Result<void, string>>;
}
