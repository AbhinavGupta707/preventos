import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = join(__dirname, "..", "app");
const programmePicker = readFileSync(join(appRoot, "onboarding", "programme.tsx"), "utf8");
const steadyReferral = readFileSync(join(appRoot, "steady-referral.tsx"), "utf8");
const sleepDiary = readFileSync(join(appRoot, "sleep-diary.tsx"), "utf8");

describe("mobile Steady and Nightshift launch boundaries", () => {
  it("keeps Steady referral-only from the programme picker", () => {
    expect(programmePicker).toContain("Referral only");
    expect(programmePicker).toContain("/steady-referral");
    expect(steadyReferral).toContain("No drink log, no reduction plan, and no coach path");
    expect(steadyReferral).toMatch(/Drinkline/);
    expect(steadyReferral).toMatch(/GP/);
    expect(steadyReferral).not.toMatch(/safe drinking|safe level|detox plan|treat alcohol dependence/i);
  });

  it("keeps the Nightshift diary wellbeing-framed", () => {
    expect(sleepDiary).toContain("No score to chase");
    expect(sleepDiary).toMatch(/speak to a qualified\s+health professional/);
    expect(sleepDiary).not.toMatch(/treat(s|ment)? insomnia|CBT-?I|sleep therapy|medical device/i);
  });
});
