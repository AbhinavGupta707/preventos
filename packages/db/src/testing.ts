import pg from "pg";

/**
 * Shared advisory-lock key. `CREATE DATABASE` / `DROP DATABASE` take global
 * catalog locks and can collide when turbo runs integration suites
 * concurrently (W3-TESTCI). A single cluster-wide advisory lock serialises
 * just the DDL setup across suites — the tests themselves still run in
 * parallel against their own uniquely-named databases.
 */
const DDL_LOCK_KEY = 990099;

/**
 * Drops and recreates a test database, holding a cluster-wide advisory lock for
 * the duration so concurrent suites never run CREATE/DROP at the same time.
 * `dbName` must be a trusted, code-defined identifier (it is interpolated, not
 * parameterised — Postgres does not allow bound identifiers in DDL).
 */
export async function resetTestDatabase(adminUrl: string, dbName: string): Promise<void> {
  if (!/^[a-z_][a-z0-9_]*$/.test(dbName)) throw new Error(`unsafe test db name: ${dbName}`);
  const admin = new pg.Pool({ connectionString: adminUrl, max: 1 });
  try {
    const client = await admin.connect();
    try {
      await client.query("SELECT pg_advisory_lock($1)", [DDL_LOCK_KEY]);
      try {
        await client.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
        await client.query(`CREATE DATABASE ${dbName}`);
      } finally {
        await client.query("SELECT pg_advisory_unlock($1)", [DDL_LOCK_KEY]);
      }
    } finally {
      client.release();
    }
  } finally {
    await admin.end();
  }
}
