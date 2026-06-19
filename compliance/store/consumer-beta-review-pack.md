# Consumer Beta Store Review Pack — WP10.7/G5

> **DRAFT — 2026-06-18.** Store-review positioning for a consumer beta that does
> not claim formal clinical sign-off. This pack is for owner/legal adoption and
> App Store / Google Play reviewer notes. It does not approve product code or
> content for real users by itself.

## Recommended beta wedge

Ship **QuitKit + Exhale for adults (18+)** as the consumer beta wedge.

Do not enable Steady or Nightshift publicly for this beta. They can remain in
internal testing only, behind feature flags or unavailable navigation, until the
blockers below are closed.

## Store posture

PreventOS should be described as:

- a consumer wellbeing and habit-support app;
- for adults who already smoke or vape and want support to quit, reduce, or plan;
- opt-in, consent-led, and usable without AI coach or analytics;
- not a medical service, not emergency care, and not a regulated medical device.

PreventOS should not be described as:

- diagnosing, treating, curing, or preventing any disease or condition;
- clinically proven, clinician-approved, MHRA/UKCA/CE/FDA cleared, or equivalent;
- providing alcohol detox, withdrawal support, medication instructions, or sleep
  treatment;
- monitored live by clinicians or emergency responders.

## Required reviewer-note summary

Use this as the starting point for App Store Connect and Play Console reviewer
notes:

> PreventOS is an 18+ consumer wellbeing app for smoking and adult vaping habit
> support. This beta enables QuitKit and Exhale only. Alcohol and sleep features
> are disabled for public beta while further clinical/legal review is pending.
> The app is not a medical device, does not diagnose or provide medical care, and
> is not an emergency service. Users are told to consult a qualified health
> professional for symptoms, medications, nicotine replacement products, alcohol
> withdrawal, sleep concerns, or any health concern. The optional AI coach runs
> behind deterministic safety filters; tier-1 safety content bypasses the LLM and
> routes to scripted resources. HealthKit and Health Connect are not requested in
> this beta build.

Add the exact demo account, backend status, support URL, privacy URL, and any
feature flags to the final submission notes.

## User-facing disclaimer set

The canonical disclaimer language lives in
`compliance/claims/consumer-beta-disclaimers.md`. At minimum, show it in:

- store description or "What to know" section;
- onboarding/terms acceptance;
- AI coach first-run screen;
- crisis/safety screens;
- settings/about/legal.

## Enabled features

| Feature | Beta status | Notes |
|---------|-------------|-------|
| Adult age gate | Required | Must be visible before Exhale enrolment. |
| QuitKit onboarding and quit/reduction planning | Enabled after owner/legal adoption | Avoid outcome guarantees and disease-prevention claims. |
| Craving SOS and plan repair | Enabled | Offline-capable support, not emergency care. |
| Exhale adult vaping support | Enabled | Existing adult vapers only; no youth targeting or product promotion. |
| Savings/progress tracking | Enabled | User-entered estimates only; no financial guarantees. |
| Optional AI coach | Conditional | Requires processor/transfer review and clear AI/non-clinician disclosure. |
| Push reminders | Conditional | Token registration is implemented behind proactive-contact consent; delivery remains disabled until provider credentials, quiet-hours policy, monitoring, and neutral lock-screen copy are approved. |
| First-party analytics | Conditional | Requires analytics consent and matching store labels. |

## Blocked features

| Feature | Blocker |
|---------|---------|
| Youth vaping | Children's Code/safeguarding model, age ratings, parental/privacy decisions. |
| Steady public alcohol moderation | Dependence/withdrawal safety, clinical/legal owner acceptance, store physical-harm risk. |
| Alcohol detox or withdrawal advice | Hard blocked. Must route to professional/emergency support, not in-app guidance. |
| Nightshift public release | Sleep titration, safety-screen constants, treatment-claim risk, clinical parameter review. |
| HealthKit / Health Connect | Not needed for beta; wearable DPIA and store health-permission review open. |
| Medication or NRT dosing recommendations | Professional advice only; app may signpost and support adherence/technique after review. |
| Live clinical monitoring or SLA promises | Staffing and coverage are not arranged. |
| Formal research claims or compensation for TestFlight participation | Ethics/store review issues; out of beta scope. |

## Launch-blocking owner/legal items

- [ ] Controller legal entity, privacy contact, support URL, deletion URL.
- [ ] Privacy policy published as HTML, not PDF, and accessible in-app.
- [ ] Terms updated with no-medical-device, no diagnosis, no emergency-care, and
      consult-professional clauses.
- [ ] Processor DPAs, transfer safeguards, and AI provider retention verified.
- [ ] App Store privacy nutrition labels completed from actual binary/SDKs.
- [ ] Google Play Data Safety completed from actual binary/SDKs.
- [ ] Age rating answers reflect 18+ smoking/vaping habit-support content.
- [ ] Store screenshots show only enabled QuitKit + Exhale beta surfaces. Do
      not use public Steady/Nightshift pages or screenshots unless the owner
      explicitly approves those gated programmes for the store listing.
- [ ] Feature flags prevent Steady, Nightshift, wearable import, and high-risk
      claims from appearing to public beta users.
- [ ] Push provider credentials, notification copy, quiet-hours policy, and
      monitoring are approved before enabling notification delivery beyond
      `PUSH_PROVIDER=noop`.
- [ ] Claims register check run on all store listing copy before submission.
