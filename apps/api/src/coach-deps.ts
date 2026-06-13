import { fileURLToPath } from "node:url";
import { FakeCoachProvider, claudeProviderFromEnv } from "@preventos/coach";
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

/**
 * Build the boot-time coach configuration: the compiled claims register
 * (post-filter fences, single source of truth = compliance/claims) and the LLM
 * provider. The real Claude adapter is used only when ANTHROPIC_API_KEY is set;
 * otherwise the deterministic FakeCoachProvider keeps local/CI runs free.
 */
export async function loadCoachConfig(): Promise<CoachConfig> {
  const claimsFences = compileClaimsRegister(await loadClaimsRegister(REGISTER_PATH));
  const provider: CoachLlmProvider = claudeProviderFromEnv() ?? new FakeCoachProvider();
  return { provider, claimsFences };
}
