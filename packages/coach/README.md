# @preventos/coach — the guardrailed AI coach (WS6)

The policy-enforcement proxy that sits between the app and the LLM. The model is
never trusted and never load-bearing for safety: a deterministic rail wraps
every call.

```
runCoachTurn(input, deps)

  deterministic PRE-FILTER  ── @preventos/safety-core classify() (843-case validated)
        │
        ├─ tier 1 / tier 2 ─▶  scripted crisis flow (routeCrisis)   LLM BYPASSED
        │                       caller opens an escalation case
        │
        └─ tier 0 ──────────▶  buildFrame() spotlights the user text
                                 │
                                 ▼   CoachLlmProvider port (Claude, or Fake in tests)
                                 │
                         deterministic POST-FILTER ── classify(output) + claims register
                                 │
                                 ├─ violation ─▶ scripted safe substitute
                                 ├─ error/timeout ─▶ scripted fallback (fail closed)
                                 └─ clean ─▶ the model's reply
                                 │
                                 ▼
                         100% logging (always, before returning)
```

## Why this shape

Current guardrail research (OWASP **LLM01:2025**, Microsoft spotlighting, the
Wallace et al. instruction hierarchy) is unanimous that prompt- and
classifier-level LLM guardrails are **probabilistic** and get bypassed within
weeks. So they are *defence in depth* here, never the control of record:

- **The deterministic pre-filter is the safety control.** It is the same
  classifier validated at tier-1 recall 1.00 over 843 cases, runs before the
  model, and takes no bypass parameter. Tier 1 **and** tier 2 skip the LLM
  entirely (CLAUDE.md invariant 1: the LLM never handles risk content).
- **The LLM is sandboxed behind the port.** It sees only a minimised, PII-free
  context and a spotlighted (delimited, instruction-hierarchy-marked) copy of
  the user text — never the data layer, never raw identifiers.
- **The post-filter re-runs the safety classifier on the model's own output**
  and enforces the governed claims register (WP10.10, invariant 5) under the
  `coach-fences` scope — no sleep-treatment claims, no alcohol detox guidance,
  no medical / dosing / guarantee language. Raw output is buffered and inspected
  in full before any of it can reach the user; streaming to the client happens
  later, over already-filtered text.
- **Fail closed.** A provider error or a blocked output never leaks — a scripted,
  claim-safe message is substituted. A logging failure fails the whole turn:
  there is no un-logged success.

## Ports (injected by `apps/api`)

| Port | Production | Tests / no-key |
|------|------------|----------------|
| `CoachLlmProvider` | `ClaudeCoachProvider` (official `@anthropic-ai/sdk`, model `claude-opus-4-8`, `COACH_MODEL`-overridable) | `FakeCoachProvider` (deterministic, records calls) |
| `CoachLogSink` | db-backed writer → `core.coach_interaction` | in-memory recorder |
| `claimsFences` | compiled `compliance/claims/claims-register.json` | same, loaded in the test |

The Claude adapter is dormant without `ANTHROPIC_API_KEY` (the API falls back to
the fake provider), so CI and local runs never spend money. This package has no
db dependency; a lint boundary keeps the Anthropic SDK importable only here
(the "sole LLM path").
