import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { todayIso, useAppStore } from "../src/state/store";
import { Button, Screen, Text } from "../src/ui/primitives";
import { color, space } from "../src/ui/tokens";

/** Thirty-second morning check-in. Honest answers, zero ceremony. */
export default function Checkin() {
  const enrolments = useAppStore((s) => s.enrolments);
  const recordCheckin = useAppStore((s) => s.recordCheckin);
  const recordLapse = useAppStore((s) => s.recordLapse);

  const primary = enrolments[0]?.vertical ?? "smoking";
  const question =
    primary === "sleep" ? "How was last night?" : "How did yesterday actually go?";

  const yesterday = new Date(Date.parse(`${todayIso()}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10);

  return (
    <Screen testID="checkin-screen">
      <View style={styles.body}>
        <Text variant="title">{question}</Text>
        <View style={{ height: space.xs }} />
        <Text variant="body" color={color.inkMuted}>
          Whatever the answer, it counts. The honest version is the useful one.
        </Text>
        <View style={{ height: space.lg }} />
        <Button
          testID="checkin-good"
          label="Held the line"
          onPress={() => {
            recordCheckin(todayIso());
            router.back();
          }}
        />
        <View style={{ height: space.sm }} />
        <Button
          testID="checkin-slipped"
          label="I slipped"
          kind="secondary"
          onPress={() => {
            recordCheckin(todayIso());
            recordLapse(primary, yesterday);
            router.replace("/debrief");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center", paddingBottom: space.xl },
});
