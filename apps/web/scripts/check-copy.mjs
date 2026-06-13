#!/usr/bin/env node
// WP3.1 — claims-register lint for the web surface (E16).
// Scans every source file that can carry user-facing copy against the
// compliance/claims/claims-register.json blocklists. Raw-text scan by design:
// over-blocking beats under-blocking for regulated copy.
//
//   node scripts/check-copy.mjs            scan apps/web copy surfaces
//   node scripts/check-copy.mjs <dir>      scan an explicit directory (used by tests)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(webRoot, "..", "..");
const registerPath = join(repoRoot, "compliance", "claims", "claims-register.json");

const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".json", ".md", ".mdx"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", ".turbo", "test"]);

function loadPatterns() {
  const register = JSON.parse(readFileSync(registerPath, "utf8"));
  const patterns = [];
  for (const [listName, list] of Object.entries(register.blocklists)) {
    for (const p of list.patterns) {
      patterns.push({ list: listName, id: p.id, regex: new RegExp(p.pattern, p.flags ?? "") });
    }
  }
  if (patterns.length === 0) throw new Error("claims register has no patterns — refusing to pass");
  return patterns;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (SCAN_EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

function scan(roots, patterns) {
  const violations = [];
  for (const root of roots) {
    let files;
    try {
      files = walk(root);
    } catch {
      continue; // directory absent — nothing to scan
    }
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const { list, id, regex } of patterns) {
        const match = regex.exec(text);
        if (match) {
          violations.push({ file: relative(webRoot, file), list, id, excerpt: match[0].slice(0, 80) });
        }
      }
    }
  }
  return violations;
}

function main() {
  const patterns = loadPatterns();
  const explicitDir = process.argv[2];
  const roots = explicitDir ? [explicitDir] : SCAN_DIRS.map((d) => join(webRoot, d));
  const violations = scan(roots, patterns);
  if (violations.length > 0) {
    process.stderr.write(`claims lint FAILED — ${violations.length} violation(s):\n`);
    for (const v of violations) {
      process.stderr.write(`  ${v.file}: [${v.list}/${v.id}] "${v.excerpt}"\n`);
    }
    process.exit(1);
  }
  process.stdout.write(`claims lint OK — ${patterns.length} patterns, no blocked copy\n`);
}

main();
