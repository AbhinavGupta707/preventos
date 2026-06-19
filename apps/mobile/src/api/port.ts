import type { BfoSection, ReadinessStage, Vertical } from "@preventos/domain";
import type {
  CoachFrame,
  PersonDataBundle,
  PushTokenInput,
  SleepDiaryInput,
  SleepWindowInput,
  SleepWindowView,
} from "@preventos/api-client";
import type { Result } from "@preventos/shared";

import type { NextAction, TodayContext } from "../core/nextBestAction";

/** What an intake hands the backend to stand up a programme journey. */
export interface JourneyEnrolment {
  readonly vertical: Vertical;
  readonly stage?: ReadinessStage;
  /** Sets a quit plan when present (smoking/vaping). */
  readonly quitDate?: string;
}

export interface CoachReplyRequest {
  readonly vertical: Vertical;
  readonly frame: CoachFrame;
  readonly context?: Readonly<{
    readonly daysWon?: number;
    readonly streakActive?: boolean;
    readonly enrolledVerticals?: readonly Vertical[];
    readonly lastLapseVertical?: Vertical;
  }>;
}

/**
 * Typed client port to the PreventOS backend (WP2.x). Screens talk only to
 * this interface. `MockApi` implements it for offline/preview and tests;
 * `FetchApi` implements it against the live apps/api (selected when
 * EXPO_PUBLIC_API_URL is set). BFO persistence and next-best-action
 * arbitration are still served locally because no server route exists yet;
 * coach and push are server-backed in live mode.
 */
export interface ApiPort {
  /** Ensures a backend session exists (dev: sign-up + token; prod: auth provider). */
  ensureSession(): Promise<Result<{ readonly personId: string }, string>>;

  /** Stands up the journey server-side: consents + enrolment + (quit) plan. */
  enrolJourney(input: JourneyEnrolment): Promise<Result<void, string>>;

  /** Records a rescue/craving press as an inbound contact. */
  logCraving(channel?: "app" | "web"): Promise<Result<void, string>>;

  /** Logs a Nightshift morning diary entry. */
  logSleepDiary(input: SleepDiaryInput): Promise<Result<void, string>>;

  /** Requests the current Nightshift sleep-window recommendation. */
  createSleepWindow(input: SleepWindowInput): Promise<Result<SleepWindowView, string>>;

  /** Persist an intake-produced BFO section (server merges into the person's BFO). */
  submitBfoSection(section: BfoSection): Promise<Result<void, string>>;

  /** Server-side arbitration decides the today surface; computed locally for now. */
  getNextBestAction(ctx: TodayContext): Promise<Result<NextAction, string>>;

  /**
   * Stream a coach reply token-by-token. Callers MUST run the deterministic
   * crisis gate (`classifyOutbound`) before calling this — the chat reducer
   * enforces that by never producing a coach request for tier-1 text.
   */
  streamCoachReply(
    message: string,
    onToken: (token: string) => void,
    request: CoachReplyRequest,
  ): Promise<Result<void, string>>;

  /** Register an Expo push token once permission is granted. */
  registerPushToken(input: PushTokenInput): Promise<Result<void, string>>;

  /** Export the authenticated account's server-side data bundle. */
  exportAccountData(): Promise<Result<PersonDataBundle, string>>;

  /** Delete the authenticated account's mutable server-side data, then callers clear local state. */
  deleteAccount(): Promise<Result<void, string>>;
}
