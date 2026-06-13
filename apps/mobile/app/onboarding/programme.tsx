import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Screen, Text } from "../../src/ui/primitives";
import { color, radius, space } from "../../src/ui/tokens";

interface ProgrammeCardProps {
  readonly title: string;
  readonly tagline: string;
  readonly testID: string;
  readonly onPress?: () => void;
  readonly comingSoon?: boolean;
}

function ProgrammeCard({ title, tagline, testID, onPress, comingSoon }: ProgrammeCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={comingSoon}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: comingSoon ? 0.55 : pressed ? 0.9 : 1 }]}
    >
      <Text variant="heading">{title}</Text>
      <View style={{ height: space.xs }} />
      <Text variant="caption" color={color.inkMuted}>
        {tagline}
      </Text>
      {comingSoon ? (
        <View style={styles.soonBadge}>
          <Text variant="caption" color={color.inkMuted}>
            Coming soon
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ProgrammePicker() {
  return (
    <Screen testID="onboarding-programme">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="title">What would you like to work on first?</Text>
        <View style={{ height: space.xs }} />
        <Text variant="caption" color={color.inkMuted}>
          You can add another programme any time — everything shows up in one place.
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
          tagline="Quieter nights, built from your own mornings."
          onPress={() => router.push("/onboarding/sleep")}
        />
        <ProgrammeCard
          testID="programme-alcohol"
          title="Steady — alcohol"
          tagline="A calmer relationship with drinking."
          comingSoon
        />
        <Text variant="caption" color={color.inkFaint}>
          Steady opens once its safety checks are in place — it deserves to be done right.
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
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
  soonBadge: {
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.pill,
    marginTop: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
});
