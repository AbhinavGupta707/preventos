import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PersonId } from "@preventos/domain";
import { attachIdentity, createDb, createEnrolment, createPerson, runMigrations, resetTestDatabase } from "@preventos/db";
import { checkConsent, grantConsent, requireConsent, revokeConsent } from "../src/service.js";
import { erasePerson, exportPersonData } from "../src/data-rights.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test_consent";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;
let personId: PersonId;

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
  await runMigrations(handle.pool);
  const person = await createPerson(handle.db, { pseudonym: "consent-test", ageBand: "35-44" });
  personId = person.id as PersonId;
  await attachIdentity(handle.db, { personId, phoneE164: "+447700900456", email: "consent@example.com" });
  await createEnrolment(handle.db, { personId, vertical: "smoking", status: "active", stage: "ready" });
});

afterAll(async () => {
  await handle.pool.end();
});

const scope = { purpose: "proactive_contact" } as const;

describe("consent service", () => {
  it("denies by default", async () => {
    expect(await checkConsent(handle.db, personId, scope)).toBe(false);
    await expect(requireConsent(handle.db, personId, scope)).rejects.toThrow(/consent not granted/);
  });

  it("grant -> allow, revoke -> deny, re-grant -> allow; every change is evented", async () => {
    await grantConsent(handle.db, { personId, ...scope, evidence: { source: "onboarding" } });
    expect(await checkConsent(handle.db, personId, scope)).toBe(true);
    await revokeConsent(handle.db, { personId, ...scope });
    expect(await checkConsent(handle.db, personId, scope)).toBe(false);
    await grantConsent(handle.db, { personId, ...scope });
    expect(await checkConsent(handle.db, personId, scope)).toBe(true);
    const { rows } = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'consent.changed' AND person_id = $1",
      [personId],
    );
    expect(Number(rows[0].count)).toBe(3);
  });

  it("scopes are independent", async () => {
    expect(await checkConsent(handle.db, personId, { purpose: "wearable_data" })).toBe(false);
  });
});

describe("data rights", () => {
  it("export bundle contains identity, person, and per-table sections", async () => {
    const bundle = await exportPersonData(handle.pool, personId);
    expect(bundle.person).toMatchObject({ pseudonym: "consent-test" });
    expect(bundle.identity).toMatchObject({ phone_e164: "+447700900456" });
    expect(Array.isArray(bundle["consent_record"])).toBe(true);
    expect((bundle["enrolment"] as unknown[]).length).toBe(1);
  });

  it("erasure removes identity + mutable data, anonymises the person, retains audit", async () => {
    await erasePerson(handle, personId);
    const identity = await handle.pool.query("SELECT * FROM identity.person_identity WHERE person_id = $1", [
      personId,
    ]);
    expect(identity.rowCount).toBe(0);
    const person = await handle.pool.query("SELECT * FROM core.person WHERE id = $1", [personId]);
    expect(person.rows[0].pseudonym).toMatch(/^erased-/);
    expect(person.rows[0].age_band).toBeNull();
    const enrolments = await handle.pool.query("SELECT count(*) FROM core.enrolment WHERE person_id = $1", [
      personId,
    ]);
    expect(enrolments.rows[0].count).toBe("0");
    const audit = await handle.pool.query("SELECT count(*) FROM core.consent_record WHERE person_id = $1", [
      personId,
    ]);
    expect(Number(audit.rows[0].count)).toBeGreaterThan(0);
    const erasedEvent = await handle.pool.query(
      "SELECT count(*) FROM core.event WHERE type = 'person.erased' AND person_id = $1",
      [personId],
    );
    expect(erasedEvent.rows[0].count).toBe("1");
  });
});
