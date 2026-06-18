import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { api } from "../../src/api";
import type { NextAction } from "../../src/core/nextBestAction";
import { totalSavings } from "../../src/core/savings";
import { crossedMilestones } from "../../src/core/streaks";
import { daysWonFor, todayIso, useAppStore } from "../../src/state/store";
import { Companion } from "../../src/ui/Companion";
import { ActionCard, Button, Card, ProgrammeChip, ProgressMetric, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

const VERTICAL_LABELS: Record<string, string> = {
  smoking: "smoke-free",
  vaping: "vape-free",
  alcohol: "on track",
  sleep: "sleep routine",
};

export default function Today() {
  const enrolments = useAppStore((s) => s.enrolments);
  const lapses = useAppStore((s) => s.lapses);
  const lastCheckinDate = useAppStore((s) => s.lastCheckinDate);
  const plans = useAppStore((s) => s.plans);
  const milestonesAcked = useAppStore((s) => s.milestonesAcked);
  const ackMilestone = useAppStore((s) => s.ackMilestone);
  const [action, setAction] = useState<NextAction | null>(null);

  const today = todayIso();
  const smoking = enrolments.find((e) => e.vertical === "smoking");
  const daysUntilQuit = smoking?.quitDate
    ? Math.max(0, Math.round((Date.parse(smoking.quitDate) - Date.parse(today)) / 86_400_000))
    : undefined;

  const pendingDebrief = useMemo(() => {
    const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    return enrolments.some((e) => (lapses[e.vertical] ?? []).includes(yesterday));
  }, [enrolments, lapses, today]);

  useEffect(() => {
    let cancelled = false;
    void api
      .getNextBestAction({
        enrolledVerticals: enrolments.map((e) => e.vertical),
        pendingDebrief,
        checkinDoneToday: lastCheckinDate === today,
        hasIfThenPlan: plans.length > 0,
        daysUntilQuitDate: daysUntilQuit,
      })
      .then((result) => {
        if (!cancelled && result.ok) setAction(result.value);
      });
    return () => {
      cancelled = true;
    };
  }, [enrolments, pendingDebrief, lastCheckinDate, today, plans.length, daysUntilQuit]);

  // Milestone identity moments — fire exactly once per threshold.
  const milestone = useMemo(() => {
    for (const e of enrolments) {
      const won = daysWonFor(e, lapses[e.vertical] ?? [], today);
      const crossed = crossedMilestones(milestonesAcked[e.vertical] ?? 0, won);
      const latest = crossed.at(-1);
      if (latest !== undefined) return { vertical: e.vertical, days: latest, won };
    }
    return null;
  }, [enrolments, lapses, milestonesAcked, today]);

  // The companion reflects the person's longest active streak (cross-programme).
  const companionDaysWon = useMemo(
    () => enrolments.reduce((max, e) => Math.max(max, daysWonFor(e, lapses[e.vertical] ?? [], today)), 0),
    [enrolments, lapses, today],
  );
  const saved = totalSavings(
    enrolments
      .filter((e) => e.spendProfile)
      .map((e) => ({
        profile: e.spendProfile!,
        daysWon: daysWonFor(e, lapses[e.vertical] ?? [], today),
      })),
  );

  return (
    <Screen testID="today-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="display">Today</Text>
            <Text variant="body" color={color.inkMuted}>
              One good next step. No feed to keep up with.
            </Text>
          </View>
          <ProgrammeChip label="QuitKit + Exhale beta" tone="peach" />
        </View>
        <Companion
          context="home"
          daysWon={companionDaysWon}
          hour={new Date().getHours()}
          recentLapse={pendingDebrief}
          diaryLoggedToday={lastCheckinDate === today}
          milestoneJustReached={milestone !== null}
        />
        <View style={{ height: space.md }} />

        {enrolments.length === 0 ? (
          <Card tone="peach" testID="today-empty">
            <Text variant="heading">Let's set up your first support plan.</Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={color.inkMuted}>
              QuitKit and Exhale are open for this beta. Steady and Nightshift stay private while
              the heavier safety checks are finished.
            </Text>
            <View style={{ height: space.md }} />
            <Button label="Choose a programme" onPress={() => router.push("/onboarding/programme")} />
          </Card>
        ) : null}

        {milestone ? (
          <Card tone="success" testID="milestone-card">
            <Text variant="heading">{`${milestone.days} days won`}</Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={color.inkMuted}>
              {`That's ${milestone.days} ${VERTICAL_LABELS[milestone.vertical] ?? ""} days that belong to you now. They don't reset. Ever.`}
            </Text>
            <View style={{ height: space.sm }} />
            <Button
              label="Noted"
              kind="success"
              onPress={() => ackMilestone(milestone.vertical, milestone.won)}
            />
          </Card>
        ) : null}

        {milestone ? <View style={{ height: space.md }} /> : null}

        {action ? (
          <ActionCard
            testID="nba-card"
            actionTestID="nba-go"
            eyebrow="Next best action"
            title={action.title}
            body={action.body}
            actionLabel="Start"
            onPress={() => router.push(action.route as never)}
          />
        ) : null}

        <View style={{ height: space.md }} />
        <View style={styles.metricRow}>
          <ProgressMetric
            label="DAYS WON"
            value={String(companionDaysWon)}
            detail="Longest active run across your programmes"
            tone="success"
          />
          <ProgressMetric
            label="MONEY KEPT"
            value={`£${saved.toFixed(2)}`}
            detail="Smoking and vaping spend avoided"
            tone="peach"
          />
        </View>

        <View style={{ height: space.md }} />
        <View style={styles.streakRow}>
          {enrolments.map((e) => {
            const won = daysWonFor(e, lapses[e.vertical] ?? [], today);
            return (
              <Card key={e.vertical} style={styles.streakCard} tone="soft">
                <ProgrammeChip
                  label={e.vertical === "smoking" ? "QuitKit" : e.vertical === "vaping" ? "Exhale" : e.vertical}
                  tone={e.vertical === "vaping" ? "peach" : "primary"}
                />
                <View style={{ height: space.sm }} />
                <Text variant="title" testID={`dayswon-${e.vertical}`}>
                  {String(won)}
                </Text>
                <Text variant="caption" color={color.inkMuted}>
                  days won
                </Text>
              </Card>
            );
          })}
        </View>

        <View style={{ height: space.md }} />
        <Pressable testID="slip-link" onPress={() => router.push("/debrief")}>
          <Text variant="caption" color={color.inkFaint}>
            Had a slip? No judgement here — let's debrief it.
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: space.sm, justifyContent: "space-between" },
  headerText: { flex: 1 },
  metricRow: { flexDirection: "row", gap: space.sm },
  scroll: { paddingBottom: 120, paddingTop: space.lg },
  streakCard: { flex: 1 },
  streakRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});
