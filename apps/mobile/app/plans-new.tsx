import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useAppStore } from "../src/state/store";
import { Button, OptionRow, Screen, Text } from "../src/ui/primitives";
import { color, space } from "../src/ui/tokens";

/** If-then builder (WP2.4): trigger + pre-decided response, two taps. */
const IF_OPTIONS = [
  "Morning coffee",
  "After meals",
  "Stress spike",
  "After work",
  "Out drinking",
  "Boredom",
] as const;

const THEN_OPTIONS = [
  "Open Rescue and ride it out",
  "Drink a glass of water, slowly",
  "Step outside for two minutes",
  "Text my person",
  "Three slow breaths before deciding anything",
] as const;

export default function PlanNew() {
  const [ifTrigger, setIfTrigger] = useState<string | null>(null);
  const addPlan = useAppStore((s) => s.addPlan);
  const enrolments = useAppStore((s) => s.enrolments);
  const vertical = enrolments[0]?.vertical ?? "smoking";

  return (
    <Screen testID="plan-new-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!ifTrigger ? (
          <View>
            <Text variant="title">If this happens…</Text>
            <View style={{ height: space.xs }} />
            <Text variant="caption" color={color.inkMuted}>
              Pick the moment that most often catches you out.
            </Text>
            <View style={{ height: space.md }} />
            {IF_OPTIONS.map((opt) => (
              <OptionRow
                key={opt}
                testID={`plan-if-${opt.toLowerCase().replace(/\s+/g, "-")}`}
                label={opt}
                selected={false}
                onPress={() => setIfTrigger(opt)}
              />
            ))}
          </View>
        ) : (
          <View>
            <Text variant="title">…then I will:</Text>
            <View style={{ height: space.xs }} />
            <Text variant="caption" color={color.inkMuted}>
              {`When ${ifTrigger.toLowerCase()} hits, your pre-decided move is:`}
            </Text>
            <View style={{ height: space.md }} />
            {THEN_OPTIONS.map((opt) => (
              <OptionRow
                key={opt}
                testID={`plan-then-${THEN_OPTIONS.indexOf(opt)}`}
                label={opt}
                selected={false}
                onPress={() => {
                  addPlan({
                    id: `plan-${Date.now()}`,
                    vertical,
                    ifTrigger,
                    thenAction: opt,
                  });
                  router.back();
                }}
              />
            ))}
            <View style={{ height: space.sm }} />
            <Button label="Back" kind="ghost" onPress={() => setIfTrigger(null)} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
