# UK GDPR Article 9 analysis — WP10.6

> **DRAFT — 2026-06-12.** Legal review required before adoption (TBD(legal) throughout).
> Gate: G4. Referenced by all three DPIAs.

## 1. Is this special category data? Yes — squarely.

Smoking/vaping/alcohol consumption records, sleep diaries, instrument scores (AUDIT, HSI,
SCI, PHQ-2/GAD-2), craving/lapse logs, and wearable sleep data are all **data concerning
health** (Art. 4(15) read with Recital 35 — past, current or future physical or mental
health status). We do not rely on any "it's lifestyle data, not health data" argument:
behaviour-change context makes the health character explicit (a drink diary inside an
alcohol-reduction programme is a health record even if the same data elsewhere might not be).

## 2. Conditions considered

| Condition | Verdict | Reasoning |
|-----------|---------|-----------|
| **Art. 9(2)(a) — explicit consent** | **Adopted (primary, for all programme processing)** | Direct-to-consumer wellbeing product; users self-enrol; granular per-purpose consent is already the build design (WP1.3). No power imbalance (not employer/state-mediated at launch — re-examine if commissioned cohorts arrive). |
| Art. 9(2)(h) — health/social care | Rejected | Requires processing by/under responsibility of a professional under obligation of secrecy (DPA 2018 s.11). PreventOS is explicitly non-clinical; no treatment relationship exists. |
| Art. 9(2)(d) — not-for-profit body | Not applicable | Commercial product. |
| Art. 9(2)(j) — research | Not applicable at launch | Evidence dashboard is service analytics on pseudonymised + k≥5 data under the consent purposes; if formal research/MRT publication is pursued, revisit with DPA 2018 Sch. 1 Pt 1 para 4 conditions. |
| **Art. 9(2)(c) — vital interests** | **Reserved (crisis path only)** | If a crisis escalation must proceed when consent is impossible/withdrawn, vital-interests is the fallback for that minimal processing. Documented as exceptional, not routine. TBD(legal): confirm framing for the escalation audit carve-out. |

## 3. Explicit-consent quality requirements → build obligations

For 9(2)(a) to hold, consent must be explicit, specific, informed, freely given, withdrawable:

1. **Separate, affirmative statement per purpose** (not bundled with ToS acceptance) —
   WP1.3 ledger purposes: per-programme processing · cross-vertical screening/cross-enrolment
   offers · AI coach · wearable data (per datatype) · analytics. Each is independently
   declinable and the product degrades gracefully (coach-off and wearables-off paths exist).
2. **Plain language at the point of collection** — onboarding copy obligation (WP2.2).
3. **Withdrawal as easy as grant** — in-app consent centre, immediate effect (WP1.3
   acceptance: revoked purpose blocks dependent action — already a test).
4. **Records** — the consent ledger is itself the Art. 7(1) demonstration record.
5. **No detriment for declining** non-essential purposes — declining analytics/coach/wearables
   never blocks programme content.

## 4. Associated obligations checklist

- [ ] Appropriate Policy Document: VERIFY(legal) — strictly required for several DPA 2018
  Sch. 1 conditions; not for 9(2)(a) — but drafting one is cheap and we should. TBD(legal).
- [ ] Art. 30 record of processing activities — seed from the DPIA processor register.
- [ ] Transfers: IDTA/UK addendum per non-UK processor. Current beta register:
  `processor-register.md`.
- [ ] Children: consumer beta is 18+; Exhale age gate is additionally store-policy-driven.
- [ ] ICO registration (data protection fee) — TBD(owner): pay before processing real users.

## Sign-off block

| Role | Name | Date | Decision |
|------|------|------|----------|
| Legal reviewer | TBD | TBD | confirm / amend condition mapping |
| Owner | TBD | TBD | adopt |
