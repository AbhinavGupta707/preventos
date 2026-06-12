import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import type { Vertical } from "@preventos/domain";

export const RELAPSE_STATES = [
  "stable",
  "at_risk",
  "lapse",
  "debrief",
  "plan_repair",
  "re_engagement",
] as const;
export type RelapseState = (typeof RELAPSE_STATES)[number];

/**
 * The universal relapse machine (PRD §3.7): one shape for every vertical.
 * A lapse can interrupt ANY state; recovery always runs debrief -> plan
 * repair -> back to stable. Dormancy routes through re_engagement.
 */
const TRANSITIONS: ReadonlyMap<RelapseState, readonly RelapseState[]> = new Map([
  ["stable", ["at_risk", "lapse", "re_engagement"]],
  ["at_risk", ["stable", "lapse", "re_engagement"]],
  ["lapse", ["debrief"]],
  ["debrief", ["plan_repair", "lapse"]],
  ["plan_repair", ["stable", "lapse"]],
  ["re_engagement", ["stable", "at_risk", "lapse"]],
]);

export function transitionRelapse(current: RelapseState, next: RelapseState): Result<RelapseState, string> {
  const allowed = TRANSITIONS.get(current) ?? [];
  if (!allowed.includes(next)) return err(`illegal relapse transition: ${current} -> ${next}`);
  return ok(next);
}

/** Per-vertical lapse definitions live in config, not code (plan §4.2). */
export const LAPSE_DEFINITIONS: Readonly<Record<Vertical, string>> = {
  smoking: "any cigarette smoked",
  vaping: "any vape session during a committed quit/taper window",
  alcohol: "a heavy-drinking day (>6 units female / >8 units male in one day)",
  sleep: "3 consecutive nights below 85% sleep efficiency",
};

/**
 * "Days won" arithmetic (PRD §3.7): the count of lapse-free days since
 * enrolment. A lapse day simply doesn't count — it never resets the total.
 * Monotone non-decreasing over time by construction.
 */
export function daysWon(enrolledOn: string, today: string, lapseDates: readonly string[]): number {
  const start = Date.parse(`${enrolledOn}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  const lapses = new Set(lapseDates);
  let won = 0;
  for (let t = start; t <= end; t += 86_400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    if (!lapses.has(day)) won += 1;
  }
  return won;
}
