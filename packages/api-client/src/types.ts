import type {
  AgeBand,
  ConsentPurpose,
  Nation,
  PlanType,
  ReadinessStage,
  Sex,
  Vertical,
} from "@preventos/domain";

/**
 * Minimal structural fetch contract so this client runs unchanged on every
 * surface — React Native, the browser, and Node — without pulling in DOM or
 * Node typings. The platform's global `fetch` satisfies it structurally.
 */
export interface HttpRequestInit {
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

export interface HttpResponseLike {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type FetchLike = (url: string, init?: HttpRequestInit) => Promise<HttpResponseLike>;

export interface ApiClientConfig {
  /** Origin of apps/api, e.g. "http://127.0.0.1:3001" (no trailing slash). */
  readonly baseUrl: string;
  /** Bearer token for person-scoped routes; omit for public/dev-session calls. */
  readonly getToken?: () => string | undefined;
  /** Inject a fetch in tests; defaults to the platform global. */
  readonly fetch?: FetchLike;
}

/** A failed request: transport failure surfaces as status 0. */
export interface ApiError {
  readonly status: number;
  readonly message: string;
}

// ---- request inputs (mirror apps/api zod schemas) ----

export interface SignUpInput {
  readonly pseudonym: string;
  readonly ageBand?: AgeBand;
  readonly sex?: Sex;
  readonly language?: string;
  readonly nation?: Nation;
}

export interface ConsentInput {
  readonly purpose: ConsentPurpose;
  readonly signal?: string;
  readonly recipient?: string;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

export interface ConsentScope {
  readonly purpose: ConsentPurpose;
  readonly signal?: string;
  readonly recipient?: string;
}

export interface EnrolInput {
  readonly vertical: Vertical;
  readonly stage?: ReadinessStage;
}

export interface PlanCreateInput {
  readonly vertical: Vertical;
  readonly type: PlanType;
  readonly slots?: Readonly<Record<string, unknown>>;
}

export interface DrinkLogInput {
  readonly date: string;
  readonly units: number;
  readonly drinkType?: string;
  readonly context?: string;
}

export interface SleepDiaryInput {
  readonly date: string;
  readonly bedTime: string;
  readonly sleepOnsetLatencyMin: number;
  readonly wasoMin: number;
  readonly wakeCount?: number;
  readonly finalWakeTime: string;
  readonly riseTime: string;
  readonly quality?: number;
}

// ---- response views (mirror apps/api reply shapes) ----

export interface SignedUpPerson {
  readonly personId: string;
  readonly pseudonym: string;
}

/** Dev-only sign-up + session in one call (POST /dev/session). */
export interface DevSession {
  readonly personId: string;
  readonly token: string;
}

export interface ConsentChange {
  readonly purpose: string;
  readonly action: string;
  readonly occurredAt: string;
}

export interface EnrolmentView {
  readonly id: string;
  readonly vertical: Vertical;
  readonly status: string;
  readonly stage: string;
  readonly enrolledAt: string;
}

export interface PlanView {
  readonly id: string;
  readonly vertical: Vertical;
  readonly type: PlanType;
  readonly slots: Readonly<Record<string, unknown>>;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Server-side safety screen of inbound free text (invariant 1). */
export interface SafetyScreen {
  readonly tier: 0 | 1 | 2;
  readonly crisis: boolean;
  readonly caseId?: string;
}

export interface DrinkLogged {
  readonly id: string;
  readonly date: string;
  readonly units: number;
  readonly safety: SafetyScreen;
}

export interface SleepDiaryLogged {
  readonly id: string;
  readonly date: string;
}

export interface CravingLogged {
  readonly id: string;
  readonly occurredAt: string;
}
