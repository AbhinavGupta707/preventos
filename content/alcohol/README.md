# Steady — alcohol content pack (DRAFT)

**Status: DRAFT. Nothing in this directory may reach a real user until a sign-off
registry entry exists in `compliance/` (CLAUDE.md invariant 3).**

Drafted for WP V.3c (content half of WPV.3). Rules, hard-stop enforcement logic,
unit-calculator code, and JITAI wiring are the other half of WPV.3 and live in
package code/config — this directory is copy and structured content only.

## Files

| File | Contents |
|------|----------|
| `pack.yaml` | Pack manifest: instruments (by registry id), goal types, risk windows, contraindication taxonomy, escalation deltas |
| `diary.yaml` | Emotionally-safe drink-diary copy: quick-log, retro-fill mercy, post-log acknowledgements, drink-free-day language |
| `tomorrow-morning.yaml` | Prospective-framing engine copy: evening prompts, pre-window countdowns, morning loop-closers |
| `social-survival.yaml` | Social-event survival plans: spacing, alternation scripts, refusal lines, exit plans, post-event debrief |
| `units-education.yaml` | UK-unit education: what a unit is, the maths, drink examples, CMO low-risk guidelines, myth-busters |
| `normative-feedback.yaml` | Normative-feedback templates with data slots + display rules to avoid boomerang effects |
| `lapse-debriefs.yaml` | AVE-tuned lapse debriefs: lapse ≠ relapse, functional analysis, plan repair, repeat-lapse compassion ladder |
| `referral-hard-stop.yaml` | **Dependence hard-stop referral scripts (invariant 4).** Warm routing to local services. Contains NO reduction pathway. |

## Atom shape

Every file is `meta:` + `atoms:`. Each atom:

```yaml
- id: steady.<surface>.<slug>     # stable, dot-namespaced
  kind: microcopy | script | plan | education | feedback-template | debrief
  surface: where it renders (diary.quicklog, hardstop.screen, …)
  audience: all | dependence-flagged   # who MAY see it
  contraindications: []                # taxonomy keys that BLOCK it (WP4.1)
  body: the copy (slots as {{slot_name}})
```

Contraindication taxonomy keys used here: `dependence-flagged`, `pregnancy-flagged`.
Per plan WP4.1: **no alcohol-moderation content for dependence-flagged users** — every
moderation/goal/reduction atom in this pack carries `contraindications: [dependence-flagged]`.
Only `referral-hard-stop.yaml` atoms (and crisis content owned by `packages/safety`)
have `audience: dependence-flagged`.

## Invariants honoured (CLAUDE.md)

1. **Instruments verbatim (inv. 2):** AUDIT / AUDIT-C question text appears NOWHERE in
   this pack. Intake references instruments by registry id only (`pack.yaml`).
2. **Sign-off before exposure (inv. 3):** every `meta.status` is `DRAFT`, `signoff: null`.
3. **Dependence hard stop (inv. 4):** `referral-hard-stop.yaml` offers referral only —
   no unit caps, no drink-free-day goals, no moderation framing, no in-app reduction
   pathway. It also never instructs tapering/detox (PRD: no unsupported solo detox;
   plan WP6.3: no detox guidance in Steady) — it warns that stopping suddenly can be
   dangerous and routes to medical support.
4. **Tone:** no shaming anywhere — no red ink, no "failed/ruined/wasted", no moral
   language. Lapses are data, not verdicts.

## Before sign-off (G3 reviewer checklist seeds)

- Verify all service phone numbers/URLs in `referral-hard-stop.yaml` are current.
- Clinical review of unit maths examples and CMO guideline framing.
- Normative-feedback data source must exist before those templates activate
  (slots render nothing without it — see display rules in that file).
- Hard-stop criteria themselves (AUDIT thresholds etc.) are WP10.3 parameter-sheet
  items, signed separately; this pack only carries the copy.
