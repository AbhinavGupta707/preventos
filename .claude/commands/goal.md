---
description: Execute work packages from IMPLEMENTATION_PLAN.md autonomously to done-and-verified, without mid-task check-ins
argument-hint: "[WP id | milestone id | 'next'] — default: next unblocked WP"
---

Drive the PreventOS build to its next concrete outcome with zero unnecessary interruptions.

## Resolve the target
1. Read `IMPLEMENTATION_PLAN.md` (plan of record) and `PROGRESS.md` (live ledger).
2. Target = `$ARGUMENTS` if given (a WP id like `1.2`, or a milestone like `M0` meaning: loop
   WPs until that milestone's exit criteria pass). Otherwise: the next WP that is unblocked by
   the dependency notes, not claimed in PROGRESS.md, and highest-leverage for the current milestone.
3. Claim it in PROGRESS.md (status `claimed`, your session/branch) BEFORE writing code. If the
   target touches spine packages (`domain`, `db`, `events`, `consent`, `decisions`) and another
   session holds an active spine claim — stop and report the conflict instead of proceeding.

## Execute
4. Branch `wp/<id>-<slug>` off `main` (skip branching only if no remote exists).
5. Follow `CLAUDE.md` conventions: TDD, strict TS, import boundaries, files ≤400 lines.
   The WP's acceptance criteria in the plan are the contract — build to them, all of them.
6. Do NOT pause to ask about anything reversible inside the repo. Make the smallest safe
   assumption, record it in PROGRESS.md notes, and keep moving. The ONLY hard stops:
   - the five safety invariants in CLAUDE.md (never trade these for progress)
   - spending real money, creating external accounts/services, or publishing anything
   - destructive operations (data loss, force-push, git reset --hard)
   - a genuine product fork the owner must decide — park it, build the rest, flag it at the end
7. After 3 failed attempts at the same blocker: stop, document attempts in PROGRESS.md, report.

## Verify (runtime-first — lint/tests passing is not "done")
8. `pnpm verify` green, AND prove the artifact actually works: boot the app/screen, run the
   journey/demo script, execute the negative test (e.g. prove the forbidden thing fails).
9. Update PROGRESS.md: status `done` + one-line evidence of what was proven.

## Land & report
10. Commit (conventional format, no attribution trailers), push, open a PR to `main` if a
    remote exists; merge directly only when working alone on the spine with owner's standing
    approval. Never push over a red CI — check the previous run first.
11. Report: outcome first (what now works, how it was proven), assumptions made, what this
    unblocked, and the single best next `/goal` target.
