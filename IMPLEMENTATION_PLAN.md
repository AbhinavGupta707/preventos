# PreventOS — Implementation Plan v3.0

**Source:** `PreventOS_Product_Requirements_Document_v1.md` (PRD v1.0)
**Supersedes:** v2.0 (single-vertical). v3.0 reflects the owner's decision of 2026-06-12: launch
**four fully-built verticals** in one app — smoking, vaping (adult), alcohol, sleep — at full
blue-sky software depth.
**Status:** Active — execution started (M0 in progress).

---

## 0. How to read this plan

§1 decisions · §2 what we build (per-vertical + shared) · §3 deferred + triggers · §4 architecture ·
§5 software work packages · §6 human-owned track + launch gates · §7 milestones · §8 quality ·
§9 evidence targets · §10 risks · §11 open items. Every work package (WP) is hand-off-ready:
goal, scope, acceptance criteria, dependencies, agent pairing.

---

## 1. Decision log

### Owner decisions
| ID | Decision | Value |
|----|----------|-------|
| O1 | Build intent | Real product, publicly launched, production quality |
| O2 | AI coach in v1 | Yes — guardrailed LLM coach from launch |
| O3 | Channels | Mobile app (iOS + Android) + web app + marketing site; SMS/voice/TV are later bolt-ons |
| O4 | Go-to-market | Organic engagement first; contracts only after evidence |
| O5 | Stack & spend | Per engineering defaults; minimal spend ramp |
| O6 | Escalation staffing & clinical reviewer | Owner arranges (gates G2/G3) |
| O7 | **Vertical scope** | **Four wedges, fully built: smoking (QuitKit), adult vaping (Exhale), alcohol (Steady), sleep (Nightshift)** — blue-sky functionality wherever software-reachable |

### Engineering defaults (flag to override)
| ID | Decision | Value | Rationale |
|----|----------|-------|-----------|
| E1 | Product shape | **One app, four programmes** (programme switcher + unified "today" surface), one consumer brand (placeholder "PreventOS") | One funnel; cross-vertical screening/cross-sell (PRD §3.1 [D]); single burden budget. Brand architecture = PRD Open Q1, owner can rename anytime pre-launch |
| E2 | Mobile | Expo (React Native, TS strict), expo-router, NativeWind, Expo push, EAS | One codebase iOS+Android; shares domain packages with web |
| E3 | Web | Next.js: marketing/SEO site + logged-in web app at parity | Organic acquisition needs public web |
| E4 | Backend | Fastify + PostgreSQL 16 + Drizzle + graphile-worker; pnpm/turborepo monorepo | Carried from v2 |
| E5 | Auth | Clerk behind an auth port + own staff RBAC | Speed; swappable |
| E6 | LLM | Claude API behind in-house policy-enforcement proxy; provider port for dual-provider later | Guardrails outside the model (PRD §3.3) |
| E7 | Safety sequencing | Deterministic safety rail built & green **before** the coach speaks to anyone | Non-negotiable under O2 |
| E8 | Events | Append-only Postgres events + outbox; DecisionRecords MRT-ready from day one | PRD §7.2 schema preserved |
| E9 | FHIR | FHIR-aligned domain model + export module; server deferred | PRD §7.1 honored at schema level |
| E10 | Analytics | PostHog + own event lake as truth; in-house evidence dashboard | Evidence is the commercial output |
| E11 | Licenses | No GPL/AGPL; CI-enforced | PRD §3.2 broadened |
| E12 | Content rule | Nothing reaches a real user without clinical sign-off recorded; pipeline-enforced | |
| E13 | Crisis resilience | Crisis resources bundled offline in-app + isolated static endpoint | PRD §8.2 degraded mode |
| E14 | Spend ramp | £0 local → free tiers + LLM eval budget (M2) → UK cloud + store fees (launch) | |
| E15 | **Blue-sky scope rule** | Build all [TS]+[D] and all **software-only** [BS] features for the four verticals (conversational intake, wearable corroboration, combined pathways, generative variant tooling offline). Hardware [BS], partnership [BS] (open banking, GAMSTOP), and all [R] items stay gated per the PRD's own gates | "No engineering constraints" honored; regulatory/ethical/partnership constraints stay binding (PRD assumption set) |
| E16 | **Regulatory posture for sleep** | Nightshift ships full CBT-I mechanics under **wellbeing framing** — no insomnia-treatment claims in any copy. Claims register (WP10.10) gates all marketing language. SaMD pursuit is a separate owner decision | PRD §10.1 boundary rule: treatment claims cross the MHRA line (§10.2: sleep = first SaMD candidate) |
| E17 | Alcohol safety posture | AUDIT at intake; dependence/withdrawal-risk indicators → **hard stop**: no in-app reduction pathway, scripted referral to local services. Moderation pathways only for increasing/higher-risk tiers | PRD §5.3: unsupervised withdrawal is dangerous |
| E18 | Vaping scope | Adults (18+, age-gated) only at launch; youth mode is a structurally separate build (Children's Code, safeguarding) — deferred | PRD §5.2 segments |
| E19 | Instruments | HSI (smoking), time-to-first-vape index (vaping), AUDIT-C/AUDIT (alcohol — WHO, free), SCI preferred over ISI for sleep pending licensing audit; PHQ-2/GAD-2 as signpost-only cross-screens (public domain) | ISI has commercial licensing burden; SCI is the Sleepio-class instrument |
| E20 | Toolchain pins | Node 22 + pnpm 10 pinned in `.tool-versions`; CI reads the same file | One source of truth for tool versions |

---

## 2. What we are building

**One app (iOS, Android, web): four complete behaviour-change programmes on the PreventOS core,
with one guardrailed AI coach that sees the whole person.**

### 2.1 Shared app surfaces (all programmes)
- **Onboarding:** ≤90s conversational-or-tap intake per programme; cross-vertical 2-item screens
  (smoker → alcohol/sleep/mood screens) with consented cross-enrolment offers (PRD §3.1 [D]/[BS]).
- **Unified "today" surface:** one next-best-action across all enrolled programmes (never one feed
  per programme); rescue button (craving/urge/can't-sleep) one tap from everywhere, offline-capable.
- **AI Coach:** one coach, vertical-specialised session frames; measurement-aware across programmes;
  MI-consistent; lapse debriefs; proactive check-ins; guardrails per §2.3 of plan v2 (unchanged:
  pre/post deterministic filters, scripted crisis flows, 100% logging, red-team CI).
- **JITAI orchestrator with cross-vertical arbitration:** single burden budget; programmes never
  message users directly (PRD §3.4 [D] — now genuinely needed, not speculative).
- **Universal relapse engine:** one state machine, per-vertical lapse definitions (cigarette /
  vape session / heavy-drinking day / 3 nights <85% sleep efficiency); "days won" never resets.
- **Savings rail:** money-not-spent across smoking+vaping+alcohol, goal-pegged.
- **Plans:** if-then builder, coping/relapse plans, co-edited with coach.
- **Consent centre, data export, deletion; safety net; evidence/analytics plane** — as plan v2.

### 2.2 Per-vertical scope (full [TS]+[D]+software-[BS] per E15)

**QuitKit — smoking (PRD §5.1):** quit-date or cut-down-to-quit with adherence-aware reduction
scheduler · craving SOS (urge-surfing audio 90s/3m/5m, delay timers, substitution/distraction menus,
breathing pacer) · trigger logging · if-then plans for top-3 triggers · morning-after lapse debrief ·
risk-window JITAI (first-cig time, commute, after-work, payday, drinking occasions — "drinking
tonight?" Friday prompts) · identity-shift programme (non-smoker narrative arc, milestone identity
reflections) · NRT product chooser + usage technique coaching (adherence support only, signpost to
prescribers) · savings with goal-pegging · household co-quit mode [BS] · outcomes: Russell-Standard-
compatible self-report (verification-tier model; CO upgrade path deferred to contracts).

**Exhale — adult vaping (PRD §5.2):** shares QuitKit machinery · time-to-first-vape dependence
proxy · withdrawal coaching, boredom-replacement menus, stealth-use functional analysis ·
device-tapering tools: puff-budget plans + nicotine-strength step-down ladders with product-mapping
database [BS] · dual-user routing (vape+smoke → QuitKit logic) · appearance/performance/savings
framing, never disease-scare · outcomes: 7-/30-day self-report abstinence, use-days, TTFV trajectory.

**Steady — alcohol (PRD §5.3):** AUDIT intake with severity laddering + **dependence hard-stop →
referral (E17)** · emotionally-safe drink diary (quick-log, retro-fill mercy, no shaming) · UK-unit
calculator · normative feedback · goal types: drink-free days, unit caps, spend caps ·
"tomorrow-morning" prospective framing engine · binge-risk countdowns before learned windows ·
social-event survival plans (spacing, alternation scripts, exit plans) · payday/Friday/fixture
risk-window JITAI · AVE-tuned lapse debriefs · savings mirror · DV/safeguarding lexicon elevated ·
outcomes: AUDIT-C trajectory, drinking days, heavy-drinking days, units/week.

**Nightshift — sleep (PRD §5.12):** full digital CBT-I mechanics under wellbeing framing (E16):
morning 4-tap sleep diary → SE/SOL/WASO computed · **sleep-restriction-style window titration:
algorithmic weekly adjustment from diary efficiency, with safety screens (excessive-daytime-
sleepiness occupations flagged → window floor + signpost)** · stimulus-control coaching · cognitive
restructuring for sleep beliefs · wind-down audio library · "can't sleep right now" 2am rescue mode
(dark UI, audio-first) · shift-worker protocol [D] · wearable-informed-not-wearable-led corroboration
(HealthKit/Health Connect; diary primacy; orthosomnia-aware de-escalation content) [BS] · combined
pathways: sleep+alcohol, sleep+smoking shared-diary burden management · outcomes: SCI, diary-derived
SE/SOL/WASO trajectories.

### 2.3 Definition of Done — five demo scripts

**A — Smoking journey:** install → ≤90s intake → quit date → countdown pushes → craving SOS offline
→ slip → debrief → plan repair → streak survives → savings correct → 4-week outcome recorded.
**B — Safety (release-blocking):** self-harm-adjacent text → scripted crisis flow ≤2s + escalation
case + SLA timer, LLM provably bypassed · jailbreak corpus 100% refused · backend killed → offline
crisis resources still render · **alcohol intake with dependence indicators → hard stop + referral,
no reduction pathway offered** · **HGV-driver profile in Nightshift → titration floor applied**.
**C — Cross-vertical:** smoker's intake screens flag Friday drinking + poor sleep → consented
cross-enrolment into Steady + Nightshift → unified today-surface shows one arbitrated plan →
notification count stays within the single burden budget (provable from DecisionRecords).
**D — Sleep loop:** 14 days of simulated diaries → window computed → week-2 titration adjusts per
rules → user sees SE improve in plain language → wearable data corroborates but never overrides diary.
**E — Evidence:** dashboard shows funnel, D1/D7/D30 retention, per-programme engagement + outcome
trajectories, cross-enrolment rates, by acquisition source/age/sex; k≥5 suppression; export.

---

## 3. Deferred (un-defer triggers)

| Deferred | Trigger |
|---|---|
| Youth vaping mode (13–17) | Owner decision + safeguarding build + Children's Code conformance (PRD §5.2/§3.11) |
| SMS, IVR/voice, WhatsApp, TV channels | Channel demand or commissioned cohort |
| Hardware verification (CO monitors, breathalysers) + fleet | First verified-outcome contract |
| Open banking, GAMSTOP, GP Connect, NHS login, EPS | Partnership/commissioning phase |
| Commissioner dashboard, DTAC pack, PbR module | First serious commissioner conversation |
| Gambling, weight, T2D, hypertension, activity-standalone, mood, MSK, ageing, adherence verticals | Post-launch traction; each = content + rules + instruments on the proven core |
| SaMD programme (sleep treatment claims) | Owner strategy decision (E16) |
| Phase-3 sensing (voice, keystroke, rPPG, pupillometry); all [R] items | Ethics approvals + validation (PRD §6.2) |
| Bandit/RL policies, feature store, Kafka | First MRT or volume threshold |
| 20+ language packs, BSL | Demand; i18n plumbing ships in schema from M0 |

---

## 4. Architecture

### 4.1 Monorepo (modular monolith; verticals = content + rules + config only)

```
preventos/
├── apps/
│   ├── mobile/               # Expo app (all four programmes)
│   ├── web/                  # Next.js: marketing site + web app
│   ├── api/                  # Fastify: domain APIs, coach proxy
│   ├── worker/               # graphile-worker: JITAI, schedules, outbox, SLA clocks
│   ├── console/              # Next.js: staff console + evidence dashboard
│   └── crisis-static/        # Isolated crisis endpoint (zero platform deps)
├── packages/
│   ├── shared/               # Result types, branded types, config, test utils
│   ├── domain/               # Entities, FHIR mappings, invariants (imports ONLY shared)
│   ├── db/ events/ consent/ content/ instruments/ outcomes/
│   ├── decisions/            # Rules engine, JITAI + cross-vertical arbitration, relapse SM
│   ├── coach/                # Session frames, context assembly, policy-proxy client
│   ├── safety/               # Risk lexicon, pre/post filters, escalation routing
│   └── ui/                   # Shared design tokens/primitives
├── content/{smoking,vaping,alcohol,sleep}/   # YAML packs (DRAFT until signed off)
├── compliance/               # DPIAs, hazard log, sign-off registry, claims register (DRAFT)
└── tools/                    # Content linter, red-team runner, license checker, journey simulator
```

Import-boundary lint: `domain` imports only `shared`; vertical content/config may not import core
internals; no app imports another app. Files ≤400 lines.

### 4.2 Data model deltas vs v2
Multi-enrolment: `Person 1—N Enrolment(vertical)`; BFO is per-person with per-vertical sections;
one burden budget per person (not per enrolment); DecisionRecords carry `vertical` + arbitration
context (candidates from all enrolled programmes); lapse definitions per vertical in config, not code.
Sleep adds `SleepDiaryEntry` (raw taps) + derived `SleepMetrics` (SE/SOL/WASO, windowed) +
`SleepWindow` (versioned titration history — every adjustment auditable). Alcohol adds
`DrinkLogEntry` + unit computation. All FHIR-mapped (Observation/CarePlan) per PRD §7.1.

### 4.3 Coach request path, environments, safety isolation — unchanged from plan v2 §4.3–4.5.

---

## 5. Software work packages

Sizing S/M/L as before. TDD, ≥80% core-logic coverage, code-reviewer pass on everything;
security-reviewer on auth/safety/consent/payload surfaces; database-reviewer on schema.

### WS1 — Platform core
- **WP1.1a Root monorepo & CI scaffold** — S — pnpm+turborepo, strict TS, Vitest, ESLint with
  import boundaries, `.tool-versions` (E20), docker-compose (Postgres), GitHub Actions
  (typecheck/lint/test/license-check/secret-scan), `shared` + `domain` foundation packages.
  Accept: clean clone → `pnpm install && pnpm verify` green; GPL dep fails CI; boundary violation fails lint. **← STARTED 2026-06-12**
- **WP1.1b App shells** — S — Expo app + Next.js web + console boot to hello-screens; EAS profiles.
  Accept: EAS internal build installs on both platforms; `pnpm dev` runs all shells.
- **WP1.2 Domain model & persistence** — L — entities per §4.2 incl. multi-enrolment, sleep/alcohol
  structures; Drizzle schema/migrations/repos; append-only enforcement at DB level; pseudonymisation
  boundary; FHIR mapping doc. Accept: idempotent migrations; invariant property tests; ≥80% coverage.
- **WP1.3 Consent ledger & privacy surface** — M — per-purpose grants incl. cross-enrolment and
  wearable-data purposes; export + deletion (store-compliant). Accept: revoked purpose blocks
  dependent action; deletion e2e with audit carve-outs.
- **WP1.4 Event backbone & DecisionRecords** — M — typed catalogue; outbox; arbitration-aware
  decision schema (vertical, candidate set across programmes, randomisation prob). Accept:
  immutability; journey replay; MRT-schema validation.
- **WP1.5 Auth & RBAC** — M — Clerk port; staff console auth (TOTP); k≥5 aggregate-only analyst role
  in query layer. Accept: permission matrix tested; suppression verified at API.

### WS2 — Mobile app
- **WP2.1 Foundation & design system** — M — navigation, NativeWind tokens, offline/error states,
  deep links; calm non-clinical identity. Accept: EAS builds install; design review pass.
- **WP2.2 Onboarding & intake** — L — per-programme ≤90s flows; **conversational intake option via
  coach (instruments still rendered verbatim — policy rule)** [BS]; cross-vertical 2-item screens +
  consented cross-enrolment offers; value before account friction; 18+ age gate for Exhale (E18).
  Accept: median <90s in scripted usability runs; verbatim rendering verified; cross-screen → offer
  → enrolment e2e; age gate untraversable.
- **WP2.3 Today surface & rescue** — L — unified next-best-action across enrolled programmes;
  rescue button context-aware (craving/urge/can't-sleep by time + enrolments); offline assets.
  Accept: rescue ≤1 tap everywhere incl. airplane mode; arbitration drives the surface (no
  per-programme feeds).
- **WP2.4 Plans, savings, milestones** — M — cross-programme savings rail; if-then builder;
  milestone identity moments per vertical. Accept: savings property-tested across multi-programme
  prices; milestones fire exactly once.
- **WP2.5 Push & JITAI delivery** — M — Expo push, inline-action notifications, quiet hours,
  permission choreography. Accept: time-warped journey delivers each push exactly once within budget.
- **WP2.6 Coach chat UI** — M — streaming, session-frame affordances, crisis flows visually
  distinct, cross-device transcripts. Accept: first-token p95 <1.5s staging; crisis renders with
  LLM path down.

### WS3 — Web
- **WP3.1 Marketing site** — M — four programme landing pages; savings calculator + sleep-debt
  calculator as lead magnets; SEO content hub through the governed content pipeline; waitlist.
  Accept: Lighthouse ≥90; conversion instrumented; claims-register lint on all copy (E16).
- **WP3.2 Web app parity** — L — all programme flows incl. sleep diary and drink log; WCAG 2.2 AA.
  Accept: Demo A/C/D pass on web; axe-core zero criticals; no forked business logic.

### WS4 — Content system
- **WP4.1 Content-atom schema & store** — M — as v2 + per-vertical contraindication taxonomy
  (e.g. no alcohol-moderation content for dependence-flagged users; no sleep-restriction content
  outside Nightshift enrolment — PRD §3.2). Accept: contraindication enforcement tested.
- **WP4.2 Authoring pipeline & governance** — M — as v2 + claims-register lint (marketing/treatment
  language blocklist for sleep). Accept: unapproved or claim-violating content fails CI.
- **WP4.3 Generative variant factory (offline tooling)** [BS] — M — LLM-drafted reading-age/tone
  variants of approved atoms, human-locked before release (PRD §3.2 [BS]). Accept: variants never
  reach prod without lock; provenance recorded.
- **WP4.4 Instrument registry** — M — HSI, AUDIT-C/AUDIT, SCI, TTFV index, PHQ-2/GAD-2
  (signpost-only); verbatim enforcement; licensing-status wiring (E19). Accept: published-scoring
  test vectors pass per instrument; unlicensed instruments unreachable.

### WS-V — Vertical packs (each = content + rules + outcome defs + escalation deltas; **no core code**)
- **WPV.0 Vertical framework** — M — vertical registry/config schema (lapse definitions, rescue
  modes, instruments, outcome definitions, escalation deltas, contraindications); programme
  switcher UX. Accept: adding a toy fifth vertical requires zero core-package changes (proven in test).
- **WPV.1 QuitKit pack** — L — full content + rules per §2.2; reduction-scheduler rules; identity
  arc; risk-window definitions. Accept: WP4.2 validation 100%; no dangling slots; BCT audit.
- **WPV.2 Exhale pack** — M — vaping deltas: TTFV, taper ladders + product-mapping DB, stealth-use
  debriefs; dual-user routing rules. Accept: as V.1 + taper-plan property tests.
- **WPV.3 Steady pack** — L — AUDIT laddering + **hard-stop rules (E17)**; drink-diary UX (mobile+web);
  unit calculator; normative feedback; survival plans; risk windows. Accept: hard-stop unbypassable
  by any flow (adversarial test); unit maths property-tested vs published UK examples.
- **WPV.4 Nightshift pack** — L+L (split: content / titration engine) — diary UX (4-tap morning,
  2am rescue); **titration engine: window computation from diary SE, weekly adjustment rules,
  occupation safety screens, window floors — fully versioned/auditable**; stimulus-control +
  restructuring content; wind-down audio; shift-worker protocol; orthosomnia de-escalation content.
  Accept: titration property tests against hand-computed clinical vectors (sign-off WP10.3);
  safety-screen routing exhaustively tested; diary→metrics math verified.
- **WPV.5 Cross-vertical integration** — M — cross-screen→enrolment flows; arbitration policies
  (priority rules across programmes within one budget); combined-pathway logic (shared diary burden:
  sleep+alcohol single evening check-in); cross-programme coach context. Accept: Demo C end-to-end;
  burden budget provably respected from DecisionRecords.

### WS5 — Decisions, JITAI & relapse
- **WP5.1 Rules engine** — M — as v2 (versioned YAML DSL, replayable, shadow mode).
- **WP5.2 JITAI scheduler + burden governor + arbitration** — L — fixed anchors, per-vertical
  decision points, risk-window v0 from explicit signals, progressive profiling; **single
  cross-vertical budget: proposed ≤3 proactive pushes/day total (not per programme), ≤1/hour,
  quiet hours 21:30–08:00 — pending sign-off (WP10.3)**; arbitration ranks candidates by expected
  utility within budget (PRD §3.4 [D]). Accept: multi-programme time-warp journey respects budget;
  starvation test (no programme permanently silenced — rotation fairness); snooze never penalises.
- **WP5.3 Relapse engine** — M — universal SM + per-vertical lapse defs from config; re-engagement
  ladders. Accept: transition tables exhaustive per vertical; streak survives lapse; ladder caps.

### WS6 — AI Coach & guardrails
- **WP6.1 Policy proxy** — L — as v2 (sole LLM path, 100% logging, fallback). 
- **WP6.2 Session frames & context assembly** — L — vertical-specialised frames (craving rescue,
  drink-diary debrief, sleep-window explainer, taper check-in) + cross-programme awareness;
  typed tools (edit plan, log entry, schedule check-in) evented. Accept: MI-adherence eval ≥90% on
  per-vertical synthetic corpora (independent judge agents).
- **WP6.3 Post-filter & fences** — M — as v2 + vertical fences (no dosing talk anywhere; no
  sleep-treatment claims language; no detox guidance in Steady). Accept: violation corpus block
  recall ≥0.98.
- **WP6.4 Proactive coach** — M — as v2, arbitration-routed.

### WS7 — Safety & escalation
- **WP7.1 Risk lexicon & classifiers** — L — as v2 + alcohol-context elevation (DV/safeguarding),
  withdrawal-risk patterns, overdose lexicon. Accept: tier-1 recall ≥0.95 on expanded corpus
  (~800 cases); <500ms p95.
- **WP7.2 Crisis flows & offline resources** — M — as v2 + vertical-specific routing (drink-aware
  crisis content, 2am-safe rendering). 
- **WP7.3 Escalation queue & console** — M — as v2.
- **WP7.4 Red-team suite** — L — as v2 + vertical scenarios (detox-seeking, dependence concealment,
  sleep-medication elicitation, dual-use questions). Release-blocking, ratcheting.

### WS8 — Outcomes, analytics & evidence
- **WP8.1 Outcome-definitions engine** — M — Russell-Standard smoking; vaping 7/30-day; alcohol
  AUDIT-C delta + drinking-day trajectories; sleep SCI delta + SE trajectory. Versioned, pinnable.
- **WP8.2 Analytics instrumentation** — M — as v2 + per-programme funnels and cross-enrolment
  tracking; payload privacy audit.
- **WP8.3 Evidence dashboard** — M — as v2 + per-vertical and cross-vertical views (Demo E).
- **WP8.4 Experiment framework lite** — S — as v2; safety flows excluded from experimentation.

### WS9 — Infrastructure & security
- **WP9.1 Environments, IaC, release pipeline** — M — as v2.
- **WP9.2 Observability & clinical audit trail** — M — as v2 + titration-adjustment audit stream.
- **WP9.3 Security baseline & hardening** — M — as v2; HealthKit/Health Connect data handling review.
- **WP9.4 Wearable integration** — M — HealthKit + Health Connect read (sleep, steps) behind
  per-datatype consent; corroboration-only wiring (diary primacy). Accept: consent-gated; deletion
  cascades; never blocks any pathway when absent (PRD §3.5).

---

## 6. WS10 — Human-owned track (agents draft · owner decides/signs/arranges)

| WP | Deliverable (DRAFT-stamped) | Human action | Gates |
|----|---|---|---|
| 10.1 | Clinical reviewer brief — now sized for **four packs**; staggered review schedule (smoking → vaping → alcohol → sleep; sleep titration is the heaviest item) | Engage reviewer(s); consider two reviewers given volume | G3 |
| 10.2 | Per-vertical content sign-off packages | Sign-off recorded per pack | G3 (per-vertical) |
| 10.3 | Clinical parameter sheet: burden budget, SLA model, risk corpus/thresholds, outcome wordings, **alcohol hard-stop criteria, sleep titration rules + occupation screens** | Sign each value | G3 |
| 10.4 | Instrument licensing audit (SCI vs ISI decision; AUDIT/HSI/PHQ-2/GAD-2 confirmations) | Execute licenses if needed | G3 |
| 10.5 | Escalation coverage options paper | **Owner decision + arrangement** | G2 |
| 10.6 | Privacy pack: core DPIA, LLM DPIA, **wearable-data DPIA**, Art. 9 analysis, privacy policy, ToS | Review + adopt | G4 |
| 10.7 | Store compliance (health-app policies, data-safety forms, age rating incl. 18+ programme gating) | Own listings | G5 |
| 10.8 | Launch & growth kit: ASO ×4 programme narratives, outreach playbook, referral mechanics | Owner executes outreach | — |
| 10.9 | Hazard log v0 (seeded from WS6/7 + titration + hard-stop designs) | Owner review | — |
| 10.10 | **Claims register**: approved marketing/product language per vertical; sleep treatment-claim blocklist wired to content lint (E16) | Owner + clinical reviewer adopt | G5 |
| 10.11 | Evidence-pack template (commissioner-ready format) | Owner review | — |

**Launch gates (release-pipeline-enforced):** G1 safety suite green · G2 escalation coverage live ·
G3 clinical sign-offs (per-vertical — a programme can be feature-flagged off if its pack lags) ·
G4 privacy pack adopted · G5 store + claims compliance. Beta = G1 + provisional G3 per enabled
programme; public = all gates for all enabled programmes.

---

## 7. Milestones

- **M0 Foundations** — WP1.1a/b, 1.2–1.5, 2.1, 4.1, 4.4, 5.1, 9.1; WS10: 10.1, 10.4 kicked off.
  Exit: shells boot; core packages ≥80% coverage; CI fully gating. **← IN PROGRESS**
- **M1 Engine + QuitKit deterministic** — 2.2–2.5, 3.1, 4.2, V.0, V.1, 5.2 (single-vertical mode),
  5.3, 7.1, 7.2. Exit: Demo A minus coach on TestFlight internal; safety rail live; marketing site up.
- **M2 The coach** — 6.1–6.4, 2.6, 7.3, 7.4, 9.2. Exit: Demo B (smoking subset) passes; MI eval ≥90%.
- **M3 Exhale + Steady** — V.2, V.3, 7.1/7.4 vertical expansion, 4.3. Exit: both programmes pass
  their journeys + alcohol hard-stop demo; coach frames for both eval-passed.
- **M4 Nightshift + cross-vertical** — V.4, V.5, 5.2 full arbitration, 9.4. Exit: Demos C + D pass;
  titration vectors signed off (10.3).
- **M5 Web parity, evidence, experiments** — 3.2, 8.1–8.4, 9.3. Exit: all five demos pass on staging;
  security audit zero criticals; load test 25k users / 2k concurrent coach sessions.
- **M6 Beta → public** — staggered beta (QuitKit+Exhale → Steady → Nightshift as G3 sign-offs land),
  ≥2 fix-iterate cycles, then phased public store rollout with all gates green.

Parallel from week 1: 10.1, 10.4, all four content packs drafting (V.1–V.4 content halves), WP2.1
design system.

---

## 8. Test & quality strategy
As plan v2 (TDD, layered, property tests, time-warp, red-team ratchet, MI-adherence evals, demo
scripts as nightly e2e) **plus**: titration-algorithm property tests against clinically-signed
vectors; alcohol unit-math and hard-stop adversarial tests; arbitration fairness/starvation tests;
cross-programme burden-budget invariant tested at the DecisionRecord level.

## 9. Engagement evidence targets (draft; calibrate in beta)
Platform: activation ≥50% (beta) → ≥60%; D1/D7/D30 = 40/25/15% → 45/30/20%; organic referral ≥25%
by month 6. Per-programme: smoking 4-week self-report quit ≥15% of quit-date setters (ITT); vaping
30-day abstinence ≥12%; alcohol +2 drink-free days/week by week 4 for ≥40% of active users; sleep
diary completion ≥70% during active programme, SCI improvement ≥40% of completers; cross-enrolment
≥20% of users in 2+ programmes by day 30.

## 10. Risk register (v3 deltas)
| Risk | Likelihood | Mitigation |
|---|---|---|
| 4× clinical sign-off volume becomes the schedule bottleneck | **High — the dominant risk** | Staggered beta per programme (G3 per-vertical flags); two-reviewer option (10.1); shared BCT backbone reuses ~60% of content patterns across packs |
| Sleep titration harms (daytime sleepiness) | Low prob, high severity | Occupation screens + window floors; clinically-signed adjustment vectors; wellbeing framing; de-escalation content |
| Alcohol-dependent users circumvent hard-stop | Medium | Adversarial tests on every flow; coach fences; lexicon watches for dependence/withdrawal language post-enrolment |
| Treatment-claim drift (esp. sleep) | Medium | Claims register lint in CI on app + marketing copy (10.10) |
| Four-programme scope dilutes polish | Medium-High | Vertical framework forces thin verticals (WPV.0 acceptance test); staggered beta surfaces weakest programme before public launch; cut-or-delay decision per programme at M6 |
| AI coach safety incident | Low prob, critical | Unchanged stack: E7 sequencing, deterministic filters, red-team ratchet, G2 coverage |
| Organic traction fails | Medium-High | Four wedges = four acquisition surfaces + cross-sell; §9 reviewed honestly at M6; commissioner pivot preserved |
| Wearable-data privacy (Art. 9) | Medium | 10.6 wearable DPIA; per-datatype consent; corroboration-only design |

## 11. Open items
| ID | Item | Status |
|----|------|--------|
| Q1 | App/consumer brand name (placeholder "PreventOS"; programmes keep PRD working names) | Owner — needed by 10.7/10.8 |
| Q2 | Clinical reviewer(s) — volume now suggests two | Owner arranging (O6) |
| Q3 | Escalation coverage arrangement | Owner arranging (O6) |
| Q4 | SCI vs ISI final call | After 10.4 licensing audit |
| Q5 | Beta stagger order confirmation (QuitKit+Exhale → Steady → Nightshift) | Default applied |
| Q6 | Beta tester source list (~50–200) | Owner, by M5 |

*End of plan v3.0 — execution underway: WP1.1a (root scaffold) started 2026-06-12.*
