import * as Notifications from "expo-notifications";

import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";

/**
 * Push scaffolding (WP2.5). Local notifications only until SVC lands — remote
 * push needs the server-side JITAI dispatcher. The OS prompt is only ever
 * called from the primed choreography stage (see core/pushChoreography).
 */

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

export const requestOsPermission = async (): Promise<Result<"granted" | "denied", string>> => {
  try {
    const response = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return ok(response.granted ? "granted" : "denied");
  } catch (error: unknown) {
    return err(error instanceof Error ? error.message : "permission request failed");
  }
};

/** Quit-day countdown reminder — scheduled locally, respects quiet hours upstream. */
export const scheduleQuitDayReminder = async (
  quitDateIso: string,
): Promise<Result<string, string>> => {
  try {
    const fireAt = new Date(`${quitDateIso}T09:00:00`);
    if (fireAt.getTime() <= Date.now()) return err("quit date is not in the future");
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Quit day",
        body: "Today's the day you picked. Your plan is in the app — one step at a time.",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
    });
    return ok(id);
  } catch (error: unknown) {
    return err(error instanceof Error ? error.message : "scheduling failed");
  }
};
