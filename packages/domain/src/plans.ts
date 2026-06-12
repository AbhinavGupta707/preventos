import type { PersonId } from "./ids.js";
import type { Vertical } from "./verticals.js";

export const PLAN_TYPES = ["if_then", "quit", "coping", "relapse", "sleep_window"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export interface PlanObject {
  readonly id: string;
  readonly personId: PersonId;
  readonly vertical: Vertical;
  readonly type: PlanType;
  readonly slots: Readonly<Record<string, unknown>>;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OutcomeRecord {
  readonly id: string;
  readonly personId: PersonId;
  readonly vertical: Vertical;
  readonly definitionId: string;
  readonly definitionVersion: string;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly value: Readonly<Record<string, unknown>>;
  readonly verificationTier: "self_report" | "corroborated" | "verified";
  readonly provenance: Readonly<Record<string, unknown>>;
  readonly recordedAt: Date;
}

export const CONTACT_DIRECTIONS = ["inbound", "outbound"] as const;
export type ContactDirection = (typeof CONTACT_DIRECTIONS)[number];

export const CHANNELS = ["app", "web", "push", "email"] as const;
export type Channel = (typeof CHANNELS)[number];

export interface ContactRecord {
  readonly id: string;
  readonly personId: PersonId;
  readonly direction: ContactDirection;
  readonly channel: Channel;
  readonly contentAtomId?: string;
  readonly bctCodes: readonly string[];
  readonly decisionId?: string;
  readonly status: string;
  readonly occurredAt: Date;
}
