import type { EnrolmentId, PersonId } from "./ids.js";
import type { Vertical } from "./verticals.js";

export const ENROLMENT_STATUSES = ["active", "paused", "completed", "withdrawn"] as const;
export type EnrolmentStatus = (typeof ENROLMENT_STATUSES)[number];

export const READINESS_STAGES = [
  "not_ready",
  "ambivalent",
  "ready",
  "acting",
  "maintaining",
  "relapsed",
] as const;
export type ReadinessStage = (typeof READINESS_STAGES)[number];

/** One person may hold many enrolments, but at most one active per vertical (DB-enforced). */
export interface Enrolment {
  readonly id: EnrolmentId;
  readonly personId: PersonId;
  readonly vertical: Vertical;
  readonly status: EnrolmentStatus;
  readonly stage: ReadinessStage;
  readonly pathwayVariant?: string;
  readonly contentVersionPin?: string;
  readonly enrolledAt: Date;
}
