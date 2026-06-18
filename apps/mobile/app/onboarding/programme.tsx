import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ProgrammeChip, Screen, Text } from "../../src/ui/primitives";
import { color, radius, space } from "../../src/ui/tokens";

interface ProgrammeCardProps {
  readonly title: string;
  readonly tagline: string;
  readonly testID: string;
  readonly onPress?: () => void;
  readonly status?: "open" | "private";
}

function ProgrammeCard({ title, tagline, testID, onPress, status = "open" }: ProgrammeCardProps) {
  const disabled = status !== "open";
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.card, disabled ? styles.disabledCard : null, pressed ? styles.pressed : null]}
    >
      <View style={styles.cardTopline}>
        <Text variant="heading">{title}</Text>
        <ProgrammeChip label={status === "open" ? "Open beta" : "Private"} tone={status === "open" ? "success" : "muted"} />
      </View>
      <View style={{ height: space.xs }} />
      <Text variant="caption" color={color.inkMuted}>
        {tagline}
      </Text>
    </Pressable>
  );
}

export default function ProgrammePicker() {
  return (
    <Screen testID="onboarding-programme">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="title">What would you like support with first?</Text>
        <View style={{ height: space.xs }} />
        <Text variant="caption" color={color.inkMuted}>
          QuitKit and Exhale are open for this beta. Everything you add still lands on one Today
          surface.
        </Text>
        <View style={{ height: space.lg }} />
        <ProgrammeCard
          testID="programme-smoking"
          title="QuitKit — smoking"
          tagline="Quit on your date or cut down first. Built around your triggers."
          onPress={() => router.push("/onboarding/smoking")}
        />
        <ProgrammeCard
          testID="programme-vaping"
          title="Exhale — vaping"
          tagline="Taper on your terms. 18+ only."
          onPress={() => router.push("/onboarding/age")}
        />
        <ProgrammeCard
          testID="programme-sleep"
          title="Nightshift — sleep"
          tagline="Private testing while safety assumptions are reviewed."
          status="private"
        />
        <ProgrammeCard
          testID="programme-alcohol"
          title="Steady — alcohol"
          tagline="Referral-only safeguards stay private until launch gates clear."
          status="private"
        />
        <Text variant="caption" color={color.inkFaint}>
          Alcohol and sleep features stay internal for now; the app keeps their higher-risk paths
          behind safety gates.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: space.md,
    padding: space.md,
  },
  cardTopline: { alignItems: "flex-start", gap: space.sm },
  disabledCard: { backgroundColor: color.surfaceSunken, opacity: 0.68 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
