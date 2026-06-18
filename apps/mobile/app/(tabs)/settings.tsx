import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, View } from "react-native";

import { api, liveApiConfigured } from "../../src/api";
import { mobileClerkConfigured } from "../../src/auth/clerk";
import { Button, Card, ProgrammeChip, Screen, Text } from "../../src/ui/primitives";
import { color, space } from "../../src/ui/tokens";
import { useAppStore } from "../../src/state/store";

function localExportSnapshot(): Record<string, unknown> {
  const state = useAppStore.getState();
  return {
    onboarded: state.onboarded,
    enrolments: state.enrolments,
    bfoSections: state.bfoSections,
    lapses: state.lapses,
    lastCheckinDate: state.lastCheckinDate,
    plans: state.plans,
    milestonesAcked: state.milestonesAcked,
    choreography: state.choreography,
    sleepDiary: state.sleepDiary,
    sleepWindow: state.sleepWindow,
  };
}

function ClerkAccountControls({ onSignedOut }: { readonly onSignedOut: () => void }) {
  const { isLoaded, signOut } = useAuth();

  if (!isLoaded) {
    return (
      <Text variant="caption" color={color.inkMuted}>
        Checking account session...
      </Text>
    );
  }

  return (
    <>
      <SignedOut>
        <Text variant="body" color={color.inkMuted}>
          Sign in to use live account export and deletion. If access is lost, use the account recovery option in the
          Clerk sign-in flow.
        </Text>
      </SignedOut>
      <SignedIn>
        <Button
          kind="ghost"
          label="Sign out"
          onPress={() => {
            void signOut().then(onSignedOut);
          }}
        />
      </SignedIn>
    </>
  );
}

export default function Settings() {
  const resetAll = useAppStore((s) => s.resetAll);
  const enrolments = useAppStore((s) => s.enrolments);
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function shareExport(): Promise<void> {
    setBusy("export");
    setStatus(null);
    const exported = liveApiConfigured ? await api.exportAccountData() : { ok: true as const, value: localExportSnapshot() };
    setBusy(null);
    if (!exported.ok) {
      setStatus(exported.error);
      return;
    }
    await Share.share({
      title: "PreventOS data export",
      message: JSON.stringify(exported.value, null, 2),
    });
    setStatus(liveApiConfigured ? "Server data export ready." : "Device data export ready.");
  }

  async function deleteData(): Promise<void> {
    setBusy("delete");
    setStatus(null);
    if (liveApiConfigured) {
      const deleted = await api.deleteAccount();
      if (!deleted.ok) {
        setBusy(null);
        setStatus(deleted.error);
        return;
      }
    }
    resetAll();
    setBusy(null);
    setStatus(liveApiConfigured ? "Account deletion completed. Local device data was cleared too." : "Local data reset.");
  }

  return (
    <Screen testID="settings-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text variant="display">Privacy</Text>
        <Text variant="body" color={color.inkMuted}>
          Clear controls for a beta build.
        </Text>
        <View style={{ height: space.lg }} />

        <Card>
          <ProgrammeChip label={liveApiConfigured ? "Live API" : "Local first"} tone="success" />
          <View style={{ height: space.sm }} />
          <Text variant="heading">{liveApiConfigured ? "Your account syncs with the beta API." : "Your setup stays on this device."}</Text>
          <View style={{ height: space.xs }} />
          <Text variant="body" color={color.inkMuted}>
            {liveApiConfigured
              ? "Export and deletion use the authenticated server account. Rescue still works offline."
              : "QuitKit and Exhale can run offline after setup. Sync only happens when a beta API is configured for the app."}
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
            {liveApiConfigured
              ? "Use these controls for the authenticated server account and this device."
              : "This beta build keeps local controls here so testing never traps your answers."}
          </Text>
          <View style={{ height: space.md }} />
          {mobileClerkConfigured ? (
            <>
              <ClerkAccountControls
                onSignedOut={() => {
                  setStatus("Signed out.");
                }}
              />
              <View style={{ height: space.md }} />
            </>
          ) : null}
          <Button
            kind="ghost"
            label={busy === "export" ? "Preparing export..." : liveApiConfigured ? "Export account data" : "Export device data"}
            disabled={busy !== null}
            onPress={() => {
              void shareExport();
            }}
          />
          <View style={{ height: space.sm }} />
          <Button
            kind="ghost"
            label={busy === "delete" ? "Deleting…" : liveApiConfigured ? "Delete account data" : "Reset this device"}
            disabled={busy !== null}
            onPress={() =>
              Alert.alert(liveApiConfigured ? "Delete account data?" : "Reset local data?", liveApiConfigured ? "This deletes mutable server account data and clears this device." : "This clears beta app data stored on this device.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: liveApiConfigured ? "Delete" : "Reset",
                  style: "destructive",
                  onPress: () => {
                    void deleteData();
                  },
                },
              ])
            }
          />
          {status !== null ? (
            <>
              <View style={{ height: space.sm }} />
              <Text variant="caption" color={color.inkMuted}>
                {status}
              </Text>
            </>
          ) : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  scroll: { paddingBottom: 120, paddingTop: space.lg },
});
