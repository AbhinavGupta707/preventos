import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { ReadinessStage } from "@preventos/domain";
import { HSI, getInstrument } from "@preventos/instruments";

import { api } from "../../src/api";
import { emptyIntake, intakeReducer, toBfoSection } from "../../src/core/intake";
import type { IntakeState } from "../../src/core/intake";
import { todayIso, useAppStore } from "../../src/state/store";
import { Button, OptionRow, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

const TRIGGERS = [
  "Morning coffee",
  "After meals",
  "Stress",
  "After work",
  "Drinking",
  "Boredom",
] as const;

const STRUGGLES = [
  "Cravings hit out of nowhere",
  "I don't know what to do instead",
  "Everyone around me smokes",
  "My routines are built around it",
  "I'm not sure I really want to stop",
  "I've failed before and it gets to me",
] as const;

const READINESS: ReadonlyArray<{ label: string; value: ReadinessStage }> = [
  { label: "I'm ready — let's set a date", value: "ready" },
  { label: "I want to, but I'm not sure yet", value: "ambivalent" },
  { label: "Mostly just looking for now", value: "not_ready" },
];

const QUIT_OFFSETS = [
  { label: "Today", days: 0 },
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
  { label: "In two weeks", days: 14 },
] as const;

const PACK_PRICES = [
  { label: "Around £10", value: 10 },
  { label: "Around £13", value: 13 },
  { label: "Around £16", value: 16 },
  { label: "I roll my own (about £6 a pouch-day)", value: 6 },
] as const;

/** Midpoints of the HSI cigarettes-per-day bands, for the savings baseline. */
const CPD_MIDPOINTS = [7, 15, 25, 35] as const;

const STEPS = ["hsi1", "hsi2", "triggers", "struggles", "readiness", "quitdate", "spend"] as const;
type Step = (typeof STEPS)[number];

export default function SmokingIntake() {
  const [intake, setIntake] = useState<IntakeState>(() => emptyIntake("smoking"));
  const [step, setStep] = useState<Step>("hsi1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enrol = useAppStore((s) => s.enrol);

  // Invariant 2 gate: getInstrument verifies verbatim integrity + licensing;
  // a non-cleared or tampered instrument never renders.
  const servable = useMemo(() => getInstrument("hsi"), []);
  if (!servable.ok) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text variant="body" color={color.inkMuted}>
            This assessment is temporarily unavailable.
          </Text>
        </View>
      </Screen>
    );
  }

  const stepIndex = STEPS.indexOf(step);
  const advance = () => setStep(STEPS[stepIndex + 1] ?? step);

  const finish = async (pricePerPack: number) => {
    const cpdBand = intake.answers.hsi["hsi-cpd"] ?? 0;
    const cigarettesPerDay = CPD_MIDPOINTS[cpdBand] ?? 15;
    const finalState = intakeReducer(intake, { type: "set_spend", cigarettesPerDay, pricePerPack });
    setIntake(finalState);
    const section = toBfoSection(finalState);
    if (!section.ok) {
      setError(section.error);
      return;
    }
    setSubmitting(true);
    await api.submitBfoSection(section.value);
    const offset = finalState.answers.quitOffsetDays ?? 7;
    const quitDate = new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
    enrol(
      {
        vertical: "smoking",
        enrolledOn: todayIso(),
        quitDate,
        spendProfile: { vertical: "smoking", cigarettesPerDay, pricePerPack },
      },
      section.value,
    );
    // Stand the journey up server-side (consents + enrolment + quit plan).
    // Local-first: the store above already drives the offline UX, so a
    // backend failure (or the offline MockApi) never blocks intake.
    await api.enrolJourney({
      vertical: "smoking",
      quitDate,
      ...(finalState.answers.readiness !== undefined ? { stage: finalState.answers.readiness } : {}),
    });
    router.replace("/onboarding/done");
  };

  return (
    <Screen testID="intake-smoking">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="caption" color={color.inkFaint}>
          {`Step ${stepIndex + 1} of ${STEPS.length}`}
        </Text>
        <View style={{ height: space.sm }} />

        {step === "hsi1" ? (
          <View testID="intake-step-hsi1">
            <Text variant="heading">{HSI.items[0]!.text}</Text>
            <View style={{ height: space.md }} />
            {HSI.items[0]!.options.map((opt, idx) => (
              <OptionRow
                key={opt.text}
                testID={`hsi-ttfc-${idx}`}
                label={opt.text}
                selected={intake.answers.hsi["hsi-ttfc"] === idx}
                onPress={() => {
                  setIntake(intakeReducer(intake, { type: "answer_hsi", item: "hsi-ttfc", value: idx }));
                  advance();
                }}
              />
            ))}
          </View>
        ) : null}

        {step === "hsi2" ? (
          <View testID="intake-step-hsi2">
            <Text variant="heading">{HSI.items[1]!.text}</Text>
            <View style={{ height: space.md }} />
            {HSI.items[1]!.options.map((opt, idx) => (
              <OptionRow
                key={opt.text}
                testID={`hsi-cpd-${idx}`}
                label={opt.text}
                selected={intake.answers.hsi["hsi-cpd"] === idx}
                onPress={() => {
                  setIntake(intakeReducer(intake, { type: "answer_hsi", item: "hsi-cpd", value: idx }));
                  advance();
                }}
              />
            ))}
          </View>
        ) : null}

        {step === "triggers" ? (
          <View testID="intake-step-triggers">
            <Text variant="heading">When do cigarettes usually happen for you?</Text>
            <View style={{ height: space.md }} />
            {TRIGGERS.map((t) => (
              <OptionRow
                key={t}
                testID={`trigger-${t.toLowerCase().replace(/\s+/g, "-")}`}
                label={t}
                selected={intake.answers.triggers.includes(t.toLowerCase())}
                onPress={() =>
                  setIntake(intakeReducer(intake, { type: "toggle_trigger", trigger: t.toLowerCase() }))
                }
              />
            ))}
            <View style={{ height: space.sm }} />
            <Button
              testID="intake-next"
              label="Next"
              onPress={advance}
              disabled={intake.answers.triggers.length === 0}
            />
          </View>
        ) : null}

        {step === "struggles" ? (
          <View testID="intake-step-struggles">
            <Text variant="heading">What makes it hard? Pick any that ring true.</Text>
            <View style={{ height: space.md }} />
            {STRUGGLES.map((s) => (
              <OptionRow
                key={s}
                label={s}
                selected={intake.answers.struggles.includes(s)}
                onPress={() => setIntake(intakeReducer(intake, { type: "toggle_struggle", struggle: s }))}
              />
            ))}
            <View style={{ height: space.sm }} />
            <Button testID="intake-next-struggles" label="Next" onPress={advance} />
          </View>
        ) : null}

        {step === "readiness" ? (
          <View testID="intake-step-readiness">
            <Text variant="heading">Where are you with this right now?</Text>
            <View style={{ height: space.md }} />
            {READINESS.map((r) => (
              <OptionRow
                key={r.value}
                testID={`readiness-${r.value}`}
                label={r.label}
                selected={intake.answers.readiness === r.value}
                onPress={() => {
                  setIntake(intakeReducer(intake, { type: "set_readiness", readiness: r.value }));
                  advance();
                }}
              />
            ))}
          </View>
        ) : null}

        {step === "quitdate" ? (
          <View testID="intake-step-quitdate">
            <Text variant="heading">When would you like your quit day to be?</Text>
            <View style={{ height: space.xs }} />
            <Text variant="caption" color={color.inkMuted}>
              You can move it later. A date a few days out tends to stick best.
            </Text>
            <View style={{ height: space.md }} />
            {QUIT_OFFSETS.map((q) => (
              <OptionRow
                key={q.days}
                testID={`quitdate-${q.days}`}
                label={q.label}
                selected={intake.answers.quitOffsetDays === q.days}
                onPress={() => {
                  setIntake(intakeReducer(intake, { type: "set_quit_offset", days: q.days }));
                  advance();
                }}
              />
            ))}
          </View>
        ) : null}

        {step === "spend" ? (
          <View testID="intake-step-spend">
            <Text variant="heading">Roughly what does a pack cost you?</Text>
            <View style={{ height: space.xs }} />
            <Text variant="caption" color={color.inkMuted}>
              This powers your savings counter — money not spent, from day one.
            </Text>
            <View style={{ height: space.md }} />
            {PACK_PRICES.map((p) => (
              <OptionRow
                key={p.label}
                testID={`price-${p.value}`}
                label={p.label}
                selected={false}
                onPress={() => void finish(p.value)}
              />
            ))}
            {submitting ? (
              <Text variant="caption" color={color.inkMuted}>
                Setting things up…
              </Text>
            ) : null}
            {error ? (
              <Text variant="caption" color={color.danger}>
                {error}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", flex: 1, justifyContent: "center" },
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
