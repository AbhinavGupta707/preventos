import type { Result } from "@preventos/shared";
import { err, ok, sha256Hex } from "@preventos/shared";
import type { ContentChannel, ResolvedAtom, Sequence } from "./schema.js";

export interface Catalog {
  readonly byId: ReadonlyMap<string, ResolvedAtom>;
  readonly sequences: ReadonlyMap<string, Sequence>;
  /** Deterministic content-version hash — what a cohort pins (plan WP4.1). */
  readonly hash: string;
}

export function buildCatalog(
  atoms: readonly ResolvedAtom[],
  sequences: readonly Sequence[] = [],
): Result<Catalog, string> {
  const byId = new Map<string, ResolvedAtom>();
  for (const atom of atoms) {
    if (byId.has(atom.id)) return err(`duplicate atom id: ${atom.id}`);
    byId.set(atom.id, atom);
  }
  const sequenceMap = new Map<string, Sequence>();
  for (const sequence of sequences) {
    if (sequenceMap.has(sequence.id) || byId.has(sequence.id)) {
      return err(`duplicate sequence id: ${sequence.id}`);
    }
    for (const step of sequence.steps) {
      if (!byId.has(step.atom)) {
        return err(`sequence ${sequence.id} references unknown atom ${step.atom}`);
      }
    }
    sequenceMap.set(sequence.id, sequence);
  }
  const sortedAtoms = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const sortedSequences = [...sequenceMap.values()].sort((a, b) => a.id.localeCompare(b.id));
  const hash = sha256Hex(JSON.stringify({ atoms: sortedAtoms, sequences: sortedSequences }));
  return ok({ byId, sequences: sequenceMap, hash });
}

export function resolveAtom(catalog: Catalog, id: string): Result<ResolvedAtom, string> {
  const atom = catalog.byId.get(id);
  return atom === undefined ? err(`unknown atom: ${id}`) : ok(atom);
}

export function isContraindicated(atom: ResolvedAtom, personFlags: readonly string[]): boolean {
  return atom.contraindications.some((flag) => personFlags.includes(flag));
}

export type ServeEnvironment = "production" | "development";

/**
 * Safety invariant 3 (CLAUDE.md): unapproved content is unreachable in
 * production. There is no override parameter by design.
 */
export function assertServable(atom: ResolvedAtom, environment: ServeEnvironment): Result<ResolvedAtom, string> {
  if (environment === "production" && atom.status === "draft") {
    return err(`atom ${atom.id} is ${atom.status} and cannot be served in production (no sign-off recorded)`);
  }
  return ok(atom);
}

/** Deterministic rendering: channel variant, else body, else numbered steps. */
export function renderAtom(
  atom: ResolvedAtom,
  channel: ContentChannel,
  slotValues: Readonly<Record<string, string>> = {},
): Result<string, string> {
  if (!atom.channels.includes(channel)) {
    return err(`atom ${atom.id} is not authored for channel ${channel}`);
  }
  const template =
    atom.channelVariants[channel] ??
    atom.body ??
    atom.steps?.map((step, i) => `${i + 1}. ${step}`).join("\n");
  if (template === undefined) return err(`atom ${atom.id} has no renderable content`);
  let missing: string | undefined;
  const rendered = template.replace(/\{([a-z0-9_]+)\}/g, (_, name: string) => {
    const value = slotValues[name];
    if (value === undefined) {
      missing = name;
      return "";
    }
    return value;
  });
  if (missing !== undefined) return err(`atom ${atom.id} requires slot value {${missing}}`);
  return ok(rendered);
}
