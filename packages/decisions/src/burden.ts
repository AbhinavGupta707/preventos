import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";

/**
 * Cross-vertical burden budget (plan WP5.2): ONE budget per person, shared by
 * all programmes. Values are proposed defaults pending clinical sign-off
 * (WP10.3) — change them in config, never bypass the governor.
 */
export interface BurdenConfig {
  readonly maxProactivePerDay: number;
  readonly minGapMinutes: number;
  readonly quietStart: string;
  readonly quietEnd: string;
}

export const DEFAULT_BURDEN: BurdenConfig = {
  maxProactivePerDay: 3,
  minGapMinutes: 60,
  quietStart: "21:30",
  quietEnd: "08:00",
};

const minutesOfDay = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Quiet hours may span midnight (21:30 -> 08:00). `localTime` is "HH:MM". */
export function inQuietHours(localTime: string, config: BurdenConfig = DEFAULT_BURDEN): boolean {
  const t = minutesOfDay(localTime);
  const start = minutesOfDay(config.quietStart);
  const end = minutesOfDay(config.quietEnd);
  return start <= end ? t >= start && t < end : t >= start || t < end;
}

/**
 * Gate for any proactive send. `sentToday` are prior proactive sends in the
 * person's local day; user-initiated flows are exempt by not being counted.
 */
export function canSendProactive(
  sentToday: readonly Date[],
  now: Date,
  localTime: string,
  config: BurdenConfig = DEFAULT_BURDEN,
): Result<true, string> {
  if (inQuietHours(localTime, config)) return err("quiet hours");
  if (sentToday.length >= config.maxProactivePerDay) return err("daily budget exhausted");
  const gapMs = config.minGapMinutes * 60_000;
  for (const sent of sentToday) {
    if (Math.abs(now.getTime() - sent.getTime()) < gapMs) return err("minimum gap not met");
  }
  return ok(true);
}
