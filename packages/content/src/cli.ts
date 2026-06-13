import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OUTCOME_REF_IDS } from "@preventos/outcomes";
import { compileClaimsRegister, loadClaimsRegister } from "./claims.js";
import { loadSignoffRegistry } from "./signoff.js";
import { validatePack } from "./validate.js";

/**
 * Authoring validator CLI (WP4.2). Validates every pack under a content root:
 *
 *   pnpm content:validate            # whole repo content/, used by CI
 *   pnpm content:validate content/sleep [content/smoking …]
 *
 * Exit code 1 when any pack has errors. Warnings (reading age) never block.
 */

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

async function resolvePackDirs(args: readonly string[]): Promise<readonly string[]> {
  if (args.length > 0) return args.map((arg) => path.resolve(arg));
  const contentRoot = path.join(REPO_ROOT, "content");
  const entries = await readdir(contentRoot);
  const checks = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(contentRoot, entry);
      return (await stat(full)).isDirectory() ? full : undefined;
    }),
  );
  return checks.filter((dir): dir is string => dir !== undefined).sort();
}

async function main(args: readonly string[]): Promise<number> {
  const out = (line: string): void => void process.stdout.write(`${line}\n`);
  const register = await loadClaimsRegister(path.join(REPO_ROOT, "compliance", "claims", "claims-register.json"));
  const compiled = compileClaimsRegister(register);
  const signoff = await loadSignoffRegistry(path.join(REPO_ROOT, "compliance", "sign-off-registry.yaml"));

  let failed = false;
  for (const packDir of await resolvePackDirs(args)) {
    const report = await validatePack(packDir, compiled, signoff, OUTCOME_REF_IDS);
    const status = report.errors.length === 0 ? "ok" : "FAIL";
    const hash = report.catalogHash === undefined ? "" : ` catalog=${report.catalogHash.slice(0, 12)}`;
    out(`[${status}] ${report.pack}: ${report.atomCount} atoms${hash}`);
    for (const error of report.errors) out(`  error: ${error}`);
    for (const warning of report.warnings) out(`  warn:  ${warning}`);
    if (report.errors.length > 0) failed = true;
  }
  return failed ? 1 : 0;
}

process.exitCode = await main(process.argv.slice(2));
