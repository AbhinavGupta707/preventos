# PreventOS Beta Release Runbook

Date: 2026-06-18

This runbook is for the consumer beta push. It documents what is wired today,
what owners must activate, and how to verify a build without weakening the
safety invariants in `AGENTS.md`.

## Current Release Posture

Recommended beta wedge: QuitKit and Exhale first. Steady and Nightshift can be
used for internal testing, but should stay flagged out of public beta until the
extra alcohol and sleep safety assumptions are explicitly accepted.

Code status:

- GitHub Actions are available and the repo has a single CI workflow:
  `.github/workflows/ci.yml`.
- CI runs on pull requests and pushes to `main`.
- CI provisions Postgres 16, installs with `pnpm install --frozen-lockfile`, and
  runs `pnpm verify`.
- Concrete deployment prep lives in `docs/beta-deployment.md`, with a
  non-auto-applied Render template at `deploy/render/render.yaml.template`.
- `pnpm verify` runs typecheck, lint, tests, license check, and content
  validation.
- EAS config exists at `apps/mobile/eas.json` with `development`, `preview`,
  `preview-simulator`, and `production` profiles.
- The API and worker are runnable Node services, but production hosting is not
  yet encoded as infrastructure-as-code.
- Mobile live builds now call the authenticated API for coach replies and remote
  push token registration. BFO/intake persistence and Today/NBA arbitration
  remain local-only until server routes are added.

Non-negotiable release boundaries:

- The deterministic crisis/risk classifier must stay before the LLM.
- Tier-1 and tier-2 risk content must bypass the LLM.
- Validated instruments must render verbatim.
- Alcohol dependence indicators must route to hard-stop referral only.
- Sleep copy must avoid treatment or insomnia claims.
- No real user-facing content ships without a sign-off registry entry.

## Owner Actions Before Public Beta

- Adopt the beta wedge: QuitKit + Exhale public, Steady/Nightshift internal only.
- Choose the production hosting target for API, worker, web, console, and
  Postgres.
- Create the Clerk tenant and hand engineering the non-production and production
  key sets.
- Create the Fireworks key and set the beta model policy. Leave the legacy
  Claude fallback unset for beta unless the owner explicitly re-enables it.
- Choose and credential a real push delivery provider after beta safety review.
  Until then, keep worker delivery at `PUSH_PROVIDER=noop`; registered tokens
  are stored but not sent to Expo/APNS/FCM by CI or the worker.
- Confirm Apple Developer and Google Play Console access for internal testing.
- Adopt consumer privacy/store documents, including LLM processor language,
  retention/deletion schedule, and no-medical-device positioning.
- Decide the escalation policy. Do not promise live clinical monitoring unless
  staffing and SLA coverage actually exist.

## Environment Checklist

Use `.env.example` as the local template. Do not commit real `.env` files.

Required for local API, worker, console live data, and integration tests:

- `DATABASE_URL`

Optional local development:

- `PREVENTOS_AUTH_PROVIDER=fake`
- `PORT`
- `HOST`
- `ALLOW_DEV_SESSIONS`
- `DEV_SESSION_TOKEN`
- `DEV_SESSION_PERSON_ID`
- `PREVENTOS_API_URL`
- `EXPO_PUBLIC_API_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_CLERK_JWT_TEMPLATE`
- `CONTENT_ROOT`
- `PREVENTOS_CONTENT_ROOT`
- `PUSH_PROVIDER`
- `RATE_LIMIT_TRUSTED_PROXIES`

LLM activation. Fireworks is the chosen production coach provider; leave these
unset in CI and local verification unless you are deliberately running a staging
smoke test:

- `FIREWORKS_API_KEY`
- `COACH_MODEL`

Clerk activation:

- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_WEBHOOK_SECRET`
- `CLERK_JWT_KEY`
- `CLERK_JWT_AUDIENCE`
- `CLERK_AUTHORIZED_PARTIES`
- `CLERK_JWT_TEMPLATE`

Current auth status: `apps/api` selects Clerk by default through the
`@preventos/auth` `ClerkAuthProvider`. `apps/web` and `apps/mobile` load Clerk
client SDKs only when their public publishable-key env vars are set, then pass
session tokens through `@preventos/api-client` to server-backed routes including
account export and deletion. Fake auth remains available only when
`PREVENTOS_AUTH_PROVIDER=fake`, `ALLOW_DEV_SESSIONS=true`, or a seeded
`DEV_SESSION_TOKEN`/`DEV_SESSION_PERSON_ID` pair explicitly asks for local dev
auth. Local web/mobile live sync may use the gated `/dev/session` stand-in only
when `ALLOW_DEV_SESSIONS=true` (and mobile also sets
`EXPO_PUBLIC_ALLOW_DEV_SESSIONS=true`). Those dev sessions are not production
auth and must remain disabled outside local development.

Current mobile runtime status: in live API mode, the mobile coach calls
`POST /coach/messages` with a Clerk/dev bearer token and the existing
deterministic client crisis gate still runs before the request is created.
Remote push registration calls `POST /push/tokens` only after the OS permission
flow grants notifications and requires `proactive_contact` consent server-side.
The token payload is stored in `core.push_token`; the event payload records only
person id, token id, and platform. BFO submission and Today/NBA retrieval are
still documented local fallbacks because no server route exists yet.

## Local Verification

From the repo root:

```sh
pnpm install
docker compose up -d
pnpm verify
```

Targeted checks when iterating on release/config docs:

```sh
pnpm check-licenses
pnpm content:validate
pnpm --filter @preventos/api-client test
pnpm --filter @preventos/api test
pnpm --filter @preventos/worker test
pnpm --filter @preventos/mobile test
pnpm --filter @preventos/mobile typecheck
pnpm --filter @preventos/web build
pnpm --filter @preventos/console build
```

Run local services:

```sh
pnpm --filter @preventos/api dev
pnpm --filter @preventos/worker dev
pnpm --filter @preventos/web dev
pnpm --filter @preventos/console dev
pnpm --filter @preventos/mobile start
```

For web-to-API local sync, set:

```sh
DATABASE_URL=postgres://preventos:preventos_dev@localhost:5432/preventos
PREVENTOS_API_URL=http://127.0.0.1:3001
PREVENTOS_AUTH_PROVIDER=fake
ALLOW_DEV_SESSIONS=true
```

For mobile-to-API internal builds, set `EXPO_PUBLIC_API_URL` to a device-reachable
API URL before building. Leave it unset for offline/mock previews. Set
`EXPO_PUBLIC_ALLOW_DEV_SESSIONS=true` only for local/dev builds against an API
that also has `ALLOW_DEV_SESSIONS=true`. Remote push token registration also
needs the Expo project id from `apps/mobile/app.json` and a signed-in session
whose account has granted `proactive_contact` consent.

## CI Verification

Expected GitHub Actions check:

- Workflow: `ci`
- Job: `verify`
- Required service: Postgres 16
- Command: `pnpm verify`
- Expected result before merge: green on the PR branch

CI intentionally does not require LLM keys. With no `FIREWORKS_API_KEY` and no
legacy fallback key, the coach path uses `FakeCoachProvider`, so verification is
deterministic and has zero provider spend.

If GitHub Actions is unavailable, the fallback merge gate is:

```sh
docker compose up -d
pnpm verify
```

Record the local command output in the PR description when using the fallback.

## Clerk Setup Path

Clerk is wired behind `AuthPort` for API session verification. Follow
registration/discovery/install order before debugging runtime auth:

1. Create separate Clerk applications for development/staging and production.
2. Configure allowed origins and redirect URLs for web, console, and mobile deep
   links.
3. Enable the intended sign-in methods for adults-only consumer beta.
4. Create JWT/session templates that expose only the claims required by the
   `@preventos/auth` port:
   - `preventos_user_kind`: `"end_user"` or `"staff"`
   - `preventos_person_id`: the PreventOS UUID for an end user
   - `preventos_staff_id`: stable staff id, or rely on Clerk `sub`
   - `preventos_staff_role`: one of `advisor`, `service_admin`, `analyst`,
     `platform_admin`
   Do not store health data, programme state, diary data, assessment scores, or
   safety flags in Clerk metadata.
5. Store keys in the deployment platform secret manager, not in git.
6. Set `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` for apps/api. Set
   `CLERK_JWT_KEY` from Clerk's PEM public key when you want networkless token
   verification; otherwise the Clerk SDK may retrieve JWKS through Clerk's
   backend API. Set `CLERK_AUTHORIZED_PARTIES` to the allowed web/console/mobile
   origins.
7. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for apps/web and
   `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for live mobile builds. If the API needs
   a named Clerk JWT template, also set `CLERK_JWT_TEMPLATE` for web server
   routes and `EXPO_PUBLIC_CLERK_JWT_TEMPLATE` for mobile.
8. Keep `PREVENTOS_AUTH_PROVIDER=clerk` (or leave it unset) in beta/prod.
9. Disable `/dev/session` by leaving `ALLOW_DEV_SESSIONS` unset or false.
10. Smoke-test a Clerk-issued bearer token against `/consents/check`,
   `/me/export`, and `DELETE /me` in a non-production account before exposing
   real app traffic.

Do not treat Clerk as active just because keys exist. The feature is present in
code, but launch still requires the owner-created tenant, JWT template, allowed
origins, and a successful end-to-end Clerk sign-in/session flow.

## Fireworks And LLM Activation Path

Provider selection in `apps/api/src/coach-deps.ts` is:

1. `FIREWORKS_API_KEY` -> Fireworks (chosen production/beta provider)
2. `ANTHROPIC_API_KEY` -> Claude legacy fallback only
3. no key -> deterministic fake provider

Fireworks defaults to:

```text
accounts/fireworks/models/llama-v3p3-70b-instruct
```

Set `COACH_MODEL` only when the owner has chosen a different beta model. After
activating a real key in staging:

1. Run `pnpm verify` without keys first to prove deterministic CI parity.
2. Start the API with the real key in staging.
3. Smoke-test a normal tier-0 coach turn.
4. Smoke-test tier-1 and tier-2 text and confirm the LLM is bypassed.
5. Confirm coach logs are written and no raw identifiers are sent in the LLM
   frame.
6. Remove the key and confirm the API falls back to the fake provider locally.

Manual staging smoke command:

```sh
FIREWORKS_API_KEY=... pnpm smoke:coach:fireworks
```

Optional model override:

```sh
FIREWORKS_API_KEY=... COACH_MODEL=accounts/fireworks/models/llama-v3p3-70b-instruct pnpm smoke:coach:fireworks
```

The smoke script runs one real tier-0 Fireworks turn, then sends tier-1 and
tier-2 crisis text through the same configured provider and fails if Fireworks
is called for either elevated-risk turn. Do not run it in CI.

Never debug LLM behavior before proving the deterministic safety classifier is
registered and reachable.

## Push Registration And Delivery Path

Mobile remote push registration is implemented end-to-end for live API builds:

1. The in-app primer must be accepted before the OS prompt can run.
2. If the OS grants notification permission, mobile requests an Expo push token
   for the configured EAS project.
3. Mobile calls `POST /push/tokens` through `@preventos/api-client` with the
   current bearer token.
4. `apps/api` requires `proactive_contact` consent, stores or refreshes the
   token in `core.push_token`, and emits `push.token_registered` with coded ids
   only.
5. Account export includes `push_token`; account erasure deletes it.

Delivery is intentionally not active yet. `apps/worker` exposes a push delivery
provider abstraction, but the only available provider in this build is
`noop`. Keep `PUSH_PROVIDER=noop` in CI, staging, and beta until the owner
selects credentials, copy approval, quiet-hours behavior, and provider-specific
monitoring. Any non-noop value currently fails fast rather than making an
unreviewed provider call.

## EAS, TestFlight, And Play Internal Testing

Pre-build:

- Confirm the beta wedge and feature flags.
- Confirm Apple Developer team and Google Play package ownership.
- Confirm Expo account/project access for `abhinav1103` and project
  `b503d74b-58fa-4019-9cbb-39ed317a51a1`.
- Confirm `app.preventos.mobile` bundle/package identifiers.
- Decide whether the build should use `MockApi` or live API. Set
  `EXPO_PUBLIC_API_URL` only for live API builds.
- Confirm no production LLM key is embedded in the mobile build. LLM keys belong
  on the server only.

Build:

```sh
cd apps/mobile
eas build --profile preview-simulator --platform ios
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

Internal testing checklist:

- Install on a clean iOS device and Android device.
- Run QuitKit onboarding to first today card.
- Run Exhale age gate and onboarding.
- Verify rescue is reachable in one tap and works without network.
- Verify crisis text routes to the scripted crisis surface and no coach reply is
  generated.
- Verify live API builds call `/coach/messages` for ordinary coach turns and
  never for client-gated crisis text.
- Verify notifications permission choreography without over-promising delivery.
- Verify remote push token registration reaches `/push/tokens` after permission
  grant; actual delivery remains disabled while `PUSH_PROVIDER=noop`.
- Verify privacy/consent surfaces are reachable.
- Verify export, deletion, logout, unauthenticated, and expired-session states
  on web and mobile live API builds.
- Verify `EXPO_PUBLIC_API_URL` points to beta API for live builds and is unset
  for offline/mock builds.

Submission:

- Use TestFlight for iOS internal testing.
- Use Play Console internal testing for Android.
- Include app review notes that PreventOS is adult wellbeing support, not a
  medical device or emergency service.
- Do not submit Steady or Nightshift as public beta flows until their release
  assumptions are accepted.

## Deployment Checklist

API:

- Provision Postgres 16 and set `DATABASE_URL`.
- Run migrations before first traffic with `pnpm db:migrate`.
- Set `PORT` per host and `HOST=0.0.0.0`.
- Keep `ALLOW_DEV_SESSIONS=false`.
- Set LLM keys only in the server secret manager.
- Set `FIREWORKS_API_KEY` and, only if explicitly chosen, `COACH_MODEL`.
- Confirm `/coach/messages` uses the provider chain and crisis bypass tests pass.

Web:

- Deploy `apps/web`.
- Set `PREVENTOS_API_URL` to the API origin for live sync.
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` when Clerk web auth is active.
- Set `CLERK_JWT_TEMPLATE` if web server routes must request a named API token.
- Confirm marketing waitlist and funnel events reach the API-backed marketing
  schema; offline `.data` fallback should be development-only.
- Confirm privacy export/delete routes use Clerk tokens or explicitly gated
  dev sessions; do not silently fall back to server mocks.
- Run `pnpm --filter @preventos/web build`.

Console:

- Deploy `apps/console` behind staff-only access.
- Set `DATABASE_URL`.
- Confirm `/evidence` shows configured live data and preserves k-anonymity
  suppression.
- Run `pnpm --filter @preventos/console build`.

Worker:

- Deploy exactly one active worker process per environment until queue ownership
  is documented.
- Set `DATABASE_URL`.
- Set `PUSH_PROVIDER=noop` until a real delivery provider has owner-approved
  credentials, copy, monitoring, and quiet-hours behavior.
- Keep `CONTENT_ROOT` at the deployed content bundle unless intentionally
  overriding.
- Confirm worker boot logs the push provider and validates rule refs and content
  catalog before loops start.

Mobile:

- Build with EAS profiles above.
- Use server-side secrets only. Mobile gets `EXPO_PUBLIC_API_URL`,
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, and optionally
  `EXPO_PUBLIC_CLERK_JWT_TEMPLATE`, never LLM or database keys.
- Confirm push token registration works in live API mode. Confirm push
  credentials, delivery provider, notification copy, and quiet-hours policy
  before public rollout.

Rollback:

- Web/console: redeploy the previous build.
- API/worker: stop the new process, redeploy the previous build, and confirm
  migrations are backward compatible before rollback.
- Mobile: stop promotion in TestFlight/Play internal track; ship a new build if
  already installed testers need a fix.

## PR Checklist

- Branch pushed before work starts.
- `.env.example` updated without secrets.
- `docs/beta-deployment.md` owner decisions are still accurate.
- Deployment templates contain placeholders only, never real secrets.
- Runbook owner actions are explicit.
- `pnpm check-licenses` green.
- `pnpm content:validate` green.
- `pnpm verify` green, or skipped with a concrete reason and targeted checks.
- PR describes GitHub Actions status and expected `ci / verify` check.
