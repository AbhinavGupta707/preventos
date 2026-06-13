import type { Vertical } from "@preventos/domain";

export type RescueMode = "craving" | "urge" | "cant_sleep";

const NIGHT_START = 21;
const NIGHT_END = 6;

const isNight = (hour: number): boolean => hour >= NIGHT_START || hour < NIGHT_END;

/**
 * Context-aware rescue (WP2.3): mode follows enrolments and time of day.
 * Rescue is never unavailable — with no enrolments it defaults to craving,
 * whose grounding tools are programme-agnostic.
 */
export const rescueMode = (enrolled: readonly Vertical[], hour: number): RescueMode => {
  if (enrolled.includes("sleep") && isNight(hour)) return "cant_sleep";
  if (enrolled.includes("smoking")) return "craving";
  if (enrolled.includes("vaping")) return "urge";
  if (enrolled.includes("sleep")) return "cant_sleep";
  return "craving";
};
