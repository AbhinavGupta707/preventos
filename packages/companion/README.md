# @preventos/companion — the avatar state engine (WS-AV / AV.2)

The presentation **brain** for "Sprout", the 2D companion. Pure, deterministic, side-effect-free:
a snapshot of platform state in, a fully-resolved `CompanionView` out (`companionView(snapshot)`).
Safe to call on every render.

## What it is / isn't
- It is the single mapping from platform signals (days-won, lapse, SOS, dormancy, time-of-day,
  context) → companion **mood**, **dialogue slot**, **evolution stage**, and **animation hints**.
- It is NOT the renderer (see `demo/` for reference motion) and NOT a source of copy.

## Binding ethical rules (plan E21; CLAUDE.md safety invariants) — enforced in code + tests
1. **Steps aside in a crisis.** `context: "crisis"` → `mood: "stepped_aside"`, `visible: false`,
   `dialogueSlot: null`. A cute creature must never present tier-1 risk content (invariant 1, presentation side).
2. **Never guilts or punishes.** A lapse → `concerned` (care), never disappointment; days-won is
   never shown as reset. There is no "sad/blame" mood in the type.
3. **No variable reward / loot.** Evolution stages and cosmetics unlock on **deterministic
   days-won milestones only** (`stages.ts`). No randomness.
4. **Copy stays governed.** The engine returns dialogue **slot ids** (`companion.lapse.care`),
   never user-facing text. Lines come from clinically-signed content packs (invariant 3). The avatar
   is the face of the one guardrailed coach — never a second, ungoverned voice.
5. **Reduced-motion** is passed through to the renderer in `animation.reduceMotion`.

## Renderer contract
A renderer (web React-DOM today; RN + Rive in production) consumes `CompanionView`:
- `mood` → which animation/state-machine input to drive
- `animation.loopSeconds` / `animation.breathCycleSeconds` (the 4s-in/6s-out co-regulation pace)
- `evolutionStage` / `unlockedAccessories` → which rig layer + cosmetics to show
- `dialogueSlot` → look up governed copy and render in the coach voice

## Reference motion
`demo/index.html` is a complete, runnable animated reference (SVG + CSS keyframes, all moods,
days-won evolution, reduced-motion aware). Preview it with the `companion-demo` launch config or
open the file directly.

## Production path (AV.1 / AV.3 — not in this package)
- **AV.1**: commission a Rive rig (or start from a Rive marketplace base) with a state machine whose
  inputs match `CompanionMood` + `evolutionStage`. One `.riv` asset serves mobile (rive-react-native)
  and web. Character design is an owner/design decision.
- **AV.3**: wire `companionView` into the mobile home surface, SOS co-breathing, and the coach screen;
  the crisis screen must render with the companion absent (mood `stepped_aside`), re-proving invariant 1
  at the app layer.
