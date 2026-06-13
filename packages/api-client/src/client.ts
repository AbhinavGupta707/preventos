import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import type {
  ApiClientConfig,
  ApiError,
  ConsentChange,
  ConsentInput,
  ConsentScope,
  CravingLogged,
  DevSession,
  DrinkLogInput,
  DrinkLogged,
  EnrolInput,
  EnrolmentView,
  FetchLike,
  HttpRequestInit,
  PlanCreateInput,
  PlanView,
  SignUpInput,
  SignedUpPerson,
  SleepDiaryInput,
  SleepDiaryLogged,
} from "./types.js";

interface SendOptions {
  readonly method: "GET" | "POST" | "PUT" | "DELETE";
  readonly path: string;
  readonly body?: unknown;
  readonly auth?: boolean;
  readonly query?: Readonly<Record<string, string | undefined>>;
}

function resolveFetch(config: ApiClientConfig): FetchLike {
  if (config.fetch !== undefined) return config.fetch;
  const platform = (globalThis as { fetch?: FetchLike }).fetch;
  if (platform === undefined) {
    throw new Error("@preventos/api-client: no fetch available — pass one in config.fetch");
  }
  return platform;
}

function buildQuery(query: Readonly<Record<string, string | undefined>>): string {
  const parts = Object.entries(query)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

/**
 * Typed, Result-returning client for apps/api — the single source of the
 * HTTP contract shared by mobile, web, and tooling. Every method maps to one
 * route; envelopes (`{ data }` / `{ error }`) are unwrapped here so callers
 * deal in domain shapes, never transport detail. No throwing on HTTP errors:
 * a non-2xx response becomes `err({ status, message })`.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | undefined;
  private readonly doFetch: FetchLike;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.getToken = config.getToken ?? (() => undefined);
    this.doFetch = resolveFetch(config);
  }

  private async send(options: SendOptions): Promise<Result<Record<string, unknown>, ApiError>> {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers["content-type"] = "application/json";
    if (options.auth) {
      const token = this.getToken();
      if (token === undefined || token === "") return err({ status: 401, message: "no session token" });
      headers["authorization"] = `Bearer ${token}`;
    }
    const init: HttpRequestInit = {
      method: options.method,
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    };
    const url = this.baseUrl + options.path + (options.query ? buildQuery(options.query) : "");

    let response;
    try {
      response = await this.doFetch(url, init);
    } catch (error) {
      return err({ status: 0, message: error instanceof Error ? error.message : "network error" });
    }
    if (response.status === 204) return ok({});

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      return response.ok
        ? ok({})
        : err({ status: response.status, message: `request failed (${response.status})` });
    }
    const envelope = (parsed ?? {}) as Record<string, unknown>;
    if (!response.ok) {
      const message = typeof envelope["error"] === "string" ? envelope["error"] : `request failed (${response.status})`;
      return err({ status: response.status, message });
    }
    return ok(envelope);
  }

  private static data<T>(envelope: Record<string, unknown>): T {
    return envelope["data"] as T;
  }

  // ---- public / dev ----

  async health(): Promise<Result<{ status: string }, ApiError>> {
    const res = await this.send({ method: "GET", path: "/health" });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  async signUp(input: SignUpInput): Promise<Result<SignedUpPerson, ApiError>> {
    const res = await this.send({ method: "POST", path: "/people", body: input });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  /** Dev-only: signs up a fresh person and returns a working session token. */
  async createDevSession(pseudonym?: string): Promise<Result<DevSession, ApiError>> {
    const res = await this.send({
      method: "POST",
      path: "/dev/session",
      body: pseudonym !== undefined ? { pseudonym } : {},
    });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  // ---- consent ----

  async grantConsent(input: ConsentInput): Promise<Result<ConsentChange, ApiError>> {
    const res = await this.send({ method: "POST", path: "/consents/grant", body: input, auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  async revokeConsent(input: ConsentInput): Promise<Result<ConsentChange, ApiError>> {
    const res = await this.send({ method: "POST", path: "/consents/revoke", body: input, auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  async checkConsent(scope: ConsentScope): Promise<Result<boolean, ApiError>> {
    const res = await this.send({
      method: "GET",
      path: "/consents/check",
      auth: true,
      query: { purpose: scope.purpose, signal: scope.signal, recipient: scope.recipient },
    });
    return res.ok ? ok(ApiClient.data<{ granted: boolean }>(res.value).granted) : res;
  }

  // ---- enrolment ----

  async enrol(input: EnrolInput): Promise<Result<EnrolmentView, ApiError>> {
    const res = await this.send({ method: "POST", path: "/enrolments", body: input, auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  // ---- plans ----

  async createPlan(input: PlanCreateInput): Promise<Result<PlanView, ApiError>> {
    const res = await this.send({ method: "POST", path: "/plans", body: input, auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  async listPlans(): Promise<Result<readonly PlanView[], ApiError>> {
    const res = await this.send({ method: "GET", path: "/plans", auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  async updatePlan(id: string, slots: Readonly<Record<string, unknown>>): Promise<Result<PlanView, ApiError>> {
    const res = await this.send({ method: "PUT", path: `/plans/${id}`, body: { slots }, auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  // ---- logs ----

  async logDrink(input: DrinkLogInput): Promise<Result<DrinkLogged, ApiError>> {
    const res = await this.send({ method: "POST", path: "/logs/drink", body: input, auth: true });
    if (!res.ok) return res;
    return ok({ ...ApiClient.data<Omit<DrinkLogged, "safety">>(res.value), safety: res.value["safety"] } as DrinkLogged);
  }

  async logSleepDiary(input: SleepDiaryInput): Promise<Result<SleepDiaryLogged, ApiError>> {
    const res = await this.send({ method: "POST", path: "/logs/sleep-diary", body: input, auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }

  async logCraving(channel: "app" | "web" = "app"): Promise<Result<CravingLogged, ApiError>> {
    const res = await this.send({ method: "POST", path: "/logs/craving", body: { channel }, auth: true });
    return res.ok ? ok(ApiClient.data(res.value)) : res;
  }
}
