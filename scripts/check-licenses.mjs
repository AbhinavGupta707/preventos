import { execSync } from "node:child_process";

const BANNED = /AGPL|(?<!L)GPL/i;

const isBanned = (license) => {
  const alternatives = license.replace(/^\(|\)$/g, "").split(/\s+OR\s+/i);
  return alternatives.every((alt) => BANNED.test(alt));
};

let raw;
try {
  raw = execSync("pnpm licenses list --json", { encoding: "utf8" });
} catch (error) {
  process.stderr.write(`license check failed to run: ${error.message}\n`);
  process.exit(1);
}

if (raw.trim().startsWith("No licenses")) {
  process.stdout.write("license check passed: no dependencies to check\n");
  process.exit(0);
}

const byLicense = JSON.parse(raw);
const violations = Object.entries(byLicense)
  .filter(([license]) => isBanned(license))
  .flatMap(([license, pkgs]) => pkgs.map((p) => `${p.name}@${p.versions.join(",")} (${license})`));

if (violations.length > 0) {
  process.stderr.write(`banned licenses found (plan E11: no GPL/AGPL):\n${violations.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write("license check passed: no GPL/AGPL dependencies\n");
