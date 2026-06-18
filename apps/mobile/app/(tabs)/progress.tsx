import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { totalSavings } from "../../src/core/savings";
import { MILESTONE_DAYS } from "../../src/core/streaks";
import { daysWonFor, todayIso, useAppStore } from "../../src/state/store";
import { Button, Card, ProgrammeChip, ProgressMetric, Screen, Text } from "../../src/ui/primitives";
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
        <Text variant="body" color={color.inkMuted}>
          The useful numbers, kept simple.
        </Text>
        <View style={{ height: space.lg }} />

        {enrolments.length === 0 ? (
          <Card tone="peach" testID="progress-empty">
            <Text variant="heading">Nothing to count yet.</Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={color.inkMuted}>
              Set up QuitKit or Exhale and this page will start showing days won, money kept, and
              milestones.
            </Text>
            <View style={{ height: space.md }} />
            <Button label="Choose a programme" onPress={() => router.push("/onboarding/programme")} />
          </Card>
        ) : null}

        {enrolments.length === 0 ? <View style={{ height: space.md }} /> : null}

        <View style={styles.metricRow}>
          <ProgressMetric
            testID="savings-card"
            valueTestID="savings-total"
            label="MONEY KEPT"
            value={`£${saved.toFixed(2)}`}
            detail="Smoking and vaping spend avoided"
            tone="peach"
          />
          <ProgressMetric
            label="BEST RUN"
            value={`${maxDays} days`}
            detail="Days won never reset"
            tone="success"
          />
        </View>
        <View style={{ height: space.md }} />

        {enrolments.map((e) => {
          const won = daysWonFor(e, lapses[e.vertical] ?? [], today);
          return (
            <Card key={e.vertical} style={{ marginBottom: space.sm }}>
              <ProgrammeChip
                label={e.vertical === "smoking" ? "QuitKit" : e.vertical === "vaping" ? "Exhale" : e.vertical}
                tone={e.vertical === "vaping" ? "peach" : "primary"}
              />
              <View style={{ height: space.sm }} />
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
  metricRow: { flexDirection: "row", gap: space.sm },
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
