import type { AnimationHints, CompanionMood, CompanionSnapshot, CompanionView } from "./types.js";
import { accessoriesForDaysWon, stageForDaysWon } from "./stages.js";

const STEPPED_ASIDE: AnimationHints = { loopSeconds: 0, reduceMotion: true };

function moodFor(s: CompanionSnapshot): CompanionMood {
  // Invariant 1 (presentation): the companion is never present in a crisis flow.
  if (s.context === "crisis") return "stepped_aside";
  // Co-regulation takes priority while a rescue breathing exercise is running.
  if (s.context === "sos" && s.sosBreathingActive) return "breathing";
  // Celebration only on a real, deterministic milestone — never a surprise reward.
  if (s.milestoneJustReached) return "celebrating";
  // Care after a lapse — concern, never disappointment or blame.
  if (s.recentLapse) return "concerned";
  // Gentle concern (welcome-back) after dormancy — never guilt.
  if ((s.dormantDays ?? 0) >= 3) return "concerned";
  // Night rest on the home surface when nothing active is happening.
  if (s.context === "home" && s.timeOfDay === "night") return "asleep";
  // A logged diary / engaged day reads as quiet happiness.
  if (s.diaryLoggedToday) return "happy";
  return "idle";
}

/** Maps a mood to its governed dialogue slot. Null = the companion stays silent. */
function dialogueSlotFor(mood: CompanionMood, context: CompanionSnapshot["context"]): string | null {
  switch (mood) {
    case "stepped_aside":
      return null;
    case "breathing":
      return "companion.sos.coregulate";
    case "celebrating":
      return "companion.milestone.celebrate";
    case "concerned":
      return context === "coach" ? "companion.lapse.care" : "companion.welcome-back.gentle";
    case "happy":
      return "companion.home.encourage";
    case "asleep":
      return null;
    case "idle":
      return context === "onboarding" ? "companion.onboarding.greet" : null;
  }
}

function animationFor(mood: CompanionMood, reduceMotion: boolean): AnimationHints {
  if (mood === "stepped_aside") return STEPPED_ASIDE;
  if (mood === "breathing") {
    // 4s inhale + 6s exhale = a calm 10s cycle (paced-breathing default).
    return { loopSeconds: 10, breathCycleSeconds: 10, reduceMotion };
  }
  const loop: Record<Exclude<CompanionMood, "stepped_aside" | "breathing">, number> = {
    idle: 6,
    happy: 4,
    celebrating: 2.5,
    concerned: 5,
    asleep: 8,
  };
  return { loopSeconds: loop[mood], reduceMotion };
}

/**
 * Pure: a snapshot of platform state in, a fully-resolved companion view out.
 * Deterministic and side-effect-free — safe to call on every render.
 */
export function companionView(snapshot: CompanionSnapshot): CompanionView {
  const mood = moodFor(snapshot);
  const visible = mood !== "stepped_aside";
  const stage = stageForDaysWon(snapshot.daysWon);
  const reduceMotion = snapshot.reduceMotion ?? false;
  return {
    mood,
    dialogueSlot: visible ? dialogueSlotFor(mood, snapshot.context) : null,
    visible,
    evolutionStage: stage.stage,
    evolutionStageName: stage.name,
    unlockedAccessories: accessoriesForDaysWon(snapshot.daysWon),
    animation: animationFor(mood, reduceMotion),
  };
}
