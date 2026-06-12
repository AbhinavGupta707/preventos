import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import type { Instrument } from "./types.js";

/**
 * Time-to-first-vape index — in-house dependence proxy for Exhale, analogue
 * of the HSI time-to-first-cigarette item. No licence needed; NOT an
 * externally validated instrument (flag in evidence docs — WP10.4).
 */
export const TTFV: Instrument = {
  id: "ttfv",
  name: "Time-to-First-Vape Index",
  citation:
    "In-house measure (PreventOS), derived as an analogue of the FTND time-to-first-cigarette item; " +
    "not externally validated.",
  licensing: {
    status: "cleared",
    holder: "PreventOS (in-house)",
    conditions: [],
  },
  items: [
    {
      id: "ttfv",
      text: "How soon after waking do you usually first vape?",
      options: [
        { text: "Within 5 minutes", score: 3 },
        { text: "6 to 30 minutes", score: 2 },
        { text: "31 to 60 minutes", score: 1 },
        { text: "After 60 minutes", score: 0 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 0, label: "low" },
    { min: 1, max: 2, label: "moderate" },
    { min: 3, max: 3, label: "high" },
  ],
  integritySha256: "23758a8ddc89d3bf2c2162561c6aa4d2d9b0a0e2502eff29334e36cda1960f61",
};

/** Band a raw minutes-after-waking value onto the TTFV item scores. */
export function ttfvScoreFromMinutes(minutes: number): Result<number, string> {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return err(`invalid minutes value: ${minutes}`);
  }
  if (minutes <= 5) return ok(3);
  if (minutes <= 30) return ok(2);
  if (minutes <= 60) return ok(1);
  return ok(0);
}
