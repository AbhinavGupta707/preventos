# @preventos/safety-core — the pure, db-free safety classifier (W3-SAFEPORT)

The deterministic safety rail with **zero I/O dependencies**. This package holds the
843-case-validated classifier, the lexicon, the idiom guards, and the scripted crisis
routing — everything that is a pure function of its input. It depends only on
`@preventos/domain`, so it can be imported by **mobile (Expo/Metro), web, the API, and the
coach policy-proxy** alike: one validated classifier, used everywhere (CLAUDE.md safety
invariant 1).

The db-backed escalation **queue** (`openCase`/`claimCase`/…, which writes
`core.escalation_case` and publishes events) stays in `@preventos/safety`, which re-exports
everything here for backward compatibility. A lint boundary (eslint.config.mjs) forbids this
package from importing `@preventos/db`, `@preventos/events`, `drizzle-orm`, or `pg` — that is
what keeps it bundler-safe for the mobile client.

## Modules

| Module | Export | Purpose |
|--------|--------|---------|
| `normalize.ts` | `normalize(text)` | De-obfuscation view: joins spaced-out runs (`k i l l`), maps leet (`su1cide`), strips censor chars (`k*ll`), folds homoglyphs. Number-semantic tokens (`45yo`, `999`) preserved. |
| `classify.ts` | `classify(text)` → `RiskAssessment` | Tiered classification (tier 1 = deterministic crisis, LLM bypassed; tier 2 = human review; tier 0 = none). Takes only the text — no bypass parameter. Returns matched `ruleId`s for the audit trail. |
| `lexicon/` | `ALL_RULES` | Six category rule sets, each tier 1/2 with `requiresAll` / `unless` context guards. |
| `guards.ts` | `GUARDS` | Idiom/hyperbole/media spans that suppress overlapping matches. |
| `crisis.ts` | `routeCrisis(route)` → `CrisisFlow` | Scripted crisis flows, total over (riskClass × tier × vertical). Verbatim copy only. |
| `resources.ts` | `ALL_RESOURCES` | UK crisis resources, mirrored verbatim by `apps/crisis-static`. |

## Measured performance (against the 843-case corpus, see `tools/red-team`)

tier-1 recall **1.00** (gate ≥ 0.95) · tier-0 false positives **0.0%** · p95 **< 1 ms**.
