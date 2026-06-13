import path from "node:path";
import { fileURLToPath } from "node:url";
import { OUTCOME_REF_IDS } from "@preventos/outcomes";
import { describe, expect, it } from "vitest";
import { compileClaimsRegister, loadClaimsRegister } from "../src/claims.js";
import { signoffRegistrySchema } from "../src/signoff.js";
import { validatePack } from "../src/validate.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = path.join(HERE, "..", "..", "..");
const REGISTER_PATH = path.join(REPO_ROOT, "compliance", "claims", "claims-register.json");

const EMPTY_SIGNOFF = signoffRegistrySchema.parse({ entries: [] });

async function compiled() {
  return compileClaimsRegister(await loadClaimsRegister(REGISTER_PATH));
}

const fixture = (name: string) => path.join(HERE, "fixtures", name);

describe("validatePack", () => {
  it("passes a clean canonical pack and produces a catalog hash", async () => {
    const report = await validatePack(fixture("validate-clean"), await compiled(), EMPTY_SIGNOFF, OUTCOME_REF_IDS);
    expect(report.errors).toEqual([]);
    expect(report.atomCount).toBeGreaterThan(0);
    expect(report.catalogHash).toBeDefined();
  });

  it("fails a pack whose copy violates the claims register (negative gate test)", async () => {
    const report = await validatePack(fixture("validate-claims"), await compiled(), EMPTY_SIGNOFF, OUTCOME_REF_IDS);
    expect(report.errors.some((e) => e.includes("claims-register violation"))).toBe(true);
  });

  it("fails approved content with no sign-off entry (safety invariant 3)", async () => {
    const report = await validatePack(fixture("validate-signoff"), await compiled(), EMPTY_SIGNOFF, OUTCOME_REF_IDS);
    expect(report.errors.some((e) => e.includes("sign-off registry"))).toBe(true);
  });

  it("reports high reading-age copy as a warning, not an error", async () => {
    const report = await validatePack(fixture("validate-dense"), await compiled(), EMPTY_SIGNOFF, OUTCOME_REF_IDS);
    expect(report.errors).toEqual([]);
    expect(report.warnings.some((w) => w.includes("reading age"))).toBe(true);
  });

  it("fails an outcome_ref that resolves to no known outcome (dangling-ref gate)", async () => {
    const report = await validatePack(fixture("validate-outcome-ref"), await compiled(), EMPTY_SIGNOFF, OUTCOME_REF_IDS);
    expect(report.errors.some((e) => e.includes("outcome_ref") && e.includes("does not resolve"))).toBe(true);
  });
});
