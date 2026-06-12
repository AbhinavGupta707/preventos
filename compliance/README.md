# compliance/ — human-owned track artifacts

> **STATUS: ALL DOCUMENTS IN THIS DIRECTORY ARE DRAFT.**
> Nothing here is adopted until the owner (and, where flagged, the clinical reviewer)
> records sign-off. Plan of record: `IMPLEMENTATION_PLAN.md` §6 (WS10).

## Contents

| Path | WP | Deliverable | Gate | Adoption status |
|------|----|-------------|------|-----------------|
| `clinical-review/reviewer-brief.md` | 10.1 | Clinical reviewer brief & engagement pack | G3 | DRAFT |
| `instruments/licensing-audit.md` | 10.4 | Instrument licensing audit (SCI vs ISI, AUDIT, HSI, PHQ-2/GAD-2) | G3 | DRAFT |
| `claims/claims-register.md` | 10.10 | Claims register v0 — governance + rationale | G5 | DRAFT |
| `claims/claims-register.json` | 10.10 | Machine-readable register (feeds WP4.2 content lint) | G5 | DRAFT |
| `claims/check-claims-register.mjs` | 10.10 | Register self-check + copy checker (dependency-free) | — | working |
| `privacy/dpia-core.md` | 10.6 | Core platform DPIA (ICO template) | G4 | DRAFT scaffold |
| `privacy/dpia-llm-coach.md` | 10.6 | LLM coach DPIA | G4 | DRAFT scaffold |
| `privacy/dpia-wearables.md` | 10.6 | Wearable-data DPIA | G4 | DRAFT scaffold |
| `privacy/article-9-analysis.md` | 10.6 | UK GDPR Art. 9 lawful-basis analysis | G4 | DRAFT |
| `privacy/privacy-policy-draft.md` | 10.6 | User-facing privacy policy | G4 | DRAFT |
| `privacy/terms-of-service-draft.md` | 10.6 | User-facing terms of service | G4 | DRAFT |
| `sign-off-registry.yaml` | 10.2 (seeded here) | Sign-off registry — the enforcement record for safety invariant #3 | G3 | schema seeded, zero entries |

## How to review efficiently

Every document follows the same conventions:

- **`DECISION REQUIRED:`** — a choice only the owner (or clinical reviewer) can make.
  Searching a file for that string surfaces everything blocking adoption.
- **`VERIFY:`** — a factual claim the drafting agent could not fully confirm; check before relying on it.
- **`TBD(owner)` / `TBD(clinical)` / `TBD(legal)`** — blanks assigned to a named role.
- Each document ends with a **sign-off block**; adoption = completing that block AND adding a row
  to `sign-off-registry.yaml`.

## Enforcement wiring (what is code-enforced vs. paper)

- `claims/claims-register.json` is consumed by the content lint (WP4.2). Until that lands,
  `node compliance/claims/check-claims-register.mjs` validates the register and can check any
  copy string against the blocklist (`--check "<text>"`).
- Instrument licensing statuses in `instruments/licensing-audit.md` map to the
  `licensing-status` field in the instrument registry (WP4.4): any instrument not marked
  `cleared` there must be unreachable at runtime.
- `sign-off-registry.yaml` is the machine-readable record behind safety invariant #3
  (no content reaches a real user without a sign-off entry). Pipeline enforcement lands with WP4.2.
