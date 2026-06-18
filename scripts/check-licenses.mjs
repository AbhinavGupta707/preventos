import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BANNED = /AGPL|(?<!L)GPL/i;

const isBanned = (license) => {
  const alternatives = license.replace(/^\(|\)$/g, "").split(/\s+OR\s+/i);
  return alternatives.every((alt) => BANNED.test(alt));
};

let raw;
let source = "pnpm";
try {
  raw = execSync("pnpm licenses list --json", { encoding: "utf8" });
} catch (error) {
  source = "installed manifests";
  process.stderr.write(`pnpm license report unavailable (${error.message}); falling back to installed manifests\n`);
}

if (raw !== undefined && raw.trim().startsWith("No licenses")) {
  process.stdout.write("license check passed: no dependencies to check\n");
  process.exit(0);
}

function fallbackLicenseReport() {
  const root = join(process.cwd(), "node_modules", ".pnpm");
  const byLicense = {};
  const seen = new Set();

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const packageRoot = join(root, entry.name, "node_modules");
    let scopes;
    try {
      scopes = readdirSync(packageRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const scopeOrName of scopes) {
      const candidates = scopeOrName.name.startsWith("@")
        ? readdirSync(join(packageRoot, scopeOrName.name), { withFileTypes: true }).map((pkg) =>
            join(packageRoot, scopeOrName.name, pkg.name, "package.json"),
          )
        : [join(packageRoot, scopeOrName.name, "package.json")];

      for (const manifestPath of candidates) {
        let manifest;
        try {
          manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        } catch {
          continue;
        }

        const name = typeof manifest.name === "string" ? manifest.name : undefined;
        const version = typeof manifest.version === "string" ? manifest.version : undefined;
        const license = typeof manifest.license === "string" ? manifest.license : "UNKNOWN";
        if (name === undefined || version === undefined) continue;

        const key = `${name}@${version}`;
        if (seen.has(key)) continue;
        seen.add(key);

        byLicense[license] ??= [];
        byLicense[license].push({ name, versions: [version] });
      }
    }
  }

  return byLicense;
}

const byLicense = raw === undefined ? fallbackLicenseReport() : JSON.parse(raw);
const violations = Object.entries(byLicense)
  .filter(([license]) => isBanned(license))
  .flatMap(([license, pkgs]) => pkgs.map((p) => `${p.name}@${p.versions.join(",")} (${license})`));

if (violations.length > 0) {
  process.stderr.write(`banned licenses found (plan E11: no GPL/AGPL):\n${violations.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(`license check passed: no GPL/AGPL dependencies (${source})\n`);
