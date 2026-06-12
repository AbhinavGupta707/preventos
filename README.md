# PreventOS

Multi-vertical digital behaviour-change platform. One app, four programmes at launch:
smoking (QuitKit), adult vaping (Exhale), alcohol (Steady), sleep (Nightshift).

- Product spec: [PreventOS_Product_Requirements_Document_v1.md](./PreventOS_Product_Requirements_Document_v1.md)
- Build plan: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

## Development

Requires Node 22 and pnpm 10 (pinned in `.tool-versions`).

```sh
pnpm install          # always from repo root
pnpm verify           # typecheck + lint + test + license check
docker compose up -d  # local Postgres
```

## Structure

- `packages/` — platform core (shared, domain, then db/events/consent/content/decisions/coach/safety/…)
- `apps/` — mobile (Expo), web (Next.js), api (Fastify), worker, console, crisis-static
- `content/` — per-vertical content packs (YAML; DRAFT until clinically signed off)
- `compliance/` — DPIAs, hazard log, sign-off registry, claims register

Import boundaries are lint-enforced: `domain` imports only `shared`; verticals contribute
content + rules + config, never core code changes.
