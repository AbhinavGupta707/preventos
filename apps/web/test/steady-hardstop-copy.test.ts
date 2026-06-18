import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { PROGRAMMES } from "../lib/copy/programmes";

const ONBOARDING_PATH = join(__dirname, "..", "app", "app", "onboarding", "page.tsx");
const DRINK_LOG_PATH = join(__dirname, "..", "app", "app", "drinks", "page.tsx");
const PROGRAMME_ACCESS_PATH = join(__dirname, "..", "lib", "programme-access.ts");

describe("Steady user-facing hard-stop copy — safety invariant 4", () => {
  it("programme copy routes dependence indicators to referral-only support", () => {
    const steady = PROGRAMMES.find((programme) => programme.slug === "steady");
    expect(steady).toBeDefined();
    expect(steady?.signpost).toMatch(/GP/i);
    expect(steady?.signpost).toMatch(/Drinkline/);
    expect(steady?.signpost).toMatch(/not the right tool/i);
    expect(steady?.signpost).not.toMatch(/detox plan|safe level|treat alcohol dependence/i);
  });

  it("web app Steady entry and drink-log surfaces keep dependence referral visible", () => {
    const onboarding = readFileSync(ONBOARDING_PATH, "utf8");
    const drinkLog = readFileSync(DRINK_LOG_PATH, "utf8");
    const programmeAccess = readFileSync(PROGRAMME_ACCESS_PATH, "utf8");

    for (const source of [onboarding, drinkLog]) {
      expect(source).toMatch(/shakes, sweats/i);
      expect(source).toMatch(/Drinkline/);
      expect(source).toMatch(/GP/i);
      expect(source).not.toMatch(/detox plan|safe drinking|safe level/i);
    }
    expect(onboarding).toContain("Steady is not the right tool");
    expect(programmeAccess).toContain("NEXT_PUBLIC_PREVENTOS_ENABLE_STEADY_INTERNAL");
    expect(drinkLog).toContain("that needs proper medical support");
    expect(drinkLog).toContain("This log is not withdrawal support");
    expect(drinkLog).toContain("programmeAccess(\"steady\")");
  });
});
