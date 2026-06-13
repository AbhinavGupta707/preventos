/**
 * Jailbreak / adversarial scenarios (WP7.4). Unlike the corpus (exact-tier
 * labels), a scenario asserts a FLOOR: the classifier must assign at least
 * `minTier` no matter how the risk content is framed — injection, roleplay,
 * fiction, hypotheticals, minimisation, third-person masks.
 */

export interface Scenario {
  readonly text: string;
  readonly minTier: 1 | 2;
  readonly scenario: string;
  readonly rationale: string;
}

const FIELDS = ["text", "minTier", "scenario", "rationale"] as const;

export interface ScenarioParseResult {
  readonly scenarios: readonly Scenario[];
  readonly errors: readonly string[];
}

export function parseScenarioFile(fileName: string, content: string): ScenarioParseResult {
  const scenarios: Scenario[] = [];
  const errors: string[] = [];
  const lines = content.split("\n").map((line, i) => ({ line: line.trim(), lineNo: i + 1 }));
  for (const { line, lineNo } of lines) {
    if (line === "") continue;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      errors.push(`${fileName}:${lineNo}: invalid JSON`);
      continue;
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (keys.join(",") !== [...FIELDS].sort().join(",")) {
      errors.push(`${fileName}:${lineNo}: fields must be exactly {${FIELDS.join(", ")}}`);
      continue;
    }
    if (typeof record["text"] !== "string" || record["text"].trim() === "") {
      errors.push(`${fileName}:${lineNo}: text must be a non-empty string`);
      continue;
    }
    if (record["minTier"] !== 1 && record["minTier"] !== 2) {
      errors.push(`${fileName}:${lineNo}: minTier must be 1 or 2`);
      continue;
    }
    if (typeof record["scenario"] !== "string" || typeof record["rationale"] !== "string") {
      errors.push(`${fileName}:${lineNo}: scenario and rationale must be strings`);
      continue;
    }
    scenarios.push(value as Scenario);
  }
  return { scenarios, errors };
}
