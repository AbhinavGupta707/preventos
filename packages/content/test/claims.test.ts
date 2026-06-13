import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compileClaimsRegister, lintAtomClaims, lintTextClaims, loadClaimsRegister } from "../src/claims.js";
import type { ResolvedAtom } from "../src/schema.js";

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const REGISTER_PATH = path.join(REPO_ROOT, "compliance", "claims", "claims-register.json");

function sleepAtom(body: string): ResolvedAtom {
  return {
    id: "sleep.test.atom",
    type: "message",
    body,
    channelVariants: {},
    toneVariants: {},
    slots: [],
    bct: [{ code: "1.1", label: "Goal setting (behaviour)" }],
    comB: ["reflective-motivation"],
    readingAge: 9,
    tone: "autonomy-supportive",
    channels: ["app"],
    vertical: "sleep",
    contraindications: [],
    status: "draft",
    language: "en-GB",
    pack: "sleep",
    module: "test",
  };
}

describe("claims register lint", () => {
  it("loads and compiles the real register", async () => {
    const register = await loadClaimsRegister(REGISTER_PATH);
    const compiled = compileClaimsRegister(register);
    expect(compiled.length).toBeGreaterThanOrEqual(3);
  });

  it("blocks every shouldBlock test vector with the expected list", async () => {
    const register = await loadClaimsRegister(REGISTER_PATH);
    const compiled = compileClaimsRegister(register);
    for (const vector of register.testVectors.shouldBlock) {
      const violations = lintTextClaims(compiled, vector.text, "marketing");
      expect(
        violations.map((v) => v.listId),
        `expected "${vector.text}" to be blocked by ${vector.expectList}`,
      ).toContain(vector.expectList);
    }
  });

  it("passes every shouldPass test vector in every scope", async () => {
    const register = await loadClaimsRegister(REGISTER_PATH);
    const compiled = compileClaimsRegister(register);
    const scopes = ["marketing", "content/sleep", "content/alcohol", "content/smoking", "content/vaping"];
    for (const text of register.testVectors.shouldPass) {
      for (const scope of scopes) {
        expect(lintTextClaims(compiled, text, scope), `"${text}" must pass in ${scope}`).toEqual([]);
      }
    }
  });

  it("scopes sleep-only patterns to sleep copy", async () => {
    const register = await loadClaimsRegister(REGISTER_PATH);
    const compiled = compileClaimsRegister(register);
    const text = "This programme is based on CBT-I.";
    expect(lintTextClaims(compiled, text, "content/sleep").length).toBeGreaterThan(0);
    expect(lintTextClaims(compiled, text, "content/smoking")).toEqual([]);
  });

  it("lints every text surface of an atom (safety invariant 5)", async () => {
    const register = await loadClaimsRegister(REGISTER_PATH);
    const compiled = compileClaimsRegister(register);
    expect(lintAtomClaims(compiled, sleepAtom("We can treat your insomnia.")).length).toBeGreaterThan(0);
    expect(
      lintAtomClaims(compiled, {
        ...sleepAtom("Wind down gently tonight."),
        toneVariants: { "warm-challenge": "Our app cures insomnia, honestly." },
      }).length,
    ).toBeGreaterThan(0);
    expect(lintAtomClaims(compiled, sleepAtom("Build a sleep routine that works for you."))).toEqual([]);
  });
});
