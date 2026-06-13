import { ApiClient, type DevSession, type FetchLike } from "@preventos/api-client";
import type { BfoSection } from "@preventos/domain";
import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";

import type { NextAction, TodayContext } from "../core/nextBestAction";
import { MockApi } from "./mock";
import type { ApiPort, JourneyEnrolment } from "./port";

export interface FetchApiConfig {
  /** Origin of apps/api, e.g. "http://10.0.2.2:3001". */
  readonly baseUrl: string;
  /** Inject a fetch in tests; defaults to the platform global. */
  readonly fetch?: FetchLike;
}

/**
 * Live adapter over @preventos/api-client. Holds the dev session in memory
 * (the Clerk adapter replaces this once owner keys land), so each launch is a
 * fresh person until session persistence ships. Endpoints that don't exist
 * yet (coach reply, BFO persistence, next-best-action arbitration, push
 * registration) are served by an embedded MockApi so the UX is unchanged
 * while those work packages are pending.
 */
export class FetchApi implements ApiPort {
  private readonly client: ApiClient;
  private readonly preview = new MockApi();
  private session: DevSession | undefined;

  constructor(config: FetchApiConfig) {
    this.client = new ApiClient({
      baseUrl: config.baseUrl,
      getToken: () => this.session?.token,
      ...(config.fetch !== undefined ? { fetch: config.fetch } : {}),
    });
  }

  async ensureSession(): Promise<Result<{ readonly personId: string }, string>> {
    if (this.session !== undefined) return ok({ personId: this.session.personId });
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

  // ---- not yet server-backed: served locally until their WPs land ----

  submitBfoSection(section: BfoSection): Promise<Result<void, string>> {
    return this.preview.submitBfoSection(section);
  }

  getNextBestAction(ctx: TodayContext): Promise<Result<NextAction, string>> {
    return this.preview.getNextBestAction(ctx);
  }

  streamCoachReply(message: string, onToken: (token: string) => void): Promise<Result<void, string>> {
    return this.preview.streamCoachReply(message, onToken);
  }

  registerPushToken(token: string): Promise<Result<void, string>> {
    return this.preview.registerPushToken(token);
  }
}
