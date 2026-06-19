import { describe, expect, it } from "vitest";
import { buildPushProvider, NoopPushProvider } from "../src/push.js";

describe("push delivery provider", () => {
  it("defaults to the no-op provider and never calls a real push service", async () => {
    const provider = buildPushProvider({});
    expect(provider).toBeInstanceOf(NoopPushProvider);
    await expect(
      provider.send({
        token: "ExponentPushToken[test]",
        title: "PreventOS",
        body: "Queued locally",
      }),
    ).resolves.toEqual({ status: "skipped", reason: "noop-provider" });
  });

  it("accepts explicit noop/disabled env values", () => {
    expect(buildPushProvider({ PUSH_PROVIDER: "noop" }).name).toBe("noop");
    expect(buildPushProvider({ PUSH_PROVIDER: "disabled" }).name).toBe("noop");
  });

  it("fails fast instead of creating an unverified provider path", () => {
    expect(() => buildPushProvider({ PUSH_PROVIDER: "expo" })).toThrow(/Unsupported PUSH_PROVIDER/);
  });
});
