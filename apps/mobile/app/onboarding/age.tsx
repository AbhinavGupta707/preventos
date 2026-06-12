import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { OptionRow, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

/**
 * 18+ age gate for Exhale (E18). Untraversable: selecting an under-18 birth
 * year routes to a terminal screen with no path onward, and the selection is
 * not stored client-side as "adult" — the gate re-runs on every entry.
 */
const CURRENT_YEAR = 2026;
const YEARS: readonly number[] = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 13 - i);

export default function AgeGate() {
  const [shown, setShown] = useState(12);
  return (
    <Screen testID="age-gate">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="title">First — what year were you born?</Text>
        <View style={{ height: space.xs }} />
        <Text variant="caption" color={color.inkMuted}>
          Exhale is for adults. We ask once and don't keep your answer.
        </Text>
        <View style={{ height: space.lg }} />
        {YEARS.slice(0, shown).map((year) => (
          <OptionRow
            key={year}
            testID={`birth-year-${year}`}
            label={String(year)}
            selected={false}
            onPress={() => {
              const age = CURRENT_YEAR - year;
              if (age >= 18) {
                router.replace("/onboarding/vaping");
              } else {
                router.replace("/onboarding/not-eligible");
              }
            }}
          />
        ))}
        {shown < YEARS.length ? (
          <OptionRow label="Earlier years…" selected={false} onPress={() => setShown(shown + 20)} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
