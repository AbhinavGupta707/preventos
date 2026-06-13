import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import type { Instrument } from "./types.js";

export interface InstrumentScore {
  readonly total: number;
  readonly band: string;
}

/**
 * Deterministic scoring: responses map item id → selected option index.
 * Every item must be answered; partial administrations are not scoreable.
 */
export function scoreInstrument(
  instrument: Instrument,
  responses: Readonly<Record<string, number>>,
): Result<InstrumentScore, string> {
  if (instrument.items.length === 0) {
    return err(`instrument ${instrument.id} has no scoreable items`);
  }
  const itemIds = new Set(instrument.items.map((item) => item.id));
  for (const key of Object.keys(responses)) {
    if (!itemIds.has(key)) return err(`unknown response key "${key}" for instrument ${instrument.id}`);
  }
  let total = 0;
  for (const item of instrument.items) {
    const index = responses[item.id];
    if (index === undefined) return err(`missing response for item "${item.id}"`);
    if (!Number.isInteger(index) || index < 0 || index >= item.options.length) {
      return err(`response for item "${item.id}" must be an option index 0–${item.options.length - 1}`);
    }
    total += item.options[index]!.score;
  }
  const band = instrument.bands.find((candidate) => total >= candidate.min && total <= candidate.max);
  if (band === undefined) return err(`score ${total} falls outside the bands of instrument ${instrument.id}`);
  return ok({ total, band: band.label });
}
