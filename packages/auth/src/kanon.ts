export const K_ANONYMITY_THRESHOLD = 5;

export interface AggregateGroup {
  readonly key: string;
  readonly count: number;
}

/**
 * Server-side small-group suppression (PRD §3.11): any aggregate group with
 * fewer than k members is removed entirely (not zeroed — absence reveals
 * less than a suppressed-but-present row). Applied in the query layer so no
 * UI can be tricked into rendering small groups.
 */
export function suppressSmallGroups<T extends AggregateGroup>(
  groups: readonly T[],
  k: number = K_ANONYMITY_THRESHOLD,
): readonly T[] {
  return groups.filter((group) => group.count >= k);
}
