import { describe, expect, it } from "vitest";
import { getInstrument } from "../src/registry.js";
import { scoreInstrument } from "../src/scoring.js";
import { ttfvScoreFromMinutes } from "../src/ttfv.js";

function instrument(id: string) {
  const result = getInstrument(id);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe("HSI scoring (Heatherton et al. 1991 vectors)", () => {
  const hsi = instrument("hsi");
  const vectors: readonly [Record<string, number>, number, string][] = [
    [{ ttfc: 0, cpd: 3 }, 6, "high"], // within 5 min + 31+/day
    [{ ttfc: 3, cpd: 0 }, 0, "low"], // after 60 min + ≤10/day
    [{ ttfc: 1, cpd: 1 }, 3, "moderate"], // 6–30 min + 11–20/day
    [{ ttfc: 2, cpd: 0 }, 1, "low"], // 31–60 min + ≤10/day
    [{ ttfc: 1, cpd: 0 }, 2, "moderate"], // 6–30 min + ≤10/day
    [{ ttfc: 0, cpd: 1 }, 4, "high"], // within 5 min + 11–20/day
  ];

  it.each(vectors)("responses %j score %i (%s)", (responses, total, band) => {
    const result = scoreInstrument(hsi, responses);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.total).toBe(total);
      expect(result.value.band).toBe(band);
    }
  });
});

describe("AUDIT-C scoring (WHO/Babor 2001; UK risk bands)", () => {
  const auditC = instrument("audit-c");
  const vectors: readonly [Record<string, number>, number, string][] = [
    [{ frequency: 0, typical: 0, binge: 0 }, 0, "lower risk"],
    [{ frequency: 1, typical: 1, binge: 2 }, 4, "lower risk"],
    [{ frequency: 2, typical: 1, binge: 2 }, 5, "increasing risk"],
    [{ frequency: 3, typical: 2, binge: 3 }, 8, "higher risk"],
    [{ frequency: 4, typical: 4, binge: 4 }, 12, "possible dependence"],
  ];

  it.each(vectors)("responses %j score %i (%s)", (responses, total, band) => {
    const result = scoreInstrument(auditC, responses);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.total).toBe(total);
      expect(result.value.band).toBe(band);
    }
  });
});

describe("scoring guards", () => {
  const hsi = instrument("hsi");

  it("rejects missing responses", () => {
    expect(scoreInstrument(hsi, { ttfc: 0 }).ok).toBe(false);
  });

  it("rejects out-of-range option indices", () => {
    expect(scoreInstrument(hsi, { ttfc: 4, cpd: 0 }).ok).toBe(false);
    expect(scoreInstrument(hsi, { ttfc: -1, cpd: 0 }).ok).toBe(false);
    expect(scoreInstrument(hsi, { ttfc: 0.5, cpd: 0 }).ok).toBe(false);
  });

  it("rejects unknown response keys", () => {
    expect(scoreInstrument(hsi, { ttfc: 0, cpd: 0, extra: 1 }).ok).toBe(false);
  });
});

describe("TTFV index (in-house HSI analogue)", () => {
  const vectors: readonly [number, number][] = [
    [0, 3],
    [5, 3],
    [6, 2],
    [30, 2],
    [31, 1],
    [60, 1],
    [61, 0],
    [600, 0],
  ];

  it.each(vectors)("%i minutes scores %i", (minutes, score) => {
    const result = ttfvScoreFromMinutes(minutes);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(score);
  });

  it("rejects negative or non-finite minutes", () => {
    expect(ttfvScoreFromMinutes(-1).ok).toBe(false);
    expect(ttfvScoreFromMinutes(Number.NaN).ok).toBe(false);
  });
});
