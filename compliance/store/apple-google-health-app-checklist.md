# Apple and Google Health-App Checklist — WP10.7/G5

> **DRAFT — 2026-06-18.** Official policy sources checked on 2026-06-18.
> Store policies change; re-check these links immediately before submission.

## Sources checked

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play Data Safety form guidance: https://support.google.com/googleplay/android-developer/answer/10787469
- Android Health Connect get-started/publishing guidance: https://developer.android.com/health-and-fitness/health-connect/get-started

## Cross-store decisions

| Item | Beta answer | Evidence needed |
|------|-------------|-----------------|
| Beta channel | iOS: TestFlight. Android: internal/closed testing before production. | Track chosen and reviewer notes prepared. |
| App category | Health/Fitness or equivalent wellbeing category, not Medical unless legal chooses that posture. | Store metadata screenshots. |
| Audience | Adults 18+ only. | Age gate, age-rating questionnaire, no child-directed copy. |
| Enabled programmes | QuitKit + Exhale only. | Feature flags and screenshots. |
| Medical posture | No diagnosis, no treatment, no medical-device status, no emergency care. | Store copy, onboarding, terms, reviewer notes. |
| Health data permissions | No HealthKit or Health Connect permissions in beta. | Binary permission review. |
| Ads/marketing | No ads, no sale of health data, no health-data marketing profiles. | SDK inventory and privacy policy. |
| Account deletion | In-app and public web deletion request path. | URL and app settings screenshot. |
| Support contact | Public support URL/email shown in store and app. | Active URL and monitored inbox. |
| Notifications | Permission prompt only after in-app primer; delivery disabled until provider approval. | Device test showing prompt choreography and API token registration; `PUSH_PROVIDER=noop` until delivery is approved. |

## Apple App Store / TestFlight

| Area | Checklist |
|------|-----------|
| Beta testing | Use TestFlight for beta distribution. Apple states demos/betas/trials do not belong on the App Store, while TestFlight builds should still be intended for public distribution and comply with App Review Guidelines. |
| App completeness | Provide a full demo account or demo mode, live backend, review notes for non-obvious features, and no placeholder metadata. |
| Accurate metadata | Metadata, screenshots, privacy information, and previews must match the enabled QuitKit + Exhale experience; no hidden or dormant public features. |
| Physical harm | Avoid inaccurate health information and remind users to check with a doctor before medical decisions. Do not encourage tobacco/vape use, minors' use, or excessive alcohol. |
| Privacy policy | Link the privacy policy in App Store Connect and in-app; it must identify data collected, use, third parties, retention/deletion, consent withdrawal, and deletion requests. |
| Third-party AI | Clearly disclose any third-party AI data sharing and obtain explicit permission before coach data leaves PreventOS. |
| Health data | Health/fitness/medical data cannot be used for advertising, marketing, or data mining. If HealthKit is ever enabled, disclose specific device data and do not store personal health information in iCloud. |
| Account deletion | Apps with account creation must offer account deletion in the app. |
| Legal entity | Healthcare/sensitive-data apps should be submitted by a legal entity that provides the service, not an individual developer. |

## Google Play

| Area | Checklist |
|------|-----------|
| User Data policy | Disclose access, collection, use, handling, and sharing of user data; limit use to app/service functionality reasonably expected by the user. |
| Personal and sensitive data | Treat health data, Health Connect data, authentication data, device IDs, and app usage data as personal/sensitive where applicable. |
| Secure handling | Transmit data over modern cryptography and do not sell personal or sensitive user data. |
| Prominent disclosure | If collection may not be reasonably expected, show in-app disclosure in the normal flow, describing data, use, and sharing. It cannot live only in the privacy policy or terms. |
| Consent | Consent must be clear, affirmative, non-expiring, and granted before collection/access. Runtime permission prompts must follow the disclosure. |
| Privacy policy | Publish an active, public, non-geofenced HTML privacy policy and link it in Play Console and in-app. It must include developer info, data categories, parties shared with, security, retention, and deletion policy. |
| Data Safety | Complete the form for closed/open/production tracks. Internal-only tracks are exempt, but complete before any broader testing. Ensure it matches the privacy policy and actual SDK/binary behaviour. |
| Account deletion | Provide in-app and web account deletion request paths; deleting an account must delete associated user data unless a clearly disclosed legitimate retention reason applies. |
| Health Connect | If later enabled, declare permissions in the manifest that match Play Console data-type declarations and provide the required permission-rationale activity/privacy policy link. |

## Google Play Data Safety draft answers

These are draft answers for the QuitKit + Exhale beta only. Re-run after a binary
permission/SDK review.

| Data type | Collected? | Shared? | Purpose | Notes |
|-----------|------------|---------|---------|-------|
| Email address / User IDs | Yes | Service providers only | Account management, app functionality | Clerk/auth provider once enabled. |
| Health info | Yes | Service providers only | App functionality, analytics if consented | Smoking/vaping programme records, cravings, questionnaire responses. |
| Fitness info | No | No | Not used | No HealthKit/Health Connect beta. |
| App interactions | Yes if analytics consented | Service providers only if analytics processor approved | Analytics, app functionality | Prefer first-party only. |
| Diagnostics | TBD | TBD | App performance | Depends on crash reporting SDK. |
| Device or other IDs | Yes for push/auth where needed | Service providers only | App functionality, notifications | Expo push tokens are registered only after permission and consent; no advertising ID use. |
| User-generated content | Yes | Service providers only | App functionality | Plans and coach messages. |

## Final pre-submit gate

- [ ] Run claims register check on final store title, subtitle, description,
      screenshots, reviewer notes, and in-app legal copy.
- [ ] Confirm no HealthKit/Health Connect permissions in the submitted beta binary.
- [ ] Confirm no ad SDK, tracking SDK, or unapproved analytics SDK in the binary.
- [ ] Confirm privacy policy, support URL, and deletion URL are live.
- [ ] Confirm all processor/register entries match App Privacy and Data Safety labels.
- [ ] Confirm notification copy, quiet-hours policy, and delivery provider are
      approved before switching worker delivery away from `noop`.
