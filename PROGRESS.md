# PreventOS — execution ledger

Shared truth across all sessions. Claim a WP before working it; record evidence when done.
WP definitions and acceptance criteria live in `IMPLEMENTATION_PLAN.md` §5–6.

## Status board

| WP | Title | Status | Session/branch | Evidence / notes |
|----|-------|--------|----------------|------------------|
| 1.1a | Root monorepo & CI scaffold | **done** | main (spine session) | `pnpm verify` green; import-boundary lint proven to block violations; license checker active |
| 1.1b | App shells (Expo, web, console) | **done** | main (spine session) | Expo SDK 56 app: Metro-compiled iOS bundle verified (app code present); web + console: `next build` green and served over HTTP with content confirmed; eas.json profiles in place; `pnpm verify` green across 5 workspaces |
| 1.2 | Domain model & persistence | **done** | main (spine session) | Full entity set + FHIR mapping doc; Postgres schema with identity/core separation; append-only triggers proven at DB level (UPDATE/DELETE rejected on consent/event/decision/sleep_window); migrations idempotent (re-run applies zero); one-active-enrolment-per-vertical enforced; 8/8 integration + 17/17 domain tests; unblocks 1.3, 1.4, 1.5, 4.1 |
| V.1c | QuitKit content pack — content drafting | **done** | merged (PR #5) | 149 atoms / 15 modules in `content/smoking/`; all DRAFT-stamped; schema+slot+BCT checks green incl. negative test; no instrument text (invariant 2); `pnpm verify` green; **pending canonical-schema migration (WP4.2m)** |
| V.2c | Exhale content pack — content drafting | open | — | **Parallel-safe now** (`content/vaping/`) |
| V.3c | Steady content pack — content drafting | open | — | **Parallel-safe now** (`content/alcohol/`); include hard-stop referral scripts |
| V.4c | Nightshift content pack — content drafting | open | — | **Parallel-safe now** (`content/sleep/`); no treatment-claim language |
| 7.1c | Safety risk corpus (~800 labelled cases) | **done** | merged (PR #6) | 843 cases, 6 categories; schema/dedup/distribution enforced by `@preventos/red-team` tests in `pnpm verify` (corrupt line proven to fail); adversarial label audit: 2 mislabels found+fixed; tier scheme {0,1,2} assumption in corpus README |
| 10.1 | Clinical reviewer brief & engagement pack | **done** | merged (PR #4) | DRAFT brief + engagement letter in `compliance/clinical-review/`; two-reviewer recommendation flagged for owner |
| 10.4 | Instrument licensing audit (SCI vs ISI etc.) | **done** | merged (PR #4) | Audit in `compliance/instruments/`; **finding: SCI paper is CC BY-NC — commercial permission needed (owner action §3.1)**; AUDIT/HSI/PHQ-2/GAD-2 cleared with conditions; ISI rejected (Mapi fees) |
| 10.6 | Privacy pack drafts (DPIAs, policy, ToS) | **done** | merged (PR #4) | 3 DPIA scaffolds + Art. 9 analysis + privacy policy + ToS drafts in `compliance/privacy/`; all DECISION/TBD items role-tagged |
| 10.10 | Claims register v0 | **done** | merged (PR #4) | `compliance/claims/` — machine-readable register (3 blocklists, 16 patterns) + checker; 25 test vectors green; forbidden sleep claim proven to exit 1 |

Everything not listed is blocked behind the spine (see plan §7 dependency notes) — add rows as
WPs unblock. Statuses: open → claimed(session/branch) → in_review(PR) → done(evidence).

| 4.1 | Content-atom schema & store | **done** | main (spine session) | `@preventos/content`: zod schema matching the drafted pack shape (meta+defaults+atoms, bcttv1 tags, COM-B, slots); untagged atoms rejected; status normalisation (draft-pending-clinical-sign-off→draft); draft content unservable in production (no override by design); deterministic catalog hash for cohort pinning; sequences validated; repo-wide content gate test active in CI; 14/14 tests. Content sessions: run `pnpm --filter @preventos/content test` after rebasing on main to validate your pack |

## Session log
- 2026-06-12 · spine session: plan v3 adopted; WP1.1a built and verified; repo initialized.
