# Claims register v0 — WP10.10

> **DRAFT — refreshed 2026-06-18.** Approved-language entries are *draft-pending-signoff*; nothing in
> §3 may appear in shipped copy until the owner + clinical reviewer adopt this register.
> The blocklists in `claims-register.json` are active immediately as a guard (better to
> over-block in CI than leak a claim). Gate: G5. Plan refs: E16, WP4.2, risk "treatment-claim drift".

## 1. Why this exists

Nightshift ships full CBT-I-style mechanics under **wellbeing framing**. The line we must
not cross (MHRA medical-device boundary, plan E16): claiming to **treat, cure, or diagnose
insomnia or any sleep disorder** — in app copy, store listings, or marketing. The same
discipline applies product-wide: no medical/disease claims anywhere without sign-off.
This register is the single source of truth for (a) language we may use, (b) language that
is structurally forbidden, and (c) the machine-readable blocklist the content lint (WP4.2)
enforces in CI on every content atom and marketing page.

## 2. Mechanics

- `claims-register.json` — the enforced artifact. Three blocklists:
  `sleep-treatment-claims` (E16, the wired one), `alcohol-clinical-claims` (E17 adjacency),
  `global-medical-claims` (everything else).
- Every pattern carries an id and rationale. Test vectors in the same file pin behaviour;
  `check-claims-register.mjs` validates patterns + vectors and checks arbitrary copy:
  `node compliance/claims/check-claims-register.mjs --check "<copy>"` → exit 1 if blocked.
- **Exemption — validated instruments:** text rendered verbatim from `packages/instruments`
  (e.g. the SCI's own items mention "sleep problem" severity) is exempt from the lint;
  safety invariant #2 (verbatim rendering) governs it instead. The lint must scope to
  content atoms + marketing copy, never instrument renders.
- False positives are expected and acceptable in v0 (e.g. "speak to a therapist" passes, but
  some legitimate signposting may trip a pattern). Resolution path: rewrite the copy, or add
  a reviewed, justified exception entry to the register — never weaken a pattern ad hoc.
- Required beta disclaimers live in `consumer-beta-disclaimers.md`. They are limiting
  statements, not promotional claims; the register must allow negative phrases such as
  "not a medical device" and "does not diagnose" while still blocking positive clinical or
  regulatory-status claims.

## 3. Approved language (draft — per vertical)

Status of every entry: **draft-pending-signoff**. The JSON carries the canonical list; this
section explains the framing rules a reviewer should apply when extending it.

| Vertical | Framing rule | Example approved (draft) | Never |
|----------|--------------|--------------------------|-------|
| Nightshift (sleep) | Wellbeing outcomes: feel, habit, routine, quality. Describe what the user does, not what we treat. Signpost to GP for suspected disorders | "Build a sleep routine that works for you" · "Most people see their sleep quality improve within weeks" (VERIFY: needs evidence basis before sign-off) | treatment/cure/diagnosis claims; naming CBT-I or "therapy"; medication comparisons; device claims |
| Steady (alcohol) | Moderation + control framing for increasing/higher-risk tiers only; "low-risk", never "safe"; referral language for dependence | "Take back control of your drinking" · "Drink less, feel better" | detox/withdrawal guidance; "safe drinking"; dependence-treatment claims |
| QuitKit (smoking) | Quit support framing; NRT = usage technique support, signpost prescribers | "Your personal quit plan" · "Craving support that's there in the moment" | cessation-outcome guarantees; NRT prescribing/dosing language; disease-treatment claims |
| Exhale (vaping) | Appearance/performance/money/freedom framing | "Spend less, breathe easier" (VERIFY: "breathe easier" with clinical reviewer — health-adjacent) | disease-scare framing; health-outcome claims; youth-directed anything |

## 4. Required consumer-beta disclaimers

Status: **draft-pending-owner/legal-signoff**. These statements should appear in store
metadata, onboarding, terms, coach first-run, and safety/legal surfaces as appropriate:

- PreventOS is a wellbeing and habit-support app for adults.
- PreventOS is not a medical device.
- PreventOS does not diagnose, treat, cure, or prevent any disease or condition.
- PreventOS is not an emergency service and is not monitored for urgent help.
- Users should consult a qualified health professional about symptoms, medicines,
  nicotine replacement products, alcohol withdrawal, sleep problems, or any health concern.

## 5. Wiring plan (WP4.2)

Content lint loads `claims-register.json`, runs all three blocklists over: content-atom text
fields, marketing site copy (`apps/web` marketing routes), and store-listing source files.
`sleep-treatment-claims` additionally runs over coach post-filter fence config (WP6.3 — the
coach must not *say* what marketing must not *write*). CI fails on any match without a
register exception entry.

## Sign-off block

| Role | Name | Date | Decision |
|------|------|------|----------|
| Owner | TBD | TBD | adopt register + approved language |
| Clinical reviewer | TBD | TBD | confirm framing rules + approved entries |
