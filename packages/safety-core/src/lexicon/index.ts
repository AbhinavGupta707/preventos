import type { SafetyRule } from "../types.js";
import { SELF_HARM_RULES } from "./self-harm.js";
import { ABUSE_DV_RULES } from "./abuse-dv.js";
import { SAFEGUARDING_RULES } from "./safeguarding.js";
import { OVERDOSE_RULES } from "./overdose.js";
import { WITHDRAWAL_RULES } from "./withdrawal.js";
import { ACUTE_MEDICAL_RULES } from "./acute-medical.js";

/** Full rule set, fixed order — evaluation order is part of the deterministic contract. */
export const ALL_RULES: readonly SafetyRule[] = [
  ...SELF_HARM_RULES,
  ...ABUSE_DV_RULES,
  ...SAFEGUARDING_RULES,
  ...OVERDOSE_RULES,
  ...WITHDRAWAL_RULES,
  ...ACUTE_MEDICAL_RULES,
];
