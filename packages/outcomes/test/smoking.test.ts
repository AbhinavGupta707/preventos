import { describe, expect, it } from "vitest";
import { SMOKING_RUSSELL_4W, evaluateSmokingQuit } from "../src/index.js";
import type { SmokingJourney } from "../src/index.js";

function journey(personId: string, followUp4w: SmokingJourney["followUp4w"]): SmokingJourney {
  return {
    personId,
    vertical: "smoking",
    ageBand: "25-44",
    enrolledAt: "2026-01-05",
    quitDate: "2026-01-12",
    followUp4w,
  };
}

describe("Russell-Standard-compatible 4-week quit", () => {
  it("counts ≤5 cigarettes after the grace period as quit", () => {
    const result = evaluateSmokingQuit(SMOKING_RUSSELL_4W, [
      journey("p1", { reached: true, cigarettesAfterGrace: 0 }),
      journey("p2", { reached: true, cigarettesAfterGrace: 5 }),
      journey("p3", { reached: true, cigarettesAfterGrace: 6 }),
    ]);
    expect(result.perPerson.map((p) => p.status)).toEqual(["quit", "quit", "not_quit"]);
    expect(result.summary).toMatchObject({ n: 3, quitters: 2, quitRate: 2 / 3 });
  });

  it("ITT: lost to follow-up is a non-quitter but stays in the denominator", () => {
    const result = evaluateSmokingQuit(SMOKING_RUSSELL_4W, [
      journey("p1", { reached: true, cigarettesAfterGrace: 0 }),
      journey("p2", { reached: false }),
    ]);
    expect(result.perPerson[1]?.status).toBe("lost_to_follow_up");
    expect(result.summary).toMatchObject({ n: 2, quitters: 1, quitRate: 0.5, lostToFollowUp: 1 });
  });

  it("a CO reading at/above threshold overrides self-report", () => {
    const result = evaluateSmokingQuit(SMOKING_RUSSELL_4W, [
      journey("p1", { reached: true, cigarettesAfterGrace: 0, coPpm: 10 }),
    ]);
    expect(result.perPerson[0]?.status).toBe("not_quit");
  });

  it("CO below threshold marks the quit verified; absent CO leaves it self-report only", () => {
    const result = evaluateSmokingQuit(SMOKING_RUSSELL_4W, [
      journey("p1", { reached: true, cigarettesAfterGrace: 0, coPpm: 4 }),
      journey("p2", { reached: true, cigarettesAfterGrace: 0 }),
    ]);
    expect(result.perPerson.map((p) => p.coVerified)).toEqual([true, false]);
    expect(result.summary.coVerifiedQuitters).toBe(1);
  });

  it("pins the evaluating definition ref into the result", () => {
    const result = evaluateSmokingQuit(SMOKING_RUSSELL_4W, []);
    expect(result.definitionRef).toMatch(/^smoking\.quit\.russell_standard_4w@1#/);
  });
});
