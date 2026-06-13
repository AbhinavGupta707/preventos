import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Button, Screen, Text } from "../src/ui/primitives";
import { color, radius, space } from "../src/ui/tokens";

/**
 * Scripted crisis flow — safety invariant 1. Fully static: no LLM, no network
 * dependency, renders identically with the backend down or the device offline.
 * Deliberately unlike the rest of the app (deep indigo, high contrast) so it
 * is never mistaken for coach chat (WP2.6 accept).
 */

interface CrisisLine {
  readonly name: string;
  readonly detail: string;
  readonly action: string;
  readonly href: string;
  readonly testID: string;
}

const LINES: readonly CrisisLine[] = [
  {
    name: "Samaritans",
    detail: "24/7, free, confidential — whatever you're facing",
    action: "Call 116 123",
    href: "tel:116123",
    testID: "crisis-samaritans",
  },
  {
    name: "Shout",
    detail: "24/7 crisis support by text, if talking feels like too much",
    action: "Text SHOUT to 85258",
    href: "sms:85258",
    testID: "crisis-shout",
  },
  {
    name: "NHS 111",
    detail: "Urgent mental health support, option 2",
    action: "Call 111",
    href: "tel:111",
    testID: "crisis-nhs111",
  },
  {
    name: "Emergency",
    detail: "If you're in immediate danger",
    action: "Call 999",
    href: "tel:999",
    testID: "crisis-999",
  },
];

export default function Crisis() {
  return (
    <Screen background={color.crisisBackground} testID="crisis-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="title" color={color.crisisInk}>
          You matter. Right now matters.
        </Text>
        <View style={{ height: space.sm }} />
        <Text variant="body" color={color.crisisInkMuted}>
          What you wrote sounds heavier than an app should hold. A real person is the right next
          step — these lines exist exactly for moments like this one.
        </Text>
        <View style={{ height: space.lg }} />

        {LINES.map((line) => (
          <Pressable
            key={line.name}
            testID={line.testID}
            accessibilityRole="button"
            onPress={() => void Linking.openURL(line.href)}
            style={({ pressed }) => [styles.line, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text variant="heading" color={color.crisisInk}>
              {line.name}
            </Text>
            <Text variant="caption" color={color.crisisInkMuted}>
              {line.detail}
            </Text>
            <View style={{ height: space.xs }} />
            <Text variant="bodyStrong" color={color.crisisAction}>
              {line.action}
            </Text>
          </Pressable>
        ))}

        <View style={{ height: space.md }} />
        <Text variant="caption" color={color.crisisInkMuted}>
          These work even when the rest of the app can't reach the internet.
        </Text>
        <View style={{ height: space.lg }} />
        <Button
          testID="crisis-back"
          label="I'm okay to go back"
          kind="crisis"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: {
    backgroundColor: color.crisisSurface,
    borderRadius: radius.lg,
    marginBottom: space.sm,
    padding: space.md,
  },
  scroll: { paddingBottom: space.xxl, paddingTop: space.lg },
});
