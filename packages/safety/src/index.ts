/**
 * Package root — `@preventos/safety`. The full server-side surface: the pure
 * classifier (re-exported from ./classify-entry.ts) PLUS the db-backed
 * escalation queue. Importing this pulls in @preventos/db / drizzle-orm via
 * ./queue.ts, so it is for Node services only (apps/api, apps/worker, tools).
 *
 * Pure, bundler-safe consumers (apps/mobile, apps/web) must import the db-free
 * entry instead: `@preventos/safety/classify`.
 */
export * from "./classify-entry.js";
export { openCase, claimCase, releaseCase, closeCase, listQueue, SLA_MINUTES } from "./queue.js";
export type { OpenCaseInput, QueueEntry } from "./queue.js";
