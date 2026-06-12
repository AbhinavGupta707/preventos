# Clinical reviewer brief & engagement pack — WP10.1

> **DRAFT — 2026-06-12 — not yet sent to any reviewer.**
> Owner action: select reviewer(s), adapt the engagement letter (§7), send.
> Gate: G3 (clinical sign-offs). Plan refs: `IMPLEMENTATION_PLAN.md` §6, E12, E16, E17.

## 1. What PreventOS is (one paragraph for a candidate reviewer)

PreventOS is a consumer behaviour-change app (iOS, Android, web) launching four programmes in
one product: smoking cessation ("QuitKit"), adult vaping cessation ("Exhale"), alcohol
moderation/reduction ("Steady"), and sleep improvement ("Nightshift"). It combines structured
behaviour-change content, just-in-time prompts, validated self-report instruments, and a
guardrailed AI coach. It is a wellbeing product, not a medical device: deterministic crisis
detection runs before any AI involvement, alcohol dependence indicators trigger a hard stop
with referral to local services, and the sleep programme makes no insomnia-treatment claims.
**Nothing reaches a real user without a recorded clinical sign-off** — that sign-off is what
we are engaging you to provide.

## 2. What needs clinical review (the four packages)

Each programme ships a reviewable package: (a) all user-facing content atoms, (b) the
behavioural rules that select and sequence them, (c) instrument choice and result wording,
(d) escalation/safety deltas. Shared safety infrastructure (crisis lexicon, escalation flows,
coach guardrails) is reviewed once, with the first package.

| # | Package | Distinctive review load | Est. relative effort |
|---|---------|------------------------|----------------------|
| 1 | **QuitKit (smoking)** + shared safety backbone | Reduction scheduler; NRT usage-technique coaching (adherence support only — verify no prescribing drift); crisis flows; risk lexicon | ████ (largest first-pass: includes shared backbone) |
| 2 | **Exhale (vaping, 18+)** | Nicotine-strength step-down ladders; puff-budget plans; dual-user routing; appearance/performance framing (no disease-scare) | ██ (reuses ~60% of QuitKit patterns) |
| 3 | **Steady (alcohol)** | **AUDIT severity laddering and the dependence hard-stop criteria (E17)** — the single highest-stakes review item outside sleep; referral scripts; DV/safeguarding lexicon elevation; UK unit maths result wordings | ███ |
| 4 | **Nightshift (sleep)** | **Sleep-window titration algorithm: weekly adjustment rules, efficiency thresholds, window floors, occupation safety screens (excessive-daytime-sleepiness occupations)** — reviewed against hand-computed vectors you sign; wellbeing-framing audit of all copy | ████ (heaviest single item: the titration parameter sheet) |

Cross-cutting items reviewed alongside the packages (clinical parameter sheet, WP10.3):
notification burden budget, escalation SLA model, risk-corpus thresholds, outcome wordings.

## 3. What sign-off means (scope and record)

- You review the package against the checklist we provide per pack; you may require changes;
  iterations continue until you sign.
- Sign-off is recorded per content-pack version in `compliance/sign-off-registry.yaml`
  (name, date, version hash, scope notes). Releases are pipeline-blocked without it.
- Sign-off scope is **content and parameter accuracy/safety**, not product liability —
  the engagement letter (§7) bounds this explicitly. TBD(legal): indemnity/insurance wording.
- Changed content requires re-sign-off of the changed atoms only (delta review), not the pack.

## 4. Proposed schedule (staggered — matches build milestones)

| Window | Review activity | Feeds gate |
|--------|----------------|------------|
| Weeks 1–2 of engagement | Shared safety backbone + clinical parameter sheet first pass | G1/G3 |
| + weeks 2–4 | QuitKit pack | G3(smoking) — beta stagger group 1 |
| + weeks 4–5 | Exhale pack | G3(vaping) — beta stagger group 1 |
| + weeks 5–7 | Steady pack incl. hard-stop criteria | G3(alcohol) — beta stagger group 2 |
| + weeks 7–10 | Nightshift pack incl. titration vectors | G3(sleep) — beta stagger group 3 |

A programme whose sign-off lags is feature-flagged off; it does not block the others.

## 5. One reviewer or two? (owner decision)

**DECISION REQUIRED: single reviewer vs. two reviewers.** The plan's risk register rates
4× sign-off volume as the dominant schedule risk. Recommendation: **two reviewers** —
(a) a smoking-cessation/addictions specialist covering QuitKit, Exhale, Steady (shared
BCT backbone, alcohol experience essential for the hard-stop criteria), and (b) a
behavioural sleep medicine specialist (CBT-I experience) solely for Nightshift titration
and sleep content. This parallelises the two heaviest items. A single reviewer with both
addictions and sleep credentials is acceptable if available — expect ~10 weeks elapsed.

Reviewer profile checklist (per reviewer):
- [ ] UK-registered clinician (GMC/NMC/HCPC) or accredited health psychologist — TBD(owner): required registration level
- [ ] Behaviour-change / addictions experience (packages 1–3) or behavioural sleep medicine (package 4)
- [ ] Comfortable signing named, versioned approvals
- [ ] No conflicting commercial interest in a competing product

## 6. Volume estimate (for fee negotiation)

VERIFY against actual pack sizes once content drafting (V.1c–V.4c) completes. Working
estimate: 250–400 content atoms per pack, ~30–60 min review per 20 atoms after the first
pack's calibration, plus the parameter sheet (≈2–4 hours) and titration vectors (≈4–8 hours
including hand-computation checks). Rough total: **40–70 reviewer-hours across both reviewers.**
TBD(owner): budget envelope and hourly/fixed-fee structure.

## 7. Engagement letter skeleton (adapt and send)

> Dear [name] — We are building PreventOS, a four-programme behaviour-change app
> (smoking, adult vaping, alcohol, sleep). We are seeking a clinical reviewer to review and
> sign off [packages per §5] over approximately [window per §4]. Review means: [scope per §3].
> Materials arrive as structured packages with checklists; iterations are expected and budgeted.
> Compensation: [TBD(owner)]. Named sign-off is recorded in our compliance registry and
> release pipeline; your sign-off covers content accuracy and safety appropriateness, not
> product liability. Could we arrange a 30-minute call to discuss scope?

## Sign-off block (for this brief itself)

| Role | Name | Date | Decision |
|------|------|------|----------|
| Owner | TBD | TBD | adopt / amend |
