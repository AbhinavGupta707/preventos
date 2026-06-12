import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildCatalog } from "../src/catalog.js";
import { loadAllPacks } from "../src/load.js";

const REPO_CONTENT = path.join(fileURLToPath(new URL("../../..", import.meta.url)), "content");

/**
 * CI gate for the real content packs: once content-session PRs merge into
 * content/, every pack must validate and form a single consistent catalog.
 * Passes trivially while content/ is empty or absent.
 */
describe("repo content packs", () => {
  it("every pack under content/ validates against the canonical schema", async () => {
    const loaded = await loadAllPacks(REPO_CONTENT);
    expect(loaded.errors).toEqual([]);
    const catalog = buildCatalog(loaded.atoms, loaded.sequences);
    expect(catalog.ok).toBe(true);
  });
});
