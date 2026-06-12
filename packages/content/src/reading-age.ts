/**
 * Reading-age scorer (WP4.2). Flesch–Kincaid grade level mapped to a UK
 * reading age (grade + 5). A heuristic, not a clinical measure: it feeds
 * authoring warnings, never a blocking gate.
 */

const VOWEL_GROUP = /[aeiouy]+/g;

export function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length === 0) return 0;
  const groups = clean.match(VOWEL_GROUP)?.length ?? 0;
  let count = groups;
  // Silent trailing e ("smoke"), but "-le" after a consonant is a syllable ("little").
  if (clean.endsWith("e") && !clean.endsWith("le") && groups > 1) count -= 1;
  return Math.max(1, count);
}

function words(text: string): readonly string[] {
  return text.split(/\s+/).filter((token) => /[a-zA-Z]/.test(token));
}

function sentenceCount(text: string): number {
  const sentences = text.split(/[.!?\n]+/).filter((part) => /[a-zA-Z]/.test(part));
  return Math.max(1, sentences.length);
}

/**
 * Estimated reading age in years, or undefined when the text has no words.
 * Flesch–Kincaid grade = 0.39·(words/sentence) + 11.8·(syllables/word) − 15.59;
 * UK reading age ≈ grade + 5, clamped to [5, 18].
 */
export function estimateReadingAge(text: string): number | undefined {
  const tokens = words(text);
  if (tokens.length === 0) return undefined;
  const syllables = tokens.reduce((sum, token) => sum + countSyllables(token), 0);
  const grade = 0.39 * (tokens.length / sentenceCount(text)) + 11.8 * (syllables / tokens.length) - 15.59;
  return Math.min(18, Math.max(5, Math.round(grade + 5)));
}
