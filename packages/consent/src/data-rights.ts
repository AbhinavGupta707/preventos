import type pg from "pg";
import type { PersonId } from "@preventos/domain";
import type { Db } from "@preventos/db";
import { publish } from "@preventos/events";

const EXPORT_TABLES = [
  "enrolment",
  "consent_record",
  "event",
  "decision_record",
  "plan_object",
  "outcome_record",
  "contact_record",
  "sleep_diary_entry",
  "sleep_window",
  "drink_log_entry",
  "escalation_case",
  "coach_interaction",
] as const;

export interface PersonDataBundle {
  readonly person: unknown;
  readonly identity: unknown;
  readonly [table: string]: unknown;
}

/** UK GDPR right of access: one JSON bundle of everything held on the person. */
export async function exportPersonData(pool: pg.Pool, personId: PersonId): Promise<PersonDataBundle> {
  const person = await pool.query("SELECT * FROM core.person WHERE id = $1", [personId]);
  const identity = await pool.query("SELECT * FROM identity.person_identity WHERE person_id = $1", [personId]);
  const sections: Record<string, unknown[]> = {};
  for (const table of EXPORT_TABLES) {
    const { rows } = await pool.query(`SELECT * FROM core.${table} WHERE person_id = $1`, [personId]);
    sections[table] = rows;
  }
  return { person: person.rows[0] ?? null, identity: identity.rows[0] ?? null, ...sections };
}

const ERASE_MUTABLE_TABLES = [
  "contact_record",
  "plan_object",
  "outcome_record",
  "sleep_diary_entry",
  "drink_log_entry",
  "enrolment",
  // Coach transcripts hold free text (the person's words + raw model output);
  // unlike the append-only audit tables they are erased outright (WP6.1).
  "coach_interaction",
] as const;

/**
 * UK GDPR erasure with audit carve-outs (plan WP1.3 / PRD §7.4):
 * - identity schema row is deleted (all direct identifiers gone)
 * - the core person row is anonymised in place
 * - mutable person-content tables are deleted
 * - append-only audit tables (consent, event, decision, sleep_window) and
 *   escalation cases are retained: they carry only the pseudonymous id and
 *   coded payloads (enforced by the events catalogue), and safety/audit
 *   retention is a statutory carve-out explained to the user in plain language.
 */
export async function erasePerson(handle: { db: Db; pool: pg.Pool }, personId: PersonId): Promise<void> {
  const client = await handle.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM identity.person_identity WHERE person_id = $1", [personId]);
    for (const table of ERASE_MUTABLE_TABLES) {
      await client.query(`DELETE FROM core.${table} WHERE person_id = $1`, [personId]);
    }
    await client.query(
      `UPDATE core.person
          SET pseudonym = 'erased-' || left(id::text, 8),
              age_band = NULL, sex = NULL, nation = NULL,
              deprivation_quintile = NULL, acquisition_source = NULL
        WHERE id = $1`,
      [personId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  await publish(handle.db, "person.erased", { personId });
}
