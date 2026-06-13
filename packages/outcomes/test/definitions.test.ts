import { describe, expect, it } from "vitest";
import {
  OUTCOME_DEFINITIONS,
  SMOKING_RUSSELL_4W,
  definitionRef,
  getDefinition,
  outcomeDefinitionSchema,
} from "../src/index.js";

describe("outcome definition registry", () => {
  it("every registered definition is schema-valid and uniquely identified", () => {
    const ids = OUTCOME_DEFINITIONS.map((d) => `${d.id}@${d.version}`);
    expect(new Set(ids).size).toBe(OUTCOME_DEFINITIONS.length);
    for (const def of OUTCOME_DEFINITIONS) {
      expect(() => outcomeDefinitionSchema.parse(def)).not.toThrow();
    }
  });

  it("covers all four verticals", () => {
    const verticals = new Set(OUTCOME_DEFINITIONS.map((d) => d.vertical));
    expect(verticals).toEqual(new Set(["smoking", "vaping", "alcohol", "sleep"]));
  });

  it("looks definitions up by id@version", () => {
    expect(getDefinition("smoking.quit.russell_standard_4w@1")).toEqual(SMOKING_RUSSELL_4W);
    expect(getDefinition("smoking.quit.russell_standard_4w@99")).toBeNull();
  });

  it("the smoking definition is ITT: lost to follow-up counts as non-quitter", () => {
    expect(SMOKING_RUSSELL_4W.params.lostToFollowUpIsNonQuitter).toBe(true);
  });

  it("definition refs are content-addressed and pinnable", () => {
    const ref = definitionRef(SMOKING_RUSSELL_4W);
    expect(ref).toMatch(/^smoking\.quit\.russell_standard_4w@1#[0-9a-f]{12}$/);
    // Identical content hashes identically (replay pinning)…
    expect(definitionRef(structuredClone(SMOKING_RUSSELL_4W))).toBe(ref);
    // …and any parameter change produces a different ref.
    const tampered = {
      ...SMOKING_RUSSELL_4W,
      params: { ...SMOKING_RUSSELL_4W.params, maxCigarettesAfterGrace: 6 },
    };
    expect(definitionRef(tampered)).not.toBe(ref);
  });

  it("has no SCI definition (deferred pending license — WP10.4)", () => {
    expect(OUTCOME_DEFINITIONS.some((d) => d.id.includes("sci"))).toBe(false);
  });
});
