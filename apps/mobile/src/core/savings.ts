import type { Vertical } from "@preventos/domain";

const CIGARETTES_PER_PACK = 20;

export type SpendProfile =
  | { readonly vertical: "smoking"; readonly cigarettesPerDay: number; readonly pricePerPack: number }
  | { readonly vertical: Exclude<Vertical, "smoking">; readonly weeklySpend: number };

/** Money not spent per day won, per programme. */
export const dailySpend = (profile: SpendProfile): number => {
  if (profile.vertical === "smoking") {
    return Math.max(0, (profile.cigarettesPerDay / CIGARETTES_PER_PACK) * profile.pricePerPack);
  }
  return Math.max(0, profile.weeklySpend / 7);
};

export interface ProgrammeSavings {
  readonly profile: SpendProfile;
  readonly daysWon: number;
}

/** Cross-programme savings rail: sum over enrolled programmes (plan §2.1). */
export const totalSavings = (programmes: readonly ProgrammeSavings[]): number =>
  programmes.reduce((sum, p) => sum + dailySpend(p.profile) * Math.max(0, p.daysWon), 0);
