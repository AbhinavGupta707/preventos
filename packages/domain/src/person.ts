import type { PersonId } from "./ids.js";

export const NATIONS = ["england", "scotland", "wales", "northern_ireland"] as const;
export type Nation = (typeof NATIONS)[number];

export const AGE_BANDS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const SEXES = ["female", "male", "intersex", "prefer_not_to_say"] as const;
export type Sex = (typeof SEXES)[number];

export type DeprivationQuintile = 1 | 2 | 3 | 4 | 5;

/**
 * Pseudonymous core profile. Direct identifiers (phone, email, postcode, auth id)
 * never appear on this entity — they live only in the identity boundary (plan §4.2).
 */
export interface Person {
  readonly id: PersonId;
  readonly pseudonym: string;
  readonly ageBand?: AgeBand;
  readonly sex?: Sex;
  readonly language: string;
  readonly nation?: Nation;
  readonly deprivationQuintile?: DeprivationQuintile;
  readonly acquisitionSource?: string;
  readonly createdAt: Date;
}
