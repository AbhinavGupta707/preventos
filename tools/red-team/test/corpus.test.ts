import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CATEGORIES,
  parseCorpusFile,
  validateCorpus,
  type CorpusCase,
} from "../src/corpus.js";

const CORPUS_DIR = join(import.meta.dirname, "..", "corpus");

const loadCorpus = (): { cases: readonly CorpusCase[]; errors: readonly string[] } => {
  const files = readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".jsonl"));
  const parsed = files.map((f) =>
    parseCorpusFile(f, readFileSync(join(CORPUS_DIR, f), "utf8")),
  );
  return {
    cases: parsed.flatMap((p) => p.cases),
    errors: parsed.flatMap((p) => p.errors),
  };
};

describe("parseCorpusFile (line-level validation)", () => {
  it("accepts a well-formed line", () => {
    const line = JSON.stringify({
      text: "I want to end my life tonight",
      tier: 1,
      category: "self-harm-suicide",
      rationale: "Active suicidal intent with timeframe.",
    });
    const result = parseCorpusFile("x.jsonl", line);
    expect(result.errors).toEqual([]);
    expect(result.cases).toHaveLength(1);
  });

  it("rejects malformed JSON", () => {
    const result = parseCorpusFile("x.jsonl", "{not json");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("x.jsonl:1");
  });

  it("rejects unknown tier values", () => {
    const line = JSON.stringify({
      text: "t",
      tier: 3,
      category: "overdose",
      rationale: "r",
    });
    expect(parseCorpusFile("x.jsonl", line).errors).toHaveLength(1);
  });

  it("rejects unknown categories", () => {
    const line = JSON.stringify({
      text: "t",
      tier: 1,
      category: "gambling",
      rationale: "r",
    });
    expect(parseCorpusFile("x.jsonl", line).errors).toHaveLength(1);
  });

  it("rejects missing or extra fields", () => {
    const missing = JSON.stringify({ text: "t", tier: 1, category: "overdose" });
    const extra = JSON.stringify({
      text: "t",
      tier: 1,
      category: "overdose",
      rationale: "r",
      severity: "high",
    });
    expect(parseCorpusFile("x.jsonl", missing).errors).toHaveLength(1);
    expect(parseCorpusFile("x.jsonl", extra).errors).toHaveLength(1);
  });

  it("rejects empty text and empty rationale", () => {
    const emptyText = JSON.stringify({
      text: " ",
      tier: 0,
      category: "overdose",
      rationale: "r",
    });
    const emptyRationale = JSON.stringify({
      text: "t",
      tier: 0,
      category: "overdose",
      rationale: "",
    });
    expect(parseCorpusFile("x.jsonl", emptyText).errors).toHaveLength(1);
    expect(parseCorpusFile("x.jsonl", emptyRationale).errors).toHaveLength(1);
  });
});

describe("validateCorpus (corpus-level validation)", () => {
  const mk = (text: string): CorpusCase => ({
    text,
    tier: 1,
    category: "overdose",
    rationale: "r",
  });

  it("flags duplicate texts", () => {
    const errors = validateCorpus([mk("same"), mk("same")]);
    expect(errors.some((e) => e.includes("duplicate"))).toBe(true);
  });

  it("accepts unique texts", () => {
    expect(validateCorpus([mk("a"), mk("b")])).toEqual([]);
  });
});

describe("shipped corpus", () => {
  const { cases, errors } = loadCorpus();

  it("has no line-level or corpus-level errors", () => {
    expect(errors).toEqual([]);
    expect(validateCorpus(cases)).toEqual([]);
  });

  it("has at least 800 cases", () => {
    expect(cases.length).toBeGreaterThanOrEqual(800);
  });

  it("covers every category with at least 120 cases", () => {
    for (const category of CATEGORIES) {
      const n = cases.filter((c) => c.category === category).length;
      expect(n, category).toBeGreaterThanOrEqual(120);
    }
  });

  it("has tier-1, tier-2, and hard-negative coverage in every category", () => {
    for (const category of CATEGORIES) {
      const byTier = (tier: number): number =>
        cases.filter((c) => c.category === category && c.tier === tier).length;
      expect(byTier(1), `${category} tier 1`).toBeGreaterThanOrEqual(35);
      expect(byTier(2), `${category} tier 2`).toBeGreaterThanOrEqual(35);
      expect(byTier(0), `${category} hard negatives`).toBeGreaterThanOrEqual(35);
    }
  });
});
