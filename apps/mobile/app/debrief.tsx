import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { daysWonFor, todayIso, useAppStore } from "../src/state/store";
import { Button, Card, Screen, Text } from "../src/ui/primitives";
import { color, space } from "../src/ui/tokens";

/**
 * Morning-after lapse debrief — AVE-tuned: a slip is an event, not an identity.
 * Days won are restated immediately because they never reset (plan §2.1).
 */
export default function Debrief() {
  const enrolments = useAppStore((s) => s.enrolments);
  const lapses = useAppStore((s) => s.lapses);
  const today = todayIso();
  const totalWon = enrolments.reduce(
    (sum, e) => sum + daysWonFor(e, lapses[e.vertical] ?? [], today),
    0,
  );

  return (
    <Screen testID="debrief-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="title">About that slip</Text>
        <View style={{ height: space.md }} />
        <Card>
          <Text variant="body">
            One slip doesn't undo the work. The all-or-nothing voice — "well, that's blown it" —
            is the single most common reason a slip becomes a relapse. It's also wrong.
          </Text>
        </Card>
        <View style={{ height: space.sm }} />
        <Card tone="soft" testID="debrief-dayswon">
          <Text variant="heading">{`${totalWon} days won — still yours`}</Text>
          <Text variant="caption" color={color.inkMuted}>
            Days won never reset. Yesterday doesn't get to take them.
          </Text>
        </Card>
        <View style={{ height: space.sm }} />
        <Card>
          <Text variant="bodyStrong">Worth thirty seconds:</Text>
          <View style={{ height: space.xs }} />
          <Text variant="body" color={color.inkMuted}>
            Where were you, who were you with, what had the hour before looked like? That's not
            blame — it's reconnaissance. It tells you exactly which plan to strengthen.
          </Text>
        </Card>
        <View style={{ height: space.lg }} />
        <Button
          testID="debrief-repair"
          label="Repair the plan"
          onPress={() => router.replace("/plans-new")}
        />
        <View style={{ height: space.sm }} />
        <Button label="Done for now" kind="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
