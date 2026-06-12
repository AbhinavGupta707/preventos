import { describe, expect, it } from "vitest";
import { VERTICALS, isVertical } from "../src/verticals.js";

describe("verticals", () => {
  it("contains exactly the four launch verticals", () => {
    expect(VERTICALS).toEqual(["smoking", "vaping", "alcohol", "sleep"]);
  });

  it("isVertical accepts members and rejects non-members", () => {
    for (const vertical of VERTICALS) expect(isVertical(vertical)).toBe(true);
    expect(isVertical("gambling")).toBe(false);
    expect(isVertical("")).toBe(false);
  });
});
