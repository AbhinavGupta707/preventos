# @preventos/red-team — safety red-team suite (WP7.4)

Runs the labelled risk corpus and the adversarial jailbreak scenarios through the
deterministic classifier in `@preventos/safety`, and enforces the release gate.
This suite is part of `pnpm verify`, so it is a **required CI check** — a red gate
blocks merge.

## What runs

- **`corpus/` (843 cases, 6 categories)** — exact-tier labels. Schema/dedup/distribution
  validated by `test/corpus.test.ts`; classifier accuracy measured by `test/harness.test.ts`.
- **`scenarios/jailbreaks.jsonl`** — adversarial framings (prompt-injection, roleplay,
  fictional/academic wrapping, obfuscation, minimisation, third-person masks) plus the
  plan's vertical scenarios: detox-seeking, dependence-concealment, sleep-medication
  elicitation, dual-use. Each asserts a **tier floor** the framing must not lower.

## Release-blocking thresholds (`test/harness.test.ts`)

| Gate | Threshold | Source |
|------|-----------|--------|
| Tier-1 recall | **≥ 0.95** | plan WP7.1 |
| Classification latency p95 | **< 500 ms** | plan WP7.1 |
| Per-category tier-0 false-positive rate | < 10% | this suite |
| Tier-2 coverage (reach a human/scripted path) | ≥ 90% | this suite |

The per-category report (tier-1 recall, tier-2 coverage, FP rate, p95) is printed on
every run.

## The ratchet rule

**Every miss becomes a case before its fix, and the known-miss list only ever shrinks.**

`ratchet.json` holds the exact texts the classifier is *currently known to miss*
(`knownCorpusMisses`, `knownScenarioMisses`). The harness asserts the live miss set is
**exactly equal** to the ledger — so the gate fails in both directions:

- **A regression / newly-added failing case** → the miss set grows beyond the ledger →
  red. To go green you must explicitly add the case text to `ratchet.json`. That is the
  ratchet: a new miss is recorded as a known gap (the "case") *before* any code change
  papers over it.
- **A fix lands** → the case now passes → the live miss set is smaller than the ledger →
  red until you delete the stale entry in the same PR.

Reviewers **must reject** any diff that adds an entry to `ratchet.json` without a
corresponding new corpus/scenario case, and the list must trend toward empty. It is
empty today (recall 1.00).

## Dev loop

```bash
# full report + every misclassification (not part of CI):
npx tsx scripts/eval.ts all     # modes: misses | fp | t2 | all
```

Workflow when you find a new bypass in the wild:
1. Add the verbatim text to the right `corpus/*.jsonl` (with its true tier) or
   `scenarios/jailbreaks.jsonl` (with its tier floor).
2. Run the suite — it goes red (a recorded miss with no fix).
3. Add the text to `ratchet.json` to acknowledge the gap → green, gap is now tracked.
4. Improve the lexicon in `@preventos/safety` until it passes; remove the entry from
   `ratchet.json` in the same PR.
