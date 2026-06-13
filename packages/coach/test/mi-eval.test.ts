import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { compileClaimsRegister, loadClaimsRegister } from "@preventos/content";
import type { CompiledBlocklist } from "@preventos/content";
import { classify } from "@preventos/safety-core";
import { FakeCoachProvider } from "../src/index.js";
import { MI_CORPUS, NON_ADHERENT_CONTROLS, corpusResponder } from "../src/eval/corpora.js";
import { runMiEval } from "../src/eval/runner.js";
import { scoreMiAdherence } from "../src/eval/mi-rubric.js";

const REGISTER = fileURLToPath(new URL("../../../compliance/claims/claims-register.json", import.meta.url));
const TARGET = 0.9;

let fences: readonly CompiledBlocklist[];
beforeAll(async () => {
  fences = compileClaimsRegister(await loadClaimsRegister(REGISTER));
});

describe("WP6.2 — coach MI-adherence eval (Fake provider, no key)", () => {
  it("the corpus is multi-vertical and tier-0 (every turn reaches the LLM, none crisis-routed)", async () => {
    const verticals = new Set(MI_CORPUS.map((c) => c.vertical));
    expect(verticals).toEqual(new Set(["smoking", "vaping", "alcohol", "sleep"]));

    // Guard: a corpus message that trips the safety classifier would crisis-bypass
    // the LLM (empty reply) and silently distort the eval — keep them all tier-0.
    for (const c of MI_CORPUS) {
      expect(classify(c.userText).tier, `${c.id} must be tier-0`).toBe(0);
    }

    const provider = new FakeCoachProvider(corpusResponder(MI_CORPUS));
    const report = await runMiEval({ provider, claimsFences: fences });
    // Every reply is a coaching message (no crisis bypass) — the pipeline ran end to end.
    expect(report.results).toHaveLength(MI_CORPUS.length);
    expect(report.results.every((r) => r.reply.length > 0)).toBe(true);
  });

  it("overall adherence meets the ≥90% target", async () => {
    const provider = new FakeCoachProvider(corpusResponder(MI_CORPUS));
    const report = await runMiEval({ provider, claimsFences: fences });
    expect(report.overall.rate).toBeGreaterThanOrEqual(TARGET);
    expect(report.overall.total).toBe(MI_CORPUS.length);
  });

  it("the gate is a real floor: exactly the two sub-par cases fail (rubric has teeth)", async () => {
    const provider = new FakeCoachProvider(corpusResponder(MI_CORPUS));
    const report = await runMiEval({ provider, claimsFences: fences });

    const expectedFailures = MI_CORPUS.filter((c) => c.subPar).map((c) => c.id).sort();
    expect(report.failures.map((f) => f.id).sort()).toEqual(expectedFailures);
    // The slip kinds are caught precisely.
    expect(report.failures.find((f) => f.id === "smk-track")?.violations).toContain("righting_reflex");
    expect(report.failures.find((f) => f.id === "vap-restart")?.violations).toContain("question_stacking");
  });

  it("reports a per-vertical rate for all four programmes", async () => {
    const provider = new FakeCoachProvider(corpusResponder(MI_CORPUS));
    const report = await runMiEval({ provider, claimsFences: fences });
    for (const vertical of ["smoking", "vaping", "alcohol", "sleep"] as const) {
      expect(report.byVertical[vertical]?.total).toBeGreaterThan(0);
    }
  });

  it("rubric calibration: every clearly non-MI control scores non-adherent (0%)", () => {
    for (const control of NON_ADHERENT_CONTROLS) {
      const score = scoreMiAdherence(control.reply);
      expect(score.adherent, `${control.id} should be non-adherent`).toBe(false);
    }
  });

  it("the post-filter preserves an adherent reply unchanged (no spurious substitution)", async () => {
    const provider = new FakeCoachProvider(corpusResponder(MI_CORPUS));
    const report = await runMiEval({ provider, claimsFences: fences });
    const good = MI_CORPUS.find((c) => c.id === "smk-meeting")!;
    const result = report.results.find((r) => r.id === "smk-meeting")!;
    expect(result.reply).toBe(good.reply);
    expect(result.score.adherent).toBe(true);
  });

  it("EVERY corpus reply reaches the rubric verbatim — no case is silently bypassed or substituted", async () => {
    // Guards the eval against a future claims-fence rule that would substitute a
    // corpus reply (post-filter) or a classifier change that would crisis-bypass
    // it: either would score a fallback message and distort the rate undetected.
    const provider = new FakeCoachProvider(corpusResponder(MI_CORPUS));
    const report = await runMiEval({ provider, claimsFences: fences });
    for (const c of MI_CORPUS) {
      const result = report.results.find((r) => r.id === c.id)!;
      expect(result.reply, `${c.id} must pass through the pipeline unchanged`).toBe(c.reply);
    }
  });
});
