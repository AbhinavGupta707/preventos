import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { ReadinessStage } from "@preventos/domain";

import { todayIso, useAppStore } from "../../src/state/store";
import { OptionRow, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

/**
 * Nightshift intake — wellbeing framing (E16), bespoke questions (not
 * instrument-derived; SCI is blocked pending licence). No treatment claims.
 */
const NIGHT_TROUBLES = [
  "Getting to sleep",
  "Waking in the night",
  "Waking too early",
  "My mind won't switch off",
] as const;

const READINESS: ReadonlyArray<{ label: string; value: ReadinessStage }> = [
  { label: "Ready to work on my nights", value: "ready" },
  { label: "Curious what this looks like", value: "ambivalent" },
];

export default function SleepIntake() {
  const [troubles, setTroubles] = useState<readonly string[]>([]);
  const [step, setStep] = useState<"troubles" | "readiness">("troubles");
  const enrol = useAppStore((s) => s.enrol);

  const finish = (readiness: ReadinessStage) => {
    enrol(
      { vertical: "sleep", enrolledOn: todayIso() },
      {
        vertical: "sleep",
        readiness,
        comB: { capability: [], opportunity: [], motivation: [] },
        triggers: [...troubles],
        instrumentScores: {},
        completeness: 1,
      },
    );
    router.replace("/onboarding/done");
  };

  return (
    <Screen testID="intake-sleep">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === "troubles" ? (
          <View>
            <Text variant="heading">What do your nights look like lately?</Text>
            <View style={{ height: space.xs }} />
            <Text variant="caption" color={color.inkMuted}>
              Pick anything that's been true this month.
            </Text>
            <View style={{ height: space.md }} />
            {NIGHT_TROUBLES.map((t) => (
              <OptionRow
                key={t}
                label={t}
                selected={troubles.includes(t)}
                onPress={() =>
                  setTroubles(troubles.includes(t) ? troubles.filter((x) => x !== t) : [...troubles, t])
                }
              />
            ))}
            <View style={{ height: space.sm }} />
            <OptionRow
              label="Continue"
              selected={false}
              onPress={() => setStep("readiness")}
            />
          </View>
        ) : (
          <View>
            <Text variant="heading">Where are you with this right now?</Text>
            <View style={{ height: space.md }} />
            {READINESS.map((r) => (
              <OptionRow key={r.value} label={r.label} selected={false} onPress={() => finish(r.value)} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
