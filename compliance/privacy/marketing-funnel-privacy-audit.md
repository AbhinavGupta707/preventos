# Marketing waitlist & conversion-funnel — payload privacy audit (WP8.2)

> **DRAFT — 2026-06-13.** Extends `dpia-core.md`; covers only the pre-account
> marketing surface (`apps/web` waitlist + first-party conversion funnel → the
> `marketing` Postgres schema). Gate: G4. TBD(legal)/TBD(DPO) review required
> before launch. Cross-references `article-9-analysis.md` and `privacy-policy-draft.md`.

## What this audit answers

The WP8.2 scope question: *does any special-category (UK GDPR Art. 9) data reach
a third party through the marketing funnel?* **Finding: no.** The funnel is
entirely first-party, structurally isolated from clinical data, and gated by an
allow-list that cannot carry free text, identifiers, or special-category fields.

## Data captured

| Sink | Field | Classification | Notes |
|------|-------|----------------|-------|
| `marketing.waitlist_signup` | `email` | Personal data (Art. 4) | The only direct identifier in the funnel. |
| | `programme` | **Potentially health-related** (Art. 9-adjacent) | Coded enum `quitkit \| exhale \| steady \| nightshift \| unsure`. Interest in a cessation programme can imply health context — treated as sensitive even though it is an interest signal, not a diagnosis. Never free text. |
| | `created_at` | Operational | — |
| `marketing.funnel_event` | `name` | Operational | Coded enum (`waitlist_joined`, `savings_calculated`, `sleep_debt_calculated`, `programme_page_cta_clicked`). |
| | `path` | Operational | Page path, ≤200 chars. |
| | `properties` | Operational | Coded values only: short strings (≤100 chars) or numbers, ≤10 keys. **No identifiers, no free text, no Art. 9 fields.** |
| | `received_at` | Operational | — |

## Controls

1. **Schema isolation (structural).** The two tables live in their own
   `marketing` Postgres schema with **no foreign key to `core.person`**
   (migration `0006_marketing.sql`; proven by `marketing.integration.test.ts`).
   A waitlist lead is not a person — no consent record, no enrolment, never
   joined to clinical rows. A lead becomes a person only later, via the normal
   pseudonymous sign-up.
2. **Allow-list at the boundary (technical, authoritative).** `apps/api` is the
   store of record. `waitlistSignupSchema` and `funnelEventSchema`
   (`apps/api/src/schemas.ts`) are `.strict()` allow-lists: programme/event names
   are enums; funnel property values are restricted to short scalars (no nested
   objects/arrays, ≤100-char strings, ≤10 keys). This is what makes it
   *structurally impossible* to smuggle free text, a date of birth, a postcode,
   or any special-category value through `properties`. Enforced + tested in
   `apps/api/test/marketing.integration.test.ts`.
3. **First-party only (no processors).** All sinks are first-party: the web
   routes forward to `apps/api` → our own Postgres, with a local `.data/*.ndjson`
   file as the dev/offline fallback. There is **no analytics SDK, no third-party
   pixel/tag, and no data processor** in this path. Nothing is transmitted to any
   third party — so no special-category data can reach one.
4. **Minimisation in the console.** `/evidence` reads only coded aggregates
   (per-programme counts, per-event counts) from the `marketing` schema — never
   email or per-lead rows.

## Findings

- **PASS — no special-category data to third parties.** The funnel is first-party
  end to end; the allow-list prevents special-category values in event payloads;
  programme interest never leaves our infrastructure.
- **FLAG (DPO) — programme interest is Art. 9-adjacent.** Although coded and
  first-party, expressing interest in an alcohol/smoking/sleep programme can imply
  health context. Confirm the lawful basis (explicit opt-in consent at waitlist
  join) and the Art. 9 condition in `article-9-analysis.md`.
- **PASS — email is the only identifier**, held first-party in an isolated schema,
  trivially purgeable (single-schema deletion by email).

## Owner / TBD actions before launch

- TBD(DPO): confirm the waitlist retention period in
  `retention-deletion-schedule.md` and a deletion/suppression path on request
  (the isolated schema makes a by-email purge straightforward).
- TBD(legal): confirm lawful basis (consent for the signup; legitimate interest
  for coded aggregate funnel analytics) and update `privacy-policy-draft.md`
  (marketing/waitlist section) and the cookie/consent copy on `apps/web`.
- If a third-party analytics provider is ever added, this finding is void —
  re-run the audit and add a processor + international-transfer assessment.
