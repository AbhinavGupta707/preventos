import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HSI, getInstrument } from "@preventos/instruments";

const smokingScreenSource = () =>
  readFileSync(fileURLToPath(new URL("../app/onboarding/smoking.tsx", import.meta.url)), "utf8");

describe("mobile app instrument rendering — safety invariant 2", () => {
  it("renders the smoking HSI intake from @preventos/instruments, not local copy", () => {
    const source = smokingScreenSource();
    const hsi = getInstrument("hsi");
    expect(hsi.ok).toBe(true);

    expect(source).toContain('getInstrument("hsi")');
    expect(source).toContain("HSI.items[0]!.text");
    expect(source).toContain("HSI.items[1]!.text");
    expect(source).toContain("label={opt.text}");

    for (const item of HSI.items) {
      expect(source).not.toContain(item.text);
      for (const option of item.options) {
        expect(source).not.toContain(option.text);
      }
    }
  });
});
