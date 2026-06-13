import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useAppStore } from "../../src/state/store";
import { Button, Card, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

const READINESS_COPY: Record<string, string> = {
  ready: "You said you're ready — so we'll keep things moving.",
  ambivalent: "You're weighing it up. That's a fine place to start from.",
  not_ready: "No pressure here. We'll keep it light until you say otherwise.",
};

/** Plain-language BFO playback: what we heard, before anything is asked of them. */
export default function OnboardingDone() {
  const sections = useAppStore((s) => s.bfoSections);
  const latest = sections.at(-1);

  return (
    <Screen testID="onboarding-done">
      <View style={styles.body}>
        <Text variant="title">Here's what we heard</Text>
        <View style={{ height: space.md }} />
        <Card>
          {latest ? (
            <>
              <Text variant="body">{READINESS_COPY[latest.readiness] ?? ""}</Text>
              {latest.triggers.length > 0 ? (
                <>
                  <View style={{ height: space.sm }} />
                  <Text variant="body" color={color.inkMuted}>
                    {`Your tricky moments: ${latest.triggers.join(", ")}. Your plan will be built around exactly these.`}
                  </Text>
                </>
              ) : null}
            </>
          ) : (
            <Text variant="body">You're set up.</Text>
          )}
        </Card>
        <View style={{ height: space.sm }} />
        <Text variant="caption" color={color.inkFaint}>
          Nothing you told us leaves this device until you choose otherwise.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button
          testID="onboarding-finish"
          label="See your day"
          onPress={() => router.replace("/push-primer")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  footer: { paddingBottom: space.xl },
});
