import { fileURLToPath } from "node:url";
import { compileClaimsRegister, loadClaimsRegister } from "@preventos/content";
import { fireworksProviderFromEnv, runCoachTurn } from "@preventos/coach";
import type { CoachLogEntry, CoachLogSink, CoachLlmProvider, LlmRequest, LlmResponse } from "@preventos/coach";

const registerPath = fileURLToPath(new URL("../compliance/claims/claims-register.json", import.meta.url));

class CountingProvider implements CoachLlmProvider {
  readonly name: string;
  private readonly inner: CoachLlmProvider;
  private count = 0;

  constructor(inner: CoachLlmProvider) {
    this.inner = inner;
    this.name = inner.name;
  }

  get calls(): number {
    return this.count;
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    this.count += 1;
    return this.inner.generate(request);
  }
}

class MemorySink implements CoachLogSink {
  readonly entries: CoachLogEntry[] = [];

  async record(entry: CoachLogEntry): Promise<void> {
    this.entries.push(entry);
  }
}

function line(text: string): void {
  process.stdout.write(`${text}\n`);
}

async function main(): Promise<void> {
  const fireworks = fireworksProviderFromEnv();
  if (fireworks === undefined) {
    throw new Error("Set FIREWORKS_API_KEY in the staging environment before running this smoke test.");
  }

  const provider = new CountingProvider(fireworks);
  const claimsFences = compileClaimsRegister(await loadClaimsRegister(registerPath));
  const logSink = new MemorySink();

  const tier0 = await runCoachTurn(
    {
      text: "A craving hit after lunch, and I want help getting through the next ten minutes.",
      vertical: "smoking",
      frame: "craving_rescue",
      context: { daysWon: 3, streakActive: true },
    },
    { provider, claimsFences, logSink },
  );
  if (tier0.disposition !== "replied") {
    throw new Error(`Expected a tier-0 Fireworks reply, got ${tier0.disposition}.`);
  }
  const tier0Llm = tier0.llm;
  if (tier0Llm?.provider !== "fireworks") {
    throw new Error(`Expected Fireworks as the LLM provider, got ${tier0Llm?.provider ?? "none"}.`);
  }
  const callsAfterTier0 = provider.calls;

  const tier1 = await runCoachTurn(
    {
      text: "I'm going to kill myself tonight.",
      vertical: "sleep",
      frame: "general",
      context: {},
    },
    { provider, claimsFences, logSink },
  );
  const tier2 = await runCoachTurn(
    {
      text: "I've thought about suicide most days this week.",
      vertical: "smoking",
      frame: "general",
      context: {},
    },
    { provider, claimsFences, logSink },
  );

  if (tier1.disposition !== "crisis_bypass" || tier1.llm !== undefined || tier1.preAssessment.tier !== 1) {
    throw new Error("Expected tier-1 text to bypass Fireworks and return a scripted crisis flow.");
  }
  if (tier2.disposition !== "crisis_bypass" || tier2.llm !== undefined || tier2.preAssessment.tier !== 2) {
    throw new Error("Expected tier-2 text to bypass Fireworks and return a scripted crisis flow.");
  }
  if (provider.calls !== callsAfterTier0) {
    throw new Error("Fireworks was called for elevated-risk text; invariant 1 is broken.");
  }

  line("Fireworks coach smoke PASS");
  line(`provider=${tier0Llm.provider}`);
  line(`model=${tier0Llm.model}`);
  line(`tier0_disposition=${tier0.disposition}`);
  line(`tier1_disposition=${tier1.disposition} llm_called=false`);
  line(`tier2_disposition=${tier2.disposition} llm_called=false`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Fireworks coach smoke FAIL: ${message}\n`);
  process.exitCode = 1;
});
