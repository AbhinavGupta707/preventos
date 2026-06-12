import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { rescueMode } from "../src/core/rescue";
import { todayIso, useAppStore } from "../src/state/store";
import { Button, Screen, Text } from "../src/ui/primitives";
import { color, radius, space } from "../src/ui/tokens";

/**
 * Rescue (WP2.3): everything on this screen is local — no network, no fetch.
 * It must work in airplane mode, which the e2e suite proves.
 */

const BREATH_SECONDS = 5;

function BreathingPacer({ tint, label }: { readonly tint: string; readonly label: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.6,
          duration: BREATH_SECONDS * 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: BREATH_SECONDS * 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    const interval = setInterval(
      () => setPhase((p) => (p === "in" ? "out" : "in")),
      BREATH_SECONDS * 1000,
    );
    return () => {
      loop.stop();
      clearInterval(interval);
    };
  }, [scale]);

  return (
    <View style={styles.pacerWrap}>
      <Animated.View style={[styles.pacerCircle, { backgroundColor: tint, transform: [{ scale }] }]} />
      <Text variant="heading" color={label}>
        {phase === "in" ? "Breathe in…" : "And out…"}
      </Text>
    </View>
  );
}

const DISTRACTIONS: Record<"craving" | "urge", readonly string[]> = {
  craving: [
    "Drink a glass of cold water, slowly",
    "Step outside or to a window for one minute",
    "Text someone — about anything else",
    "Sour sweet, toothpick, or gum",
  ],
  urge: [
    "Put the vape in another room — just for now",
    "Hands busy: keys, coin, anything fidgetable",
    "Two-minute walk, even indoors",
    "Cold water on your wrists",
  ],
};

export default function Rescue() {
  const enrolments = useAppStore((s) => s.enrolments);
  const recordLapse = useAppStore((s) => s.recordLapse);
  const mode = rescueMode(
    enrolments.map((e) => e.vertical),
    new Date().getHours(),
  );
  const [secondsLeft, setSecondsLeft] = useState(180);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const night = mode === "cant_sleep";
  const bg = night ? color.nightBackground : color.background;
  const ink = night ? color.nightInk : color.ink;
  const inkMuted = night ? color.nightInkMuted : color.inkMuted;

  const slipVertical = mode === "craving" ? "smoking" : "vaping";

  return (
    <Screen background={bg} testID="rescue-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {night ? (
          <View testID="rescue-night">
            <Text variant="title" color={ink}>
              Can't sleep. That's okay.
            </Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={inkMuted}>
              Lying awake trying is the one thing that doesn't work. Let's take the pressure off —
              nothing to achieve for the next few minutes.
            </Text>
            <BreathingPacer tint={color.nightAccent} label={inkMuted} />
            <Text variant="body" color={inkMuted}>
              If you're still wide awake in twenty minutes, get up, keep the lights low, and do
              something gently boring. Bed is for sleeping — your bed will still be there.
            </Text>
          </View>
        ) : (
          <View testID={`rescue-${mode}`}>
            <Text variant="title" color={ink}>
              {mode === "craving" ? "Riding out a craving" : "Riding out the urge"}
            </Text>
            <View style={{ height: space.xs }} />
            <Text variant="body" color={inkMuted}>
              {`This will crest and pass — usually within three minutes. Stay with it. ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")} to go.`}
            </Text>
            <BreathingPacer tint={color.primarySoft} label={inkMuted} />
            <Text variant="heading" color={ink}>
              Or switch channels
            </Text>
            <View style={{ height: space.sm }} />
            {DISTRACTIONS[mode].map((d) => (
              <View key={d} style={styles.distraction}>
                <Text variant="body" color={ink}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: space.lg }} />
        <Button testID="rescue-passed" label={night ? "I'll rest now" : "It passed"} onPress={() => router.back()} />
        {!night ? (
          <>
            <View style={{ height: space.sm }} />
            <Button
              testID="rescue-slipped"
              label="I slipped"
              kind="ghost"
              onPress={() => {
                recordLapse(slipVertical, todayIso());
                router.replace("/debrief");
              }}
            />
          </>
        ) : null}
        <View style={{ height: space.md }} />
        <Pressable testID="rescue-crisis-link" onPress={() => router.push("/crisis")}>
          <Text variant="caption" color={inkMuted}>
            Need more help than this right now? Tap here.
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  distraction: {
    backgroundColor: "rgba(127,127,127,0.08)",
    borderRadius: radius.md,
    marginBottom: space.sm,
    padding: space.sm + 4,
  },
  pacerCircle: {
    borderRadius: 999,
    height: 120,
    marginBottom: space.lg,
    width: 120,
  },
  pacerWrap: { alignItems: "center", paddingVertical: space.xl },
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
