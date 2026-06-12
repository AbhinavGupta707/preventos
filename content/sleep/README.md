# Nightshift content pack — DRAFT (WP V.4c)

**Status: DRAFT. Nothing in this directory may reach a real user without a sign-off
registry entry in `compliance/` (CLAUDE.md invariant 3).**

This pack contains the user-facing content half of WPV.4 (the titration engine is a
separate work package). Modules:

| File | Module |
|------|--------|
| `pack.yaml` | Manifest, claims posture, module index |
| `stimulus-control.yaml` | Bed–sleep connection coaching |
| `cognitive-restructuring.yaml` | Unhelpful-sleep-thought reframing atoms |
| `wind-down-audio.yaml` | Wind-down audio voiceover scripts |
| `rescue-2am.yaml` | "Can't sleep right now" rescue-mode copy (dark UI, audio-first) |
| `shift-worker.yaml` | Shift-worker protocol variants |
| `orthosomnia.yaml` | Sleep-tracker de-escalation content |
| `safety-screens.yaml` | Occupation / daytime-sleepiness safety-screen scripts |

## Framing rules (E16 — read before editing any copy)

Nightshift ships full behaviour-change mechanics under **wellbeing framing**. Copy
supports better sleep habits; it never states or implies that the programme detects,
addresses, or resolves a health condition (CLAUDE.md invariant 5; plan E16; PRD §10.1).

**Claims blocklist** — these terms (and their inflections) must not appear anywhere in
the pack's YAML files, including metadata and comments:

> treat / treatment · therapy / therapeutic · cure · clinical / clinically ·
> diagnose / diagnosis · insomnia · CBT / CBT-I · patient · prescribe / prescription ·
> disorder · symptom · restriction (use "sleep window") · medication (use "sleep
> medicines", signposting only)

Self-check (must return no matches):

```sh
grep -rinE '\b(treat\w*|therap\w*|cure[sd]?\b|clinic\w*|diagnos\w*|insomnia\w*|cbt\w*|patient\w*|prescri\w*|disorder\w*|symptom\w*|restriction\w*|medicat\w*)' content/sleep/*.yaml
```

This list seeds the claims register (WP10.10) and the content lint (WP4.2). Until that
lint exists in CI, run the self-check before every commit touching this directory.

Additional copy rules:

- **Soft outcome language only.** "Many people find…", "can help…", "tends to…".
  Never "will fix", "proven to", "guaranteed".
- **Signposting is allowed and encouraged** ("your GP or pharmacist is the right
  person to ask about sleep medicines") — but never advise starting, stopping, or
  changing medicines.
- **Validated instruments (SCI etc.) are NOT in this pack.** They render verbatim from
  `packages/instruments` (invariant 2). The safety-screen questions here are bespoke
  routing questions, deliberately not adapted from any validated instrument.
- en-GB spelling; reading age ≈ 9–11; tone default is autonomy-supportive.

## Atom shape

Per PRD §3.2 [TS] (BCT-labelled content graph) and plan WP4.1:

```yaml
- id: sleep.<module>.<slug>
  status: DRAFT
  type: message | exercise | audio_script | screen_script
  title: <internal title>
  bct: ["<BCTTv1 codes>"]
  com_b: [<COM-B targets>]
  reading_age: 9
  channels: [in_app, push, audio, sms]
  tone: autonomy-supportive | practical | warm-challenge
  contraindications: [<taxonomy tags>]
  requires: [<enrolment/flag preconditions>]
  body: |
    <user-facing copy>
```

Contraindication tags used in this pack:

- `flag:occupation-safety` — never serve window-tightening or nap-skipping
  encouragement to users flagged by the occupation safety screen.
- `profile:shift-worker` — standard circadian-anchor atoms are replaced by
  `shift-worker.yaml` variants (see `variant_of` fields).
- `enrolment:nightshift` — window-related copy only inside Nightshift enrolment
  (plan WP4.1: no sleep-window content outside enrolment).
