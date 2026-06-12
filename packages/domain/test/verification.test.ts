import { describe, expect, it } from "vitest";
import { VERIFICATION_TIERS, compareTiers, upgradeTier } from "../src/verification.js";

describe("verification tiers", () => {
  it("orders self_report < corroborated < verified", () => {
    expect(compareTiers("self_report", "corroborated")).toBeLessThan(0);
    expect(compareTiers("corroborated", "verified")).toBeLessThan(0);
    expect(compareTiers("verified", "verified")).toBe(0);
  });

  it("upgradeTier never downgrades, for any pair of tiers", () => {
    for (const current of VERIFICATION_TIERS) {
      for (const incoming of VERIFICATION_TIERS) {
        const upgraded = upgradeTier(current, incoming);
        expect(compareTiers(upgraded, current)).toBeGreaterThanOrEqual(0);
        expect(compareTiers(upgraded, incoming)).toBeGreaterThanOrEqual(0);
        expect([current, incoming]).toContain(upgraded);
      }
    }
  });
});
