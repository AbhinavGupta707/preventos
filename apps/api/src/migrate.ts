import { pathToFileURL } from "node:url";
import { createDb, runMigrations } from "@preventos/db";

export const LOCAL_DATABASE_URL = "postgres://preventos:preventos_dev@localhost:5432/preventos";

export function resolveMigrationDatabaseUrl(env: Record<string, string | undefined>): string {
  const configured = env["DATABASE_URL"]?.trim();
  if (configured !== undefined && configured !== "") return configured;
  if (env["NODE_ENV"] === "production" || env["RENDER"] === "true") {
    throw new Error("DATABASE_URL is required for hosted migration runs");
  }
  return LOCAL_DATABASE_URL;
}

export async function main(env: Record<string, string | undefined> = process.env): Promise<void> {
  const databaseUrl = resolveMigrationDatabaseUrl(env);
  if (env["DATABASE_URL"]?.trim() === undefined || env["DATABASE_URL"]?.trim() === "") {
    process.stderr.write("DATABASE_URL unset; using local Docker Postgres default.\n");
  }

  const { pool } = createDb(databaseUrl);
  try {
    const applied = await runMigrations(pool);
    process.stdout.write(`database migrations applied: ${applied.length === 0 ? "none" : applied.join(", ")}\n`);
  } finally {
    await pool.end();
  }
}

const argvEntry = process.argv[1];
if (argvEntry !== undefined && import.meta.url === pathToFileURL(argvEntry).href) {
  await main();
}
