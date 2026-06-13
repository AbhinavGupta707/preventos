/**
 * WP6.2 — deterministic MI-adherence judge rubric.
 *
 * A reusable, provider-agnostic "judge" that scores a single coach reply for
 * motivational-interviewing adherence. It is intentionally deterministic (no LLM
 * judge, no key, no spend) so it can gate CI against the Fake provider and, when
 * an owner supplies a key, score a real provider's outputs with the same yardstick.
 *
 * The dimensions operationalise the MI spirit encoded in the coach system prompt
 * (frames.ts BASE_RULES): brief and human, at most one open question, reflect and
 * affirm, never lecture/shame/command, roll with resistance. Each REQUIRED
 * dimension must pass for a reply to count as adherent; the rubric is calibrated
 * by the negative controls in the eval (clearly non-MI replies must score 0%).
 */

const MAX_SENTENCES = 3;
const MAX_WORDS = 55;

/** Second-person directed shaming — NOT the bare word "failure" (a de-stigmatising
 *  reframe like "a heavy day is not a failure" is MI-consistent and must pass). */
const SHAME_PATTERNS: readonly RegExp[] = [
  /\byou failed\b/,
  /\byou'?re a failure\b/,
  /\byou were (weak|lazy|pathetic)\b/,
  /\byou'?ve been (weak|lazy)\b/,
  /\byou should be ashamed\b/,
  /\bshame on you\b/,
  /\bdisappointed in you\b/,
  /\bno excuse\b/,
  /\byou blew it\b/,
  /\bwhat'?s wrong with you\b/,
  /\byou'?re (pathetic|hopeless|weak)\b/,
];

/** The "righting reflex": commanding, lecturing, or arguing the person into change. */
const RIGHTING_REFLEX_PATTERNS: readonly RegExp[] = [
  /\byou should\b/,
  /\byou must\b/,
  /\byou (need|have|ought) to\b/,
  /\byou'?ve got to\b/,
  /\bjust stop\b/,
  /\byou can'?t keep\b/,
  /\bobviously\b/,
  /\bthe fact is\b/,
  /\blike i (said|told you)\b/,
  /\bwhy did(n'?t)? you\b/,
  /\bdon'?t you (care|want|realise|realize)\b/,
];

const REFLECTION_MARKERS: readonly string[] = [
  "sounds like",
  "it sounds",
  "that sounds",
  "i hear",
  "i can hear",
  "i can tell",
  "what i'm hearing",
  "makes sense",
  "that makes sense",
  "i get that",
  "no wonder",
  "it's understandable",
  "understandable",
];

const AFFIRMATION_MARKERS: readonly string[] = [
  "that takes",
  "that took",
  "real strength",
  "you showed up",
  "credit to you",
  "that's not easy",
  "that's not nothing",
  "that's a big",
  "well done",
  "you stuck with",
  "you kept going",
  "that matters",
  "good on you",
  "you noticed",
];

// An open question carries one of these interrogatives (whole-word). "why" is
// excluded — in MI it often reads as confrontational. The word may sit anywhere
// in the question clause ("…, what's helped?"), not just at the start, and the
// boundary form matches contractions like "what's" / "how's".
const OPEN_QUESTION_RE = /\b(what|how|where|when|which|in what way|tell me)\b/;

export interface MiDimensions {
  /** Brief: ≤3 sentences and ≤55 words (the person does most of the talking). */
  readonly brief: boolean;
  /** At most one question (MI cautions against question-stacking). */
  readonly atMostOneQuestion: boolean;
  /** No commanding/lecturing/arguing (the righting reflex). */
  readonly noRightingReflex: boolean;
  /** No directed judgement or shame. */
  readonly noShame: boolean;
  /** At least one MI-consistent move: a reflection, an affirmation, or an open question. */
  readonly miConsistentMove: boolean;
}

export interface MiScore {
  readonly adherent: boolean;
  readonly dimensions: MiDimensions;
  /** Names of the REQUIRED dimensions that failed (empty when adherent). */
  readonly violations: readonly string[];
}

function sentenceCount(text: string): number {
  return text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function questionCount(text: string): number {
  return (text.match(/\?/g) ?? []).length;
}

function anyMatch(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function anyIncludes(text: string, markers: readonly string[]): boolean {
  return markers.some((m) => text.includes(m));
}

function hasOpenQuestion(text: string): boolean {
  if (questionCount(text) === 0) return false;
  // Inspect each sentence that ends in a question mark; an interrogative anywhere
  // in that question clause counts (reflections often precede the question).
  for (const raw of text.split(/(?<=[?])/)) {
    const s = raw.trim().toLowerCase();
    if (!s.endsWith("?")) continue;
    if (OPEN_QUESTION_RE.test(s)) return true;
  }
  return false;
}

/** Score one reply. `text` is the final reply shown to the person. */
export function scoreMiAdherence(text: string): MiScore {
  const lower = text.toLowerCase();

  const dimensions: MiDimensions = {
    brief: sentenceCount(text) <= MAX_SENTENCES && wordCount(text) <= MAX_WORDS,
    atMostOneQuestion: questionCount(text) <= 1,
    noRightingReflex: !anyMatch(lower, RIGHTING_REFLEX_PATTERNS),
    noShame: !anyMatch(lower, SHAME_PATTERNS),
    miConsistentMove:
      anyIncludes(lower, REFLECTION_MARKERS) ||
      anyIncludes(lower, AFFIRMATION_MARKERS) ||
      hasOpenQuestion(lower),
  };

  const violations: string[] = [];
  if (!dimensions.brief) violations.push("not_brief");
  if (!dimensions.atMostOneQuestion) violations.push("question_stacking");
  if (!dimensions.noRightingReflex) violations.push("righting_reflex");
  if (!dimensions.noShame) violations.push("shame");
  if (!dimensions.miConsistentMove) violations.push("no_mi_consistent_move");

  return { adherent: violations.length === 0, dimensions, violations };
}
