import { ScrollView, StyleSheet, View } from "react-native";

import { totalSavings } from "../../src/core/savings";
import { MILESTONE_DAYS } from "../../src/core/streaks";
import { daysWonFor, todayIso, useAppStore } from "../../src/state/store";
import { Card, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

/** Cross-programme savings rail + days won + milestone ladder (WP2.4). */
export default function Progress() {
  const enrolments = useAppStore((s) => s.enrolments);
  const lapses = useAppStore((s) => s.lapses);
  const today = todayIso();

  const programmes = enrolments
    .filter((e) => e.spendProfile)
    .map((e) => ({
      profile: e.spendProfile!,
      daysWon: daysWonFor(e, lapses[e.vertical] ?? [], today),
    }));
  const saved = totalSavings(programmes);
  const maxDays = Math.max(0, ...enrolments.map((e) => daysWonFor(e, lapses[e.vertical] ?? [], today)));

  return (
    <Screen testID="progress-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="display">Progress</Text>
        <View style={{ height: space.lg }} />

        <Card tone="accent" testID="savings-card">
          <Text variant="caption" color={color.accent}>
            NOT SPENT — ACROSS EVERYTHING
          </Text>
          <View style={{ height: space.xs }} />
          <Text variant="display" testID="savings-total">{`£${saved.toFixed(2)}`}</Text>
          <View style={{ height: space.xs }} />
          <Text variant="caption" color={color.inkMuted}>
            Smoking, vaping, drinking — one pot. Money that stayed yours.
          </Text>
        </Card>

        <View style={{ height: space.md }} />

        {enrolments.map((e) => {
          const won = daysWonFor(e, lapses[e.vertical] ?? [], today);
          return (
            <Card key={e.vertical} style={{ marginBottom: space.sm }}>
              <Text variant="heading">{`${won} days won`}</Text>
              <Text variant="caption" color={color.inkMuted}>
                {`${e.vertical} · since ${e.enrolledOn} · days won never reset`}
              </Text>
            </Card>
          );
        })}

        <View style={{ height: space.md }} />
        <Text variant="heading">Milestones</Text>
        <View style={{ height: space.sm }} />
        <View style={styles.milestoneRow}>
          {MILESTONE_DAYS.map((m) => (
            <View
              key={m}
              style={[styles.milestone, maxDays >= m ? styles.milestoneHit : null]}
            >
              <Text
                variant="caption"
                color={maxDays >= m ? color.onPrimary : color.inkFaint}
              >{`${m}d`}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  milestone: {
    alignItems: "center",
    backgroundColor: "#EFEAE0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  milestoneHit: { backgroundColor: color.primary },
  milestoneRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  scroll: { paddingBottom: 120, paddingTop: space.lg },
});
