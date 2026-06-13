import type { Result } from "@preventos/shared";
import { err, ok, sha256Hex } from "@preventos/shared";
import { AUDIT_C } from "./audit-c.js";
import { HSI } from "./hsi.js";
import { SCI } from "./sci.js";
import { TTFV } from "./ttfv.js";
import type { Instrument, InstrumentItem, LicensingStatus } from "./types.js";

const INSTRUMENTS: ReadonlyMap<string, Instrument> = new Map(
  [HSI, AUDIT_C, TTFV, SCI].map((instrument) => [instrument.id, instrument]),
);

const SERVABLE: ReadonlySet<LicensingStatus> = new Set(["cleared", "cleared-with-conditions"]);

/** Deterministic hash over item wording — the lock behind safety invariant 2. */
export function computeIntegrity(items: readonly InstrumentItem[]): string {
  return sha256Hex(JSON.stringify(items.map((item) => ({ id: item.id, text: item.text, options: item.options }))));
}

/** Recomputes the wording hash against the locked constant. */
export function verifyInstrument(instrument: Instrument): Result<Instrument, string> {
  if (computeIntegrity(instrument.items) !== instrument.integritySha256) {
    return err(
      `instrument ${instrument.id} failed verbatim integrity check — item wording does not match ` +
        `the locked hash (safety invariant 2: instruments render verbatim, never paraphrased)`,
    );
  }
  return ok(instrument);
}

export interface InstrumentSummary {
  readonly id: string;
  readonly name: string;
  readonly licensingStatus: LicensingStatus;
  readonly itemCount: number;
}

export function listInstruments(): readonly InstrumentSummary[] {
  return [...INSTRUMENTS.values()].map((instrument) => ({
    id: instrument.id,
    name: instrument.name,
    licensingStatus: instrument.licensing.status,
    itemCount: instrument.items.length,
  }));
}

/**
 * The only way to obtain a servable instrument. Non-cleared instruments are
 * unreachable from any flow (WP4.4 acceptance / E19), and wording integrity
 * is verified on every fetch.
 */
export function getInstrument(id: string): Result<Instrument, string> {
  const instrument = INSTRUMENTS.get(id);
  if (instrument === undefined) return err(`unknown instrument: ${id}`);
  if (!SERVABLE.has(instrument.licensing.status)) {
    return err(
      `instrument ${id} is unreachable (licensing-status: ${instrument.licensing.status}) — ` +
        `see compliance/instruments/licensing-audit.md`,
    );
  }
  return verifyInstrument(instrument);
}
