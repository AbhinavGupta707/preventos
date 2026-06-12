import { describe, expect, it } from "vitest";
import { decisionPoints } from "../src/scheduler.js";

describe("decision-point scheduler", () => {
  const enrolment = { vertical: "smoking" as const, enrolledOn: "2026-06-01", quitDate: "2026-06-15" };

  it("a six-week journey fires every expected point exactly once, deterministically", () => {
    const points = decisionPoints(enrolment, "2026-06-01", "2026-07-13");
    const again = decisionPoints(enrolment, "2026-06-01", "2026-07-13");
    expect(JSON.stringify(points)).toBe(JSON.stringify(again));
    const days = 43;
    const anchors = points.filter((p) => p.kind === "morning_anchor" || p.kind === "evening_anchor");
    expect(anchors.length).toBe(days * 2);
    const countdown = points.filter((p) => p.kind === "quit_countdown");
    expect(countdown.length).toBe(15);
    expect(countdown[0]?.at.startsWith("2026-06-08")).toBe(true);
    expect(countdown.at(-1)?.at.startsWith("2026-06-22")).toBe(true);
    const outcome = points.filter((p) => p.kind === "outcome_window");
    expect(outcome.length).toBe(1);
    expect(outcome[0]?.at.startsWith("2026-07-13")).toBe(true);
  });

  it("emits nothing before enrolment and nothing without a quit date for quit kinds", () => {
    const early = decisionPoints(enrolment, "2026-05-01", "2026-05-31");
    expect(early.length).toBe(0);
    const noQuit = decisionPoints({ vertical: "sleep", enrolledOn: "2026-06-01" }, "2026-06-01", "2026-06-30");
    expect(noQuit.every((p) => p.kind === "morning_anchor" || p.kind === "evening_anchor")).toBe(true);
  });
});
