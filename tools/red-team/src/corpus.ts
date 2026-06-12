/**
 * Safety-risk corpus schema and validation (WP7.1c).
 * Labelling rubric and tier definitions: corpus/README.md.
 */

export const CATEGORIES = [
  "self-harm-suicide",
  "abuse-dv",
  "safeguarding",
  "overdose",
  "withdrawal-risk",
  "acute-medical",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const TIERS = [0, 1, 2] as const;

export type Tier = (typeof TIERS)[number];

export interface CorpusCase {
  readonly text: string;
  readonly tier: Tier;
  readonly category: Category;
  readonly rationale: string;
}

const FIELDS = ["text", "tier", "category", "rationale"] as const;

const validateRecord = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "not a JSON object";
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== [...FIELDS].sort().join(",")) {
    return `fields must be exactly {${FIELDS.join(", ")}}, got {${keys.join(", ")}}`;
  }
  if (typeof record["text"] !== "string" || record["text"].trim() === "") {
    return "text must be a non-empty string";
  }
  if (!TIERS.includes(record["tier"] as Tier)) {
    return `tier must be one of ${TIERS.join(", ")}`;
  }
  if (!CATEGORIES.includes(record["category"] as Category)) {
    return `category must be one of ${CATEGORIES.join(", ")}`;
  }
  if (typeof record["rationale"] !== "string" || record["rationale"].trim() === "") {
    return "rationale must be a non-empty string";
  }
  return undefined;
};

export interface ParseResult {
  readonly cases: readonly CorpusCase[];
  readonly errors: readonly string[];
}

/** Parse one JSONL file's content; errors are prefixed `<fileName>:<lineNo>`. */
export const parseCorpusFile = (fileName: string, content: string): ParseResult => {
  const lines = content
    .split("\n")
    .map((line, index) => ({ line: line.trim(), lineNo: index + 1 }))
    .filter(({ line }) => line !== "");

  const cases: CorpusCase[] = [];
  const errors: string[] = [];
  for (const { line, lineNo } of lines) {
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      errors.push(`${fileName}:${lineNo}: invalid JSON`);
      continue;
    }
    const problem = validateRecord(value);
    if (problem !== undefined) {
      errors.push(`${fileName}:${lineNo}: ${problem}`);
      continue;
    }
    cases.push(value as CorpusCase);
  }
  return { cases, errors };
};

/** Cross-case checks over the whole corpus. */
export const validateCorpus = (cases: readonly CorpusCase[]): readonly string[] => {
  const seen = new Map<string, number>();
  const errors: string[] = [];
  for (const c of cases) {
    const key = c.text.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) {
      errors.push(`duplicate text: ${JSON.stringify(c.text)}`);
    }
  }
  return errors;
};
