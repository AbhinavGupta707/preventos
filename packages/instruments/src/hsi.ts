import type { Instrument } from "./types.js";

/**
 * Heaviness of Smoking Index — FTND items 1 and 4, verbatim per Heatherton
 * et al. (1991). Licensing: FTND © Taylor & Francis; standard usage note
 * "may be reproduced without permission" (WP10.4: cleared-with-conditions).
 */
export const HSI: Instrument = {
  id: "hsi",
  name: "Heaviness of Smoking Index",
  citation:
    "Heatherton TF, Kozlowski LT, Frecker RC, Rickert W, Robinson J (1989); Heatherton et al. (1991), " +
    "The Fagerström Test for Nicotine Dependence. Br J Addict 86(9):1119–27.",
  licensing: {
    status: "cleared-with-conditions",
    holder: "Taylor & Francis (FTND, Heatherton et al.)",
    conditions: ["Keep the citation with every rendering."],
  },
  items: [
    {
      id: "ttfc",
      text: "How soon after you wake up do you smoke your first cigarette?",
      options: [
        { text: "Within 5 minutes", score: 3 },
        { text: "6 to 30 minutes", score: 2 },
        { text: "31 to 60 minutes", score: 1 },
        { text: "After 60 minutes", score: 0 },
      ],
    },
    {
      id: "cpd",
      text: "How many cigarettes per day do you smoke?",
      options: [
        { text: "10 or less", score: 0 },
        { text: "11 to 20", score: 1 },
        { text: "21 to 30", score: 2 },
        { text: "31 or more", score: 3 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 1, label: "low" },
    { min: 2, max: 3, label: "moderate" },
    { min: 4, max: 6, label: "high" },
  ],
  integritySha256: "6a87ee335f7f5c9521678589d6b28547fba6a2b41cc603e325c3cf455b298e76",
};
