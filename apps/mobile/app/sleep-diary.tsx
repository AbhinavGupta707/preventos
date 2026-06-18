import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { api } from "../src/api";
import {
  durationLabel,
  isValidHHMM,
  sleepDiaryEntriesNeeded,
  sleepDiaryMetrics,
  sleepWindowStatus,
  toSleepDiaryInput,
  toSleepWindowInput,
  type MobileSleepDiaryEntry,
  type SleepSafetyFlags,
} from "../src/core/sleepDiary";
import { todayIso, useAppStore } from "../src/state/store";
import { Button, Card, ProgrammeChip, ProgressMetric, Screen, Text } from "../src/ui/primitives";
import { color, radius, space, type } from "../src/ui/tokens";

const MIN_DIARY_ENTRIES = 5;

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly keyboardType?: "default" | "number-pad";
  readonly placeholder?: string;
  readonly testID?: string;
}) {
  return (
    <View style={styles.field}>
      <Text variant="caption" color={color.inkMuted}>
        {label}
      </Text>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.inkFaint}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function Toggle({
  label,
  selected,
  onPress,
  testID,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        selected ? styles.toggleSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.toggleDot, selected ? styles.toggleDotSelected : null]} />
      <Text variant="bodyStrong" color={selected ? color.primary : color.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

function numericMinutes(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

export default function SleepDiary() {
  const today = todayIso();
  const recordCheckin = useAppStore((s) => s.recordCheckin);
  const recordSleepDiary = useAppStore((s) => s.recordSleepDiary);
  const setSleepWindow = useAppStore((s) => s.setSleepWindow);
  const entries = useAppStore((s) => s.sleepDiary);
  const sleepWindow = useAppStore((s) => s.sleepWindow);

  const latest = entries.at(-1);
  const [bedTime, setBedTime] = useState(latest?.bedTime ?? "23:00");
  const [getUpTime, setGetUpTime] = useState(latest?.getUpTime ?? "07:00");
  const [sleepDelayMin, setSleepDelayMin] = useState("20");
  const [nightAwakeMin, setNightAwakeMin] = useState("20");
  const [flags, setFlags] = useState<SleepSafetyFlags>({
    safetySensitiveOccupation: false,
    excessiveDaytimeSleepiness: false,
  });
  const [saving, setSaving] = useState(false);
  const [windowPending, setWindowPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const todayDone = entries.some((entry) => entry.date === today);
  const needed = sleepDiaryEntriesNeeded(entries, MIN_DIARY_ENTRIES);
  const recent = useMemo(() => entries.slice(-5).reverse(), [entries]);
  const formValid = isValidHHMM(bedTime) && isValidHHMM(getUpTime);

  async function saveDiary() {
    if (!formValid) {
      setStatus("Use 24-hour times like 23:00 and 07:00.");
      return;
    }
    const entry: MobileSleepDiaryEntry = {
      date: today,
      bedTime,
      getUpTime,
      sleepDelayMin: numericMinutes(sleepDelayMin),
      nightAwakeMin: numericMinutes(nightAwakeMin),
    };
    setSaving(true);
    const synced = await api.logSleepDiary(toSleepDiaryInput(entry));
    recordSleepDiary(entry);
    recordCheckin(today);
    setSaving(false);
    setStatus(
      synced.ok
        ? "Saved. Your diary is the source of truth for the sleep window."
        : "Saved on this device. The API will catch up when it is available.",
    );
  }

  async function requestWindow() {
    if (!formValid) {
      setStatus("Use a valid get-up time before requesting a window.");
      return;
    }
    setWindowPending(true);
    const result = await api.createSleepWindow(toSleepWindowInput(getUpTime, today, flags));
    setWindowPending(false);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    setSleepWindow(result.value);
    setStatus("Sleep window updated from your recent diary.");
  }

  return (
    <Screen testID="sleep-diary-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ProgrammeChip label="Nightshift internal" tone="muted" />
        <View style={{ height: space.sm }} />
        <Text variant="title">Morning sleep check-in</Text>
        <View style={{ height: space.xs }} />
        <Text variant="body" color={color.inkMuted}>
          Four numbers from last night. No score to chase; just a steadier picture of your routine.
        </Text>

        <View style={{ height: space.md }} />
        <Card tone={todayDone ? "success" : "surface"} testID="sleep-diary-form">
          <Text variant="heading">{todayDone ? "Today's entry is saved" : "Last night"}</Text>
          <View style={{ height: space.md }} />
          <View style={styles.fieldRow}>
            <Field label="Into bed" value={bedTime} onChangeText={setBedTime} placeholder="23:00" testID="sleep-bed-time" />
            <Field label="Got up" value={getUpTime} onChangeText={setGetUpTime} placeholder="07:00" testID="sleep-get-up" />
          </View>
          <View style={styles.fieldRow}>
            <Field
              label="Minutes to sleep"
              value={sleepDelayMin}
              onChangeText={setSleepDelayMin}
              keyboardType="number-pad"
              testID="sleep-delay"
            />
            <Field
              label="Minutes awake"
              value={nightAwakeMin}
              onChangeText={setNightAwakeMin}
              keyboardType="number-pad"
              testID="sleep-awake"
            />
          </View>
          <View style={{ height: space.sm }} />
          <Button
            testID="sleep-save"
            label={saving ? "Saving..." : todayDone ? "Update today's entry" : "Save check-in"}
            disabled={saving}
            onPress={saveDiary}
          />
        </Card>

        <View style={{ height: space.md }} />
        <Card tone="soft" testID="sleep-window-card">
          <Text variant="heading">Your sleep window</Text>
          <View style={{ height: space.xs }} />
          {sleepWindow ? (
            <>
              <Text variant="title" testID="sleep-window-times">
                {sleepWindow.windowStart} to {sleepWindow.windowEnd}
              </Text>
              <Text variant="body" color={color.inkMuted}>
                {durationLabel(sleepWindow.durationMin)} in bed. {sleepWindowStatus(sleepWindow)}
              </Text>
              {sleepWindow.signpostRequired ? (
                <>
                  <View style={{ height: space.sm }} />
                  <Text variant="body" color={color.danger} testID="sleep-window-signpost">
                    If you are fighting sleep while driving, working, or caring for someone, speak to a qualified
                    health professional. Keep the gentler window until that feels settled.
                  </Text>
                </>
              ) : null}
            </>
          ) : (
            <Text variant="body" color={color.inkMuted}>
              {needed === 0
                ? "You have enough diary entries to request a first window."
                : `Save ${needed} more check-in${needed === 1 ? "" : "s"} to request a first window.`}
            </Text>
          )}

          <View style={{ height: space.md }} />
          <Toggle
            testID="sleep-safety-occupation"
            label="My day involves driving, machinery, caring, or other safety-sensitive work"
            selected={flags.safetySensitiveOccupation}
            onPress={() => setFlags((current) => ({ ...current, safetySensitiveOccupation: !current.safetySensitiveOccupation }))}
          />
          <Toggle
            testID="sleep-safety-sleepiness"
            label="I am very sleepy during the day"
            selected={flags.excessiveDaytimeSleepiness}
            onPress={() =>
              setFlags((current) => ({ ...current, excessiveDaytimeSleepiness: !current.excessiveDaytimeSleepiness }))
            }
          />
          <View style={{ height: space.sm }} />
          <Button
            testID="sleep-window-request"
            label={windowPending ? "Updating..." : "Update sleep window"}
            kind="secondary"
            disabled={windowPending || needed > 0}
            onPress={requestWindow}
          />
        </Card>

        {status ? (
          <>
            <View style={{ height: space.md }} />
            <Card tone="peach" testID="sleep-status">
              <Text variant="body" color={color.inkMuted}>
                {status}
              </Text>
            </Card>
          </>
        ) : null}

        {recent.length > 0 ? (
          <>
            <View style={{ height: space.md }} />
            <Text variant="heading">Recent entries</Text>
            <View style={{ height: space.sm }} />
            {recent.map((entry) => {
              const metrics = sleepDiaryMetrics(entry);
              return (
                <View key={entry.date} style={styles.metricRow}>
                  <ProgressMetric label={entry.date} value={`${metrics.efficiencyPercent}%`} detail="time in bed asleep" />
                  <ProgressMetric
                    label="ASLEEP"
                    value={durationLabel(metrics.minutesAsleep)}
                    detail={`${durationLabel(metrics.minutesInBed)} in bed`}
                    tone="peach"
                  />
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: space.xs },
  fieldRow: { flexDirection: "row", gap: space.sm, marginBottom: space.sm },
  input: {
    ...type.bodyStrong,
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: color.ink,
    minHeight: 48,
    paddingHorizontal: space.sm + 4,
    paddingVertical: space.sm,
  },
  metricRow: { flexDirection: "row", gap: space.sm, marginBottom: space.sm },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  scroll: { paddingBottom: 120, paddingTop: space.lg },
  toggle: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: space.sm,
    marginBottom: space.sm,
    minHeight: 56,
    padding: space.sm + 4,
  },
  toggleDot: {
    borderColor: color.border,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  toggleDotSelected: { backgroundColor: color.primary, borderColor: color.primary },
  toggleSelected: { backgroundColor: color.primarySoft, borderColor: color.primary },
});
