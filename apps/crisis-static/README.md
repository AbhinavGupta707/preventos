# crisis-static

The standalone crisis-resources page (WP7.2). `public/` is the entire deployable —
host it on any static host or CDN, completely separate from the platform, so crisis
resources stay reachable even when the app or API is down (launch gate G2 posture).

Isolation contract (all test-enforced):

- zero `@preventos/*` imports — lint-enforced via `eslint.config.mjs` at the repo root
- no JavaScript, no external requests, no fonts, no analytics — renders offline
- dark by default, calm palette — safe to open at 2am (plan WP7.2)
- resource numbers must match `packages/safety/src/resources.ts`
  (cross-checked by a `@preventos/red-team` test, not by importing platform code)

Serve locally: `python3 -m http.server --directory public 8099`
