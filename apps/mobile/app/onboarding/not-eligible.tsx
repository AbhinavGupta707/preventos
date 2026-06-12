import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";

/** Terminal screen for under-18s: no path into Exhale from here (E18). */
export default function NotEligible() {
  return (
    <Screen testID="age-not-eligible">
      <View style={styles.body}>
        <Text variant="title">Exhale is for adults only</Text>
        <View style={{ height: space.md }} />
        <Text variant="body" color={color.inkMuted}>
          We're not able to offer the vaping programme to under-18s. If vaping is on your mind,
          a trusted adult, your GP, or school nurse are good people to talk to.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="Back to programmes" kind="secondary" onPress={() => router.replace("/onboarding/programme")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  footer: { paddingBottom: space.xl },
});
