# DPIA — PreventOS core platform — WP10.6

> **DRAFT SCAFFOLD — 2026-06-12.** Structure follows the ICO DPIA template (UK GDPR).
> Known facts are filled from the plan of record; every blank is role-tagged. Gate: G4.
> Companion DPIAs: `dpia-llm-coach.md` (AI coach), `dpia-wearables.md` (HealthKit/Health Connect).
> Lawful-basis detail: `article-9-analysis.md`.

## Step 1 — Identify the need for a DPIA

PreventOS processes **health-related special category data** (smoking, vaping, alcohol use,
sleep patterns, mood/anxiety screen results) at scale, profiles users to time interventions
(JITAI), and uses an LLM coach. Three ICO screening criteria are met (special category data;
systematic profiling/automated decision-making with significant effect on behaviour; data
concerning vulnerable-state users). A DPIA is mandatory.

## Step 2 — Describe the processing

**Nature.** Users self-enrol in behaviour-change programmes. Consumer beta scope is adult
QuitKit + Exhale only; Steady and Nightshift remain internal/blocked unless separately
reviewed. We collect:
- Account: email, auth identifiers (processor: Clerk).
- Programme data (special category — health): intake instrument responses (HSI/TTFV for
  the beta; AUDIT/SCI only in internal or later programme scopes), cravings/urges, lapse
  events, plans.
- Derived: risk windows, decision records, progress/savings estimates. Sleep metrics and
  alcohol dependence indicators are not public beta functionality.
- Usage events: append-only event stream (Postgres); first-party product analytics for beta
  unless a third-party analytics processor is explicitly approved.
- Device: push tokens (processor: Expo), platform, app version.

**Architecture controls (built, not aspirational):** pseudonymisation boundary at the
persistence layer (WP1.2); append-only event store; per-purpose consent ledger gating every
dependent action (WP1.3); analyst access k≥5 aggregate-only (WP1.5); crisis content available
offline without any data flow (E13).

**Scope.** TBD(owner): launch-volume estimate. Plan load target: 25k users.
**Context.** Adults; self-selected; some in vulnerable states (alcohol dependence indicators
→ hard stop + referral, no further programme processing). Exhale is 18+ age-gated.
Platform-wide consumer beta minimum age is 18+; Children's Code conformance is deferred with
the youth mode.
**Purposes.** Deliver the programmes; time interventions; measure outcomes; safety escalation;
service analytics. No advertising, no data sale, no third-party marketing.

## Step 3 — Consultation

TBD(owner): user consultation approach (beta cohort survey is the natural vehicle).
TBD(owner): DPO appointment or Art. 27-equivalent advice source — **DECISION REQUIRED:**
formal DPO vs. external advisor (we likely do not strictly require a DPO but the processing
profile sits close to the line; recommend external advisor at minimum).

## Step 4 — Necessity and proportionality

- Lawful bases: UK GDPR Art. 6(1)(a) consent + Art. 9(2)(a) explicit consent — full analysis
  in `article-9-analysis.md`. Consent is per-purpose, granular, withdrawable in-app.
- Data minimisation: programme data only for enrolled programmes; cross-vertical screens are
  2 items, signpost-only for mood/anxiety; wearables off by default (see wearable DPIA).
- Retention: use `retention-deletion-schedule.md` for beta. Primary deletion/anonymisation
  target is 30 days, with backup expiry and safety/security/legal carve-outs disclosed.
  **DECISION REQUIRED(legal): confirm periods.**
- Rights: in-app export (machine-readable) and deletion (WP1.3) with documented audit
  carve-outs (escalation/safety records); no fully-automated decisions with legal effect —
  JITAI affects message timing/content, user can disable proactive contact per purpose.

## Step 5 — Identify and assess risks

| # | Risk | Likelihood | Severity | Initial rating |
|---|------|-----------|----------|----------------|
| R1 | Breach exposing health behaviours (stigma, employment, relationship harm) | possible | severe | **high** |
| R2 | Re-identification of pseudonymised analytics | possible | significant | medium |
| R3 | Push notification content leaks programme membership on lock screen | probable | significant | **high** |
| R4 | Third-party processor breach or onward use (Clerk, Expo, LLM, host, support tooling — see processor register and LLM DPIA) | possible | severe | **high** |
| R5 | Vulnerable user (dependence/crisis) data mishandled in escalation | unlikely | severe | medium |
| R6 | International transfers (US processors) without valid safeguards | possible | significant | medium |
| R7 | Consent fatigue → invalid consent quality | possible | significant | medium |

## Step 6 — Measures to reduce risk

| Risk | Measures (build refs) |
|------|----------------------|
| R1 | Pseudonymisation boundary (WP1.2); encryption at rest + TLS; UK-region hosting (E14); RBAC + TOTP for staff (WP1.5); security baseline audit (WP9.3) |
| R2 | k≥5 suppression enforced in query layer (WP1.5); payload privacy audit (WP8.2) |
| R3 | Neutral notification copy by default (no programme names on lock screen) — **carry into WP2.5 acceptance criteria**; user-controllable detail level |
| R4 | DPAs + transfer addenda with all processors (TBD(legal): execute); processor register below; LLM-specific controls in LLM DPIA |
| R5 | Deterministic crisis flow, minimal data to escalation handlers, SLA-tracked queue (WP7.3), audit trail (WP9.2) |
| R6 | IDTA/UK addendum per US processor; document per-processor in register — TBD(legal) |
| R7 | Layered consent UX: value-first onboarding, per-purpose toggles, plain-language purposes (WP1.3/WP2.2) |

**Processor register:** `processor-register.md` is the current beta register. It blocks
third-party analytics and wearable data import unless separately approved.

## Step 7 — Sign-off

| Item | Name/role | Date | Outcome |
|------|-----------|------|---------|
| Measures approved by | TBD(owner) | | |
| Residual risks accepted by | TBD(owner) | | |
| DPO/advisor advice | TBD | | |
| Review date | launch − 4 weeks, then annually | | |
