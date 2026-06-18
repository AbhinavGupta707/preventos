import { createDb, runMigrations } from "@preventos/db";

const DATABASE_URL = process.env["DATABASE_URL"];
if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");

const { pool } = createDb(DATABASE_URL);

try {
  const applied = await runMigrations(pool);
  process.stdout.write(`database migrations applied: ${applied.length === 0 ? "none" : applied.join(", ")}\n`);
} finally {
  await pool.end();
}
