import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { api } from "../../src/api";
import type { NextAction } from "../../src/core/nextBestAction";
import { crossedMilestones } from "../../src/core/streaks";
import { daysWonFor, todayIso, useAppStore } from "../../src/state/store";
import { Button, Card, Screen, Text } from "../../src/ui/primitives";
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

  return (
    <Screen testID="today-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="display">Today</Text>
        <View style={{ height: space.md }} />

        {milestone ? (
          <Card tone="accent" testID="milestone-card">
            <Text variant="heading">{`${milestone.days} days won`}</Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={color.inkMuted}>
              {`That's ${milestone.days} ${VERTICAL_LABELS[milestone.vertical] ?? ""} days that belong to you now. They don't reset. Ever.`}
            </Text>
            <View style={{ height: space.sm }} />
            <Button
              label="Noted"
              kind="secondary"
              onPress={() => ackMilestone(milestone.vertical, milestone.won)}
            />
          </Card>
        ) : null}

        {milestone ? <View style={{ height: space.md }} /> : null}

        {action ? (
          <Card testID="nba-card">
            <Text variant="caption" color={color.primary}>
              NEXT UP
            </Text>
            <View style={{ height: space.xs }} />
            <Text variant="heading">{action.title}</Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={color.inkMuted}>
              {action.body}
            </Text>
            <View style={{ height: space.md }} />
            <Button
              testID="nba-go"
              label="Go"
              onPress={() => router.push(action.route as never)}
            />
          </Card>
        ) : null}

        <View style={{ height: space.md }} />
        <View style={styles.streakRow}>
          {enrolments.map((e) => {
            const won = daysWonFor(e, lapses[e.vertical] ?? [], today);
            return (
              <Card key={e.vertical} style={styles.streakCard} tone="soft">
                <Text variant="title" testID={`dayswon-${e.vertical}`}>{String(won)}</Text>
                <Text variant="caption" color={color.inkMuted}>
                  {`days won · ${e.vertical}`}
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
  scroll: { paddingBottom: 120, paddingTop: space.lg },
  streakCard: { flex: 1 },
  streakRow: { flexDirection: "row", gap: space.sm },
});
