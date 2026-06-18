# Processor and Subprocessor Register — Consumer Beta

> **DRAFT — 2026-06-18.** Source of truth for beta privacy policy, App Store
> privacy labels, Google Play Data Safety, and DPIA Step 6. Legal must execute
> DPAs and transfer safeguards before real-user processing.

## Runtime processors

| Provider | Role | Data categories | Region/transfer | Beta status | Required action |
|----------|------|-----------------|-----------------|-------------|-----------------|
| TBD UK/EU cloud host | API, Postgres, web/app hosting, backups | Account, programme, consent, event, coach, safety, analytics data | Must be UK or EEA by default | **Blocked** until selected | Choose provider, DPA, security review, backup retention. |
| Clerk | Authentication provider behind auth port | Email, auth identifiers, session metadata | US/other; UK IDTA/Addendum likely needed | Planned, keys pending | Execute DPA/transfer terms; confirm deletion API and retention. |
| Expo | Push notification delivery and EAS project services | Push token, device/app metadata, notification payload | US/other; transfer safeguards needed | Planned for push | DPA/transfer review; enforce neutral notification payloads. |
| Fireworks AI | Primary LLM provider when `FIREWORKS_API_KEY` is set | Pseudonymous coach prompts/responses, model metadata | US/other; transfer safeguards needed | Optional, not active without key | Confirm no-training terms, retention window, DPA, deletion path. |
| Anthropic | Fallback LLM provider when `ANTHROPIC_API_KEY` is set and Fireworks is absent | Pseudonymous coach prompts/responses, model metadata | US/other; transfer safeguards needed | Optional fallback | Confirm no-training terms, retention window, DPA, deletion path. |
| TBD support mailbox/helpdesk | Privacy/support requests, deletion handling | Email, support messages, request metadata | TBD | **Blocked** until selected | Select low-data processor; publish support URL and privacy contact. |

## Not approved for beta unless separately added

| Provider/integration | Status | Reason |
|----------------------|--------|--------|
| PostHog or any third-party analytics SDK | Not approved for consumer beta | Current marketing audit is first-party only. Adding a third-party SDK changes privacy labels, transfers, and DPIA risks. |
| HealthKit / Apple Health import | Not enabled | Not needed for QuitKit + Exhale; wearable DPIA remains open for Nightshift. |
| Health Connect import | Not enabled | No Android health permissions should be requested in the beta binary. |
| Open-banking provider | Not enabled | Not in beta scope; high consent and financial-data burden. |
| SMS/voice CPaaS | Not enabled | Mobile/web app beta only unless release plan adds channel parity. |
| Sentry or crash analytics processor | Not selected | If added, disclose diagnostics/device data and execute DPA. |

## Platform parties outside the processor chain

Apple and Google act as platform/store operators for TestFlight, App Store, Play
testing tracks, app distribution, review, and platform-level privacy controls.
They are not listed as PreventOS subprocessors for programme delivery, but their
store disclosures must match this register and the submitted binary.

## Register maintenance

- Update this file before adding any SDK, hosted service, model provider, crash
  reporter, analytics tool, support tool, payment service, or health-data API.
- Store labels must be regenerated from this register plus a binary permission
  review before each submission.
- Any provider with health data needs a DPA, security review, transfer assessment,
  deletion path, and no advertising/onward-use commitment.
