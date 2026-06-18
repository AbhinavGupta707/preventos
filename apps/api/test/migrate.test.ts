import { describe, expect, it } from "vitest";
import { LOCAL_DATABASE_URL, resolveMigrationDatabaseUrl } from "../src/migrate.js";

describe("migration database URL resolution", () => {
  it("uses the configured database URL when present", () => {
    expect(resolveMigrationDatabaseUrl({ DATABASE_URL: "postgres://managed/db" })).toBe("postgres://managed/db");
  });

  it("uses the local Docker Postgres default for local runs", () => {
    expect(resolveMigrationDatabaseUrl({})).toBe(LOCAL_DATABASE_URL);
    expect(resolveMigrationDatabaseUrl({ DATABASE_URL: "   " })).toBe(LOCAL_DATABASE_URL);
  });

  it("requires an explicit database URL for hosted runs", () => {
    expect(() => resolveMigrationDatabaseUrl({ NODE_ENV: "production" })).toThrow(
      "DATABASE_URL is required for hosted migration runs",
    );
    expect(() => resolveMigrationDatabaseUrl({ RENDER: "true" })).toThrow(
      "DATABASE_URL is required for hosted migration runs",
    );
  });
});
