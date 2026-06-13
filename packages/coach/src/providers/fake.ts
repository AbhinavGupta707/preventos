import type { CoachLlmProvider, LlmRequest, LlmResponse } from "../provider.js";

export type FakeResponder = (request: LlmRequest) => string | Promise<string>;

const DEFAULT_REPLY =
  "Thanks for telling me that. What feels like the smallest next step you could take today?";

/**
 * Deterministic in-process provider for tests and local dev — no network, no
 * spend. Records every request so a test can prove the LLM was, or (for the
 * crisis-bypass invariant) was never, called. To exercise the post-filter or
 * the fallback path, pass a responder that returns a forbidden string or
 * throws.
 */
export class FakeCoachProvider implements CoachLlmProvider {
  readonly name = "fake";
  private readonly responder: FakeResponder;
  private readonly recorded: LlmRequest[] = [];

  constructor(responder: FakeResponder = () => DEFAULT_REPLY) {
    this.responder = responder;
  }

  /** Read-only view of every request this provider has been asked to generate. */
  get calls(): readonly LlmRequest[] {
    return this.recorded;
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    this.recorded.push(request);
    return { text: await this.responder(request), model: "fake-coach-v1" };
  }
}
