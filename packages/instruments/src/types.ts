import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";

/** Licensing wiring per E19 / compliance/instruments/licensing-audit.md. */
export const LICENSING_STATUSES = [
  "cleared",
  "cleared-with-conditions",
  "blocked-pending-license",
  "rejected",
] as const;

export type LicensingStatus = (typeof LICENSING_STATUSES)[number];

export interface InstrumentOption {
  readonly label: string;
  readonly value: number;
}

export interface InstrumentItem {
  readonly id: string;
  /** Verbatim published wording — never paraphrased (safety invariant 2). */
  readonly text: string;
  readonly options: readonly InstrumentOption[];
}

export interface InstrumentDefinition {
  readonly id: string;
  readonly name: string;
  readonly items: readonly InstrumentItem[];
  readonly licensingStatus: LicensingStatus;
  readonly citation: string;
}

const SERVABLE: readonly LicensingStatus[] = ["cleared", "cleared-with-conditions"];

/** Gate: instruments without a cleared licensing status must be unreachable. */
export const assertServable = (
  instrument: InstrumentDefinition,
): Result<InstrumentDefinition, string> =>
  SERVABLE.includes(instrument.licensingStatus)
    ? ok(instrument)
    : err(`instrument ${instrument.id} licensing status "${instrument.licensingStatus}" is not servable`);
