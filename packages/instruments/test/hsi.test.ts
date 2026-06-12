import { describe, expect, it } from "vitest";

import { HSI, assertServable, scoreHsi } from "../src/index.js";

describe("HSI definition (invariant 2: verbatim, never paraphrased)", () => {
  it("renders the two FTND items verbatim (Heatherton et al. 1991)", () => {
    expect(HSI.items[0]?.text).toBe(
      "How soon after you wake up do you smoke your first cigarette?",
    );
    expect(HSI.items[0]?.options.map((o) => o.label)).toEqual([
      "Within 5 minutes",
      "6 to 30 minutes",
      "31 to 60 minutes",
      "After 60 minutes",
    ]);
    expect(HSI.items[1]?.text).toBe("How many cigarettes per day do you smoke?");
    expect(HSI.items[1]?.options.map((o) => o.label)).toEqual([
      "10 or less",
      "11 to 20",
      "21 to 30",
      "31 or more",
    ]);
  });

  it("carries licensing status and citation (E19 wiring)", () => {
    expect(HSI.licensingStatus).toBe("cleared-with-conditions");
    expect(HSI.citation).toContain("Heatherton");
  });

  it("option values follow published FTND scoring", () => {
    expect(HSI.items[0]?.options.map((o) => o.value)).toEqual([3, 2, 1, 0]);
    expect(HSI.items[1]?.options.map((o) => o.value)).toEqual([0, 1, 2, 3]);
  });
});

describe("scoreHsi — published scoring test vectors", () => {
  const vectors: ReadonlyArray<{
    answers: readonly [number, number];
    total: number;
    category: string;
  }> = [
    { answers: [0, 0], total: 0, category: "low" },
    { answers: [1, 1], total: 2, category: "low" },
    { answers: [2, 1], total: 3, category: "moderate" },
    { answers: [2, 2], total: 4, category: "moderate" },
    { answers: [3, 2], total: 5, category: "high" },
    { answers: [3, 3], total: 6, category: "high" },
  ];

  for (const v of vectors) {
    it(`scores ${JSON.stringify(v.answers)} as ${v.total} (${v.category})`, () => {
      const result = scoreHsi({ timeToFirstCigarette: v.answers[0], cigarettesPerDay: v.answers[1] });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.total).toBe(v.total);
        expect(result.value.category).toBe(v.category);
      }
    });
  }

  it("rejects out-of-range answers", () => {
    expect(scoreHsi({ timeToFirstCigarette: 4, cigarettesPerDay: 0 }).ok).toBe(false);
    expect(scoreHsi({ timeToFirstCigarette: -1, cigarettesPerDay: 0 }).ok).toBe(false);
    expect(scoreHsi({ timeToFirstCigarette: 1.5, cigarettesPerDay: 0 }).ok).toBe(false);
  });
});

describe("assertServable — unlicensed instruments are unreachable (WP4.4 accept)", () => {
  it("allows cleared and cleared-with-conditions instruments", () => {
    expect(assertServable(HSI).ok).toBe(true);
  });

  it("blocks instruments without a cleared licensing status", () => {
    const blocked = { ...HSI, licensingStatus: "blocked-pending-license" as const };
    const result = assertServable(blocked);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("licensing");
  });
});
