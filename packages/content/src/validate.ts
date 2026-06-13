import path from "node:path";
import { buildCatalog } from "./catalog.js";
import type { CompiledBlocklist } from "./claims.js";
import { lintAtomClaims } from "./claims.js";
import { loadPackDir } from "./load.js";
import { estimateReadingAge } from "./reading-age.js";
import { checkSignoff } from "./signoff.js";
import type { SignoffRegistry } from "./signoff.js";

/**
 * Per-pack authoring validation (WP4.2): canonical schema + catalog
 * consistency + claims-register lint + sign-off enforcement + outcome_ref
 * resolution, with a reading-age report as warnings. Errors fail CI; warnings
 * do not. `knownOutcomeIds` is the recognised-outcome registry
 * (@preventos/outcomes OUTCOME_REF_IDS) every atom `outcome_ref` must resolve
 * against — a dangling ref is an error (WP W3-GUARDS).
 */

export interface PackReport {
  readonly pack: string;
  readonly atomCount: number;
  readonly catalogHash?: string;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/** Estimated age may exceed the declared target by this much before we warn. */
const READING_AGE_TOLERANCE = 3;

export async function validatePack(
  packDir: string,
  compiledClaims: readonly CompiledBlocklist[],
  signoffRegistry: SignoffRegistry,
  knownOutcomeIds: ReadonlySet<string>,
): Promise<PackReport> {
  const pack = path.basename(packDir);
  const loaded = await loadPackDir(packDir);
  const errors: string[] = [...loaded.errors];
  const warnings: string[] = [];

  for (const atom of loaded.atoms) {
    for (const violation of lintAtomClaims(compiledClaims, atom)) {
      errors.push(
        `${atom.id}: claims-register violation [${violation.listId}/${violation.patternId}] ` +
          `"${violation.excerpt}" — ${violation.rationale}`,
      );
    }
    // A content outcome_ref must name a recognised outcome id (defined or
    // declared-pending) — a dangling ref would silently drop an outcome ask.
    if (atom.outcomeRef !== undefined && !knownOutcomeIds.has(atom.outcomeRef)) {
      errors.push(`${atom.id}: outcome_ref "${atom.outcomeRef}" does not resolve to a known outcome definition`);
    }
    const body = atom.body ?? atom.steps?.join(" ");
    if (body !== undefined) {
      const estimated = estimateReadingAge(body);
      if (estimated !== undefined && estimated > atom.readingAge + READING_AGE_TOLERANCE) {
        warnings.push(
          `${atom.id}: estimated reading age ${estimated} exceeds declared ${atom.readingAge} (+${READING_AGE_TOLERANCE} tolerance)`,
        );
      }
    }
  }

  errors.push(...checkSignoff(loaded.atoms, signoffRegistry));

  let catalogHash: string | undefined;
  if (errors.length === 0) {
    const catalog = buildCatalog(loaded.atoms, loaded.sequences);
    if (catalog.ok) {
      catalogHash = catalog.value.hash;
    } else {
      errors.push(`catalog: ${catalog.error}`);
    }
  }

  return {
    pack,
    atomCount: loaded.atoms.length,
    ...(catalogHash !== undefined ? { catalogHash } : {}),
    errors,
    warnings,
  };
}
