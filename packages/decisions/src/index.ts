export { ruleSchema, ruleSetSchema, evaluateRules, ruleSetHash, shadowDiff } from "./rules.js";
export type { Rule, RuleSet, RuleContext, RuleCondition, Candidate, Evaluation, ShadowDiff } from "./rules.js";
export { RELAPSE_STATES, LAPSE_DEFINITIONS, transitionRelapse, daysWon } from "./relapse.js";
export type { RelapseState } from "./relapse.js";
export { DEFAULT_BURDEN, inQuietHours, canSendProactive } from "./burden.js";
export type { BurdenConfig } from "./burden.js";
export { arbitrate, mandatoryCandidate, nextArbitrationState } from "./arbitration.js";
export type { ArbitrationState } from "./arbitration.js";
export {
  ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD,
  DEPENDENCE_FLAG,
  deriveAlcoholFlags,
} from "./contraindication.js";
export { decisionPoints } from "./scheduler.js";
export type { DecisionPoint, EnrolmentSchedule } from "./scheduler.js";
