# Deep review — findings register (2026-06-13)

Source: 7-dimension adversarially-verified review (40 agents, each finding confirmed/refuted by a
skeptic that read the cited code). 69 confirmed, 12 refuted. This register keeps only **genuine
defects** — the many "FULLY ENFORCED / VERIFIED" confirmations (inv2 verbatim, inv3 build-gate,
inv5 claims-lint, RBAC deny-by-default, k-anon k=5, erasure carve-outs, import boundaries, layering,
Result pattern, immutability, no secrets) are recorded as confirmed-good and not repeated here.

## Fixed in integration (commit 2acf… onward)
| Sev | id | What | Status |
|-----|----|------|--------|
| CRITICAL | int-safety-not-invoked-api | apps/api persisted user free text without classifying it (inv1 server-side bypass) | **FIXED** — `screenInboundText` classifies inbound text; tier-1/2 opens an escalation case; wired into /logs/drink; 2 tests |
| HIGH | dep-drizzle-orm-sqli | drizzle-orm 0.44.2 < 0.45.2 SQLi advisory | **FIXED** — bumped to ^0.45.2 across api/worker/db/safety |
| — | (found while fixing) | classifier RiskTier is numeric 0\|1\|2, not "none" | **FIXED** — guard corrected |

## Wave-3 — genuine defects, scoped as work packages
### WIRE — connect the apps to the live API (the critical path; known stop-gaps)
- `int-web-app-localStorage-no-api-sync-5` — web persists only to localStorage, no API sync.
- `int-mobile-uses-mockapi-exclusively-6` — mobile uses MockApi everywhere; implement the `ApiPort` fetch adapter.
- `int-console-no-database-integration-7` — console evidence runs on fixtures, not real events.
- `int-events-produced-not-consumed-4` — worker dispatcher registers zero handlers; events are write-only.

### WORKER-GUARDS — fail-fast on dangling references (HIGH)
- `int-missing-atom-refs-1` — DEFAULT_RULE_SET references 9 atom ids absent from content packs.
- `int-no-validation-atom-exists-on-contact-write-8` — no check that contentAtomId resolves before write.
- `int-outcome-ref-mismatch-2` — content `outcome_ref` (dot-naming) ≠ outcome definition ids (underscore). Reconcile + validate in `content:validate`.
  Fix shape: load the content catalog + outcome defs at worker boot and in CI; reject unresolved refs.

### STEADY-GATE — alcohol dependence hard-stop in the rules engine (inv4) (HIGH)
- `inv4-undiscovered-gap` — AUDIT-C score is not threaded into `evaluateRules`; no hardstop rule; no contraindication check at contact-send. Steady stays gated off until: RuleContext carries auditScore + assessment flags; a priority-100 unbypassable hardstop rule routes AUDIT≥thresh to referral atoms; `isContraindicated(atom, personFlags)` gates contact-send; integration test proves a dependence-flagged person never receives a moderation atom. (`test-coverage-alcohol-hard-stop-integration`.)

### SAFETY-PORTABLE — share the validated classifier with mobile (arch) — **DONE (W3-SAFEPORT)**
- `safety-invariant-1-verified` fixHint / `inv1-bypass-audit` — mobile used an 11-pattern client gate, NOT the 843-case-validated `@preventos/safety` classifier (it couldn't import it: the package pulls in @preventos/db). **Resolved:** added a pure, db-free entry `@preventos/safety/classify` (eslint import-boundary + import-graph test prove no db reaches it); the package root keeps the full surface incl. the db-backed escalation queue. The mobile gate now delegates to the validated `classify()` (tier-1 **and** tier-2 route to the scripted crisis flow); the 11-pattern list is retired. Proven by a real iOS Metro/Hermes bundle (classifier present, queue + drizzle absent). Web has no safety consumer yet — the pure entry is ready for it when WP3.2/W3-WIRE wires the web coach.
- **NEW (found & fixed during W3-SAFEPORT) — classifier under-coverage on bare phrasings:** the corpus-tuned classifier (and therefore the server `screenInboundText`) returned tier-0 for high-signal phrasings the old client gate caught — "I just want to die", "ending my life", "no reason to live", "better off dead", "I feel suicidal", "I took an overdose", bare self-harm/"end it all". Closed in the lexicon (self-harm + overdose) with idiom guards; **recall 1.00 / tier-0 FP 0.0% held over all 843 corpus cases + 24 jailbreaks**. This strengthened the server gate too, not just mobile.
- **NEW (pre-existing, NOT this WP) — `node:crypto` blocks the iOS JS bundle:** `@preventos/instruments` and `@preventos/decisions` `import { createHash } from "node:crypto"`, which Metro cannot bundle for iOS — `expo export --platform ios` aborts. Independent of the safety split (reproduced on `main`). Needs a hashing shim/abstraction usable in React Native (e.g. an injected hash port) before mobile JS can be exported/OTA-updated. Flag for the instruments / W3-WIRE track.

### SEC-HARDEN — bounded security items
- `web-ratelimit-ip-spoof` — waitlist trusts `x-forwarded-for`; harden the rate-limit key to a trusted source.
- `dep-esbuild-rce`, `dep-postcss-xss`, `dep-uuid-buffer-bounds` — dev/transitive advisories; bump (esbuild needs a coordinated vitest/vite bump — own task).
- event-schema hardening — replace unbounded `z.string()` fields (e.g. `disposition`) with enums/regex (`safety-invariant-3-verified` fixHint).

### DATA-INTEGRITY — bounded
- `integrity-index-gap-enrolment-1` — add index on `enrolment(person_id)` (multi-vertical tick perf).
- `integrity-planobject-mutable-1` — guarantee plan version increments + audit.
- append-only triggers on diaries — **needs a product decision first**: `contact_record` is mutable by design (DLR status); `drink_log`/`sleep_diary` may allow retro-fill. Decide intended mutability, then add triggers only where truly append-only. (Review's "add triggers to all three" fix would break DLR updates — do not apply blindly.)

### TEST-CI — hardening
- `test-ci-db-race` — concurrent suites DROP/CREATE test DBs via a shared admin connection; add advisory-lock/serialised setup or template-DB to prevent CI flakes. (Observed once during integration; reproduced green twice after, but latent.)
- `test-coverage-instruments-verbatim-app-render` — assert verbatim rendering at the app layer, not only the registry.
- `test-reading-age-warnings-silent` — document/affirm the warn-only reading-age behaviour in a test.

### FE-POLISH — low severity
- `react-key-collision-1` — unstable key `paragraph.slice(0,32)` on the article page.
- `web-store-mutation-pattern` — tighten the store updater to prevent accidental mutation.

## Refuted / not-an-issue (do not chase)
inv2/inv3/inv5 enforcement, RBAC, k-anon, erasure, secrets, import boundaries, layering — all
verified correct by the skeptic pass. The review's proposed "append-only triggers on contact_record"
is refuted here on product grounds (contact status is mutable by design).
