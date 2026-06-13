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
| `CoachLlmProvider` | `FireworksCoachProvider` or `ClaudeCoachProvider` (selected by key — see below) | `FakeCoachProvider` (deterministic, records calls) |
| `CoachLogSink` | db-backed writer → `core.coach_interaction` | in-memory recorder |
| `claimsFences` | compiled `compliance/claims/claims-register.json` | same, loaded in the test |

`apps/api` picks the provider by configured key, in order:

| Key set | Provider | Default model (`COACH_MODEL`-overridable) |
|---------|----------|-------------------------------------------|
| `FIREWORKS_API_KEY` | `FireworksCoachProvider` (OpenAI-compatible, base `https://api.fireworks.ai/inference/v1`) | `accounts/fireworks/models/llama-v3p3-70b-instruct` |
| `ANTHROPIC_API_KEY` (and no Fireworks key) | `ClaudeCoachProvider` (official `@anthropic-ai/sdk`) | `claude-opus-4-8` |
| neither | `FakeCoachProvider` | — (deterministic, zero spend) |

Both adapters honour an optional per-request `LlmRequest.model`, so a frame can
route a simple turn to a cheaper/faster model and a complex one to a larger
model without changing the proxy. With no key the API falls back to the fake
provider, so CI and local runs never spend money. This package has no db
dependency; a lint boundary keeps the Anthropic SDK importable only here (the
"sole LLM path"), and the Fireworks adapter speaks plain HTTP behind the same
`CoachLlmProvider` port.

## MI-adherence eval (WP6.2)

`runMiEval({ provider, claimsFences })` runs the coach over a per-vertical
synthetic corpus (`MI_CORPUS`, ~28 tier-0 turns across smoking/vaping/alcohol/
sleep) through the full pre→LLM→post pipeline and judges each reply with a
deterministic motivational-interviewing rubric (`scoreMiAdherence`): brief, at
most one open question, reflect/affirm, no righting reflex, no shame. It returns
overall and per-vertical adherence rates plus the failing cases.

The CI gate (`test/mi-eval.test.ts`) runs it against the **Fake provider** (no
key, zero spend) and asserts overall adherence **≥ 90%**. The rubric is
calibrated at both ends: two in-corpus replies are deliberately sub-par (a
righting-reflex lecture, question-stacking) so the gate is a real floor, and the
`NON_ADHERENT_CONTROLS` (clearly non-MI replies) must score 0%. The same harness
scores a real provider — pass the Fireworks or Claude provider to `runMiEval` to
measure a live model with the identical yardstick.
