import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";

import type { InstrumentDefinition } from "./types.js";

/**
 * Heaviness of Smoking Index — the two FTND items (1 and 4), reproduced verbatim.
 * Heatherton TF, Kozlowski LT, Frecker RC, Fagerström KO (1991), Br J Addict 86:1119–27.
 * Licensing: cleared-with-conditions (keep citation) — compliance/instruments/licensing-audit.md.
 */
export const HSI: InstrumentDefinition = {
  id: "hsi",
  name: "Heaviness of Smoking Index",
  licensingStatus: "cleared-with-conditions",
  citation:
    "Heatherton TF, Kozlowski LT, Frecker RC, Fagerström KO. The Fagerström Test for Nicotine Dependence. Br J Addict. 1991;86:1119–27.",
  items: [
    {
      id: "hsi-ttfc",
      text: "How soon after you wake up do you smoke your first cigarette?",
      options: [
        { label: "Within 5 minutes", value: 3 },
        { label: "6 to 30 minutes", value: 2 },
        { label: "31 to 60 minutes", value: 1 },
        { label: "After 60 minutes", value: 0 },
      ],
    },
    {
      id: "hsi-cpd",
      text: "How many cigarettes per day do you smoke?",
      options: [
        { label: "10 or less", value: 0 },
        { label: "11 to 20", value: 1 },
        { label: "21 to 30", value: 2 },
        { label: "31 or more", value: 3 },
      ],
    },
  ],
};

export type HsiCategory = "low" | "moderate" | "high";

export interface HsiAnswers {
  readonly timeToFirstCigarette: number;
  readonly cigarettesPerDay: number;
}

export interface HsiScore {
  readonly total: number;
  readonly category: HsiCategory;
}

const isItemScore = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 3;

/** Published HSI scoring: 0–6 total; 0–2 low, 3–4 moderate, 5–6 high. */
export const scoreHsi = (answers: HsiAnswers): Result<HsiScore, string> => {
  if (!isItemScore(answers.timeToFirstCigarette) || !isItemScore(answers.cigarettesPerDay)) {
    return err("HSI item scores must be integers in 0..3");
  }
  const total = answers.timeToFirstCigarette + answers.cigarettesPerDay;
  const category: HsiCategory = total <= 2 ? "low" : total <= 4 ? "moderate" : "high";
  return ok({ total, category });
};
