/**
 * Instrument registry types (WP4.4). Safety invariant 2: validated instruments
 * render verbatim from this package — never paraphrased, never templated.
 * Licensing statuses come from the WP10.4 audit
 * (compliance/instruments/licensing-audit.md).
 */

export type LicensingStatus =
  | "cleared"
  | "cleared-with-conditions"
  | "blocked-pending-license"
  | "rejected";

export interface InstrumentOption {
  readonly text: string;
  readonly score: number;
}

export interface InstrumentItem {
  readonly id: string;
  readonly text: string;
  readonly options: readonly InstrumentOption[];
}

export interface ScoreBand {
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

export interface Licensing {
  readonly status: LicensingStatus;
  readonly holder: string;
  readonly conditions: readonly string[];
}

export interface Instrument {
  readonly id: string;
  readonly name: string;
  readonly citation: string;
  /** Required attribution line, rendered with the instrument (e.g. WHO wording). */
  readonly attribution?: string;
  readonly licensing: Licensing;
  /** Empty for blocked/rejected instruments — their text must not ship (E19). */
  readonly items: readonly InstrumentItem[];
  readonly bands: readonly ScoreBand[];
  /** SHA-256 over the canonical items JSON, locked at authoring time. */
  readonly integritySha256: string;
}
