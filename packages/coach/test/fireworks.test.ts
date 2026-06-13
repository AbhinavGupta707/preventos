import { describe, expect, it } from "vitest";
import { FireworksCoachProvider, fireworksProviderFromEnv } from "../src/index.js";
import type { LlmRequest } from "../src/index.js";

/** A canned OpenAI-compatible completion body. */
function completion(text: string, model = "accounts/fireworks/models/llama-v3p3-70b-instruct") {
  return JSON.stringify({
    model,
    choices: [{ message: { role: "assistant", content: text } }],
  });
}

/** Records the single fetch call so the test can assert URL/headers/body. */
function recordingFetch(responseBody: string, init: ResponseInit = { status: 200 }) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = (url: string, requestInit: RequestInit): Promise<Response> => {
    calls.push({ url, init: requestInit });
    return Promise.resolve(new Response(responseBody, init));
  };
  return { calls, fetchFn };
}

const baseRequest: LlmRequest = {
  system: "You are the PreventOS coach.",
  messages: [{ role: "user", content: "tough day but I didn't smoke" }],
  maxTokens: 256,
};

describe("FireworksCoachProvider — OpenAI-compatible adapter", () => {
  it("calls the chat-completions endpoint with system-first messages and returns the reply", async () => {
    const { calls, fetchFn } = recordingFetch(completion("That takes real strength."));
    const provider = new FireworksCoachProvider({ apiKey: "fw-key", fetch: fetchFn });

    const response = await provider.generate(baseRequest);

    expect(response.text).toBe("That takes real strength.");
    expect(provider.name).toBe("fireworks");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.fireworks.ai/inference/v1/chat/completions");

    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer fw-key");
    expect(headers["content-type"]).toBe("application/json");

    const body = JSON.parse(calls[0]?.init.body as string);
    expect(body.model).toBe("accounts/fireworks/models/llama-v3p3-70b-instruct");
    expect(body.max_tokens).toBe(256);
    expect(body.messages).toEqual([
      { role: "system", content: "You are the PreventOS coach." },
      { role: "user", content: "tough day but I didn't smoke" },
    ]);
  });

  it("honours a per-request model override (frames route simple vs complex turns)", async () => {
    const { calls, fetchFn } = recordingFetch(completion("ok", "accounts/fireworks/models/llama-v3p1-8b-instruct"));
    const provider = new FireworksCoachProvider({ apiKey: "fw-key", fetch: fetchFn });

    const response = await provider.generate({
      ...baseRequest,
      model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    });

    const body = JSON.parse(calls[0]?.init.body as string);
    expect(body.model).toBe("accounts/fireworks/models/llama-v3p1-8b-instruct");
    // The returned model echoes what the API reports.
    expect(response.model).toBe("accounts/fireworks/models/llama-v3p1-8b-instruct");
  });

  it("uses the constructor default model and base URL overrides", async () => {
    const { calls, fetchFn } = recordingFetch(completion("hi", "custom/model"));
    const provider = new FireworksCoachProvider({
      apiKey: "fw-key",
      model: "custom/model",
      baseUrl: "https://proxy.internal/v1",
      fetch: fetchFn,
    });

    await provider.generate(baseRequest);

    expect(calls[0]?.url).toBe("https://proxy.internal/v1/chat/completions");
    expect(JSON.parse(calls[0]?.init.body as string).model).toBe("custom/model");
  });

  it("throws on a non-2xx response (the pipeline turns this into a safe fallback)", async () => {
    const { fetchFn } = recordingFetch("rate limited", { status: 429, statusText: "Too Many Requests" });
    const provider = new FireworksCoachProvider({ apiKey: "fw-key", fetch: fetchFn });

    await expect(provider.generate(baseRequest)).rejects.toThrow(/429/);
  });

  it("throws when the completion carries no text content", async () => {
    const { fetchFn } = recordingFetch(JSON.stringify({ model: "m", choices: [{ message: { content: "" } }] }));
    const provider = new FireworksCoachProvider({ apiKey: "fw-key", fetch: fetchFn });

    await expect(provider.generate(baseRequest)).rejects.toThrow(/no text content/);
  });
});

describe("fireworksProviderFromEnv — dormant without a key", () => {
  it("returns undefined when FIREWORKS_API_KEY is absent", () => {
    expect(fireworksProviderFromEnv({})).toBeUndefined();
    expect(fireworksProviderFromEnv({ FIREWORKS_API_KEY: "" })).toBeUndefined();
  });

  it("builds a provider from FIREWORKS_API_KEY", () => {
    const provider = fireworksProviderFromEnv({ FIREWORKS_API_KEY: "fw-key" });
    expect(provider).toBeInstanceOf(FireworksCoachProvider);
    expect(provider?.name).toBe("fireworks");
  });

  it("respects COACH_MODEL as the default model (via the global fetch)", async () => {
    const { calls, fetchFn } = recordingFetch(completion("ok", "accounts/fireworks/models/llama-v3p1-8b-instruct"));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchFn as unknown as typeof fetch;
    try {
      const provider = fireworksProviderFromEnv({
        FIREWORKS_API_KEY: "fw-key",
        COACH_MODEL: "accounts/fireworks/models/llama-v3p1-8b-instruct",
      });
      await provider!.generate(baseRequest);
    } finally {
      globalThis.fetch = originalFetch;
    }
    expect(JSON.parse(calls[0]?.init.body as string).model).toBe(
      "accounts/fireworks/models/llama-v3p1-8b-instruct",
    );
  });
});
