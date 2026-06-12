# PreventOS — execution ledger

Shared truth across all sessions. Claim a WP before working it; record evidence when done.
WP definitions and acceptance criteria live in `IMPLEMENTATION_PLAN.md` §5–6.

## Status board

| WP | Title | Status | Session/branch | Evidence / notes |
|----|-------|--------|----------------|------------------|
| 1.1a | Root monorepo & CI scaffold | **done** | main (spine session) | `pnpm verify` green; import-boundary lint proven to block violations; license checker active |
| 1.1b | App shells (Expo, web, console) | **claimed** | main (spine session) | In progress 2026-06-12 |
| 1.2 | Domain model & persistence | open | — | **Spine — single session only**; blocks 1.3/1.4/1.5/4.1 |
| V.1c | QuitKit content pack — content drafting | open | — | **Parallel-safe now** (`content/smoking/`); draft in structured YAML per plan WP4.1 shape; stamp DRAFT |
| V.2c | Exhale content pack — content drafting | open | — | **Parallel-safe now** (`content/vaping/`) |
| V.3c | Steady content pack — content drafting | open | — | **Parallel-safe now** (`content/alcohol/`); include hard-stop referral scripts |
| V.4c | Nightshift content pack — content drafting | open | — | **Parallel-safe now** (`content/sleep/`); no treatment-claim language |
| 7.1c | Safety risk corpus (~800 labelled cases) | open | — | **Parallel-safe now** (`tools/red-team/corpus/`); incl. hard negatives |
| 10.1 | Clinical reviewer brief & engagement pack | open | — | **Parallel-safe now** (`compliance/`) |
| 10.4 | Instrument licensing audit (SCI vs ISI etc.) | open | — | **Parallel-safe now** (`compliance/`) |
| 10.6 | Privacy pack drafts (DPIAs, policy, ToS) | open | — | **Parallel-safe now** (`compliance/`) |
| 10.10 | Claims register v0 | open | — | **Parallel-safe now** (`compliance/`); feeds content lint |

Everything not listed is blocked behind the spine (see plan §7 dependency notes) — add rows as
WPs unblock. Statuses: open → claimed(session/branch) → in_review(PR) → done(evidence).

## Session log
- 2026-06-12 · spine session: plan v3 adopted; WP1.1a built and verified; repo initialized.
