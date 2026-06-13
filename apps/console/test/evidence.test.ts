import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { K_ANONYMITY_THRESHOLD } from "@preventos/auth";
import { SYNTHETIC_COHORT, buildEvidenceGroups } from "@preventos/outcomes";
import { getEvidenceSummary } from "../lib/evidence";
import EvidencePage from "../app/evidence/page";

describe("evidence summary — k-anonymity enforced server-side", () => {
  it("the raw cohort really does contain a small group (the thing that must never render)", () => {
    const raw = buildEvidenceGroups(SYNTHETIC_COHORT);
    expect(raw.some((g) => g.count < K_ANONYMITY_THRESHOLD)).toBe(true);
  });

  it("the summary served to the UI has no group below k", () => {
    const summary = getEvidenceSummary();
    expect(summary.groups.length).toBeGreaterThan(0);
    for (const group of summary.groups) {
      expect(group.count).toBeGreaterThanOrEqual(K_ANONYMITY_THRESHOLD);
    }
    expect(summary.groups.some((g) => g.key === "vaping:65plus")).toBe(false);
    expect(summary.suppressedGroupCount).toBe(1);
  });
});

describe("evidence page — the UI cannot render small groups", () => {
  it("rendered markup never contains the suppressed group's age band", () => {
    const markup = renderToStaticMarkup(createElement(EvidencePage));
    // The only 65plus members in the fixture are the n=2 vaping group.
    expect(markup).not.toContain("65plus");
    // Sanity: large groups DO render, so absence above is suppression, not a blank page.
    expect(markup).toContain("smoking:18-24");
  });

  it("every count rendered in the groups table is ≥ k", () => {
    const markup = renderToStaticMarkup(createElement(EvidencePage));
    const counts = [...markup.matchAll(/data-group-count="(\d+)"/g)].map((m) => Number(m[1]));
    expect(counts.length).toBeGreaterThan(0);
    for (const count of counts) {
      expect(count).toBeGreaterThanOrEqual(K_ANONYMITY_THRESHOLD);
    }
  });
});
