import type { PersonId } from "./ids.js";

export const CONSENT_PURPOSES = [
  "programme_delivery",
  "proactive_contact",
  "cross_enrolment_screening",
  "wearable_data",
  "analytics",
  "supporter_sharing",
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export type ConsentAction = "granted" | "revoked";

/** Append-only fact. State is always derived by folding history — never stored. */
export interface ConsentRecord {
  readonly personId: PersonId;
  readonly purpose: ConsentPurpose;
  readonly signal?: string;
  readonly recipient?: string;
  readonly action: ConsentAction;
  readonly evidence?: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

const scopeKey = (r: Pick<ConsentRecord, "purpose" | "signal" | "recipient">): string =>
  `${r.purpose}|${r.signal ?? ""}|${r.recipient ?? ""}`;

/**
 * Folds an append-only consent history into current state: for each
 * (purpose, signal, recipient) scope, the latest record wins. Ties on
 * occurredAt resolve to revoked (fail closed).
 */
export function consentStateFromHistory(
  history: readonly ConsentRecord[],
): ReadonlyMap<string, ConsentAction> {
  const latest = new Map<string, ConsentRecord>();
  for (const record of history) {
    const key = scopeKey(record);
    const current = latest.get(key);
    if (
      current === undefined ||
      record.occurredAt > current.occurredAt ||
      (record.occurredAt.getTime() === current.occurredAt.getTime() && record.action === "revoked")
    ) {
      latest.set(key, record);
    }
  }
  return new Map([...latest].map(([key, record]) => [key, record.action]));
}

export function hasConsent(
  history: readonly ConsentRecord[],
  scope: Pick<ConsentRecord, "purpose" | "signal" | "recipient">,
): boolean {
  return consentStateFromHistory(history).get(scopeKey(scope)) === "granted";
}
