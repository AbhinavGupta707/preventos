export {
  ALCOHOL_AUDIT_C_DELTA,
  ALCOHOL_DRINKING_DAYS,
  DECLARED_OUTCOME_REFS,
  OUTCOME_DEFINITIONS,
  OUTCOME_REF_IDS,
  SLEEP_DIARY_TRAJECTORY,
  SMOKING_RUSSELL_4W,
  VAPING_PP7,
  VAPING_PP30,
  definitionRef,
  getDefinition,
  outcomeDefinitionSchema,
} from "./definitions.js";
export type { OutcomeDefinition } from "./definitions.js";

export { AGE_BANDS, daysBetween, journeysFor, weekIndex } from "./journeys.js";
export type {
  AgeBand,
  AlcoholJourney,
  Journey,
  SleepDiaryEntry,
  SleepJourney,
  SmokingFollowUp,
  SmokingJourney,
  VapingJourney,
} from "./journeys.js";

export { evaluateSmokingQuit } from "./smoking.js";
export type { SmokingQuitResult, SmokingQuitStatus } from "./smoking.js";

export { evaluateVapingPointPrevalence } from "./vaping.js";
export type { VapingAbstinenceResult } from "./vaping.js";

export { evaluateAuditCDelta, evaluateDrinkingDays } from "./alcohol.js";
export type { AuditCDeltaResult, DrinkingDaysResult } from "./alcohol.js";

export { evaluateSleepTrajectory } from "./sleep.js";
export type { SleepTrajectoryResult, SleepWeekMetrics } from "./sleep.js";

export { buildEvidenceGroups, evaluateCohort } from "./cohort.js";
export type { CohortResults, EvidenceGroup } from "./cohort.js";

// Synthetic fixture cohort — the evidence dashboard skeleton runs on this
// until the services assembly (SVC) projects journeys from real events.
export { SYNTHETIC_COHORT } from "../fixtures/cohort.js";

export {
  EXPERIMENT_SURFACES,
  GUARDRAIL_METRICS,
  MANDATORY_GUARDRAIL,
  assignVariant,
  experimentSchema,
  parseExperiment,
} from "./experiments.js";
export type { Experiment, ExperimentSurface, GuardrailMetric } from "./experiments.js";
