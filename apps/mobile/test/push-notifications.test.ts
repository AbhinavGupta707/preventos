import { beforeEach, describe, expect, it, vi } from "vitest";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

import { getRemotePushToken, requestOsPermission } from "../src/notifications/push";

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: { eas: { projectId: "test-project-id" } } },
    easConfig: { projectId: "test-project-id" },
  },
}));

vi.mock("expo-notifications", () => ({
  getExpoPushTokenAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  setNotificationHandler: vi.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

const mockedNotifications = vi.mocked(Notifications);
const mockedConstants = Constants as unknown as {
  expoConfig?: { extra?: Record<string, unknown> };
  easConfig?: { projectId?: string };
};

describe("remote push notification helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedConstants.expoConfig = { extra: { eas: { projectId: "test-project-id" } } };
    mockedConstants.easConfig = { projectId: "test-project-id" };
  });

  it("returns denied when the OS permission prompt is declined", async () => {
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({
      granted: false,
      status: "denied",
      expires: "never",
      canAskAgain: false,
    } as Awaited<ReturnType<typeof Notifications.requestPermissionsAsync>>);
    await expect(requestOsPermission()).resolves.toEqual({ ok: true, value: "denied" });
  });

  it("captures an Expo push token with platform metadata", async () => {
    mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[test]",
      type: "expo",
    } as Awaited<ReturnType<typeof Notifications.getExpoPushTokenAsync>>);
    await expect(getRemotePushToken()).resolves.toEqual({
      ok: true,
      value: { token: "ExponentPushToken[test]", platform: "ios" },
    });
    expect(mockedNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "test-project-id" });
  });

  it("fails closed when no Expo project id is configured", async () => {
    mockedConstants.expoConfig = { extra: {} };
    mockedConstants.easConfig = {};
    await expect(getRemotePushToken()).resolves.toEqual({
      ok: false,
      error: "Expo project id is required for remote push tokens",
    });
    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("surfaces remote token capture failures without provider calls", async () => {
    mockedNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error("offline"));
    await expect(getRemotePushToken()).resolves.toEqual({ ok: false, error: "offline" });
  });
});
