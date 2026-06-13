import { router } from "expo-router";
import { View, StyleSheet } from "react-native";

import { Button, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

/** Value before account friction (WP2.2): no sign-up, no email — straight in. */
export default function Welcome() {
  return (
    <Screen testID="onboarding-welcome">
      <View style={styles.body}>
        <Text variant="display">Change that{"\n"}keeps.</Text>
        <View style={{ height: space.md }} />
        <Text variant="body" color={color.inkMuted}>
          One quiet place to work on smoking, vaping, drinking or sleep — at your pace, on your
          terms. No account needed to start. About 90 seconds to set up.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button
          testID="onboarding-start"
          label="Choose a programme"
          onPress={() => router.push("/onboarding/programme")}
        />
        <View style={{ height: space.sm }} />
        <Text variant="caption" color={color.inkFaint}>
          Your answers stay on this device until you choose otherwise.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  footer: { paddingBottom: space.xl },
});
