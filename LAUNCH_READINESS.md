# PreventOS Launch Readiness Coordination

Date: 2026-06-18

This is the master integration board for moving PreventOS from a strong prototype into a
consumer beta candidate. It is intentionally coordination-only: use it to split agent work,
avoid branch collisions, and keep safety/compliance blockers visible.

## Current Launch Strategy

Recommended beta wedge: QuitKit + Exhale first.

Why:
- They reuse the most mature platform surfaces.
- They carry less acute clinical risk than alcohol withdrawal or sleep-window titration.
- They let the team prove onboarding, daily support, SOS, coach, progress, privacy, and store
  review flows before exposing the heavier programmes.

Steady and Nightshift should remain available for internal testing, but feature-flagged for public
consumer beta until their extra safety assumptions are explicitly accepted.

## Gate Status

| Gate | Current status | What is still needed | Owner |
|------|----------------|----------------------|-------|
| G1 Safety suite | Mostly code-complete | App-layer tests for crisis routing, verbatim instruments, alcohol hard-stop, and claims lint on user-facing surfaces | Safety QA agent |
| G2 Escalation coverage | Product/code scaffolding exists | Consumer-mode escalation policy: emergency signposting, support contact, incident review process, no promise of live clinical monitoring unless staffed | Owner + Privacy/Store agent |
| G3 Clinical sign-off | Formal sign-off not available now | For consumer beta, replace with owner-adopted safety assumptions per enabled programme; keep high-risk features flagged or referral-only | Owner + Compliance agent |
| G4 Privacy pack | Drafts exist | Adopt consumer privacy policy, retention/deletion schedule, Art. 9 basis, processor list, LLM data handling, wearable data stance | Privacy/Store agent |
| G5 Store + claims compliance | Claims lint exists | Apple/Google health disclaimers, no-medical-device language, app review notes, age gates, data safety declarations | Privacy/Store agent |
| G6 Coach provider activation | Fireworks is primary in code; CI uses Fake with no key | Owner supplies `FIREWORKS_API_KEY` in staging, runs Fireworks smoke command, then sets server secret for beta | Fireworks Activation agent + owner |
| G7 Push delivery activation | Remote token registration is implemented; worker delivery is `noop` | Owner chooses provider/credentials, approves notification copy and quiet-hours policy, then enables a real delivery provider after staging tests | Owner + Release/Infra agent |

## Clinical/Legal Blockers

These should not ship publicly without a stronger review path:

- Alcohol dependence or withdrawal support beyond referral/signposting.
- Detox, medication, emergency, or withdrawal advice.
- Sleep treatment claims, insomnia-treatment claims, or aggressive sleep restriction positioning.
- Youth/adolescent vaping or alcohol journeys.
- Any claim that the app diagnoses, treats, cures, prevents, or replaces professional care.
- Any live human escalation promise unless staffing and SLA coverage really exist.

These can proceed as consumer wellness/support features with conservative disclosures:

- Adult smoking and adult vaping behaviour-change support.
- Craving SOS, relapse reflection, goal planning, motivational coaching, and progress tracking.
- Alcohol intake that routes dependence indicators to referral-only mode.
- Sleep diary and wellbeing education if treatment claims are avoided and titration remains
  conservative/flagged.

## Parallel Session Plan

Use one master integration session on the root checkout. Use separate worktrees for every parallel
agent. Do not let parallel sessions switch the shared root checkout.

### 1. Master Integration Session

Branch: `codex/launch-readiness-coordination`

Responsibilities:
- Keep `PROGRESS.md` and this board current.
- Fetch remote branches before merges.
- Serialise any PRs that touch core spine packages.
- Run final `pnpm verify` after integrating code changes.
- Delete or close stale branches only after confirming their work is merged.

### 2. Design/UI Recon Session

Safe area:
- `Design Inspiration/` read-only
- UI/design notes
- Later UI implementation only after recon is accepted

Goal:
- Inspect the HTML design references.
- Extract a PreventOS visual direction for mobile and web.
- Recommend component patterns for the QuitKit + Exhale beta wedge.

### 3. Safety QA Session

Preferred branch: `codex/safety-qa-launch-gates`

Safe areas:
- Tests in `apps/mobile`, `apps/web`, `apps/api`, and package test files
- Avoid behavior changes unless a failing test proves the gap

Goals:
- Add app-layer crisis routing tests.
- Add verbatim instrument rendering tests.
- Add alcohol hard-stop integration tests.
- Re-run targeted tests and `pnpm verify` if practical.

### 4. QuitKit + Exhale UI Session

Preferred branch: `codex/quitkit-exhale-beta-ui`

Safe areas:
- `apps/mobile`
- `apps/web`
- Shared UI helpers only if necessary

Goals:
- Polish the first beta wedge: onboarding, Today, SOS, coach, progress, empty/loading/error states.
- Keep business logic behind existing API/domain contracts.
- Do not touch Steady/Nightshift except for navigation flags.

### 5. Privacy/Store Compliance Session

Preferred branch: `codex/privacy-store-pack`

Safe areas:
- `compliance/privacy`
- `compliance/claims`
- store-review docs

Goals:
- Convert draft privacy/store material into consumer-beta-ready docs.
- Add retention/deletion decisions and processor/subprocessor register.
- Add Apple/Google health-app review checklist and no-medical-device disclaimers.
- Ensure claims language stays below medical-device/treatment posture.

### 6. Release/Infra Session

Preferred branch: `codex/release-infra-beta`

Safe areas:
- env examples
- release docs
- deployment config
- CI docs

Goals:
- Clerk setup checklist.
- Fireworks/LLM key activation checklist.
- GitHub Actions billing/minutes note and fallback local gate.
- EAS/TestFlight/Play internal testing checklist.
- Production-like deployment runbook.

### 7. Nightshift Mobile Session

Preferred branch: `codex/nightshift-mobile-diary`

Safe areas:
- `apps/mobile` Nightshift screens and tests

Goals:
- Add native sleep diary form and sleep-window result UI using the existing API port.
- Keep it wellbeing-framed.
- Keep constants and public availability flagged until owner accepts safety assumptions.

## Conflict Rules

Only one session at a time may touch these core spine areas:

- `packages/domain`
- `packages/db`
- `packages/events`
- `packages/consent`
- `packages/decisions`
- shared database migrations
- `apps/worker` rule/arbitration flow

Parallel-safe areas:

- `apps/mobile` when screen ownership is split clearly
- `apps/web` when page ownership is split clearly
- `compliance/*`
- `content/*`
- release docs/config
- tests, if target files do not overlap

## Recommended Immediate Order

1. Run Design/UI Recon in parallel with this master session.
2. Launch Safety QA, Privacy/Store, and Release/Infra after the recon session starts.
3. Launch QuitKit + Exhale UI after recon produces a design direction.
4. Launch Nightshift Mobile only after the first wedge is not blocked.
5. Merge in this order: Safety QA, Privacy/Store, Release/Infra, UI, Nightshift.

## Design/UI Recon Prompt

Use this prompt in a separate Codex session rooted at `/Users/abhinavgupta/Desktop/PreventOS`:

```text
You are the Design/UI Recon session for PreventOS.

Read AGENTS.md first and follow the multi-session protocol. Do not edit product code yet unless explicitly asked. Work in a separate branch/worktree if you make any files.

Goal: inspect the local `Design Inspiration/` folder, especially the HTML files, and extract a practical design direction for PreventOS.

Context:
- PreventOS is a consumer health/wellness behaviour-change app with four programmes: QuitKit (smoking), Exhale (adult vaping), Steady (alcohol), and Nightshift (sleep).
- The immediate beta wedge is QuitKit + Exhale.
- We need a calm, trustworthy, polished product UI, not a marketing landing page.
- UI must preserve safety invariants: crisis surfaces are clear and direct, validated instruments render verbatim, alcohol dependence routes to referral-only mode, and sleep avoids treatment claims.

Tasks:
1. Inspect `Design Inspiration/` HTML/CSS/assets and summarize the reusable visual patterns: layout, typography, color, cards/surfaces, navigation, motion, density, and interaction style.
2. Decide which patterns fit PreventOS and which should not be copied.
3. Propose a lightweight mobile + web design system for the QuitKit + Exhale beta wedge.
4. Map the required screens/states: onboarding, Today, SOS, coach, progress, settings/privacy, loading/empty/error, and safety interruption states.
5. Identify the exact files likely to be touched later, but do not implement yet unless the master session asks you to proceed.
6. Return a concise report with screenshots only if they materially help. If HTML is insufficient, say exactly which PNG/JPG screenshots would help.

Deliverable:
- A short UI recon report.
- A recommended implementation split for a later UI agent.
- No broad code edits in this recon pass.
```
