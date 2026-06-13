import type { CoachLlmProvider, LlmRequest, LlmResponse } from "../provider.js";

const DEFAULT_BASE_URL = "https://api.fireworks.ai/inference/v1";
const DEFAULT_MODEL = "accounts/fireworks/models/llama-v3p3-70b-instruct";
const DEFAULT_TIMEOUT_MS = 30_000;

/** The subset of the global `fetch` this adapter uses; injectable for tests. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface FireworksProviderOptions {
  readonly apiKey: string;
  /** Default model when a request carries no per-request override. */
  readonly model?: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  /** Injectable fetch (tests only); production uses the global fetch. */
  readonly fetch?: FetchLike;
}

/** The OpenAI-compatible chat-completions response shape we read. */
interface ChatCompletion {
  readonly model?: string;
  readonly choices?: ReadonlyArray<{ readonly message?: { readonly content?: string } }>;
}

/**
 * Fireworks AI adapter (OpenAI-compatible Chat Completions). A drop-in second
 * provider behind the same `CoachLlmProvider` port the Claude adapter implements,
 * so the policy proxy (pre-filter → LLM → post-filter) is identical regardless of
 * which model answers. Like the Claude adapter it is sandboxed behind the port:
 * it never sees the data layer, only the spotlighted, minimised frame.
 *
 * Default model is Llama 3.3 70B Instruct; `COACH_MODEL` overrides the default,
 * and an individual `LlmRequest.model` overrides per request so a frame can route
 * simple vs complex turns to different models. Dormant until `FIREWORKS_API_KEY`
 * is present (see `fireworksProviderFromEnv`); with no key the API falls back to
 * the deterministic FakeCoachProvider, so CI and local runs never spend money.
 */
export class FireworksCoachProvider implements CoachLlmProvider {
  readonly name = "fireworks";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchLike;

  constructor(options: FireworksProviderOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_MODEL;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetch ?? ((url, init) => fetch(url, init));
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const model = request.model ?? this.model;
    const body = {
      model,
      max_tokens: request.maxTokens,
      // The system prompt is the privileged instruction layer; in the
      // OpenAI-compatible schema it rides as the first message.
      messages: [
        { role: "system", content: request.system },
        ...request.messages.map((turn) => ({ role: turn.role, content: turn.content })),
      ],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new Error(`Fireworks request failed: ${response.status} ${response.statusText}`);
    }
    const payload = (await response.json()) as ChatCompletion;
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (text === "") throw new Error("Fireworks returned no text content");
    return { text, model: payload.model ?? model };
  }
}

/**
 * Builds the Fireworks provider from the environment, or returns undefined when
 * no key is configured (the API then falls back to the next provider in the
 * chain). COACH_MODEL overrides the default model.
 */
export function fireworksProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): FireworksCoachProvider | undefined {
  const apiKey = env["FIREWORKS_API_KEY"];
  if (apiKey === undefined || apiKey === "") return undefined;
  const model = env["COACH_MODEL"];
  return new FireworksCoachProvider(
    model !== undefined && model !== "" ? { apiKey, model } : { apiKey },
  );
}
