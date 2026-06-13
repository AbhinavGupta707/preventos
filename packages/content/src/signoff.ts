import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { z } from "zod";
import type { ResolvedAtom } from "./schema.js";

/**
 * Sign-off registry schema + enforcement (WP4.2, safety invariant 3).
 * The registry lives at compliance/sign-off-registry.yaml; entries are added by
 * humans through WP10.2. An empty registry means nothing is cleared for real
 * users — so no atom may carry status approved/locked.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const GATE = /^G[1-5]$/;

export const signoffEntrySchema = z.object({
  id: z.string().min(1),
  /** Pack path being signed, optionally pinned to a catalog hash: "content/smoking@<hash>". */
  artifact: z.string().min(1),
  scope: z.string().min(1),
  signed_by: z.string().min(1),
  date: z.string().regex(DATE, "dates are YYYY-MM-DD"),
  gate: z.string().regex(GATE, "gate references look like G1–G5"),
  notes: z.string().optional(),
});
export type SignoffEntry = z.infer<typeof signoffEntrySchema>;

export const signoffRegistrySchema = z.object({
  entries: z.array(signoffEntrySchema),
});
export type SignoffRegistry = z.infer<typeof signoffRegistrySchema>;

export async function loadSignoffRegistry(filePath: string): Promise<SignoffRegistry> {
  return signoffRegistrySchema.parse(parse(await readFile(filePath, "utf8")));
}

export function isPackSignedOff(registry: SignoffRegistry, pack: string): boolean {
  return registry.entries.some(
    (entry) => entry.artifact === `content/${pack}` || entry.artifact.startsWith(`content/${pack}@`),
  );
}

/** Non-draft atoms without a covering registry entry are errors. */
export function checkSignoff(
  atoms: readonly ResolvedAtom[],
  registry: SignoffRegistry,
): readonly string[] {
  return atoms
    .filter((atom) => atom.status !== "draft" && !isPackSignedOff(registry, atom.pack))
    .map(
      (atom) =>
        `atom ${atom.id} is ${atom.status} but pack "${atom.pack}" has no sign-off registry entry (safety invariant 3)`,
    );
}
