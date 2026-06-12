import { describe, expect, it } from "vitest";
import type { ConsentRecord } from "../src/consent.js";
import { consentStateFromHistory, hasConsent } from "../src/consent.js";
import type { PersonId } from "../src/ids.js";

const personId = "p1" as PersonId;

const record = (
  action: ConsentRecord["action"],
  occurredAt: Date,
  overrides: Partial<ConsentRecord> = {},
): ConsentRecord => ({
  personId,
  purpose: "proactive_contact",
  action,
  occurredAt,
  ...overrides,
});

describe("consentStateFromHistory", () => {
  it("returns empty state for empty history", () => {
    expect(consentStateFromHistory([]).size).toBe(0);
  });

  it("latest record wins within a scope, regardless of input order", () => {
    const granted = record("granted", new Date("2026-01-01"));
    const revoked = record("revoked", new Date("2026-02-01"));
    expect(hasConsent([granted, revoked], granted)).toBe(false);
    expect(hasConsent([revoked, granted], granted)).toBe(false);
  });

  it("re-granting after revocation restores consent", () => {
    const history = [
      record("granted", new Date("2026-01-01")),
      record("revoked", new Date("2026-02-01")),
      record("granted", new Date("2026-03-01")),
    ];
    expect(hasConsent(history, history[0]!)).toBe(true);
  });

  it("scopes are independent across purpose, signal, and recipient", () => {
    const contact = record("granted", new Date("2026-01-01"));
    const wearable = record("revoked", new Date("2026-01-01"), { purpose: "wearable_data" });
    const withSignal = record("granted", new Date("2026-01-01"), { signal: "sleep" });
    const history = [contact, wearable, withSignal];
    expect(hasConsent(history, contact)).toBe(true);
    expect(hasConsent(history, wearable)).toBe(false);
    expect(hasConsent(history, withSignal)).toBe(true);
  });

  it("fails closed on simultaneous conflicting records", () => {
    const at = new Date("2026-01-01");
    expect(hasConsent([record("granted", at), record("revoked", at)], record("granted", at))).toBe(false);
    expect(hasConsent([record("revoked", at), record("granted", at)], record("granted", at))).toBe(false);
  });

  it("never mutates the input history", () => {
    const history = [record("granted", new Date("2026-01-01"))];
    const snapshot = [...history];
    consentStateFromHistory(history);
    expect(history).toEqual(snapshot);
  });
});
