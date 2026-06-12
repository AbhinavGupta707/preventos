import { Redirect } from "expo-router";

import { useAppStore } from "../src/state/store";

export default function Entry() {
  const hydrated = useAppStore((s) => s.hydrated);
  const onboarded = useAppStore((s) => s.onboarded);
  if (!hydrated) return null;
  return onboarded ? <Redirect href="/(tabs)/today" /> : <Redirect href="/onboarding" />;
}
