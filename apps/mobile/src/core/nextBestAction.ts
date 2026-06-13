import type { Vertical } from "@preventos/domain";

export interface TodayContext {
  readonly enrolledVerticals: readonly Vertical[];
  readonly pendingDebrief: boolean;
  readonly checkinDoneToday: boolean;
  readonly hasIfThenPlan: boolean;
  readonly daysUntilQuitDate?: number;
}

export type ActionKind = "debrief" | "checkin" | "countdown" | "make_plan" | "encourage";

export interface NextAction {
  readonly id: string;
  readonly kind: ActionKind;
  readonly title: string;
  readonly body: string;
  readonly route: string;
}

/**
 * One next-best-action across all enrolled programmes — never one feed per
 * programme (plan §2.1). Local stand-in for server-side arbitration: the API
 * port exposes the same shape so SVC's DecisionRecords can drive this surface
 * without UI changes.
 */
export const nextBestAction = (ctx: TodayContext): NextAction => {
  if (ctx.pendingDebrief) {
    return {
      id: "debrief",
      kind: "debrief",
      title: "About yesterday",
      body: "A slip is a data point, not a verdict. Two minutes to take what it can teach you.",
      route: "/debrief",
    };
  }
  if (!ctx.checkinDoneToday) {
    return {
      id: "checkin",
      kind: "checkin",
      title: "Morning check-in",
      body: "Thirty seconds. How did yesterday actually go?",
      route: "/checkin",
    };
  }
  if (ctx.daysUntilQuitDate !== undefined && ctx.daysUntilQuitDate >= 0) {
    const when = ctx.daysUntilQuitDate === 0 ? "today" : `in ${ctx.daysUntilQuitDate} days`;
    return {
      id: "countdown",
      kind: "countdown",
      title: ctx.daysUntilQuitDate === 0 ? "Quit day" : "Your quit day",
      body: `Your quit day is ${when}. Your plan is ready when you are.`,
      route: "/plans",
    };
  }
  if (!ctx.hasIfThenPlan) {
    return {
      id: "make_plan",
      kind: "make_plan",
      title: "Plan your toughest moment",
      body: "Pick your most common trigger and decide — in advance — what you'll do instead.",
      route: "/plans/new",
    };
  }
  return {
    id: "encourage",
    kind: "encourage",
    title: "You're on track",
    body: "Nothing needs your attention right now. That's the plan working.",
    route: "/progress",
  };
};
