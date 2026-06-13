import Anthropic from "@anthropic-ai/sdk";
import type { CoachLlmProvider, LlmRequest, LlmResponse } from "../provider.js";

const DEFAULT_MODEL = "claude-opus-4-8";
const DEFAULT_TIMEOUT_MS = 30_000;

export interface ClaudeProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly timeoutMs?: number;
  /** Injectable client (tests only); production passes the apiKey. */
  readonly client?: Anthropic;
}

/**
 * The real LLM adapter (plan E6). Calls the Claude Messages API through the
 * official SDK. No sampling parameters and no `thinking` config: Opus 4.8 is
 * adaptive-only and rejects `temperature` / `budget_tokens`, and the system
 * prompt's "reply with only your message" instruction keeps thinking-disabled
 * replies fast and free of leaked reasoning. Output is buffered (not streamed)
 * because the post-filter must inspect the whole reply before any of it can
 * reach the user — streaming to the client happens later, over already-filtered
 * text.
 *
 * Dormant until an ANTHROPIC_API_KEY is present (see `claudeProviderFromEnv`):
 * with no key the API falls back to the deterministic FakeCoachProvider, so CI
 * and local runs never spend money.
 */
export class ClaudeCoachProvider implements CoachLlmProvider {
  readonly name = "claude";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(options: ClaudeProviderOptions) {
    this.client =
      options.client ??
      new Anthropic({
        apiKey: options.apiKey,
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxRetries: 2,
      });
    this.model = options.model ?? DEFAULT_MODEL;
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens,
      system: request.system,
      messages: request.messages.map((turn) => ({ role: turn.role, content: turn.content })),
    });
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    if (text === "") throw new Error("Claude returned no text content");
    return { text, model: message.model };
  }
}

/**
 * Builds the Claude provider from the environment, or returns undefined when no
 * key is configured (the API then uses the FakeCoachProvider). COACH_MODEL
 * overrides the default model; owners can point it at a cheaper tier.
 */
export function claudeProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ClaudeCoachProvider | undefined {
  const apiKey = env["ANTHROPIC_API_KEY"];
  if (apiKey === undefined || apiKey === "") return undefined;
  const model = env["COACH_MODEL"];
  return new ClaudeCoachProvider(model !== undefined && model !== "" ? { apiKey, model } : { apiKey });
}
