import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { Button, Card, ProgrammeChip, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";
import { useAppStore } from "../../src/state/store";

export default function Settings() {
  const resetAll = useAppStore((s) => s.resetAll);
  const enrolments = useAppStore((s) => s.enrolments);

  return (
    <Screen testID="settings-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="display">Privacy</Text>
        <Text variant="body" color={color.inkMuted}>
          Clear controls for a beta build.
        </Text>
        <View style={{ height: space.lg }} />

        <Card>
          <ProgrammeChip label="Local first" tone="success" />
          <View style={{ height: space.sm }} />
          <Text variant="heading">Your setup stays on this device.</Text>
          <View style={{ height: space.xs }} />
          <Text variant="body" color={color.inkMuted}>
            QuitKit and Exhale can run offline after setup. Sync only happens when a beta API is
            configured for the app.
          </Text>
        </Card>

        <View style={{ height: space.md }} />
        <Card tone="peach">
          <Text variant="heading">Beta programmes</Text>
          <View style={{ height: space.sm }} />
          <View style={styles.chips}>
            <ProgrammeChip label="QuitKit" tone="success" />
            <ProgrammeChip label="Exhale 18+" tone="peach" />
            <ProgrammeChip label="Steady private" tone="muted" />
            <ProgrammeChip label="Nightshift private" tone="muted" />
          </View>
          <View style={{ height: space.sm }} />
          <Text variant="caption" color={color.inkMuted}>
            Active on this device: {enrolments.length === 0 ? "none yet" : enrolments.map((e) => e.vertical).join(", ")}
          </Text>
        </Card>

        <View style={{ height: space.md }} />
        <Card>
          <Text variant="heading">Data controls</Text>
          <View style={{ height: space.xs }} />
          <Text variant="body" color={color.inkMuted}>
            Export and deletion are part of the platform privacy flow. This beta build keeps a
            local reset here so testing never traps your answers.
          </Text>
          <View style={{ height: space.md }} />
          <Button
            kind="ghost"
            label="Reset this device"
            onPress={() =>
              Alert.alert("Reset local data?", "This clears beta app data stored on this device.", [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: resetAll },
              ])
            }
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  scroll: { paddingBottom: 120, paddingTop: space.lg },
});
