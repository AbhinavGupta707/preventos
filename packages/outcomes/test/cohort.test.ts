import { describe, expect, it } from "vitest";
import { SYNTHETIC_COHORT } from "../fixtures/cohort.js";
import {
  buildEvidenceGroups,
  evaluateCohort,
  journeysFor,
} from "../src/index.js";

describe("synthetic fixture cohort", () => {
  it("is exactly 50 journeys with the planned vertical split", () => {
    expect(SYNTHETIC_COHORT).toHaveLength(50);
    expect(journeysFor(SYNTHETIC_COHORT, "smoking")).toHaveLength(16);
    expect(journeysFor(SYNTHETIC_COHORT, "vaping")).toHaveLength(12);
    expect(journeysFor(SYNTHETIC_COHORT, "alcohol")).toHaveLength(12);
    expect(journeysFor(SYNTHETIC_COHORT, "sleep")).toHaveLength(10);
  });

  it("is deterministic: person ids are unique and stable", () => {
    const ids = SYNTHETIC_COHORT.map((j) => j.personId);
    expect(new Set(ids).size).toBe(50);
    expect(ids[0]).toBe(SYNTHETIC_COHORT[0]?.personId);
  });
});

describe("cohort evaluation against all registered definitions", () => {
  const results = evaluateCohort(SYNTHETIC_COHORT);

  it("smoking: 7/16 ITT quit rate, 5 CO-verified, 3 lost to follow-up", () => {
    const smoking = results.smoking.quit;
    expect(smoking.summary).toMatchObject({
      n: 16,
      quitters: 7,
      quitRate: 7 / 16,
      coVerifiedQuitters: 5,
      lostToFollowUp: 3,
    });
  });

  it("vaping: pp7 = 6/12, pp30 = 3/12 (unreached assessments count as using)", () => {
    expect(results.vaping.pp7.summary).toMatchObject({ n: 12, abstinent: 6, rate: 0.5 });
    expect(results.vaping.pp30.summary).toMatchObject({ n: 12, abstinent: 3, rate: 0.25 });
  });

  it("alcohol: mean AUDIT-C delta −1.0 across 9 completers, 3 missing", () => {
    expect(results.alcohol.auditCDelta.summary).toMatchObject({
      n: 12,
      completers: 9,
      meanDelta: -1,
      missingFollowUp: 3,
    });
  });

  it("alcohol: drinking days decline week-on-week", () => {
    const byWeek = results.alcohol.drinkingDays.summary.meanByWeek;
    expect(byWeek[0]).toBeGreaterThan(byWeek[byWeek.length - 1] ?? Infinity);
    for (let w = 1; w < byWeek.length; w += 1) {
      expect(byWeek[w]).toBeLessThanOrEqual(byWeek[w - 1] ?? Infinity);
    }
  });

  it("sleep: SE improves and SOL/WASO shrink from first to final week", () => {
    const byWeek = results.sleep.trajectory.summary.meanByWeek;
    const first = byWeek[0];
    const last = byWeek[byWeek.length - 1];
    expect(first && last && last.se > first.se).toBe(true);
    expect(first && last && last.solMin < first.solMin).toBe(true);
    expect(first && last && last.wasoMin < first.wasoMin).toBe(true);
  });
});

describe("evidence groups (pre-suppression)", () => {
  const groups = buildEvidenceGroups(SYNTHETIC_COHORT);

  it("groups by vertical × age band with counts", () => {
    const total = groups.reduce((sum, g) => sum + g.count, 0);
    expect(total).toBe(50);
  });

  it("deliberately contains one small group (vaping 65plus, n=2) for the suppression proof", () => {
    const small = groups.find((g) => g.vertical === "vaping" && g.ageBand === "65plus");
    expect(small?.count).toBe(2);
  });

  it("every group carries a headline metric", () => {
    for (const g of groups) {
      expect(g.headline.label.length).toBeGreaterThan(0);
      expect(Number.isFinite(g.headline.value)).toBe(true);
    }
  });
});
