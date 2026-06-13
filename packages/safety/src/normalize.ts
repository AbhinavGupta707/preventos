/**
 * Deterministic text normalization for the risk classifier (WP7.1).
 *
 * Collapses the obfuscation classes seen in the red-team corpus — spacing
 * ("k i l l  m y s e l f"), censoring ("k*ll"), leetspeak ("su1cide"),
 * homoglyph punctuation — into a single canonical view the lexicon runs on.
 * Pure function of its input: no config, no randomness, no locale dependence
 * (safety invariant 1 requires byte-stable behaviour).
 */

const LEET_MAP: Readonly<Record<string, string>> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

const CENSOR_CHARS = /[*#•]/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Leet-map a token only if it mixes letters and mappable chars — leaves pure
 * numbers ("999", "210") and number-with-unit-suffix tokens ("45yo", "20mg",
 * "3am") alone, since their digits are semantic.
 */
function deleet(token: string): string {
  if (!/[a-z]/.test(token)) return token;
  if (!/[013457@$]/.test(token)) return token;
  const bare = token.replace(/[^a-z0-9]/g, "");
  // number + unit suffix ("45yo", "20mg", "3am") or letter-digit slang ("b4")
  if (/^\d+(yo|am|pm|ml|mg|kg|cm|hrs?|mins?|st|nd|rd|th)$/.test(bare)) return token;
  if (/^[a-z]{1,2}\d$/.test(bare)) return token;
  return token.replace(/[013457@$]/g, (ch) => LEET_MAP[ch] ?? ch);
}

/** Strip censor characters from tokens that contain letters ("k*ll" -> "kll"). */
function decensor(token: string): string {
  if (!/[a-z]/.test(token)) return token;
  return token.replace(CENSOR_CHARS, "");
}

/**
 * Join spaced-out obfuscation runs: 3+ consecutive tokens, each <=2 chars,
 * at least two of them single letters ("k i l l", "c ho k ed"). Ordinary
 * short-word sequences ("i am ok") have at most one single-letter token and
 * are left alone.
 */
function joinSpacedRuns(tokens: readonly string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    let j = i;
    while (j < tokens.length && /^[a-z]{1,2}$/.test(tokens[j] ?? "")) j += 1;
    const run = tokens.slice(i, j);
    const singles = run.filter((t) => t.length === 1).length;
    if (run.length >= 3 && singles >= 2) {
      out.push(run.join(""));
    } else {
      out.push(...run);
    }
    if (j === i) {
      out.push(tokens[i] ?? "");
      i += 1;
    } else {
      i = j;
    }
  }
  return out;
}

/** Canonical lowercase de-obfuscated view of a user message. */
export function normalize(text: string): string {
  const folded = text.normalize("NFKD").replace(COMBINING_MARKS, "").toLowerCase();
  const tokens = folded
    .split(/\s+/)
    .map(decensor)
    .map(deleet)
    .map((t) => t.replace(/[^a-z0-9']/g, " ").trim())
    .flatMap((t) => (t === "" ? [] : t.split(/\s+/)));
  return joinSpacedRuns(tokens).join(" ");
}
