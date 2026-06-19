# PreventOS Beta Deployment Prep

Date: 2026-06-18

This guide converts `docs/beta-release-runbook.md` into concrete deploy
configuration for a consumer beta. It does not choose secrets, domains, paid
plans, or final hosting on behalf of the owner.

## Recommended Beta Path

Use Render for the first beta deployment: one Postgres 16 database, one Fastify
API web service, one background worker, and two Next.js web services for
marketing/app web and staff console.

Why this is the lowest-friction path for the current repo:

- It keeps API, worker, web, console, and Postgres under one provider and one
  private network.
- Render supports Blueprint-managed services, databases, and environment
  variables in a repo YAML file.
- Render has native Node web services for the API and both Next apps.
- Render background workers match the current `apps/worker` process model:
  one long-running process that polls Postgres-backed work.
- Render Postgres exposes an internal connection string for same-region
  services; use that for `DATABASE_URL`.

Alternatives inspected:

- Vercel for web/console plus Render/Fly/Railway for API, worker, and Postgres:
  excellent Next.js ergonomics, but more cross-provider configuration and more
  secret/domain routing for the first beta.
- Fly.io plus managed Postgres: strong runtime control, but more operational
  setup than needed for this first beta.
- Railway: convenient monorepo deploys, but the current app has a clean
  Render-shaped API/worker/Postgres split and already benefits from Blueprint
  templates.

Official references used for this recommendation:

- Render Blueprint YAML reference:
  https://render.com/docs/blueprint-spec
- Render Next.js deployment:
  https://render.com/docs/deploy-nextjs-app
- Render background workers:
  https://render.com/docs/background-workers
- Render Postgres internal connections:
  https://render.com/docs/postgresql-creating-connecting

## Template

Start from `deploy/render/render.yaml.template`.

It is intentionally not named `render.yaml`. To use it:

1. Owner confirms Render, region, plans, and domains.
2. Copy the template to `render.yaml`.
3. Replace every `OWNER_SELECTS_*` and `OWNER_SETS_*` placeholder.
4. Keep `sync: false` secret placeholders empty in git.
5. Validate with Render before creating paid resources.

The template assumes `main` is the deploy branch. Change `branch` only if the
beta branch itself is the deployment source.

## Service Matrix

| Service | Runtime | Build command | Start command | Required env |
|---|---|---|---|---|
| API | Node/Fastify | `pnpm --filter @preventos/api typecheck` | `pnpm --filter @preventos/api start` | `DATABASE_URL`, `PORT`, `HOST=0.0.0.0`, `ALLOW_DEV_SESSIONS=false`, Clerk server env |
| Worker | Node process | `pnpm --filter @preventos/worker typecheck` | `pnpm --filter @preventos/worker start` | `DATABASE_URL`, `PUSH_PROVIDER=noop` |
| Web | Next.js | `pnpm --filter @preventos/web build` | `pnpm --filter @preventos/web start` | `PREVENTOS_API_URL`, `PORT`, `RATE_LIMIT_TRUSTED_PROXIES`, Clerk public/server env |
| Console | Next.js | `pnpm --filter @preventos/console build` | `pnpm --filter @preventos/console start` | `DATABASE_URL`, `PORT` |
| Postgres | Postgres 16 | n/a | n/a | owner-selected plan, backups, retention |

Run migrations before API traffic:

```sh
pnpm db:migrate
```

## Environment Matrix

| Variable | Local | Staging | Beta/prod |
|---|---|---|---|
| `DATABASE_URL` | Docker Compose URL from `.env.example` | Managed Postgres internal URL | Managed Postgres internal URL |
| `PORT` | API `3001`, web `3000`, console `3100` | Host-provided | Host-provided |
| `HOST` | Optional; defaults to `0.0.0.0` | `0.0.0.0` | `0.0.0.0` |
| `ALLOW_DEV_SESSIONS` | `true` only for local journey testing | `false` | `false` |
| `DEV_SESSION_TOKEN` / `DEV_SESSION_PERSON_ID` | Optional local only | unset | unset |
| `PREVENTOS_API_URL` | `http://127.0.0.1:3001` when syncing | Staging API origin | Beta/prod API origin |
| `EXPO_PUBLIC_API_URL` | unset for MockApi, or LAN/API URL | Staging API origin for live internal builds | Beta/prod API origin for live internal builds |
| `EXPO_PUBLIC_PREVENTOS_ENABLE_STEADY_INTERNAL` / `EXPO_PUBLIC_PREVENTOS_ENABLE_NIGHTSHIFT_INTERNAL` | `false` unless testing gated mobile routes | `false` unless owner-approved private build | `false` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | unset unless testing Clerk web locally | Web Clerk publishable key | Web Clerk publishable key |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | unset unless testing Clerk mobile locally | Mobile Clerk publishable key | Mobile Clerk publishable key |
| `CLERK_JWT_TEMPLATE` / `EXPO_PUBLIC_CLERK_JWT_TEMPLATE` | optional named API token template | `preventos-api` if configured in Clerk | `preventos-api` if configured in Clerk |
| `FIREWORKS_API_KEY` | normally unset | secret manager only | secret manager only |
| `COACH_MODEL` | unset unless testing selection | owner-selected model or unset default | owner-selected model or unset default |
| `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` / `CLERK_WEBHOOK_SECRET` | unset unless testing Clerk locally | owner-created Clerk app keys | owner-created Clerk app keys |
| `CONTENT_ROOT` / `PREVENTOS_CONTENT_ROOT` | unset unless testing alternate content bundle | unset unless host path differs | unset unless host path differs |
| `PUSH_PROVIDER` | `noop` | `noop` until owner selects delivery provider | `noop` until owner selects delivery provider |
| `RATE_LIMIT_TRUSTED_PROXIES` | `1` | host-specific proxy hop count | host-specific proxy hop count |

Do not treat Clerk as fully active just because keys exist. Launch still
requires the owner-created tenant, JWT template, allowed origins, redirect URLs,
and a successful end-to-end Clerk sign-in/session flow.

## Health Checks

| Service | Probe | Expected result |
|---|---|---|
| API | `GET /health` | HTTP 200 with `{ "data": { "status": "ok" } }` |
| Worker | Process liveness and logs | Process stays up; boot logs include push provider config, rule-set validation, and worker loops started |
| Web | `GET /` | HTTP 200; waitlist/events use API store when `PREVENTOS_API_URL` is set |
| Console | `GET /` and smoke `/evidence` after DB env is set | HTTP 200; `/evidence` reads live aggregates and preserves k-anonymity suppression |
| Postgres | host-native health plus `pnpm db:migrate` | migrations apply once; rerun reports none |

Worker health is process-based because `apps/worker` has no HTTP listener.
Deploy exactly one active worker per environment until queue ownership and
horizontal scaling are documented.

## Preflight Checklist

GitHub and CI:

- Confirm the PR has `ci / verify` green.
- Confirm CI is using Postgres 16.
- Confirm no real `.env` or secret value is committed.
- Confirm Clerk publishable keys are public-only and Clerk secret/JWT keys live
  only in server secret managers.
- Confirm `pnpm verify` is green locally if GitHub Actions is unavailable.

Database:

- Provision Postgres 16.
- Run `pnpm db:migrate` against the target database.
- Rerun `pnpm db:migrate` and confirm no pending migrations.
- Confirm external database access is restricted unless an explicit operations
  need exists.

Content and claims:

- Run `pnpm content:validate`.
- Run `pnpm check-licenses`.
- Run `pnpm --filter @preventos/web build` to exercise claims lint in web
  `prebuild`.
- Confirm no user-facing content bypasses the sign-off registry.
- Confirm account export/deletion routes are reachable in API mode and return
  unauthenticated/expired-session errors rather than silently using mocks.

Safety:

- Confirm API safety tests and coach tests pass without LLM keys.
- In staging, send a normal tier-0 coach turn and confirm a governed reply.
- In staging, send tier-1 and tier-2 risk text and confirm the LLM is bypassed.
- Confirm mobile live API mode calls `/coach/messages` only for gate-cleared
  ordinary coach text.
- Confirm Steady public beta entry remains gated or referral-only.
- Confirm Nightshift public beta entry remains internal/gated.

App stores and mobile:

- Confirm Apple Developer account access.
- Confirm Google Play Console access.
- Confirm Expo account/project access and EAS credentials.
- Choose MockApi vs live API for each internal build.
- Set only `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, and
  optionally `EXPO_PUBLIC_CLERK_JWT_TEMPLATE` for live mobile builds; never
  embed server secrets in mobile.
- Verify granted notification permission registers a token through
  `/push/tokens`; delivery remains disabled while `PUSH_PROVIDER=noop`.
- Build with the intended EAS profile and install on clean iOS and Android
  devices.

Operations:

- Confirm owner-approved domains for API, web, and console.
- Put console behind staff-only access before exposing real data.
- Confirm rollback steps for web, console, API, worker, and mobile tracks.
- Confirm incident review and support contact policy without promising live
  clinical monitoring.

## Owner Decisions Still Required

- Hosting provider and paid plan acceptance.
- Deployment region.
- API, web, and console domains.
- Postgres backup, retention, and external access policy.
- Clerk tenants, allowed origins, redirect URLs, JWT/session templates, and key
  sets.
- Fireworks key and beta model policy.
- Push delivery provider, credentials, notification copy approval, monitoring,
  and quiet-hours policy.
- Apple Developer account/team and TestFlight ownership.
- Google Play Console account/package ownership.
- Whether public beta remains QuitKit + Exhale only, with Steady and Nightshift
  internal/gated.
