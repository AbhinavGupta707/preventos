/**
 * Mobile glue for the companion (avatar) state engine (AV.3).
 *
 * The single source of truth for the companion's behaviour is the pure
 * `companionView` engine in `@preventos/companion` (AV.2) — this module only
 * builds a `CompanionSnapshot` from local app state and forwards it. No mood,
 * evolution, or step-aside logic is duplicated here; the engine's binding
 * ethical rules (crisis step-aside, lapse→care-never-blame, deterministic
 * evolution, governed dialogue slots) stay authoritative.
 *
 * Safety invariant 1 (presentation side): a crisis context resolves to a
 * stepped-aside view (`visible: false`, silent) — the cute creature never shares
 * a surface with tier-1 risk content. The crisis screen renders no companion at
 * all; this mapper makes the same guarantee provable in a unit test.
 */
import { companionView } from "@preventos/companion";
import type { CompanionContext, CompanionView, TimeOfDay } from "@preventos/companion";

export interface CompanionInputs {
  readonly context: CompanionContext;
  /** Person-level days won (max active streak across enrolments); never decreases. */
  readonly daysWon: number;
  /** 0–23 local hour; pass `new Date().getHours()` at the call site. */
  readonly hour: number;
  readonly recentLapse?: boolean;
  readonly diaryLoggedToday?: boolean;
  readonly sosBreathingActive?: boolean;
  readonly milestoneJustReached?: boolean;
  readonly dormantDays?: number;
  readonly reduceMotion?: boolean;
}

/** Coarse time-of-day band used by the engine for the home "asleep" rest pose. */
export function companionTimeOfDay(hour: number): TimeOfDay {
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "day";
  if (hour < 22) return "evening";
  return "night";
}

/** Resolve the full companion view for a screen from local app state. */
export function resolveCompanion(inputs: CompanionInputs): CompanionView {
  return companionView({
    context: inputs.context,
    daysWon: inputs.daysWon,
    timeOfDay: companionTimeOfDay(inputs.hour),
    ...(inputs.recentLapse !== undefined ? { recentLapse: inputs.recentLapse } : {}),
    ...(inputs.diaryLoggedToday !== undefined ? { diaryLoggedToday: inputs.diaryLoggedToday } : {}),
    ...(inputs.sosBreathingActive !== undefined ? { sosBreathingActive: inputs.sosBreathingActive } : {}),
    ...(inputs.milestoneJustReached !== undefined ? { milestoneJustReached: inputs.milestoneJustReached } : {}),
    ...(inputs.dormantDays !== undefined ? { dormantDays: inputs.dormantDays } : {}),
    ...(inputs.reduceMotion !== undefined ? { reduceMotion: inputs.reduceMotion } : {}),
  });
}
