# Consumer Beta Privacy Decisions — WP10.6/G4

> **DRAFT — refreshed 2026-06-18.** This is a consumer-beta decision pack, not
> legal advice and not a claim of formal clinical sign-off. It must be adopted by
> the owner and legal reviewer before any real-user beta. Adoption is recorded in
> `compliance/sign-off-registry.yaml`.

## Beta posture

Recommended consumer beta: **adults only, QuitKit + Exhale only**.

PreventOS should present the beta as consumer wellbeing and habit support. It
must not present itself as medical care, a regulated medical device, diagnosis,
emergency support, treatment, or a replacement for professional advice.

## Decisions for beta

| Area | Beta decision | Remaining blocker |
|------|---------------|-------------------|
| Controller | TBD(owner: legal entity) is the controller and must appear in the policy, store listing, support URL, and Play Console/App Store Connect metadata. | Owner/legal entity details, address, privacy contact, ICO registration. |
| Age | 18+ only. Youth vaping is out of scope. | Owner confirms age-rating answers and no child-directed metadata. |
| Enabled programmes | Public beta enables adult smoking and adult vaping support. | Owner records beta scope in sign-off registry. |
| Blocked programmes | Steady and Nightshift stay internal/feature-flagged unless separately reviewed. | Alcohol and sleep blockers in `compliance/store/consumer-beta-review-pack.md`. |
| Lawful basis | UK GDPR Art. 6 consent and Art. 9 explicit consent for programme processing. Vital interests reserved only for minimal crisis/safety processing. | Legal reviewer confirms basis and withdrawal wording. |
| Consent granularity | Separate affirmative consent for programme delivery, proactive contact, AI coach, analytics, and any future wearable import. | Consent screens must match this list exactly. |
| AI coach | Optional. Fireworks or Anthropic may process pseudonymous coach prompts only after DPA/transfer checks. Tier-1 risk text bypasses the LLM. | Provider contract terms, retention, no-training terms, and transfer safeguards. |
| Analytics | First-party product analytics only for beta unless PostHog or another processor is explicitly approved. No ads, no pixels, no SDK marketing profiles. | Data Safety/App Privacy labels must match actual SDKs in the submitted binary. |
| Wearables | No HealthKit or Health Connect import in the QuitKit + Exhale consumer beta. Future Nightshift/wearable use needs the wearable DPIA reopened. | Store permission manifests must not request health permissions until enabled. |
| Push | Push notifications are optional and should use neutral lock-screen copy. | OS permission primer and proactive-contact consent must be in place. |
| Retention | Adopt `retention-deletion-schedule.md` as the beta schedule, subject to legal review. | Legal confirms retention periods and backup deletion wording. |
| Processors | Adopt `processor-register.md` as the processor/subprocessor source of truth. | DPAs, transfer addenda, and hosting choice. |
| Research | No health-related human-subject research, published trial, or MRT recruitment in consumer beta. Service analytics only. | Ethics review required before research positioning. |

## Data minimisation rules

- Collect only data needed for the enabled programme and selected consents.
- Do not collect raw location, contacts, microphone recordings, camera data,
  HealthKit data, Health Connect data, open-banking data, or employer data in the
  consumer beta.
- Do not send direct identifiers to the LLM provider. Coach prompts must be
  pseudonymous and scoped to the active session frame.
- Keep marketing leads structurally separate from programme users as described in
  `marketing-funnel-privacy-audit.md`.

## Blocked without stronger review

| Feature | Why blocked |
|---------|-------------|
| Youth/adolescent vaping | Children's Code, safeguarding, parental/privacy model, store age-rating complexity. |
| Alcohol reduction pathway for public beta | Dependence/withdrawal risk and no in-app detox pathway; needs clinical/legal owner acceptance. |
| Any alcohol detox, withdrawal, medication, or dependence support beyond referral | Safety invariant #4 and store physical-harm risk. |
| Nightshift public beta and sleep-window titration | Sleep treatment-claim and titration safety concerns; clinical parameter review needed. |
| HealthKit/Health Connect import | Store health-data rules, wearable DPIA open decisions, and no QuitKit/Exhale necessity. |
| Live human escalation promises | Staffing/SLA not arranged; app must not imply live monitoring. |
| Diagnosis, treatment, prevention, cure, clinical efficacy, or medical-device claims | No formal clinical/regulatory clearance. |
| Employer/insurer/commissioner individual reporting | Privacy firewall not needed for D2C beta and would materially change the DPIA. |
| Formal research or publication claims | Ethics review and research consent are not in place. |

## Adoption checklist

- [ ] Controller identity, address, privacy contact, ICO registration inserted.
- [ ] Legal reviewer adopts or amends the lawful-basis mapping.
- [ ] Processor DPAs and transfer safeguards completed.
- [ ] Retention/deletion schedule adopted and implemented in support processes.
- [ ] Store labels/forms checked against the submitted binary.
- [ ] Owner records a sign-off registry entry for this beta disclosure pack and
      the exact enabled programme scope.
