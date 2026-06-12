#!/usr/bin/env node
// WP10.10 — claims-register validator + copy checker. Dependency-free.
//
//   node check-claims-register.mjs              validate register + run test vectors
//   node check-claims-register.mjs --check "…"  check a copy string; exit 1 if blocked
//
// WP4.2's content lint consumes claims-register.json directly; this script keeps the
// register itself honest (patterns compile, vectors pin behaviour) until then.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const registerPath = join(dirname(fileURLToPath(import.meta.url)), "claims-register.json");

function loadRegister() {
  const raw = readFileSync(registerPath, "utf8");
  const register = JSON.parse(raw);
  for (const key of ["version", "status", "blocklists", "testVectors"]) {
    if (!(key in register)) throw new Error(`register missing required key: ${key}`);
  }
  return register;
}

function compileBlocklists(register) {
  const compiled = new Map();
  for (const [listName, list] of Object.entries(register.blocklists)) {
    if (!Array.isArray(list.patterns) || list.patterns.length === 0) {
      throw new Error(`blocklist ${listName} has no patterns`);
    }
    const patterns = list.patterns.map((p) => {
      if (!p.id || !p.pattern || !p.rationale) {
        throw new Error(`blocklist ${listName}: pattern missing id/pattern/rationale`);
      }
      try {
        return { id: p.id, regex: new RegExp(p.pattern, p.flags ?? "") };
      } catch (err) {
        throw new Error(`blocklist ${listName} pattern ${p.id} does not compile: ${err.message}`);
      }
    });
    compiled.set(listName, patterns);
  }
  return compiled;
}

function matchesFor(compiled, text) {
  const hits = [];
  for (const [listName, patterns] of compiled) {
    for (const { id, regex } of patterns) {
      if (regex.test(text)) hits.push({ list: listName, id });
    }
  }
  return hits;
}

function runVectors(register, compiled) {
  const failures = [];
  for (const vector of register.testVectors.shouldBlock) {
    const hits = matchesFor(compiled, vector.text);
    const hitLists = new Set(hits.map((h) => h.list));
    if (hits.length === 0) {
      failures.push(`shouldBlock NOT blocked: "${vector.text}"`);
    } else if (vector.expectList && !hitLists.has(vector.expectList)) {
      failures.push(
        `shouldBlock matched wrong list for "${vector.text}": expected ${vector.expectList}, got ${[...hitLists].join(", ")}`,
      );
    }
  }
  for (const text of register.testVectors.shouldPass) {
    const hits = matchesFor(compiled, text);
    if (hits.length > 0) {
      const detail = hits.map((h) => `${h.list}/${h.id}`).join(", ");
      failures.push(`shouldPass was blocked: "${text}" (${detail})`);
    }
  }
  for (const [vertical, entries] of Object.entries(register.approvedLanguage ?? {})) {
    for (const entry of entries) {
      const hits = matchesFor(compiled, entry.text);
      if (hits.length > 0) {
        const detail = hits.map((h) => `${h.list}/${h.id}`).join(", ");
        failures.push(`approvedLanguage ${vertical}/${entry.id} is blocked by own register: (${detail})`);
      }
    }
  }
  return failures;
}

function main() {
  const register = loadRegister();
  const compiled = compileBlocklists(register);
  const checkIndex = process.argv.indexOf("--check");

  if (checkIndex !== -1) {
    const text = process.argv[checkIndex + 1];
    if (!text) {
      console.error("usage: check-claims-register.mjs --check \"<copy>\"");
      process.exit(2);
    }
    const hits = matchesFor(compiled, text);
    if (hits.length > 0) {
      console.error(`BLOCKED by ${hits.map((h) => `${h.list}/${h.id}`).join(", ")}`);
      process.exit(1);
    }
    console.log("PASS — no blocklist match");
    return;
  }

  const failures = runVectors(register, compiled);
  const totalPatterns = [...compiled.values()].reduce((n, p) => n + p.length, 0);
  if (failures.length > 0) {
    console.error(`claims register INVALID (${failures.length} failure(s)):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `claims register OK — ${compiled.size} blocklists, ${totalPatterns} patterns, ` +
      `${register.testVectors.shouldBlock.length} block vectors + ${register.testVectors.shouldPass.length} pass vectors green`,
  );
}

main();
