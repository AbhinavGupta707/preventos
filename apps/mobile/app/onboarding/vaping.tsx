import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { ReadinessStage } from "@preventos/domain";

import { todayIso, useAppStore } from "../../src/state/store";
import { OptionRow, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

/**
 * Exhale intake. TTFV (time to first vape) is an in-house dependence proxy —
 * cleared, not an external validated instrument (licensing audit §1) — so its
 * wording is ours. Appearance/performance/savings framing, never disease-scare.
 */
const TTFV_OPTIONS = [
  { label: "Within 5 minutes of waking", value: 3 },
  { label: "Within half an hour", value: 2 },
  { label: "Within the first hour", value: 1 },
  { label: "Later in the day", value: 0 },
] as const;

const WEEKLY_SPEND = [
  { label: "Under £10 a week", value: 7 },
  { label: "£10–20 a week", value: 15 },
  { label: "£20–35 a week", value: 27 },
  { label: "More than £35 a week", value: 40 },
] as const;

const READINESS: ReadonlyArray<{ label: string; value: ReadinessStage }> = [
  { label: "Ready to start tapering", value: "ready" },
  { label: "Curious, not committed", value: "ambivalent" },
  { label: "Just looking for now", value: "not_ready" },
];

type Step = "ttfv" | "spend" | "readiness";

export default function VapingIntake() {
  const [step, setStep] = useState<Step>("ttfv");
  const [ttfv, setTtfv] = useState<number | null>(null);
  const [spend, setSpend] = useState<number | null>(null);
  const enrol = useAppStore((s) => s.enrol);

  const finish = (readiness: ReadinessStage) => {
    enrol(
      {
        vertical: "vaping",
        enrolledOn: todayIso(),
        spendProfile: { vertical: "vaping", weeklySpend: spend ?? 15 },
      },
      {
        vertical: "vaping",
        readiness,
        comB: { capability: [], opportunity: [], motivation: [] },
        triggers: [],
        instrumentScores: { ttfv: ttfv ?? 0 },
        completeness: 1,
      },
    );
    router.replace("/onboarding/done");
  };

  return (
    <Screen testID="intake-vaping">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {step === "ttfv" ? (
          <View>
            <Text variant="heading">How soon after waking do you usually first vape?</Text>
            <View style={{ height: space.md }} />
            {TTFV_OPTIONS.map((o) => (
              <OptionRow
                key={o.value}
                testID={`ttfv-${o.value}`}
                label={o.label}
                selected={ttfv === o.value}
                onPress={() => {
                  setTtfv(o.value);
                  setStep("spend");
                }}
              />
            ))}
          </View>
        ) : null}

        {step === "spend" ? (
          <View>
            <Text variant="heading">Roughly what does vaping cost you?</Text>
            <View style={{ height: space.xs }} />
            <Text variant="caption" color={color.inkMuted}>
              Pods, juice, coils, disposables — a rough weekly figure is fine.
            </Text>
            <View style={{ height: space.md }} />
            {WEEKLY_SPEND.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                selected={spend === o.value}
                onPress={() => {
                  setSpend(o.value);
                  setStep("readiness");
                }}
              />
            ))}
          </View>
        ) : null}

        {step === "readiness" ? (
          <View>
            <Text variant="heading">Where are you with this right now?</Text>
            <View style={{ height: space.md }} />
            {READINESS.map((r) => (
              <OptionRow
                key={r.value}
                label={r.label}
                selected={false}
                onPress={() => finish(r.value)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
