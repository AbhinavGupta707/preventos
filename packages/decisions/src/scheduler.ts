import type { Vertical } from "@preventos/domain";

export interface DecisionPoint {
  readonly at: string;
  readonly kind: "morning_anchor" | "evening_anchor" | "quit_countdown" | "outcome_window";
  readonly vertical: Vertical;
}

export interface EnrolmentSchedule {
  readonly vertical: Vertical;
  readonly enrolledOn: string;
  readonly quitDate?: string;
}

const addDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * Pure decision-point generator: given an enrolment and a date range, returns
 * every point exactly once, deterministically (plan WP5.2 time-warp testing).
 * Anchors fire daily; quit-countdown fires daily from 7 days pre-quit to
 * 7 days post-quit; the Russell-Standard outcome window prompt fires at
 * quit + 28 days.
 */
export function decisionPoints(enrolment: EnrolmentSchedule, from: string, to: string): readonly DecisionPoint[] {
  const points: DecisionPoint[] = [];
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return points;
  for (let t = start; t <= end; t += 86_400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    if (day < enrolment.enrolledOn) continue;
    points.push({ at: `${day}T08:30`, kind: "morning_anchor", vertical: enrolment.vertical });
    points.push({ at: `${day}T19:00`, kind: "evening_anchor", vertical: enrolment.vertical });
    if (enrolment.quitDate !== undefined) {
      if (day >= addDays(enrolment.quitDate, -7) && day <= addDays(enrolment.quitDate, 7)) {
        points.push({ at: `${day}T12:00`, kind: "quit_countdown", vertical: enrolment.vertical });
      }
      if (day === addDays(enrolment.quitDate, 28)) {
        points.push({ at: `${day}T10:00`, kind: "outcome_window", vertical: enrolment.vertical });
      }
    }
  }
  return points;
}
