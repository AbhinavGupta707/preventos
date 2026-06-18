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
- `pnpm verify` runs typecheck, lint, tests, license check, and content
  validation.
- EAS config exists at `apps/mobile/eas.json` with `development`, `preview`,
  `preview-simulator`, and `production` profiles.
- The API and worker are runnable Node services, but production hosting is not
  yet encoded as infrastructure-as-code.

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
- Create the Fireworks key, or explicitly choose Claude fallback, and set the
  beta model policy.
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

- `PORT`
- `ALLOW_DEV_SESSIONS`
- `DEV_SESSION_TOKEN`
- `DEV_SESSION_PERSON_ID`
- `PREVENTOS_API_URL`
- `EXPO_PUBLIC_API_URL`
- `CONTENT_ROOT`
- `PREVENTOS_CONTENT_ROOT`
- `RATE_LIMIT_TRUSTED_PROXIES`

LLM activation:

- `FIREWORKS_API_KEY`
- `ANTHROPIC_API_KEY`
- `COACH_MODEL`

Future Clerk activation placeholders:

- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_WEBHOOK_SECRET`

Current auth status: `apps/api` still boots with `FakeAuthProvider`. Local web
sync uses the gated `/dev/session` stand-in when `ALLOW_DEV_SESSIONS=true`.
Those dev sessions are not production auth and must remain disabled outside
local development.

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
pnpm --filter @preventos/api test
pnpm --filter @preventos/worker test
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
ALLOW_DEV_SESSIONS=true
```

For mobile-to-API internal builds, set `EXPO_PUBLIC_API_URL` to a device-reachable
API URL before building. Leave it unset for offline/mock previews.

## CI Verification

Expected GitHub Actions check:

- Workflow: `ci`
- Job: `verify`
- Required service: Postgres 16
- Command: `pnpm verify`
- Expected result before merge: green on the PR branch

CI intentionally does not require LLM keys. With no `FIREWORKS_API_KEY` or
`ANTHROPIC_API_KEY`, the coach path uses `FakeCoachProvider`, so verification is
deterministic and has zero provider spend.

If GitHub Actions is unavailable, the fallback merge gate is:

```sh
docker compose up -d
pnpm verify
```

Record the local command output in the PR description when using the fallback.

## Clerk Setup Path

Clerk is not fully wired yet. Follow registration/discovery/install order before
debugging runtime auth:

1. Create separate Clerk applications for development/staging and production.
2. Configure allowed origins and redirect URLs for web, console, and mobile deep
   links.
3. Enable the intended sign-in methods for adults-only consumer beta.
4. Create JWT/session templates that expose only the claims required by the
   `@preventos/auth` port: user kind, stable subject, and staff role where
   applicable.
5. Store keys in the deployment platform secret manager, not in git.
6. Implement and test the Clerk adapter behind the existing auth port.
7. Replace `FakeAuthProvider` in production API/console boot paths only after
   adapter tests prove deny-by-default RBAC and k-anonymity still hold.
8. Disable `/dev/session` by leaving `ALLOW_DEV_SESSIONS` unset or false.

Do not treat Clerk as active just because keys exist. The feature is only
present once the adapter is registered in code and the official Clerk flows pass
end-to-end.

## Fireworks And LLM Activation Path

Provider selection in `apps/api/src/coach-deps.ts` is:

1. `FIREWORKS_API_KEY` -> Fireworks
2. `ANTHROPIC_API_KEY` -> Claude
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

Never debug LLM behavior before proving the deterministic safety classifier is
registered and reachable.

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
- Verify notifications permission choreography without over-promising delivery.
- Verify privacy/consent surfaces are reachable.
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
- Run migrations before first traffic.
- Set `PORT` per host.
- Keep `ALLOW_DEV_SESSIONS=false`.
- Set LLM keys only in the server secret manager.
- Confirm `/coach/messages` uses the provider chain and crisis bypass tests pass.

Web:

- Deploy `apps/web`.
- Set `PREVENTOS_API_URL` to the API origin for live sync.
- Confirm marketing waitlist and funnel events reach the API-backed marketing
  schema; offline `.data` fallback should be development-only.
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
- Keep `CONTENT_ROOT` at the deployed content bundle unless intentionally
  overriding.
- Confirm worker boot validates rule refs and content catalog before loops
  start.

Mobile:

- Build with EAS profiles above.
- Use server-side secrets only. Mobile gets `EXPO_PUBLIC_API_URL`, never LLM or
  database keys.
- Confirm push credentials and notification copy before public rollout.

Rollback:

- Web/console: redeploy the previous build.
- API/worker: stop the new process, redeploy the previous build, and confirm
  migrations are backward compatible before rollback.
- Mobile: stop promotion in TestFlight/Play internal track; ship a new build if
  already installed testers need a fix.

## PR Checklist

- Branch pushed before work starts.
- `.env.example` updated without secrets.
- Runbook owner actions are explicit.
- `pnpm check-licenses` green.
- `pnpm content:validate` green.
- `pnpm verify` green, or skipped with a concrete reason and targeted checks.
- PR describes GitHub Actions status and expected `ci / verify` check.
