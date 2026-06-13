import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";

import { resolveCompanion, type CompanionInputs } from "../core/companion";
import { color, space } from "./tokens";

/**
 * The 2D companion (AV.3) — a code-built animated placeholder driven entirely by
 * the `@preventos/companion` engine, standing in until the Rive character rig
 * (AV.1) is commissioned. It draws nothing of its own behaviour: mood, evolution
 * stage, accessories and animation pace all come from `resolveCompanion`.
 *
 * Safety invariant 1 (presentation): when the engine returns `visible: false`
 * (crisis step-aside) this component renders `null`. It is the only avatar
 * surface; the crisis screen mounts no companion at all. The companion is also
 * silent here — it never renders dialogue copy, because all copy is clinically
 * governed in content packs (invariant 3); the engine's dialogue slot ids are
 * carried for when those governed lines are wired, not voiced by this placeholder.
 */

type CompanionProps = Omit<CompanionInputs, "reduceMotion"> & {
  /** Optional surface-aware tint (e.g. the night palette on the rescue screen). */
  readonly accentColor?: string;
  readonly testID?: string;
};

const MOOD_TINT: Record<string, string> = {
  idle: color.primarySoft,
  happy: color.primary,
  celebrating: color.accent,
  concerned: color.rescueSoft,
  breathing: color.primarySoft,
  asleep: color.surfaceSunken,
};

export function Companion({ accentColor, testID = "companion", ...inputs }: CompanionProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const view = resolveCompanion({ ...inputs, reduceMotion });

  const bob = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(1)).current;
  const mood = view.mood;
  const motionOff = view.animation.reduceMotion;
  const breathSeconds = view.animation.breathCycleSeconds;
  const loopSeconds = view.animation.loopSeconds;

  // Breathing co-regulation: a calm inhale/exhale scale matched to the engine's
  // breath cycle. All other live moods get a gentle vertical bob at the engine's
  // pace. Reduced-motion holds the pose still.
  useEffect(() => {
    bob.setValue(0);
    breath.setValue(1);
    if (motionOff || !view.visible) return;

    if (mood === "breathing" && breathSeconds) {
      const half = (breathSeconds / 2) * 1000;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breath, { toValue: 1.5, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(breath, { toValue: 1, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }

    if (mood === "asleep") return; // resting: still pose, slow breath only
    const half = (loopSeconds / 2) * 1000;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mood, motionOff, breathSeconds, loopSeconds, view.visible, bob, breath]);

  // Invariant 1: stepped aside → render nothing.
  if (!view.visible) return null;

  const tint = accentColor ?? MOOD_TINT[mood] ?? color.primarySoft;
  const translateY = bob.interpolate({ inputRange: [-1, 0], outputRange: [-6, 0] });
  const asleep = mood === "asleep";
  const concerned = mood === "concerned";

  const a11yLabel = `Companion: ${mood}, ${view.evolutionStageName} stage`;

  return (
    <View testID={testID} accessibilityRole="image" accessibilityLabel={a11yLabel} style={styles.wrap}>
      <Animated.View
        testID="companion-body"
        style={[
          styles.body,
          { backgroundColor: tint, transform: [{ translateY }, { scale: breath }] },
          // A subtle accent ring as the companion evolves (deterministic, no loot).
          view.evolutionStage >= 5 ? styles.luminousRing : null,
        ]}
      >
        <View style={styles.face}>
          <View style={[styles.eye, asleep ? styles.eyeClosed : null]} />
          <View style={[styles.eye, asleep ? styles.eyeClosed : null]} />
        </View>
        <View
          style={[
            styles.mouth,
            mood === "happy" || mood === "celebrating" ? styles.mouthSmile : null,
            concerned ? styles.mouthSoft : null,
          ]}
        />
        {mood === "celebrating" ? (
          <>
            <View style={[styles.spark, { top: 2, left: 6 }]} />
            <View style={[styles.spark, { top: 8, right: 4 }]} />
          </>
        ) : null}
        {/* Evolution accessory accent — a small scarf band from the "fledgling" stage. */}
        {view.unlockedAccessories.length >= 2 ? <View style={styles.scarf} /> : null}
      </Animated.View>
    </View>
  );
}

const BODY = 64;

const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    borderRadius: BODY / 2,
    height: BODY,
    justifyContent: "center",
    width: BODY,
  },
  eye: {
    backgroundColor: color.ink,
    borderRadius: 3,
    height: 6,
    marginHorizontal: 4,
    width: 6,
  },
  eyeClosed: { height: 2, borderRadius: 1 },
  face: { flexDirection: "row", marginBottom: 4 },
  luminousRing: {
    borderColor: color.accent,
    borderWidth: 2,
  },
  mouth: {
    backgroundColor: color.ink,
    borderRadius: 2,
    height: 2,
    width: 14,
  },
  mouthSmile: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderColor: color.ink,
    borderBottomWidth: 2,
    backgroundColor: "transparent",
    height: 8,
    width: 18,
  },
  mouthSoft: { width: 10, opacity: 0.6 },
  scarf: {
    backgroundColor: color.rescue,
    borderRadius: 2,
    bottom: 8,
    height: 5,
    position: "absolute",
    width: BODY * 0.7,
  },
  spark: {
    backgroundColor: color.accent,
    borderRadius: 2,
    height: 4,
    position: "absolute",
    width: 4,
  },
  wrap: { alignItems: "center", paddingVertical: space.sm },
});
