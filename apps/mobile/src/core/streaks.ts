/** Milestone days for identity moments (WP2.4): fire exactly once per threshold. */
export const MILESTONE_DAYS = [1, 3, 7, 14, 30, 60, 90, 180, 365] as const;

/**
 * Thresholds newly crossed between the last acknowledged days-won value and now.
 * Days won is monotone non-decreasing (relapse machine property), so a value
 * lower than `lastSeen` yields nothing — milestones never re-fire.
 */
export const crossedMilestones = (lastSeen: number, current: number): readonly number[] =>
  current <= lastSeen ? [] : MILESTONE_DAYS.filter((m) => m > lastSeen && m <= current);
