import {
  ApiClient,
  type DevSession,
  type FetchLike,
  type PersonDataBundle,
  type PushTokenInput,
  type SleepDiaryInput,
  type SleepWindowInput,
  type SleepWindowView,
  type TokenProvider,
} from "@preventos/api-client";
import type { BfoSection } from "@preventos/domain";
import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";

import type { NextAction, TodayContext } from "../core/nextBestAction";
import { MockApi } from "./mock";
import type { ApiPort, CoachReplyRequest, JourneyEnrolment } from "./port";

export interface FetchApiConfig {
  /** Origin of apps/api, e.g. "http://10.0.2.2:3001". */
  readonly baseUrl: string;
  /** Clerk session token provider. When present, /dev/session is never called. */
  readonly getAuthToken?: TokenProvider;
  /** Local development only: allows POST /dev/session bootstrap. */
  readonly allowDevSessions?: boolean;
  /** Inject a fetch in tests; defaults to the platform global. */
  readonly fetch?: FetchLike;
}

/**
 * Live adapter over @preventos/api-client. Holds the dev session in memory
 * (the Clerk adapter replaces this once owner keys land), so each launch is a
 * fresh person until session persistence ships. Endpoints that don't exist
 * yet (BFO persistence and next-best-action arbitration) are served by an
 * embedded MockApi; coach replies and push token registration are live API
 * calls because server routes now exist.
 */
export class FetchApi implements ApiPort {
  private readonly client: ApiClient;
  private readonly preview = new MockApi();
  private readonly getAuthToken: TokenProvider | undefined;
  private readonly allowDevSessions: boolean;
  private session: DevSession | undefined;

  constructor(config: FetchApiConfig) {
    this.getAuthToken = config.getAuthToken;
    this.allowDevSessions = config.allowDevSessions ?? false;
    this.client = new ApiClient({
      baseUrl: config.baseUrl,
      getToken: async () => this.session?.token ?? (await this.getAuthToken?.()),
      ...(config.fetch !== undefined ? { fetch: config.fetch } : {}),
    });
  }

  async ensureSession(): Promise<Result<{ readonly personId: string }, string>> {
    if (this.session !== undefined) return ok({ personId: this.session.personId });
    const clerkToken = await this.getAuthToken?.();
    if (clerkToken !== undefined && clerkToken !== "") return ok({ personId: "clerk-authenticated" });
    if (!this.allowDevSessions) return err("authenticated session required");
    const res = await this.client.createDevSession();
    if (!res.ok) return err(res.error.message);
    this.session = res.value;
    return ok({ personId: res.value.personId });
  }

  async enrolJourney(input: JourneyEnrolment): Promise<Result<void, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;

    for (const purpose of ["programme_delivery", "proactive_contact"] as const) {
      const grant = await this.client.grantConsent({ purpose });
      if (!grant.ok) return err(grant.error.message);
    }

    const enrol = await this.client.enrol({
      vertical: input.vertical,
      ...(input.stage !== undefined ? { stage: input.stage } : {}),
    });
    // 409 = already enrolled in this vertical; treat as success (idempotent intake).
    if (!enrol.ok && enrol.error.status !== 409) return err(enrol.error.message);

    if (input.quitDate !== undefined) {
      const plan = await this.client.createPlan({
        vertical: input.vertical,
        type: "quit",
        slots: { quitDate: input.quitDate },
      });
      if (!plan.ok) return err(plan.error.message);
    }
    return ok(undefined);
  }

  async logCraving(channel: "app" | "web" = "app"): Promise<Result<void, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;
    const res = await this.client.logCraving(channel);
    return res.ok ? ok(undefined) : err(res.error.message);
  }

  async logSleepDiary(input: SleepDiaryInput): Promise<Result<void, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;
    const res = await this.client.logSleepDiary(input);
    return res.ok ? ok(undefined) : err(res.error.message);
  }

  async createSleepWindow(input: SleepWindowInput): Promise<Result<SleepWindowView, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;
    const res = await this.client.createSleepWindow(input);
    return res.ok ? ok(res.value) : err(res.error.message);
  }

  async exportAccountData(): Promise<Result<PersonDataBundle, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;
    const res = await this.client.exportAccountData();
    return res.ok ? ok(res.value) : err(res.error.message);
  }

  async deleteAccount(): Promise<Result<void, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;
    const res = await this.client.deleteAccount();
    return res.ok ? ok(undefined) : err(res.error.message);
  }

  // ---- not yet server-backed: served locally until their WPs land ----

  submitBfoSection(section: BfoSection): Promise<Result<void, string>> {
    return this.preview.submitBfoSection(section);
  }

  getNextBestAction(ctx: TodayContext): Promise<Result<NextAction, string>> {
    return this.preview.getNextBestAction(ctx);
  }

  async streamCoachReply(
    message: string,
    onToken: (token: string) => void,
    request: CoachReplyRequest,
  ): Promise<Result<void, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;
    const res = await this.client.sendCoachMessage({
      text: message,
      vertical: request.vertical,
      frame: request.frame,
      channel: "app",
      ...(request.context !== undefined ? { context: request.context } : {}),
    });
    if (!res.ok) return err(res.error.message);
    if (res.value.message !== undefined && res.value.message !== "") {
      onToken(res.value.message);
      return ok(undefined);
    }
    return err(res.value.disposition === "crisis_bypass" ? "safety flow activated" : "empty coach reply");
  }

  async registerPushToken(input: PushTokenInput): Promise<Result<void, string>> {
    const session = await this.ensureSession();
    if (!session.ok) return session;
    const res = await this.client.registerPushToken(input);
    return res.ok ? ok(undefined) : err(res.error.message);
  }
}
