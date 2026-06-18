import type { AppProgramme } from "./store/types";

type Env = Readonly<Record<string, string | undefined>>;

const INTERNAL_FLAGS: Readonly<Partial<Record<AppProgramme, string>>> = {
  steady: "NEXT_PUBLIC_PREVENTOS_ENABLE_STEADY_INTERNAL",
  nightshift: "NEXT_PUBLIC_PREVENTOS_ENABLE_NIGHTSHIFT_INTERNAL",
};

function enabled(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true" || value?.toLowerCase() === "yes";
}

export function programmeAccess(programme: AppProgramme, env: Env = process.env): "open" | "internal" | "gated" {
  const flag = INTERNAL_FLAGS[programme];
  if (flag === undefined) return "open";
  return enabled(env[flag]) ? "internal" : "gated";
}

export function programmeSelectable(programme: AppProgramme, env: Env = process.env): boolean {
  return programmeAccess(programme, env) !== "gated";
}

export function publicProgrammes(programmes: readonly AppProgramme[], env: Env = process.env): readonly AppProgramme[] {
  return programmes.filter((programme) => programmeSelectable(programme, env));
}
