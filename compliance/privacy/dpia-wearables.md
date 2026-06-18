# DPIA — Wearable data (HealthKit / Health Connect) — WP10.6

> **DRAFT SCAFFOLD — 2026-06-12.** Extends `dpia-core.md`; covers the deltas from reading
> wearable/health-platform data (plan WP9.4, PRD §3.5). Gate: G4. Plan risk register names
> this explicitly ("Wearable-data privacy (Art. 9)").

## Step 1 — Need

Reading sleep and activity data from Apple HealthKit and Android Health Connect is
unambiguous special category processing of continuously-sensed health data. DPIA required.
Consumer beta note: QuitKit + Exhale do not need wearable import, so HealthKit/Health
Connect are **not enabled** for the consumer beta.

## Step 2 — Processing description

- **Data types if later enabled:** sleep stages/sessions and step counts only (corroboration of Nightshift
  diaries; activity context). No heart rate, no location, no workouts at launch — adding any
  datatype reopens this DPIA.
- **Design stance (load-bearing, from the plan):** *wearable-informed, not wearable-led.*
  Diary primacy: wearable data corroborates and never overrides the user's diary, never
  gates a pathway, and every feature works fully with wearables absent or revoked (WP9.4
  acceptance). Orthosomnia-aware de-escalation content addresses sensor-fixation harm.
- **Consent:** double-gated — OS-level permission (HealthKit/Health Connect) AND our own
  per-datatype consent purpose in the ledger (WP1.3). Either revocation stops ingestion.
- **Platform rules (constraints we inherit):** Apple/Google prohibit using health-platform
  data for advertising or sale, and restrict on-selling — our no-ads/no-sale posture already
  complies. VERIFY(legal): current HealthKit + Health Connect developer-policy texts at
  store-submission time (WP10.7 dependency).

## Step 4 — Necessity & proportionality

The product works without wearables (necessity is for *corroboration quality*, not core
function — stated honestly in the consent screen). Proportionality controls: two datatypes
only; read-only; ingestion windowed to enrolment-active periods; raw samples reduced to
nightly/daily aggregates at ingestion — **DECISION REQUIRED(owner): retain raw samples or
aggregates only? Recommend aggregates-only; carry into WP9.4 acceptance.**

## Step 5 — Risks

| # | Risk | Likelihood | Severity | Initial rating |
|---|------|-----------|----------|----------------|
| W1 | Continuous sensing reveals patterns beyond stated purpose (shift work, cohabitation changes) | possible | significant | medium |
| W2 | Deletion does not cascade to ingested wearable data | possible | severe | **high** |
| W3 | User misunderstands scope ("the app reads all my health data") → trust harm | probable | moderate | medium |
| W4 | Orthosomnia: data display worsens the sleep problem | possible | significant | medium |
| W5 | Platform-policy violation → store removal (availability harm to users) | unlikely | severe | medium |

## Step 6 — Measures

| Risk | Measures (build refs) |
|------|----------------------|
| W1 | Two datatypes only; aggregation at ingestion; no inference features beyond diary corroboration without a new DPIA pass |
| W2 | Deletion cascade across wearable-derived rows is a WP9.4 acceptance criterion — verified by test, not policy |
| W3 | Per-datatype consent screen lists exactly what is read, with live examples; settings show last-read timestamp per datatype |
| W4 | Diary primacy in UI; de-escalation content pack; option to hide wearable comparisons entirely |
| W5 | WP10.7 store-compliance review gates submission; policy texts re-verified each store submission |

## Step 7 — Sign-off

| Item | Name/role | Date | Outcome |
|------|-----------|------|---------|
| Measures approved by | TBD(owner) | | |
| Residual risk accepted by | TBD(owner) | | |
| Review trigger | any new datatype, any new inference use | | |
