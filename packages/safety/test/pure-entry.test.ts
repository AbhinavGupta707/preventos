import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * W3-SAFEPORT proof: `@preventos/safety/classify` must import with NO
 * @preventos/db dependency so it can be bundled into apps/mobile and apps/web
 * (which cannot pull in a Postgres driver). This test walks the *real* import
 * graph from the pure entry and fails if anything db-shaped is reachable. It is
 * a transitive, runtime-shaped check; the matching eslint boundary
 * (eslint.config.mjs) is the structural guard that stops a regression at lint.
 */

const SRC = join(import.meta.dirname, "..", "src");
const PKG_ROOT = join(SRC, "..");
const FORBIDDEN = ["@preventos/db", "@preventos/events", "drizzle-orm", "pg"] as const;

function specifiersOf(file: string): readonly string[] {
  const code = readFileSync(file, "utf8");
  const specs: string[] = [];
  // `import ... from "x"` and `export ... from "x"` (incl. multiline + type-only)
  for (const m of code.matchAll(/\bfrom\s*["']([^"']+)["']/g)) {
    if (m[1] !== undefined) specs.push(m[1]);
  }
  // bare side-effect `import "x"`
  for (const m of code.matchAll(/\bimport\s*["']([^"']+)["']/g)) {
    if (m[1] !== undefined) specs.push(m[1]);
  }
  return specs;
}

/** Follow relative imports (./foo.js -> ./foo.ts) transitively; collect bare (package) specifiers and visited files. */
function walk(entry: string): { externals: Set<string>; files: Set<string> } {
  const externals = new Set<string>();
  const files = new Set<string>();
  const stack: string[] = [entry];
  while (stack.length > 0) {
    const file = stack.pop();
    if (file === undefined || files.has(file)) continue;
    files.add(file);
    for (const spec of specifiersOf(file)) {
      if (spec.startsWith(".")) {
        stack.push(resolve(dirname(file), spec).replace(/\.js$/, ".ts"));
      } else {
        externals.add(spec);
      }
    }
  }
  return { externals, files };
}

function depsOf(pkgName: string): readonly string[] {
  const name = pkgName.replace("@preventos/", "");
  const pj = JSON.parse(readFileSync(join(SRC, "..", "..", name, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  return Object.keys(pj.dependencies ?? {});
}

describe("@preventos/safety/classify — pure, db-free entry [W3-SAFEPORT]", () => {
  const pure = walk(join(SRC, "classify-entry.ts"));

  it("its transitive import graph reaches no db / event / orm package", () => {
    for (const forbidden of FORBIDDEN) {
      const hit = [...pure.externals].some((e) => e === forbidden || e.startsWith(`${forbidden}/`));
      expect(hit, `pure entry must not import ${forbidden}`).toBe(false);
    }
  });

  it("only @preventos/domain crosses the @preventos boundary", () => {
    const internal = [...pure.externals].filter((e) => e.startsWith("@preventos/")).sort();
    expect(internal).toEqual(["@preventos/domain"]);
  });

  it("never reaches the db-backed escalation queue module", () => {
    expect([...pure.files].some((f) => f.endsWith("queue.ts"))).toBe(false);
  });

  it("the full @preventos dependency closure of the pure entry is db-free", () => {
    const seen = new Set<string>();
    const queue = [...pure.externals].filter((e) => e.startsWith("@preventos/"));
    while (queue.length > 0) {
      const pkg = queue.pop();
      if (pkg === undefined || seen.has(pkg)) continue;
      seen.add(pkg);
      const deps = depsOf(pkg);
      for (const forbidden of FORBIDDEN) {
        expect(deps, `${pkg} must not depend on ${forbidden}`).not.toContain(forbidden);
      }
      for (const dep of deps) if (dep.startsWith("@preventos/")) queue.push(dep);
    }
    expect([...seen].sort()).toEqual(["@preventos/domain", "@preventos/shared"]);
  });

  it("negative control: the walker DOES catch the db via the full package root", () => {
    const full = walk(join(SRC, "index.ts"));
    expect([...full.externals]).toContain("@preventos/db");
    expect([...full.files].some((f) => f.endsWith("queue.ts"))).toBe(true);
  });

  it("package.json maps ./classify to the pure entry and keeps the root full", () => {
    const pj = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")) as {
      exports: Record<string, { default: string }>;
    };
    expect(pj.exports["./classify"]?.default).toBe("./src/classify-entry.ts");
    expect(pj.exports["."]?.default).toBe("./src/index.ts");
  });
});
