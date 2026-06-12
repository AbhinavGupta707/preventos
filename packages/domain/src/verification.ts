export const VERIFICATION_TIERS = ["self_report", "corroborated", "verified"] as const;

export type VerificationTier = (typeof VERIFICATION_TIERS)[number];

const rank = (tier: VerificationTier): number => VERIFICATION_TIERS.indexOf(tier);

export const compareTiers = (a: VerificationTier, b: VerificationTier): number => rank(a) - rank(b);

export const upgradeTier = (current: VerificationTier, incoming: VerificationTier): VerificationTier =>
  rank(incoming) > rank(current) ? incoming : current;
