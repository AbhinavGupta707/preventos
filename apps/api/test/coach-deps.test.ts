import { describe, expect, it } from "vitest";
import { FakeCoachProvider, FireworksCoachProvider } from "@preventos/coach";
import { selectCoachProviderFromEnv } from "../src/coach-deps.js";

describe("coach provider selection", () => {
  it("chooses Fireworks when FIREWORKS_API_KEY is present", () => {
    const provider = selectCoachProviderFromEnv({ FIREWORKS_API_KEY: "test-fireworks-key" });

    expect(provider).toBeInstanceOf(FireworksCoachProvider);
    expect(provider.name).toBe("fireworks");
  });

  it("keeps Fireworks as the primary path when multiple provider keys exist", () => {
    const provider = selectCoachProviderFromEnv({
      FIREWORKS_API_KEY: "test-fireworks-key",
      ANTHROPIC_API_KEY: "test-anthropic-key",
    });

    expect(provider).toBeInstanceOf(FireworksCoachProvider);
    expect(provider.name).toBe("fireworks");
  });

  it("falls back to the deterministic fake provider when no provider key exists", () => {
    const provider = selectCoachProviderFromEnv({});

    expect(provider).toBeInstanceOf(FakeCoachProvider);
    expect(provider.name).toBe("fake");
  });
});
