import { Stack, router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { api } from "../src/api";
import { color, radius, shadow, type } from "../src/ui/tokens";

/** Routes where the floating rescue button would be in the way of itself. */
const RESCUE_HIDDEN_ON = ["/rescue", "/crisis"];

function RescueButton() {
  const pathname = usePathname();
  if (RESCUE_HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  return (
    <Pressable
      testID="rescue-fab"
      accessibilityRole="button"
      accessibilityLabel="Rescue — help with a craving, urge, or sleepless night"
      onPress={() => {
        // Log the press as an inbound contact (best-effort, online-safe — the
        // rescue screen itself stays fully offline). MockApi makes this a no-op.
        void api.logCraving();
        router.push("/rescue");
      }}
      style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={styles.fabText}>Rescue</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.background },
        }}
      >
        <Stack.Screen name="rescue" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="crisis" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="checkin" options={{ presentation: "modal" }} />
        <Stack.Screen name="debrief" options={{ presentation: "modal" }} />
        <Stack.Screen name="plans-new" options={{ presentation: "modal" }} />
        <Stack.Screen name="push-primer" options={{ presentation: "modal" }} />
      </Stack>
      <RescueButton />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fab: {
    backgroundColor: color.rescue,
    borderRadius: radius.pill,
    bottom: 96,
    paddingHorizontal: 22,
    paddingVertical: 14,
    position: "absolute",
    right: 16,
    ...shadow.card,
  },
  fabText: {
    ...type.bodyStrong,
    color: color.onRescue,
  },
});
