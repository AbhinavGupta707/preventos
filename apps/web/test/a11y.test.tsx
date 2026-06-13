// WP3.1/3.2 — axe-core checks on every page component. The WP3.2 bar is zero
// critical violations; we hold the stricter line of zero violations full stop.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";

import Home from "../app/page";
import QuitKit from "../app/quitkit/page";
import Exhale from "../app/exhale/page";
import Steady from "../app/steady/page";
import Nightshift from "../app/nightshift/page";
import SavingsTool from "../app/tools/savings-calculator/page";
import SleepDebtTool from "../app/tools/sleep-debt/page";
import Learn from "../app/learn/page";
import ArticlePage from "../app/learn/[slug]/page";
import TodayPage from "../app/app/page";
import OnboardingPage from "../app/app/onboarding/page";
import SleepDiaryPage from "../app/app/diary/sleep/page";
import DrinkLogPage from "../app/app/drinks/page";
import ConsentPage from "../app/app/consent/page";
import { SiteNav } from "../components/site-nav";
import { SiteFooter } from "../components/site-footer";

afterEach(cleanup);

async function expectNoViolations(element: ReactElement) {
  const { container } = render(element);
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } }, // jsdom has no layout; contrast is covered by Lighthouse
  });
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  expect(results.violations.map((v) => `${v.impact}: ${v.id}`)).toEqual([]);
}

describe("marketing pages have no axe violations", () => {
  it("home", () => expectNoViolations(<Home />));
  it("quitkit", () => expectNoViolations(<QuitKit />));
  it("exhale", () => expectNoViolations(<Exhale />));
  it("steady", () => expectNoViolations(<Steady />));
  it("nightshift", () => expectNoViolations(<Nightshift />));
  it("savings calculator", () => expectNoViolations(<SavingsTool />));
  it("sleep-debt calculator", () => expectNoViolations(<SleepDebtTool />));
  it("learn hub", () => expectNoViolations(<Learn />));
  it("article page", async () => {
    const element = await ArticlePage({ params: Promise.resolve({ slug: "uk-alcohol-units-explained" }) });
    await expectNoViolations(element);
  });
  it("site nav", () => expectNoViolations(<SiteNav />));
  it("site footer", () => expectNoViolations(<SiteFooter />));
});

describe("app pages have no axe violations", () => {
  it("today (pre-onboarding)", () => expectNoViolations(<TodayPage />));
  it("onboarding", () => expectNoViolations(<OnboardingPage />));
  it("sleep diary", () => expectNoViolations(<SleepDiaryPage />));
  it("drink log", () => expectNoViolations(<DrinkLogPage />));
  it("consent centre", () => expectNoViolations(<ConsentPage />));
});
