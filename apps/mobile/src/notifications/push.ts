import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";

/**
 * Push scaffolding (WP2.5). The OS prompt is only ever called from the primed
 * choreography stage (see core/pushChoreography). Remote registration stores an
 * Expo push token server-side; delivery still runs behind the worker provider
 * seam and never calls a real provider in CI.
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

const pushPlatform = (): "ios" | "android" | "web" =>
  Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";

const expoProjectId = (): string | undefined => {
  const extraProjectId = Constants.expoConfig?.extra?.["eas"];
  if (typeof extraProjectId === "object" && extraProjectId !== null && "projectId" in extraProjectId) {
    const projectId = (extraProjectId as { readonly projectId?: unknown }).projectId;
    if (typeof projectId === "string" && projectId !== "") return projectId;
  }
  return Constants.easConfig?.projectId;
};

export const getRemotePushToken = async (): Promise<Result<{ readonly token: string; readonly platform: "ios" | "android" | "web" }, string>> => {
  const projectId = expoProjectId();
  if (projectId === undefined) return err("Expo project id is required for remote push tokens");
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return ok({ token: token.data, platform: pushPlatform() });
  } catch (error: unknown) {
    return err(error instanceof Error ? error.message : "push token request failed");
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
