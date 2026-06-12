import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { ResolvedAtom } from "./schema.js";

/**
 * Claims-register lint (WP4.2, safety invariant 5). Consumes the machine-readable
 * register at compliance/claims/claims-register.json (WP10.10) — patterns live
 * THERE, never here, so governance owns the blocklists.
 */

const claimPatternSchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  flags: z.string().optional(),
  rationale: z.string().min(1),
});

const blocklistSchema = z.object({
  appliesTo: z.array(z.string().min(1)).min(1),
  enforcement: z.enum(["ci-blocking", "advisory"]),
  rationale: z.string().min(1),
  patterns: z.array(claimPatternSchema).min(1),
});

export const claimsRegisterSchema = z.object({
  version: z.string().min(1),
  status: z.string().min(1),
  blocklists: z.record(z.string(), blocklistSchema),
  testVectors: z.object({
    shouldBlock: z.array(z.object({ text: z.string().min(1), expectList: z.string().min(1) })),
    shouldPass: z.array(z.string().min(1)),
  }),
});
export type ClaimsRegister = z.infer<typeof claimsRegisterSchema>;

export async function loadClaimsRegister(filePath: string): Promise<ClaimsRegister> {
  return claimsRegisterSchema.parse(JSON.parse(await readFile(filePath, "utf8")));
}

export interface CompiledBlocklist {
  readonly listId: string;
  readonly appliesTo: readonly string[];
  readonly enforcement: "ci-blocking" | "advisory";
  readonly patterns: readonly { id: string; regex: RegExp; rationale: string }[];
}

export function compileClaimsRegister(register: ClaimsRegister): readonly CompiledBlocklist[] {
  return Object.entries(register.blocklists).map(([listId, list]) => ({
    listId,
    appliesTo: list.appliesTo,
    enforcement: list.enforcement,
    patterns: list.patterns.map((p) => ({
      id: p.id,
      regex: new RegExp(p.pattern, p.flags ?? ""),
      rationale: p.rationale,
    })),
  }));
}

/** "content/*" matches any content scope; otherwise exact match. */
function scopeMatches(appliesTo: string, scope: string): boolean {
  if (appliesTo.endsWith("/*")) return scope.startsWith(appliesTo.slice(0, -1));
  return appliesTo === scope;
}

export interface ClaimViolation {
  readonly listId: string;
  readonly patternId: string;
  readonly rationale: string;
  readonly excerpt: string;
}

export function lintTextClaims(
  compiled: readonly CompiledBlocklist[],
  text: string,
  scope: string,
): readonly ClaimViolation[] {
  const violations: ClaimViolation[] = [];
  for (const list of compiled) {
    if (!list.appliesTo.some((applies) => scopeMatches(applies, scope))) continue;
    for (const pattern of list.patterns) {
      const match = text.match(pattern.regex);
      if (match !== null) {
        violations.push({
          listId: list.listId,
          patternId: pattern.id,
          rationale: pattern.rationale,
          excerpt: match[0].slice(0, 80),
        });
      }
    }
  }
  return violations;
}

/** Every text surface of the atom is linted — body, variants, items, questions. */
export function lintAtomClaims(
  compiled: readonly CompiledBlocklist[],
  atom: ResolvedAtom,
): readonly ClaimViolation[] {
  const scope = `content/${atom.pack}`;
  const surfaces = [
    atom.title ?? "",
    atom.body ?? "",
    ...(atom.steps ?? []),
    ...Object.values(atom.channelVariants).filter((v): v is string => v !== undefined),
    ...Object.values(atom.toneVariants).filter((v): v is string => v !== undefined),
    ...(atom.items ?? []).map((item) => item.copy),
    ...(atom.questions ?? []).flatMap((q) => [q.prompt, ...q.options.map((o) => o.label)]),
    ...(atom.options ?? []),
  ];
  return surfaces.flatMap((surface) => lintTextClaims(compiled, surface, scope));
}
