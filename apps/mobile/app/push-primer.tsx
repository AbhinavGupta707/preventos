import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { api } from "../src/api";
import { canPromptOs } from "../src/core/pushChoreography";
import { getRemotePushToken, requestOsPermission, scheduleQuitDayReminder } from "../src/notifications/push";
import { useAppStore } from "../src/state/store";
import { Button, Screen, Text } from "../src/ui/primitives";
import { color, space } from "../src/ui/tokens";

/**
 * Permission choreography (WP2.5): this primer always precedes the OS prompt.
 * "Not now" defers without burning the one-shot iOS prompt.
 */
export default function PushPrimer() {
  const choreography = useAppStore((s) => s.choreography);
  const applyChoreography = useAppStore((s) => s.applyChoreography);
  const enrolments = useAppStore((s) => s.enrolments);

  const goToToday = () => router.replace("/(tabs)/today");

  const accept = async () => {
    applyChoreography("primer_accepted");
    // Reducer is pure; re-derive the stage it just moved to.
    if (!canPromptOs({ stage: "primed" })) return goToToday();
    const result = await requestOsPermission();
    if (result.ok && result.value === "granted") {
      applyChoreography("os_granted");
      const remoteToken = await getRemotePushToken();
      if (remoteToken.ok) await api.registerPushToken(remoteToken.value);
      const quitDate = enrolments.find((e) => e.quitDate)?.quitDate;
      if (quitDate) await scheduleQuitDayReminder(quitDate);
    } else {
      applyChoreography("os_denied");
    }
    goToToday();
  };

  // Already settled (granted or denied) — nothing to ask.
  const settled = choreography.stage === "granted" || choreography.stage === "denied";
  useEffect(() => {
    if (settled) router.replace("/(tabs)/today");
  }, [settled]);
  if (settled) return null;

  return (
    <Screen testID="push-primer">
      <View style={styles.body}>
        <Text variant="title">A nudge at the right moment</Text>
        <View style={{ height: space.md }} />
        <Text variant="body" color={color.inkMuted}>
          The hardest moments are predictable — your quit day, your risky hours. With reminders
          on, we can show up just before them. Never more than a few a day, never overnight, and
          you can change your mind any time.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button testID="push-accept" label="Turn on reminders" onPress={() => void accept()} />
        <View style={{ height: space.sm }} />
        <Button
          testID="push-defer"
          label="Not now"
          kind="ghost"
          onPress={() => {
            applyChoreography("primer_declined");
            goToToday();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  footer: { paddingBottom: space.xl },
});
