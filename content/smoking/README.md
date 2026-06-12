# QuitKit (smoking) content pack

> **DRAFT — PENDING CLINICAL SIGN-OFF.**
> Nothing in this directory may reach a real user until a sign-off entry exists in the
> `compliance/` sign-off registry (safety invariant 3, `CLAUDE.md`). Every file carries
> this stamp in its header.

Work package: **V.1c** (content-drafting half of WPV.1, `IMPLEMENTATION_PLAN.md` §5 WS-V).
Scope source: plan §2.2 (QuitKit) and PRD §5.1.

## Sourcing & alignment

All clinical-adjacent content is drafted from **public** UK guidance:

- NCSCT standard treatment programme and briefings (withdrawal-oriented behavioural
  support, quit-date setting, "not a puff" rule, combination NRT).
- NHS Better Health — Quit Smoking (craving facts, body-recovery timeline, vaping-to-quit
  positioning).
- NICE NG209 framing for cut-down-to-quit with NRT support.

Nothing here is a treatment claim; QuitKit is behaviour-change support. Prescription
medicines (varenicline, cytisine) get adherence support only — **no dosing content**
(PRD §5.1; coach fence WP6.3).

## Editorial rules (apply to every atom)

- **Tone:** autonomy-supportive. The user chooses; we offer. No "should/must", no shame,
  no scare framing. Positive recovery framing is allowed; disease-scare is not.
- **Reading age ≤ 9** for all user-facing text (`body`, `steps`, `script`, `items`,
  `options` strings). Staff-facing fields (`evidence_note`, comments) are exempt.
- **UK English.** UK services only (999/111, pharmacist, GP, midwife).
- **Instruments are never reproduced here.** Validated instrument items (HSI etc.) render
  verbatim from `packages/instruments` (safety invariant 2). Content atoms reference them
  by `instrument_ref` only.
- **No fabricated testimonials.** The ex-smoker story library ships as *slots* with a
  provenance requirement (`identity.yaml`); real stories are sourced and consented later.

## Atom schema (self-describing draft)

The WP4.1 validator does not exist yet. Until it does, this pack is the schema's living
spec — every file repeats the same shape so migration is mechanical.

```yaml
meta:
  pack: smoking
  programme: QuitKit
  module: <module-name>            # matches the filename
  status: draft-pending-clinical-sign-off
  schema: preventos.content-atom/0.1-draft
  language: en-GB
  sources: [<public guidance used>]
  defaults:                        # inherited by every atom; atoms may override
    reading_age: 9
    tone: autonomy-supportive
    channels: [app, web]
    vertical: smoking
    contraindications: []

atoms:
  - id: smoking.<module>.<slug>    # globally unique
    type: message | info_card | audio_script | exercise | plan_template |
          worksheet | jitai_message | chooser_item | checklist | outcome_prompt |
          signpost | story_slot
    title: <short title>
    body: <user-facing text>       # or steps / script / items / options per type
    bcttv1:                        # BCT Taxonomy v1 — code + label kept together
      - { code: "1.1", label: "Goal setting (behaviour)" }
    com_b:                         # any of: physical-capability, psychological-capability,
      - reflective-motivation      # physical-opportunity, social-opportunity,
                                   # reflective-motivation, automatic-motivation
    contraindications: []          # tags from the taxonomy below (overrides default)
    evidence_note: <staff-facing source pointer>
```

Optional per-type fields: `slots` (declared `{placeholder}` names used in the text),
`instrument_ref`, `duration_seconds` (audio), `trigger_window` (jitai_message),
`variant_group` (alternates the JITAI engine rotates through).

**Slot syntax:** `{snake_case}` placeholders. Every placeholder used in text must be
declared in `slots` — the WP4.2 linter will enforce "no dangling slots".

## Contraindication taxonomy (smoking pack, per WP4.1)

| Tag | Meaning | Effect when flagged on the user |
|-----|---------|--------------------------------|
| `pregnancy` | Pregnant or possibly pregnant | Suppress general NRT chooser content; route to `signposting.yaml` specialist atoms |
| `under_18` | Under 18 | Suppress; adult programme only (E18 analogue) |
| `recent_cardiac_event` | Recent heart attack / unstable heart condition | Suppress self-serve NRT chooser; prescriber-first signpost |
| `prescriber_medication` | On varenicline/cytisine | Show adherence atoms; never dosing content |
| `mood_flagged` | Low-mood markers present | Pair withdrawal low-mood card with mood signpost |

## File map

| File | Module |
|------|--------|
| `onboarding.yaml` | Welcome, pathway choice, quit-date prep, not-a-puff rule |
| `reduction.yaml` | Cut-down-to-quit scheduler copy, adherence-aware re-plans |
| `cravings-sos.yaml` | Urge-surfing audio scripts (90s/3m/5m), breathing pacer, delay timer |
| `cravings-menus.yaml` | Substitution menu, distraction pack, 4Ds card |
| `triggers.yaml` | Trigger taxonomy, logging prompts, if-then plan templates |
| `lapse-debrief.yaml` | Morning-after debrief flow, AVE reframes, streak repair |
| `risk-windows.yaml` | JITAI micro-support atoms per learned risk window |
| `identity.yaml` | Non-smoker narrative arc, identity reflections, story slots |
| `nrt.yaml` | Product chooser, technique coaching, side-effect coping, adherence |
| `withdrawal.yaml` | What-to-expect timeline, symptom coping cards |
| `savings.yaml` | Savings rail copy, goal-pegging templates |
| `milestones.yaml` | Days-won explainer, milestone celebrations |
| `household-co-quit.yaml` | Co-quit invites, supporter guidance, smoke-free home |
| `outcomes.yaml` | Russell-Standard-compatible self-report wordings (10.3 signs these) |
| `signposting.yaml` | Pregnancy / urgent-symptom / mood / medicines signposts |

## Sign-off status

| Gate | Status |
|------|--------|
| Drafted (this WP) | ✅ 2026-06-12 |
| WP4.2 pipeline validation | ⏳ pending (validator not built) |
| BCT audit (WPV.1 acceptance) | ⏳ pending |
| Clinical sign-off (WP10.2, gate G3) | ❌ **not started — pack must not ship** |
