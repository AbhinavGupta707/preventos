import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

/**
 * Applies pending .sql migrations from `dir` in filename order, each inside a
 * transaction, tracked in public.schema_migrations. Returns the filenames it
 * applied — an empty array means the database was already up to date.
 */
export async function runMigrations(pool: Pool, dir: string = MIGRATIONS_DIR): Promise<readonly string[]> {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS public.schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];
  for (const file of files) {
    const seen = await pool.query("SELECT 1 FROM public.schema_migrations WHERE name = $1", [file]);
    if ((seen.rowCount ?? 0) > 0) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO public.schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      applied.push(file);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }
  return applied;
}
