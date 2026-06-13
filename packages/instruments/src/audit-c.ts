import type { Instrument } from "./types.js";

/**
 * AUDIT-C — items 1–3 of the WHO AUDIT, verbatim per Babor et al. (2001),
 * The Alcohol Use Disorders Identification Test, 2nd ed. (WHO/MSD/MSB/01.6a).
 * Risk bands per UK usage (NHS alcohol identification guidance).
 * WP10.4: cleared-with-conditions — see licensing.conditions.
 */
export const AUDIT_C: Instrument = {
  id: "audit-c",
  name: "AUDIT-C (Alcohol Use Disorders Identification Test — Consumption)",
  citation:
    "Saunders JB, Aasland OG, Babor TF, de la Fuente JR, Grant M (1993). Development of the Alcohol Use " +
    "Disorders Identification Test (AUDIT). Addiction 88(6):791–804; Babor et al. (2001), WHO/MSD/MSB/01.6a.",
  attribution: "WHO-approved instrument, reproduced unaltered.",
  licensing: {
    status: "cleared-with-conditions",
    holder: "World Health Organization (public domain as WHO-approved instrument)",
    conditions: [
      "Render verbatim and unaltered.",
      "Identify as a WHO-approved instrument and keep the citation.",
      "Respondents must never be charged a fee to complete it — screening stays outside any paywall.",
    ],
  },
  items: [
    {
      id: "frequency",
      text: "How often do you have a drink containing alcohol?",
      options: [
        { text: "Never", score: 0 },
        { text: "Monthly or less", score: 1 },
        { text: "2 to 4 times a month", score: 2 },
        { text: "2 to 3 times a week", score: 3 },
        { text: "4 or more times a week", score: 4 },
      ],
    },
    {
      id: "typical",
      text: "How many drinks containing alcohol do you have on a typical day when you are drinking?",
      options: [
        { text: "1 or 2", score: 0 },
        { text: "3 or 4", score: 1 },
        { text: "5 or 6", score: 2 },
        { text: "7, 8, or 9", score: 3 },
        { text: "10 or more", score: 4 },
      ],
    },
    {
      id: "binge",
      text: "How often do you have six or more drinks on one occasion?",
      options: [
        { text: "Never", score: 0 },
        { text: "Less than monthly", score: 1 },
        { text: "Monthly", score: 2 },
        { text: "Weekly", score: 3 },
        { text: "Daily or almost daily", score: 4 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 4, label: "lower risk" },
    { min: 5, max: 7, label: "increasing risk" },
    { min: 8, max: 10, label: "higher risk" },
    { min: 11, max: 12, label: "possible dependence" },
  ],
  integritySha256: "70ee2aa59c12b1c9af2136ce0c0c2d6387aca80c545cb05e59da1c90c5b8bb65",
};
