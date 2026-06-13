/**
 * Pure (db-free) entry point — `@preventos/safety/classify`.
 *
 * Everything reachable from here is a pure function of its arguments: the
 * deterministic risk classifier, the text normalizer, the lexicon, and the
 * scripted crisis routing + resources. NOTHING here imports `@preventos/db`,
 * `@preventos/events`, `drizzle-orm`, or `pg`, so this entry is safe to bundle
 * into the mobile app and the web client (which cannot pull in a Postgres
 * driver). The db-backed escalation queue lives behind the package root
 * (`@preventos/safety`) instead — see ./queue.ts.
 *
 * The import boundary is lint-enforced (eslint.config.mjs) and proved by
 * test/pure-entry.test.ts, which walks this module's real import graph.
 */
export { classify } from "./classify.js";
export { normalize } from "./normalize.js";
export type { RiskAssessment, RiskMatch, RiskTier, SafetyRule } from "./types.js";
export { ALL_RULES } from "./lexicon/index.js";
export { routeCrisis } from "./crisis.js";
export type { CrisisFlow, CrisisRoute, CrisisStep } from "./crisis.js";
export { ALL_RESOURCES } from "./resources.js";
export type { CrisisResource } from "./resources.js";
