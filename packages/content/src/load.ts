import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import type { ResolvedAtom, Sequence } from "./schema.js";
import { moduleFileSchema, resolveAtoms } from "./schema.js";

export interface LoadedPack {
  readonly atoms: readonly ResolvedAtom[];
  readonly sequences: readonly Sequence[];
  readonly errors: readonly string[];
}

export async function loadModuleFile(filePath: string): Promise<LoadedPack> {
  let parsed: unknown;
  try {
    parsed = parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return {
      atoms: [],
      sequences: [],
      errors: [`${filePath}: YAML parse failed — ${error instanceof Error ? error.message : String(error)}`],
    };
  }
  const result = moduleFileSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${filePath}: ${issue.path.join(".") || "(root)"} — ${issue.message}`,
    );
    return { atoms: [], sequences: [], errors };
  }
  return { atoms: resolveAtoms(result.data), sequences: result.data.sequences ?? [], errors: [] };
}

export async function loadPackDir(packDir: string): Promise<LoadedPack> {
  const entries = (await readdir(packDir)).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort();
  const atoms: ResolvedAtom[] = [];
  const sequences: Sequence[] = [];
  const errors: string[] = [];
  for (const entry of entries) {
    const loaded = await loadModuleFile(path.join(packDir, entry));
    atoms.push(...loaded.atoms);
    sequences.push(...loaded.sequences);
    errors.push(...loaded.errors);
  }
  return { atoms, sequences, errors };
}

/** Loads every pack under a content root (content/<pack>/*.yaml). */
export async function loadAllPacks(contentRoot: string): Promise<LoadedPack> {
  let packDirs: string[] = [];
  try {
    const entries = await readdir(contentRoot);
    const checks = await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(contentRoot, entry);
        return (await stat(full)).isDirectory() ? full : undefined;
      }),
    );
    packDirs = checks.filter((dir): dir is string => dir !== undefined);
  } catch {
    return { atoms: [], sequences: [], errors: [] };
  }
  const loaded = await Promise.all(packDirs.map((dir) => loadPackDir(dir)));
  return {
    atoms: loaded.flatMap((pack) => [...pack.atoms]),
    sequences: loaded.flatMap((pack) => [...pack.sequences]),
    errors: loaded.flatMap((pack) => [...pack.errors]),
  };
}
