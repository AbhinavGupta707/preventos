import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildCatalog } from "../src/catalog.js";
import { loadAllPacks, loadPackDir } from "../src/load.js";

const REPO_CONTENT = path.join(fileURLToPath(new URL("../../..", import.meta.url)), "content");

/**
 * RATCHET — packs drafted before the canonical schema existed (WP4.1), awaiting
 * migration under WP4.2m. Every entry here is a known, loudly-tracked gap, not
 * coverage. The migration session must shrink this set to empty; when a pack
 * validates cleanly this test FAILS until it is removed from the list, so the
 * ratchet only ever tightens.
 *
 * EMPTY since WP4.2m: all four packs validate against the canonical schema.
 * Nothing may ever be added back.
 */
const LEGACY_PACKS = new Set<string>([]);

async function packDirs(): Promise<string[]> {
  try {
    const entries = await readdir(REPO_CONTENT);
    const checks = await Promise.all(
      entries.map(async (entry) =>
        (await stat(path.join(REPO_CONTENT, entry))).isDirectory() ? entry : undefined,
      ),
    );
    return checks.filter((d): d is string => d !== undefined);
  } catch {
    return [];
  }
}

describe("repo content packs", () => {
  it("every non-legacy pack validates; legacy entries are real and still legacy", async () => {
    const dirs = await packDirs();
    for (const legacy of LEGACY_PACKS) {
      expect(dirs, `LEGACY_PACKS entry "${legacy}" does not exist under content/ — remove it`).toContain(legacy);
    }
    for (const dir of dirs) {
      const loaded = await loadPackDir(path.join(REPO_CONTENT, dir));
      if (LEGACY_PACKS.has(dir)) {
        expect(
          loaded.errors.length,
          `pack "${dir}" now validates cleanly — remove it from LEGACY_PACKS to lock it in`,
        ).toBeGreaterThan(0);
        continue;
      }
      expect(loaded.errors, `pack "${dir}" must validate against the canonical schema`).toEqual([]);
      const catalog = buildCatalog(loaded.atoms, loaded.sequences);
      expect(catalog.ok, `pack "${dir}" must form a consistent catalog`).toBe(true);
    }
  });

  it("all packs together form one catalog (no cross-pack id collisions)", async () => {
    const loaded = await loadAllPacks(REPO_CONTENT);
    expect(loaded.errors).toEqual([]);
    expect(loaded.atoms.length).toBeGreaterThanOrEqual(300);
    const catalog = buildCatalog(loaded.atoms, loaded.sequences);
    expect(catalog.ok, catalog.ok ? "" : catalog.error).toBe(true);
  });
});
