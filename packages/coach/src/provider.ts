export interface LlmTurn {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface LlmRequest {
  readonly system: string;
  readonly messages: readonly LlmTurn[];
  readonly maxTokens: number;
  /**
   * Optional per-request model override. A frame may route a simple turn to a
   * cheaper/faster model and a complex one to a larger model; when unset the
   * provider uses its configured default (COACH_MODEL or the built-in default).
   */
  readonly model?: string;
}

export interface LlmResponse {
  readonly text: string;
  readonly model: string;
}

/**
 * The LLM provider port (plan E6: "Claude API behind an in-house
 * policy-enforcement proxy; provider port for dual-provider later").
 *
 * The ONLY implementations of this port live in this package, and the ONLY
 * caller is `runCoachTurn` — which always runs the deterministic pre-filter
 * before, and the deterministic post-filter after, every `generate` call.
 * There is no other path from the application to the model (E7: guardrails
 * outside the model). A lint boundary forbids importing the Anthropic SDK
 * anywhere but this package.
 */
export interface CoachLlmProvider {
  readonly name: string;
  generate(request: LlmRequest): Promise<LlmResponse>;
}
