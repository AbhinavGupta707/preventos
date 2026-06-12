import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { useAppStore } from "../../src/state/store";
import { Button, Card, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

/** If-then plans (WP2.4): implementation intentions, co-editable with the coach later. */
export default function Plans() {
  const plans = useAppStore((s) => s.plans);

  return (
    <Screen testID="plans-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="display">Plans</Text>
        <View style={{ height: space.xs }} />
        <Text variant="body" color={color.inkMuted}>
          Decisions made in advance are the ones that hold. If this happens, then I'll do that.
        </Text>
        <View style={{ height: space.lg }} />

        {plans.length === 0 ? (
          <Card tone="soft">
            <Text variant="heading">No plans yet</Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={color.inkMuted}>
              Start with your most common trigger. One good if-then beats ten vague intentions.
            </Text>
          </Card>
        ) : (
          plans.map((p) => (
            <Card key={p.id} style={{ marginBottom: space.sm }}>
              <Text variant="caption" color={color.primary}>
                {p.vertical.toUpperCase()}
              </Text>
              <View style={{ height: space.xs }} />
              <Text variant="bodyStrong">{`If ${p.ifTrigger.toLowerCase()}…`}</Text>
              <Text variant="body" color={color.inkMuted}>{`then ${p.thenAction.toLowerCase()}.`}</Text>
            </Card>
          ))
        )}

        <View style={{ height: space.md }} />
        <Button testID="plan-add" label="Add a plan" onPress={() => router.push("/plans-new")} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120, paddingTop: space.lg },
});
