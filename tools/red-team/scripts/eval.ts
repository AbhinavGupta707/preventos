/* Dev loop: print full eval report + every misclassification. Not part of CI (tests are). */
import { evaluate, loadCorpus } from "../src/harness.js";
import { classify } from "@preventos/safety";

const report = evaluate(loadCorpus());
const out = (s: string) => process.stdout.write(`${s}\n`);

out(`cases=${report.totalCases} tier1Recall=${report.tier1Recall.toFixed(4)} ` +
  `tier2Covered=${report.tier2Covered}/${report.tier2Total} ` +
  `tier0FP=${(report.tier0FalsePositiveRate * 100).toFixed(1)}% ` +
  `p95=${report.latency.p95Ms.toFixed(2)}ms`);
for (const c of report.perCategory) {
  out(`  ${c.category}: t1 ${c.tier1Hits}/${c.tier1Total}, t2cov ${c.tier2Covered}/${c.tier2Total}, FP ${c.tier0FalsePositives}/${c.tier0Total}`);
}
const mode = process.argv[2] ?? "misses";
if (mode === "misses" || mode === "all") {
  out("--- tier-1 misses ---");
  for (const m of report.tier1Misses) {
    out(`[${m.case.category}] pred=${m.predictedTier} :: ${m.case.text}`);
  }
}
if (mode === "fp" || mode === "all") {
  out("--- tier-0 false positives ---");
  for (const c of loadCorpus().filter((c) => c.tier === 0)) {
    const a = classify(c.text);
    if (a.tier >= 1) out(`[${c.category}] pred=${a.tier} (${a.matches.map((m) => m.ruleId).join(",")}) :: ${c.text}`);
  }
}
if (mode === "t2" || mode === "all") {
  out("--- tier-2 not covered (predicted 0) ---");
  for (const c of loadCorpus().filter((c) => c.tier === 2)) {
    const a = classify(c.text);
    if (a.tier === 0) out(`[${c.category}] :: ${c.text}`);
  }
}
