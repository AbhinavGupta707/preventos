import { fileURLToPath } from "node:url";
import { FakeCoachProvider, claudeProviderFromEnv, fireworksProviderFromEnv } from "@preventos/coach";
import type { CoachLlmProvider } from "@preventos/coach";
import { compileClaimsRegister, loadClaimsRegister } from "@preventos/content";
import type { CompiledBlocklist } from "@preventos/content";

export interface CoachConfig {
  readonly provider: CoachLlmProvider;
  readonly claimsFences: readonly CompiledBlocklist[];
}

const REGISTER_PATH = fileURLToPath(
  new URL("../../../compliance/claims/claims-register.json", import.meta.url),
);

export function selectCoachProviderFromEnv(env: NodeJS.ProcessEnv = process.env): CoachLlmProvider {
  return fireworksProviderFromEnv(env) ?? claudeProviderFromEnv(env) ?? new FakeCoachProvider();
}

/**
 * Build the boot-time coach configuration: the compiled claims register
 * (post-filter fences, single source of truth = compliance/claims) and the LLM
 * provider. Provider selection is by configured key, in order:
 *   Fireworks (FIREWORKS_API_KEY) → Claude (ANTHROPIC_API_KEY) → Fake.
 * With no key the deterministic FakeCoachProvider keeps local/CI runs free
 * (zero spend). COACH_MODEL overrides the active provider's default model.
 */
export async function loadCoachConfig(): Promise<CoachConfig> {
  const claimsFences = compileClaimsRegister(await loadClaimsRegister(REGISTER_PATH));
  return { provider: selectCoachProviderFromEnv(), claimsFences };
}
