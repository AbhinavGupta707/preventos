import { describe, expect, it } from "vitest";
import type { Vertical } from "@preventos/domain";
import { arbitrate, nextArbitrationState } from "../src/arbitration.js";
import { DEFAULT_BURDEN, canSendProactive, inQuietHours } from "../src/burden.js";
import type { Candidate } from "../src/rules.js";

describe("burden governor", () => {
  it("quiet hours span midnight: 21:30 -> 08:00", () => {
    expect(inQuietHours("22:00")).toBe(true);
    expect(inQuietHours("03:00")).toBe(true);
    expect(inQuietHours("07:59")).toBe(true);
    expect(inQuietHours("08:00")).toBe(false);
    expect(inQuietHours("12:00")).toBe(false);
    expect(inQuietHours("21:29")).toBe(false);
  });

  it("enforces the daily cap and the minimum gap", () => {
    const now = new Date("2026-06-12T14:00:00Z");
    const full = [1, 2, 3].map((h) => new Date(`2026-06-12T0${h}:00:00Z`));
    expect(canSendProactive(full, now, "14:00").ok).toBe(false);
    const recent = [new Date("2026-06-12T13:30:00Z")];
    expect(canSendProactive(recent, now, "14:00").ok).toBe(false);
    const spaced = [new Date("2026-06-12T09:00:00Z")];
    expect(canSendProactive(spaced, now, "14:00").ok).toBe(true);
  });

  it("property: across a simulated day, never exceeds the cap nor violates the gap", () => {
    const sent: Date[] = [];
    for (let minute = 0; minute < 24 * 60; minute += 7) {
      const now = new Date(Date.UTC(2026, 5, 12, Math.floor(minute / 60), minute % 60));
      const localTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
      if (canSendProactive(sent, now, localTime).ok) sent.push(now);
    }
    expect(sent.length).toBeLessThanOrEqual(DEFAULT_BURDEN.maxProactivePerDay);
    const sorted = [...sent].sort((a, b) => a.getTime() - b.getTime());
    for (let i = 1; i < sorted.length; i++) {
      const gapMin = (sorted[i]!.getTime() - sorted[i - 1]!.getTime()) / 60_000;
      expect(gapMin).toBeGreaterThanOrEqual(DEFAULT_BURDEN.minGapMinutes);
    }
  });
});

describe("cross-vertical arbitration", () => {
  const candidate = (vertical: Vertical, priority: number): Candidate => ({
    ruleId: `${vertical}.r`,
    vertical,
    priority,
    unbypassable: false,
    action: { kind: "send_atom", ref: `${vertical}.atom` },
  });

  it("higher priority wins when fairness is equal", () => {
    const chosen = arbitrate([candidate("smoking", 80), candidate("sleep", 40)], {
      roundsSinceServed: { smoking: 0, sleep: 0 },
    });
    expect(chosen?.vertical).toBe("smoking");
  });

  it("starvation guard: a persistently outranked vertical eventually gets served", () => {
    let state = { roundsSinceServed: { smoking: 0, sleep: 0 } as Partial<Record<Vertical, number>> };
    const servedVerticals = new Set<Vertical>();
    for (let round = 0; round < 25; round++) {
      const chosen = arbitrate([candidate("smoking", 80), candidate("sleep", 40)], state);
      expect(chosen).toBeDefined();
      servedVerticals.add(chosen!.vertical);
      state = nextArbitrationState(state, chosen!.vertical);
    }
    expect(servedVerticals).toContain("sleep");
    expect(servedVerticals).toContain("smoking");
  });

  it("is deterministic and returns undefined on empty candidates", () => {
    expect(arbitrate([], { roundsSinceServed: {} })).toBeUndefined();
    const a = arbitrate([candidate("alcohol", 50), candidate("vaping", 50)], { roundsSinceServed: {} });
    const b = arbitrate([candidate("vaping", 50), candidate("alcohol", 50)], { roundsSinceServed: {} });
    expect(a?.ruleId).toBe(b?.ruleId);
  });
});
