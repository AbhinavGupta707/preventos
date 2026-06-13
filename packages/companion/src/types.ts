/**
 * Companion (avatar) state engine — the presentation brain for the 2D buddy.
 *
 * BINDING ETHICAL RULES (plan E21; CLAUDE.md safety invariants). These are
 * enforced in `companionView` and guarded by tests:
 *  - The companion NEVER guilts or punishes. A lapse maps to `concerned`
 *    (care), never disappointment; "days won" is never shown as reset.
 *  - The companion STEPS ASIDE entirely during a crisis flow — a cute creature
 *    must never present tier-1 risk content (invariant 1, presentation side).
 *  - NO variable-reward / loot mechanics. Cosmetics and evolution unlock on
 *    deterministic days-won milestones only.
 *  - The engine returns dialogue SLOT IDS, never user-facing copy. All copy is
 *    clinically governed in content packs (invariant 3). The avatar is the face
 *    of the one guardrailed coach — never a second, ungoverned voice.
 */

export const COMPANION_CONTEXTS = ["onboarding", "home", "sos", "coach", "crisis"] as const;
export type CompanionContext = (typeof COMPANION_CONTEXTS)[number];

export const COMPANION_MOODS = [
  "idle",
  "happy",
  "celebrating",
  "concerned",
  "breathing",
  "asleep",
  "stepped_aside",
] as const;
export type CompanionMood = (typeof COMPANION_MOODS)[number];

export type TimeOfDay = "morning" | "day" | "evening" | "night";

export interface CompanionSnapshot {
  readonly context: CompanionContext;
  /** Lapse-free days since enrolment (from decisions.daysWon). Never decreases. */
  readonly daysWon: number;
  readonly timeOfDay: TimeOfDay;
  /** A lapse was just logged/debriefed — drives care, never blame. */
  readonly recentLapse?: boolean;
  readonly diaryLoggedToday?: boolean;
  /** SOS breathing/urge-surf is actively running — companion co-regulates. */
  readonly sosBreathingActive?: boolean;
  /** A days-won milestone was crossed this session. */
  readonly milestoneJustReached?: boolean;
  /** Consecutive days with no engagement (drives gentle welcome-back). */
  readonly dormantDays?: number;
  readonly reduceMotion?: boolean;
}

export interface AnimationHints {
  /** Suggested loop length in seconds for the renderer. */
  readonly loopSeconds: number;
  /** Breathing pace for co-regulation (inhale+exhale seconds); undefined unless breathing. */
  readonly breathCycleSeconds?: number;
  /** Renderer must honour OS reduced-motion; mirrors snapshot.reduceMotion. */
  readonly reduceMotion: boolean;
}

export interface CompanionView {
  readonly mood: CompanionMood;
  /** Governed content slot for the line the companion "says" — null when silent. */
  readonly dialogueSlot: string | null;
  /** Whether to render the companion at all (false during crisis). */
  readonly visible: boolean;
  readonly evolutionStage: number;
  readonly evolutionStageName: string;
  readonly unlockedAccessories: readonly string[];
  readonly animation: AnimationHints;
}
