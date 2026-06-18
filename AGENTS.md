# PreventOS — build conventions (read me first, every session)

One app, four behaviour-change programmes: smoking (QuitKit), adult vaping (Exhale),
alcohol (Steady), sleep (Nightshift). Spec: `PreventOS_Product_Requirements_Document_v1.md`.
Plan of record: `IMPLEMENTATION_PLAN.md` (v3). Live work ledger: `PROGRESS.md`.

## Commands
- `pnpm install` — **from repo root only**, never inside a workspace
- `pnpm verify` — typecheck + lint + test + license check (must be green before any commit)
- `docker compose up -d` — local Postgres 16

## Conventions
- TypeScript strict everywhere; TDD (test first); ≥80% coverage on core-logic packages
- Import boundaries are lint-enforced: `packages/domain` imports only `@preventos/shared`;
  verticals contribute content + rules + config under `content/`, never core-package changes
- Files ≤400 lines; immutable patterns (no in-place mutation); no `console.log`
- No GPL/AGPL dependencies (CI-enforced)
- Commits: conventional format (`feat:`, `fix:`, `chore:`…), no attribution trailers

## Safety invariants — never violate, never "temporarily" disable
1. Crisis/risk detection is deterministic, runs before the LLM, and cannot be bypassed by
   config, flag, or prompt. The LLM never handles tier-1 risk content.
2. Validated instruments render verbatim from `packages/instruments` — never paraphrased.
3. No content reaches a real user without a sign-off registry entry (`compliance/`).
4. Alcohol dependence indicators → hard stop + referral; no in-app reduction pathway.
5. Sleep copy never makes treatment claims (claims register lints this).

## Multi-session protocol
1. Check live claims before starting: `git fetch origin && git branch -r` — a pushed
   `wp/<id>-*` branch IS the claim on that work package. Also read `PROGRESS.md` on main.
2. Core-spine packages (`domain`, `db`, `events`, `consent`, `decisions`) — ONE session at a
   time; the spine session works directly on the root checkout.
3. Parallel-safe areas: `content/*`, `compliance/*`, `apps/web`, `apps/mobile`, `apps/console`,
   `tools/*` — provided no other session has claimed the same directory.
4. Parallel sessions NEVER switch branches in the shared root checkout. Isolate in a worktree
   (EnterWorktree tool, or `git worktree add ../preventos-wp<id> -b wp/<id>-<slug>`), then push
   the branch immediately — that publishes your claim.
5. PR to `main` with `pnpm verify` green; update your `PROGRESS.md` row (status + evidence) in
   the same PR. PROGRESS.md on main is the shared truth across sessions.
