export { createDb } from "./client.js";
export type { Db } from "./client.js";
export { runMigrations, MIGRATIONS_DIR } from "./migrate.js";
export { resetTestDatabase } from "./testing.js";
export * as schema from "./schema.js";
export type { EnrolmentAssessment } from "./schema.js";
export {
  createPerson,
  attachIdentity,
  createEnrolment,
  appendConsent,
  consentHistoryFor,
  appendEvent,
  appendDecision,
} from "./repos.js";
export {
  marketing,
  waitlistSignup,
  funnelEvent,
  recordWaitlistSignup,
  recordFunnelEvent,
  waitlistCountsByProgramme,
  funnelCountsByName,
} from "./marketing.js";
export type { ProgrammeCount, EventCount } from "./marketing.js";
