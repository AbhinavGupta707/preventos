import type { PersonId } from "./ids.js";
import type { ReadinessStage } from "./enrolment.js";
import type { Vertical } from "./verticals.js";

export interface ComBDeficits {
  readonly capability: readonly string[];
  readonly opportunity: readonly string[];
  readonly motivation: readonly string[];
}

/** Per-vertical section of the Behavioural Formulation Object (PRD §3.1). */
export interface BfoSection {
  readonly vertical: Vertical;
  readonly readiness: ReadinessStage;
  readonly comB: ComBDeficits;
  readonly triggers: readonly string[];
  readonly instrumentScores: Readonly<Record<string, number>>;
  readonly completeness: number;
}

export interface Bfo {
  readonly personId: PersonId;
  readonly sections: readonly BfoSection[];
  readonly updatedAt: Date;
}
