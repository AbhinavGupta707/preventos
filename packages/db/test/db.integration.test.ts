import { resetTestDatabase } from "../src/testing.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PersonId } from "@preventos/domain";
import { createDb } from "../src/client.js";
import { runMigrations } from "../src/migrate.js";
import {
  appendConsent,
  appendDecision,
  appendEvent,
  attachIdentity,
  consentHistoryFor,
  createEnrolment,
  createPerson,
} from "../src/repos.js";

const ADMIN_URL = process.env["DATABASE_URL"] ?? "postgres://preventos:preventos_dev@localhost:5432/preventos";
const TEST_DB = "preventos_test";
const TEST_URL = ADMIN_URL.replace(/\/[^/]*$/, `/${TEST_DB}`);

let handle: ReturnType<typeof createDb>;

beforeAll(async () => {
  await resetTestDatabase(ADMIN_URL, TEST_DB);
  handle = createDb(TEST_URL);
});

afterAll(async () => {
  await handle.pool.end();
});

describe("migrations", () => {
  it("applies cleanly on a fresh database and is idempotent on re-run", async () => {
    const first = await runMigrations(handle.pool);
    expect(first.length).toBeGreaterThan(0);
    const second = await runMigrations(handle.pool);
    expect(second).toEqual([]);
  });
});

describe("schema round-trips and invariants", () => {
  let personId: string;

  it("creates a pseudonymous person and round-trips through drizzle", async () => {
    const created = await createPerson(handle.db, {
      pseudonym: "amber-fox-12",
      ageBand: "35-44",
      sex: "female",
      nation: "scotland",
      deprivationQuintile: 2,
      acquisitionSource: "organic-web",
    });
    personId = created.id;
    expect(created.pseudonym).toBe("amber-fox-12");
    expect(created.language).toBe("en-GB");
  });

  it("keeps direct identifiers only in the identity schema", async () => {
    const identityRow = await attachIdentity(handle.db, {
      personId,
      phoneE164: "+447700900123",
      email: "test@example.com",
      postcode: "G1 1AA",
    });
    expect(identityRow.personId).toBe(personId);
    const corePersonColumns = await handle.pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'person'",
    );
    const names = corePersonColumns.rows.map((r: { column_name: string }) => r.column_name);
    for (const banned of ["phone_e164", "email", "postcode", "clerk_user_id"]) {
      expect(names).not.toContain(banned);
    }
  });

  it("allows one active enrolment per vertical and rejects a second", async () => {
    await createEnrolment(handle.db, { personId, vertical: "smoking", status: "active", stage: "ready" });
    const thrown = await createEnrolment(handle.db, {
      personId,
      vertical: "smoking",
      status: "active",
      stage: "ready",
    }).then(
      () => undefined,
      (error: unknown) => error,
    );
    expect(thrown).toBeInstanceOf(Error);
    const cause = (thrown as Error).cause as { constraint?: string } | undefined;
    expect(cause?.constraint).toBe("one_active_enrolment_per_vertical");
    await createEnrolment(handle.db, { personId, vertical: "sleep", status: "active", stage: "acting" });
  });

  it("consent records are append-only: UPDATE and DELETE are rejected by the database", async () => {
    const row = await appendConsent(handle.db, {
      personId: personId as PersonId,
      purpose: "proactive_contact",
      action: "granted",
      evidence: { source: "onboarding" },
    });
    const history = await consentHistoryFor(handle.db, personId);
    expect(history.length).toBe(1);
    await expect(
      handle.pool.query("UPDATE core.consent_record SET action = 'revoked' WHERE id = $1", [row.id]),
    ).rejects.toThrow(/append-only/);
    await expect(handle.pool.query("DELETE FROM core.consent_record WHERE id = $1", [row.id])).rejects.toThrow(
      /append-only/,
    );
  });

  it("events are append-only", async () => {
    const created = await appendEvent(handle.db, { type: "test.event", personId, payload: { n: 1 } });
    await expect(handle.pool.query("DELETE FROM core.event WHERE id = $1", [created.id])).rejects.toThrow(
      /append-only/,
    );
  });

  it("decision records enforce the probability bound in both layers", async () => {
    const base = {
      personId: personId as PersonId,
      vertical: "smoking" as const,
      stateSnapshot: { stage: "acting" },
      candidates: [{ atom: "smoking.craving.surf90" }],
      policyVersion: "rules@0.1.0",
      chosenAction: { atom: "smoking.craving.surf90" },
    };
    const stored = await appendDecision(handle.db, { ...base, randomisationProbability: 1 });
    expect(stored.randomisationProbability).toBe(1);
    await expect(appendDecision(handle.db, { ...base, randomisationProbability: 1.5 })).rejects.toThrow(
      /within \[0, 1\]/,
    );
    await expect(
      handle.pool.query(
        `INSERT INTO core.decision_record
           (person_id, vertical, state_snapshot, candidates, policy_version, chosen_action, randomisation_probability)
         VALUES ($1, 'smoking', '{}', '[]', 'raw', '{}', 1.5)`,
        [personId],
      ),
    ).rejects.toThrow(/check/i);
    await expect(handle.pool.query("DELETE FROM core.decision_record WHERE id = $1", [stored.id])).rejects.toThrow(
      /append-only/,
    );
  });

  it("sleep windows are append-only (titration history is auditable)", async () => {
    await handle.pool.query(
      `INSERT INTO core.sleep_window (person_id, version, window_start, window_end, effective_from)
       VALUES ($1, 1, '23:30', '06:00', '2026-06-15')`,
      [personId],
    );
    await expect(
      handle.pool.query("UPDATE core.sleep_window SET window_start = '23:00' WHERE person_id = $1", [personId]),
    ).rejects.toThrow(/append-only/);
  });
});
