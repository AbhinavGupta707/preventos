import { describe, expect, it } from "vitest";
import { computeIntegrity, getInstrument, listInstruments, verifyInstrument } from "../src/registry.js";

describe("instrument registry", () => {
  it("registers HSI, AUDIT-C, TTFV, and SCI", () => {
    const ids = listInstruments().map((entry) => entry.id);
    expect(ids).toContain("hsi");
    expect(ids).toContain("audit-c");
    expect(ids).toContain("ttfv");
    expect(ids).toContain("sci");
  });

  it("serves cleared instruments with verbatim item text", () => {
    const hsi = getInstrument("hsi");
    expect(hsi.ok).toBe(true);
    if (hsi.ok) {
      expect(hsi.value.items[0]?.text).toBe("How soon after you wake up do you smoke your first cigarette?");
      expect(hsi.value.items[0]?.options?.[0]?.text).toBe("Within 5 minutes");
    }
  });

  it("SCI is unreachable while blocked-pending-license (E19) and ships no item text", () => {
    const sci = getInstrument("sci");
    expect(sci.ok).toBe(false);
    if (!sci.ok) expect(sci.error).toContain("blocked-pending-license");
    const entry = listInstruments().find((candidate) => candidate.id === "sci");
    expect(entry?.licensingStatus).toBe("blocked-pending-license");
    // No copyrighted SCI wording may ship until permission is executed (WP10.4 §3.1).
    expect(entry?.itemCount).toBe(0);
  });

  it("rejects unknown instrument ids", () => {
    expect(getInstrument("isi").ok).toBe(false);
  });

  it("every served instrument passes its locked integrity hash (safety invariant 2)", () => {
    for (const entry of listInstruments()) {
      const instrument = getInstrument(entry.id);
      if (!instrument.ok) continue;
      expect(
        computeIntegrity(instrument.value.items),
        `${entry.id} integrity hash must match its locked constant`,
      ).toBe(instrument.value.integritySha256);
    }
  });

  it("detects paraphrased item text (verbatim enforcement)", () => {
    const hsi = getInstrument("hsi");
    expect(hsi.ok).toBe(true);
    if (!hsi.ok) return;
    const [first, ...rest] = hsi.value.items;
    const tampered = {
      ...hsi.value,
      items: [{ ...first!, text: "How quickly do you smoke after waking?" }, ...rest],
    };
    const verdict = verifyInstrument(tampered);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.error).toContain("verbatim");
  });

  it("AUDIT-C carries the WHO conditions, including no-fee-to-respondent", () => {
    const auditC = getInstrument("audit-c");
    expect(auditC.ok).toBe(true);
    if (auditC.ok) {
      expect(auditC.value.licensing.status).toBe("cleared-with-conditions");
      expect(auditC.value.licensing.conditions.join(" ")).toMatch(/fee|charge/i);
      expect(auditC.value.attribution).toContain("WHO");
    }
  });
});
