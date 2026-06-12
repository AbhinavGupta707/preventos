import { describe, expect, it } from "vitest";
import { err, map, ok, unwrapOr, type Result } from "../src/result.js";

describe("Result", () => {
  it("ok wraps a value", () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(42);
  });

  it("err wraps an error", () => {
    const result = err("boom");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("boom");
  });

  it("map transforms ok values and passes errors through", () => {
    const success: Result<number, string> = ok(2);
    const failure: Result<number, string> = err("boom");
    expect(unwrapOr(map(success, (n) => n * 3), 0)).toBe(6);
    expect(unwrapOr(map(failure, (n) => n * 3), -1)).toBe(-1);
  });

  it("does not mutate the original result", () => {
    const original = ok(2);
    map(original, (n) => n * 3);
    if (original.ok) expect(original.value).toBe(2);
  });
});
