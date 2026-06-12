import type { ConsentPurpose, ConsentRecord, PersonId } from "@preventos/domain";
import { hasConsent } from "@preventos/domain";
import type { Db } from "@preventos/db";
import { appendConsent, consentHistoryFor } from "@preventos/db";
import { publish } from "@preventos/events";

export interface ConsentScope {
  readonly purpose: ConsentPurpose;
  readonly signal?: string;
  readonly recipient?: string;
}

export interface ConsentChange extends ConsentScope {
  readonly personId: PersonId;
  readonly evidence?: Readonly<Record<string, unknown>>;
}

async function record(db: Db, change: ConsentChange, action: "granted" | "revoked") {
  const row = await appendConsent(db, { ...change, action });
  await publish(db, "consent.changed", {
    personId: change.personId,
    purpose: change.purpose,
    action,
    ...(change.signal !== undefined ? { signal: change.signal } : {}),
    ...(change.recipient !== undefined ? { recipient: change.recipient } : {}),
  });
  return row;
}

export const grantConsent = (db: Db, change: ConsentChange) => record(db, change, "granted");
export const revokeConsent = (db: Db, change: ConsentChange) => record(db, change, "revoked");

/**
 * Deny by default: a person can be processed for a purpose only if their
 * append-only history folds to "granted" for that exact scope.
 */
export async function checkConsent(db: Db, personId: PersonId, scope: ConsentScope): Promise<boolean> {
  const history = await consentHistoryFor(db, personId);
  const records: ConsentRecord[] = history.map((row) => ({
    personId: row.personId as PersonId,
    purpose: row.purpose as ConsentPurpose,
    ...(row.signal !== null ? { signal: row.signal } : {}),
    ...(row.recipient !== null ? { recipient: row.recipient } : {}),
    action: row.action as "granted" | "revoked",
    occurredAt: row.occurredAt,
  }));
  return hasConsent(records, scope);
}

/** Throwing guard for call sites that must not proceed without consent. */
export async function requireConsent(db: Db, personId: PersonId, scope: ConsentScope): Promise<void> {
  if (!(await checkConsent(db, personId, scope))) {
    throw new Error(`consent not granted: ${scope.purpose} for person ${personId}`);
  }
}
