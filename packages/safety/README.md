# @preventos/safety — safety subsystem (WS7)

The deterministic safety rail. Per CLAUDE.md **safety invariant 1**, risk detection
runs *before* the LLM and cannot be bypassed by config, flag, or prompt — `classify()`
is a pure function of a single string argument, with no options object that could carry
a kill switch.

## Modules

| Module | Export | Purpose |
|--------|--------|---------|
| `normalize.ts` | `normalize(text)` | De-obfuscation view: joins spaced-out runs (`k i l l`), maps leet (`su1cide`), strips censor chars (`k*ll`), folds homoglyphs. Number-semantic tokens (`45yo`, `999`, `215/125`) preserved. |
| `classify.ts` | `classify(text)` → `RiskAssessment` | Tiered classification (tier 1 = deterministic crisis, LLM bypassed; tier 2 = human review; tier 0 = none). Returns matched `ruleId`s for the audit trail. |
| `lexicon/` | `ALL_RULES` | Six category rule sets (self-harm, abuse/DV, safeguarding, overdose, withdrawal, acute-medical), each tier 1/2 with `requiresAll` / `unless` context guards. |
| `guards.ts` | `GUARDS` | Idiom/hyperbole/media spans ("dying for a cigarette", "social suicide") that suppress overlapping matches — keeps the false-positive rate low. |
| `crisis.ts` | `routeCrisis(route)` → `CrisisFlow` | WP7.2 scripted crisis flows. Total over (riskClass × tier × vertical). Verbatim copy only — the LLM never generates it. Night-safe; alcohol verticals carry the E17 "do not suddenly stop" warning. |
| `resources.ts` | `ALL_RESOURCES` | UK crisis resources (999/111/Samaritans/Shout/Domestic Abuse Helpline/NSPCC/Childline/Drinkline). Mirrored verbatim by `apps/crisis-static`. |
| `queue.ts` | `openCase` / `claimCase` / `releaseCase` / `closeCase` / `listQueue` | WP7.3 escalation queue over `core.escalation_case`. Tier-driven SLA clocks; guarded state transitions (closed is terminal → immutable audit); `escalation.opened`/`closed` published via `@preventos/events`. |

## Measured performance (against the 843-case corpus, see `tools/red-team`)

- tier-1 recall **1.00** (gate: ≥ 0.95) · tier-0 false positives **0.0%** · p95 **< 1 ms** (gate: < 500 ms)
- the corpus + jailbreak scenarios run in CI via `@preventos/red-team` and are release-blocking

## What this package does *not* do

It does not call an LLM, and nothing here is configurable in a way that could weaken
detection. Crisis copy is fixed strings; the only "routing" is a deterministic switch on
risk class, tier, and vertical.
