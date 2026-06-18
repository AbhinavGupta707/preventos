import { describe, expect, it } from "vitest";
import { createFixedWindowRateLimiter } from "../lib/rate-limit";

describe("createFixedWindowRateLimiter", () => {
  it("allows the configured number of hits, then blocks inside the same window", () => {
    let now = 1_000;
    const limiter = createFixedWindowRateLimiter({
      windowMs: 60_000,
      maxPerWindow: 2,
      maxBuckets: 10,
      clock: () => now,
    });

    expect(limiter.isRateLimited("198.51.100.7")).toBe(false);
    expect(limiter.isRateLimited("198.51.100.7")).toBe(false);
    expect(limiter.isRateLimited("198.51.100.7")).toBe(true);

    now += 60_001;
    expect(limiter.isRateLimited("198.51.100.7")).toBe(false);
  });

  it("prunes expired buckets", () => {
    let now = 1_000;
    const limiter = createFixedWindowRateLimiter({
      windowMs: 100,
      maxPerWindow: 1,
      maxBuckets: 10,
      clock: () => now,
    });

    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.isRateLimited("b")).toBe(false);
    expect(limiter.size()).toBe(2);

    now += 101;
    expect(limiter.size()).toBe(0);
  });

  it("keeps the bucket map bounded under many unique keys", () => {
    let now = 1_000;
    const limiter = createFixedWindowRateLimiter({
      windowMs: 60_000,
      maxPerWindow: 5,
      maxBuckets: 3,
      clock: () => now,
    });

    expect(limiter.isRateLimited("a")).toBe(false);
    now += 1;
    expect(limiter.isRateLimited("b")).toBe(false);
    now += 1;
    expect(limiter.isRateLimited("c")).toBe(false);
    now += 1;
    expect(limiter.isRateLimited("d")).toBe(false);

    expect(limiter.size()).toBe(3);
    expect(limiter.isRateLimited("a")).toBe(false);
    expect(limiter.size()).toBe(3);
  });
});
