import type { Vertical } from "@preventos/domain";

type InternalVertical = Extract<Vertical, "alcohol" | "sleep">;
type Env = Readonly<Record<string, string | undefined>>;

const INTERNAL_FLAGS: Readonly<Record<InternalVertical, string>> = {
  alcohol: "EXPO_PUBLIC_PREVENTOS_ENABLE_STEADY_INTERNAL",
  sleep: "EXPO_PUBLIC_PREVENTOS_ENABLE_NIGHTSHIFT_INTERNAL",
};

const enabled = (value: string | undefined): boolean =>
  value === "1" || value?.toLowerCase() === "true" || value?.toLowerCase() === "yes";

export function internalProgrammeEnabled(vertical: InternalVertical, env: Env = process.env): boolean {
  return enabled(env[INTERNAL_FLAGS[vertical]]);
}
