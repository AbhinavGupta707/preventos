import type { Instrument } from "./types.js";

/**
 * Sleep Condition Indicator — REGISTERED BUT BLOCKED (E19, WP10.4 §3.1).
 * The 2014 validation paper is CC BY-NC; commercial use needs explicit
 * permission, which the owner must execute. Until the registry status flips
 * to cleared*, the SCI is unreachable AND none of its item text may ship —
 * which is why items is empty. Diary-derived metrics (SE/SOL/WASO) carry the
 * sleep outcome story in the interim.
 */
export const SCI: Instrument = {
  id: "sci",
  name: "Sleep Condition Indicator",
  citation:
    "Espie CA, Kyle SD, Hames P, Gardani M, Fleming L, Cape J (2014). The Sleep Condition Indicator: " +
    "a clinical screening tool to evaluate insomnia disorder. BMJ Open 4:e004183.",
  licensing: {
    status: "blocked-pending-license",
    holder: "Espie et al. (validation paper CC BY-NC 3.0; listed on Mapi ePROVIDE)",
    conditions: [
      "Owner action: execute commercial permission per compliance/instruments/licensing-audit.md §3.1, " +
        "then flip this status and add the item text from the licensed source.",
    ],
  },
  items: [],
  bands: [],
  integritySha256: "",
};
