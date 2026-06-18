# DPIA — AI coach (LLM) — WP10.6

> **DRAFT SCAFFOLD — 2026-06-12.** Extends `dpia-core.md`; covers only the deltas introduced
> by the guardrailed LLM coach (plan WS6, E6, E7). Gate: G4.

## Step 1 — Need

The coach sends user conversation content — which routinely contains special category health
data and occasionally crisis-adjacent content — to a third-party LLM provider (Fireworks
when `FIREWORKS_API_KEY` is configured, or Anthropic when `ANTHROPIC_API_KEY` is configured
and Fireworks is absent) via an in-house policy-enforcement proxy. Novel-technology
processing of sensitive data on vulnerable-state users: DPIA required.

## Step 2 — Processing description (deltas)

- **Sole path:** all LLM traffic flows through the policy proxy (WP6.1). No client ever calls
  the provider directly. 100% of requests/responses logged (clinical audit trail, WP9.2).
- **What is sent:** session-frame context assembled server-side (WP6.2) — programme state,
  recent relevant entries, conversation turns. Pseudonymous coach identifiers only;
  direct identifiers (email, name) are stripped at the proxy boundary — **carry into WP6.1
  acceptance criteria: identifier-stripping test.**
- **What is never sent:** tier-1 risk content. Deterministic crisis detection runs pre-LLM
  and routes to scripted flows (safety invariant #1); the LLM is provably bypassed.
- **Provider terms:** VERIFY(legal) at contract time — API data not used for model training
  by Fireworks/Anthropic, current retention windows, and whether a zero-data-retention
  arrangement is available at our tier. **DECISION REQUIRED(owner):** standard retention
  vs. pursuing ZDR.
- **Transfers:** US/non-UK provider — IDTA/UK addendum or equivalent safeguard required.
  See `processor-register.md`.

## Step 4 — Necessity & proportionality (deltas)

- Distinct consent purpose: "AI coach" is its own consent grant (WP1.3); every programme is
  fully usable with the coach declined (deterministic content paths). Withdrawal kills the
  data flow immediately.
- Minimisation: context assembly sends the minimum frame for the session type, not the full
  history; logging is ours (the audit copy lives in our infrastructure, not the provider's).

## Step 5 — Risks (deltas)

| # | Risk | Likelihood | Severity | Initial rating |
|---|------|-----------|----------|----------------|
| L1 | Harmful/wrong coaching output (e.g. implied medical advice) | possible | severe | **high** |
| L2 | Prompt injection via user content exfiltrates context | possible | significant | medium |
| L3 | User over-discloses (third-party info, identifiers) into prompts | probable | significant | **high** |
| L4 | Provider-side retention/breach of conversation content | unlikely | severe | medium |
| L5 | Crisis content reaches the LLM due to detection miss | unlikely | severe | medium |
| L6 | Users treat coach as clinician (automation over-trust) | probable | significant | **high** |

## Step 6 — Measures

| Risk | Measures (build refs) |
|------|----------------------|
| L1 | Pre/post deterministic filters + vertical fences (no dosing, no treatment claims, no detox guidance — WP6.3, block recall ≥0.98 acceptance); MI-adherence eval ≥90% (WP6.2); red-team CI ratchet, release-blocking (WP7.4) |
| L2 | Post-filter on outputs; typed tool calls only (no free-form actions); context assembly is server-controlled — user text cannot alter frame policy |
| L3 | Identifier stripping at proxy; UI guidance not to share others' details; logs access-controlled under RBAC |
| L4 | Provider DPA + no-training term + retention minimisation (VERIFY above); only pseudonymous content crosses |
| L5 | Lexicon recall ≥0.95 acceptance (WP7.1) measured on expanded corpus; post-filter as second net; scripted-flow fallback on any safety-service error (fail-closed — **carry into WP6.1 acceptance**) |
| L6 | Persistent non-clinical framing in coach UI (WP2.6); coach self-identifies as not a medical professional; signposting built into session frames |

## Step 7 — Sign-off

| Item | Name/role | Date | Outcome |
|------|-----------|------|---------|
| Measures approved by | TBD(owner) | | |
| Residual risk accepted by | TBD(owner) | | |
| Review trigger | any provider/model/proxy-policy change | | |
