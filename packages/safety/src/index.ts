/**
 * The pure, db-free classifier + crisis routing now live in
 * `@preventos/safety-core` (W3-SAFEPORT) so mobile and web can import the
 * 843-validated classifier without pulling in `@preventos/db`. This package
 * re-exports all of it for backward compatibility and adds the db-backed
 * escalation queue (`core.escalation_case`).
 */
export * from "@preventos/safety-core";
export { openCase, claimCase, releaseCase, closeCase, listQueue, SLA_MINUTES } from "./queue.js";
export type { OpenCaseInput, QueueEntry } from "./queue.js";
