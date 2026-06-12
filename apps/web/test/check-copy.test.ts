import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = join(__dirname, "..", "scripts", "check-copy.mjs");

function runChecker(dir?: string) {
  const args = dir ? [script, dir] : [script];
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

describe("claims-register copy lint (E16)", () => {
  it("fails on a forbidden sleep treatment claim", () => {
    const dir = mkdtempSync(join(tmpdir(), "copy-block-"));
    writeFileSync(join(dir, "bad.json"), JSON.stringify({ headline: "Clinically proven to treat insomnia" }));
    const result = runChecker(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("sleep-treatment-claims");
  });

  it("fails on an alcohol detox claim", () => {
    const dir = mkdtempSync(join(tmpdir(), "copy-block-"));
    writeFileSync(join(dir, "bad.tsx"), `export const copy = "Your at-home alcohol detox plan";`);
    const result = runChecker(dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("alcohol-clinical-claims");
  });

  it("passes clean copy", () => {
    const dir = mkdtempSync(join(tmpdir(), "copy-pass-"));
    writeFileSync(join(dir, "good.json"), JSON.stringify({ headline: "Build a sleep routine that works for you" }));
    const result = runChecker(dir);
    expect(result.status).toBe(0);
  });

  it("passes the real apps/web copy surfaces (the live gate)", () => {
    const result = runChecker();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });
});
