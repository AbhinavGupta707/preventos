# PreventOS — Multi-Vertical Digital Behaviour-Change & Prevention Platform
## Product Requirements Document (Blue-Sky Edition, v1.0)

**Document status:** Draft for internal strategy review
**Scope basis:** Evidence Dossier for a Multi-Vertical Digital Behaviour-Change and Prevention Platform (2026)
**Assumption set:** No development-time or engineering-capacity constraints. Everything specified here is technically achievable with current or near-current software, sensing, ML, and telephony technology. Regulatory, ethical, and evidential constraints are treated as real and binding; engineering constraints are not.
**Working product name:** "PreventOS" (placeholder). Vertical modules carry working names in their sections.

---

## 0. Document Control & Reading Guide

### 0.1 Purpose
This PRD specifies the complete, maximal ("blue-sky") product vision for a UK-first, multi-vertical digital behaviour-change and prevention platform. It is written to be decomposable: any single Part or module section can be lifted out as a standalone build spec, funding annex (SBRI/NIHR i4i), or DTAC/NICE-ESF evidence submission scaffold.

### 0.2 How blue-sky is handled
Every feature carries one of four **build-tier tags** so the maximal vision stays separable from the commissionable core:

| Tag | Meaning |
|---|---|
| **[TS]** Table stakes | Required for a credible commissioned service; evidence-established mechanisms |
| **[D]** Differentiator | Under-exploited, commercially decisive, technically near-term |
| **[BS]** Blue-sky | No technical barrier in principle, but requires significant build, novel integration, or new data partnerships |
| **[R]** Research-gated | Technically buildable now, but must not be deployed beyond ethics-approved pilots until evidence matures (e.g. voice biomarkers as risk triggers) |

Evidence tags from the source dossier are preserved where relevant: **[E]** established, **[M]** emerging, **[H]** novel hypothesis.

### 0.3 Out of scope
- Acute/crisis clinical care delivery (the platform detects, safety-nets, and escalates; it never replaces crisis services)
- Autonomous diagnosis or autonomous medication decisions by the AI coach
- Non-UK regulatory pathways (US FDA/PDT and German DiGA are referenced as design constraints for future export, not specified)

### 0.4 Glossary (abbreviated)
- **BCT / BCTTv1** — Behaviour Change Technique (Taxonomy v1); the atomic unit of intervention content
- **COM-B / BCW** — Capability–Opportunity–Motivation model / Behaviour Change Wheel
- **JITAI** — Just-In-Time Adaptive Intervention
- **MRT** — Micro-Randomised Trial
- **ESF / DTAC / SaMD** — NICE Evidence Standards Framework / NHS Digital Technology Assessment Criteria / Software as a Medical Device (MHRA)
- **ICB / LA** — Integrated Care Board / Local Authority
- **PROM** — Patient-Reported Outcome Measure
- **CO / rPPG** — Carbon monoxide (exhaled, smoking verification) / remote photoplethysmography
- **MI / BA / CBT(-I)** — Motivational Interviewing / Behavioural Activation / Cognitive Behavioural Therapy (for Insomnia)

---

# PART 1 — VISION, STRATEGY & PRODUCT PRINCIPLES

## 1.1 Vision statement
One platform that any UK commissioner, employer, or individual can use to start, sustain, and *prove* behaviour change across the fifteen highest-burden prevention domains — delivered through whatever channel the person actually has (smartphone, SMS, voice call, browser, TV, carer), timed to the moments their risk is real, and verified to a standard a payer will fund.

## 1.2 Strategic theses (from the evidence dossier)
1. **One core, fifteen thin modules.** The behaviour-change engine, AI coach, JITAI orchestrator, sensing/verification layer, relapse engine, commissioner dashboard, and equity rail are built once and reused. Verticals contribute content packs, instruments, outcome definitions, escalation rules, and optional hardware — nothing else.
2. **Smoking first; addiction platform second; everything else third.** Smoking cessation uniquely combines a standardised KPI (CO-validated 4-week quit), ring-fenced LA funding, SMS-fit evidence, and incumbent whitespace.
3. **Verification is the moat.** Commissioners buy verified outcomes, not engagement. The verification stack (CO, BP, breathalyser, scales, open banking, self-exclusion status, FHIR-linked labs) is the single highest-leverage asset.
4. **Equity-first is both ethics and strategy.** Deprivation-first SMS/voice design wins the populations commissioners are measured on and incumbents ignore.
5. **Stay below unsafe autonomy.** The AI coach orchestrates evidence-based content and reflection; policy logic — not the model — owns clinical boundaries and escalation.
6. **Modular regulatory posture.** Launch as DTAC/ESF behaviour-support; selectively up-regulate individual modules (insomnia first, structured anxiety second) to SaMD where reimbursement justifies the burden.

## 1.3 Product principles (binding on all feature design)
1. **Minute-one value.** Every vertical must deliver a meaningful first action within 60 seconds of first contact, on every channel including SMS.
2. **No moralising, ever.** Framing is autonomy-supportive, identity-aware, and shame-safe. Lapses trigger debriefs, not guilt.
3. **Measurement-based everything.** Every user has a live outcome trajectory on validated instruments; every coach interaction is aware of it.
4. **Channel parity, not channel hierarchy.** SMS and voice users get a full service, not a degraded one.
5. **Hardware optional, always.** Every verified pathway has a software-only fallback; hardware upgrades precision, never gates access.
6. **Privacy as a product feature.** Sensing is opt-in, value-exchanged, explained in plain language, and granularly revocable. Teen and workplace deployments get structurally different privacy models.
7. **The relapse engine is universal.** Lapse → debrief → plan-repair → re-engagement is one machine, skinned per vertical.
8. **Everything is an experiment.** All adaptive logic ships inside an experimentation framework capable of micro-randomised trials.

## 1.4 Target buyers & commercial surfaces
| Buyer | What they buy | Primary verticals | Proof they need |
|---|---|---|---|
| Local authorities (public health grant) | Commissioned cessation/reduction services | Smoking, alcohol, weight, activity, drugs | CO-validated quits, AUDIT shifts, weight trajectories, reach into deprived quintiles |
| ICBs / NHS England | Pathway capacity relief, waiting-list support, prevention | Sleep, anxiety/depression, MSK, hypertension, T2D prevention, gambling (NHSE from 2026) | Reliable improvement/recovery analogues, referral/appointment avoidance, PROMs |
| Employers / occupational health | Workforce health, absence reduction | Stress/burnout, sleep, MSK, alcohol, activity, CVD risk | Engagement + absence/presenteeism + validated PROMs |
| Insurers / cash plans | Risk reduction, member value | Metabolic cluster, CVD, MSK | Verified biometrics, persistence |
| Individuals (D2C) | Self-directed change | All | Outcomes they can feel + savings they can count |
| Schools / colleges (with safeguarding rails) | Youth vaping, sleep, wellbeing | Vaping, sleep, stress | Feasibility, safeguarding compliance, anonymous cohort outcomes |


---

# PART 2 — USERS, PERSONAS & SEGMENTATION

## 2.1 User classes (platform-wide)
1. **End users** — the person changing behaviour. Sub-segmented per vertical (Part 5) and cross-cut by the dimensions in §2.2.
2. **Supporters** — nominated family, friends, carers, "quit buddies", affected others (gambling), parents/guardians (youth, with consent architecture).
3. **Coaches & clinicians** — human coaches (commissioned-service tiers), stop-smoking advisors, IAPT/Talking-Therapies practitioners, physiotherapists, pharmacists; receive caseload views and escalations.
4. **Commissioner/payer analysts** — LA public-health teams, ICB digital leads, employer benefits managers; consume the dashboard, never row-level identifiable data without lawful basis.
5. **Service administrators** — configure cohorts, eligibility, content variants, escalation routing, hardware fleets.
6. **Researchers** — run MRTs and evaluations inside the experimentation framework under ethics approvals.

## 2.2 Cross-cutting segmentation dimensions (applied in every vertical)
- **Readiness:** not-ready / ambivalent / ready / acting / maintaining / relapsed (drives content tone and JITAI cadence)
- **Deprivation & digital access:** smartphone-rich / smartphone-shared / SMS-only / voice-only / offline-supported (drives channel routing; IMD-quintile reporting is a first-class dashboard dimension)
- **Health literacy & language:** plain-language tiering (reading age 9 default), 20+ language packs, BSL video variants, easy-read formats
- **Comorbidity flags:** mental-health comorbidity, pregnancy, LTCs, neurodivergence (drives content adaptation and escalation thresholds)
- **Life context:** shift work, caring load, payday cycle, housing instability (feeds JITAI risk-window models)
- **Age & safeguarding tier:** adult / young adult / adolescent (13–17, structurally different privacy + safeguarding model) / older adult (accessibility-first defaults)
- **Acquisition route:** GP referral / LA service / self-referral / employer / pharmacy / school / discharge pathway (drives consent model and data-sharing scope)

## 2.3 Illustrative personas (abbreviated; full persona library is an appendix deliverable)
- **"Donna", 47, Glasgow, 20/day smoker, SMS-only, night-shift carer.** Needs: text-first quitting, savings framed as household wins, craving help at 3am breaks, optional CO check at pharmacy. Never sees an app store.
- **"Kieran", 16, vapes between classes.** Needs: anonymous-feeling text support, refusal scripts before parties, zero parental disclosure by default, panic-button flows. Safeguarding rails active.
- **"Marcus", 34, sports-betting after payday.** Needs: one-tap GAMSTOP + bank gambling block + urge surfing, payday-eve risk warnings, debt triage routing, shame-safe tone.
- **"Priya", 52, prediabetic, on a Talking-Therapies waitlist.** Needs: combined weight + mood + sleep pathway, waiting-list bridge support, weekly weigh-in loop with a £20 connected scale.
- **"George", 79, two falls last year.** Needs: TV-mode strength-and-balance with giant buttons, daughter-linked adherence visibility (consented), voice check-ins, sudden-drop safety nets.

---

# PART 3 — SHARED PLATFORM CORE (DETAILED SPECIFICATION)

The core is sixteen services. Verticals may not re-implement any of them.

## 3.1 Behavioural Intake & Segmentation Engine
**Purpose:** convert first contact into a usable behavioural profile in ≤8 questions and ≤90 seconds, then deepen progressively.

**Functionality**
- **[TS]** Adaptive intake: branching micro-questionnaires using validated brief instruments per vertical (HSI for smoking, AUDIT-C, PHQ-2→PHQ-9 step-up, GAD-2→GAD-7, ISI/SCI, PGSI, ePAQ-style MSK triage), readiness staging, channel/access assessment, and safeguarding screens where age-relevant.
- **[TS]** COM-B deficit mapping: every answer maps to capability/opportunity/motivation deficits, producing a machine-readable **Behavioural Formulation Object (BFO)** that all downstream services consume.
- **[D]** Progressive profiling: never front-load; the JITAI engine schedules one profiling micro-question per contact until the BFO is complete.
- **[D]** Multi-vertical risk surfacing: intake in one vertical screens lightly for adjacent risks (smoker → alcohol/ sleep/ mood two-item screens) and offers cross-enrolment with explicit consent.
- **[BS]** Conversational intake: full intake conductible by the AI coach in free text or by voice call (IVR-LLM, §4.5), with instrument items administered verbatim (psychometric integrity preserved — paraphrasing of validated items is prohibited by policy rule, not model discretion).
- **[BS]** Contextual import: with consent, prefill from NHS login demographics, GP record problem lists (GP Connect), pharmacy dispensing history, and wearable baselines.

**Outputs:** BFO; segment assignments; channel plan; consent ledger entries; baseline outcome record.

## 3.2 Behaviour-Change Engine (Content & Mechanism Layer)
**Purpose:** the canonical store of intervention content, indexed by mechanism, so that "what to deliver" is always selected by evidence-tagged logic.

**Functionality**
- **[TS]** **BCT-labelled content graph:** every content atom (message, exercise, audio, video, plan template, worksheet) is tagged with BCTTv1 codes, COM-B targets, vertical(s), reading age, language, channel renderings, tone variants (autonomy-supportive / practical / warm-challenge), and contraindications (e.g. no weight-loss framing in ED-flagged users; no sleep-restriction content without insomnia-module enrolment).
- **[TS]** **Plan objects:** implementation intentions ("if-then" plans), action plans, coping plans, and relapse plans are first-class data structures the user co-edits and the JITAI engine can trigger from.
- **[D]** **Policy/decision layer (proprietary):** rules + bandit/RL policies select content atoms given the BFO, stage, trajectory, and context. Open research code (e.g. Oralytics designs) used as design reference only — no GPL code in the production core.
- **[D]** **Experiment framework integration:** every selection point is an experimentable decision (A/B, contextual bandit, MRT randomisation) with guardrail metrics (burden, opt-out, distress flags).
- **[BS]** **Generative variant factory:** LLM-generated paraphrase variants of content atoms at multiple reading ages/tones/languages, every variant human-reviewed and locked before release (generation is offline tooling, not runtime improvisation, for clinical-content integrity).
- **[BS]** **Cultural adaptation pipeline:** community-reviewer workflow producing culturally adapted content packs (dietary advice by cuisine, Ramadan-aware fasting adaptations, faith-context alcohol framing).

## 3.3 Guardrailed AI Coach ("the Coach")
**Purpose:** a conversational layer that delivers MI-style reflection, planning, psychoeducation, skills rehearsal, check-ins, and relapse debriefs — with hard, policy-owned boundaries.

**Capabilities**
- **[TS]** MI-consistent reflective listening; open questions, affirmations, reflections, summaries; rolling with resistance; change-talk elicitation.
- **[TS]** Structured session frames: agenda-setting, skill rehearsal (urge surfing walkthroughs, refusal scripts, worry postponement, paced breathing), plan creation/repair, session summaries written back to the user record.
- **[TS]** Measurement awareness: the Coach always knows current scores, trajectory, stage, active plans, BCT history, and escalation thresholds; it references them naturally ("your sleep efficiency is up 9% since the restriction window moved").
- **[TS]** Lapse debrief protocol: non-judgemental functional analysis (trigger → thought → action → consequence), abstinence-violation-effect counter-framing, plan repair, next-24-hours commitment.
- **[D]** Consented proactive check-ins on JITAI schedule, channel-appropriate (two-line SMS vs. in-app conversation vs. 90-second voice call).
- **[D]** Session summarisation for human coaches: hand-off packets when users step up to human support.
- **[BS]** Full-duplex voice coach: natural conversational voice sessions over phone line (no app needed), with barge-in, silence tolerance, and warm prosody; identical guardrails.
- **[BS]** Multilingual code-switching within session; BSL avatar rendering for video channels.
- **[R]** Affect-aware pacing: using consented voice/typing-cadence signals to slow down, simplify, or offer a break — never to make clinical inferences (§6.2).

**Hard guardrails (policy layer, outside the model)**
1. No diagnosis, no diagnosis-implying language; no medication initiation/change advice beyond adherence support for prescribed regimens and signposting to prescribers.
2. Deterministic risk lexicon + classifier ensemble for self-harm/suicide, abuse, safeguarding, overdose, and domestic-violence signals → immediate scripted safety flow + human escalation routing; the LLM cannot suppress, reword, or delay it.
3. Verbatim administration of validated instruments; no improvised psychometrics.
4. Topic fences per vertical and per age tier (e.g. youth module: no dosing talk, mandatory safeguarding routing).
5. Conversation-length and dependency guards: the Coach nudges toward real-world action and human connection; flags over-reliance patterns.
6. Every guardrail trigger is logged, auditable, and replayable for clinical-safety review (DCB0129 hazard log linkage).

## 3.4 JITAI Orchestration Engine
**Purpose:** decide *whether, when, what, and through which channel* to intervene, continuously, for every user.

**Functionality**
- **[TS]** Decision-point scheduler: per-user decision points (fixed: morning/evening anchors; dynamic: detected risk windows) evaluating state (tailoring variables) → intervention options → delivery.
- **[TS]** Burden governor: hard caps on contact frequency per channel; fatigue modelling; quiet hours; "snooze the platform" controls that never penalise the user.
- **[D]** **Risk-window learning:** per-user models of vulnerability windows from explicit signals (logged triggers, lapse timestamps, payday dates, shift patterns, fixture lists for gambling) and consented passive signals (steps, sleep, location-category — never raw GPS retention by default).
- **[D]** Receptivity modelling: learn when prompts get engaged vs. ignored; shift timing accordingly (HeartSteps-style proximal-outcome optimisation).
- **[D]** Cross-vertical arbitration: one user, many modules → a single orchestrator ranks competing interventions by expected utility and burden budget (no module may message a user directly).
- **[BS]** Event-stream ingestion: calendar (consented) for "high-risk social event tonight"; weather for activity prompts; sports fixtures + payday for gambling risk; sunset times for older-adult activity safety.
- **[BS]** Online RL policy optimisation with formal safety constraints (action-set whitelists, off-policy evaluation before deployment, automatic rollback on guardrail breach).
- **[R]** Sensor-triggered micro-interventions from voice/keystroke/mobility deterioration signals — pilot-only until evidence matures.

## 3.5 Sensing & Digital Phenotyping Layer (phased)
**Phase 1 [TS]:** self-report, engagement logs, phone step counts/activity recognition, sleep (device-native), timestamps, manual diary entries.
**Phase 2 [D]:** connected hardware via the Verification Stack (§3.6); wearable integrations (HealthKit, Health Connect, Fitbit, Garmin, Oura, Withings) with per-datatype consent.
**Phase 3 [R/BS]:** opt-in research-grade phenotyping — voice samples, keystroke dynamics, typing/touch metadata, mobility entropy, screen-rhythm features, smartphone pupillometry/eye-tracking micro-tasks, rPPG vitals via front camera. All Phase 3: ethics-approved pilots, separate consent, never commissioner-facing endpoints until validated.

**Engineering requirements**
- On-device feature extraction wherever feasible (raw audio/keystrokes never leave the device in default configurations; derived features only).
- Per-signal consent toggles with plain-language value statements ("we use X to do Y for you; turn off any time; here's what we delete").
- Sensing degrades gracefully: absence of any signal never blocks any pathway.

## 3.6 Verification Stack
**Purpose:** turn outcomes into payer-grade evidence without clinic visits.

| Verification primitive | Verticals served | Tier |
|---|---|---|
| Bluetooth CO monitor with camera-guided exhalation flow, liveness checks, device-serial binding | Smoking (4-week CO-validated quits) | [D] |
| Validated (BIHS-listed) Bluetooth BP cuffs + guided-measurement protocol (rest timer, cuff-position camera check) + manual-entry fallback with plausibility scoring | Hypertension/CVD | [D] |
| Connected scales + photo-assisted manual weigh-in (dial/display OCR) | Weight, T2D | [D] |
| Bluetooth breathalyser with randomised prompt-window testing and facial-match liveness | Alcohol (commissioned/high-acuity cohorts) | [D] |
| Open-banking read-only connection → gambling-spend signal, gambling-block status; savings-from-quitting auto-calculation | Gambling, smoking, alcohol | [BS] |
| Self-exclusion status checks (GAMSTOP integration) + device/DNS blocking attestations | Gambling | [D] |
| Pharmacy/EPS refill signals; smart pill-cap integrations | Adherence, hypertension, smoking pharmacotherapy | [BS] |
| FHIR-linked labs (HbA1c, lipids) via GP Connect / pathology feeds | T2D, CVD | [BS] |
| Home cotinine / saliva test kits with camera-read lateral-flow interpretation | Vaping (later), smoking edge cases, substance-use pathways | [BS] |
| Carer/collateral confirmation flows (consented second-party attestation) | Falls/ageing, substance use | [D] |
| Range-of-motion computer-vision tasks (pose estimation on-device) | MSK | [BS] |
| Video-verified observation sessions (scheduled, human-witnessed) for highest-stakes cohorts | Any | [BS] |

**Anti-gaming architecture [D]:** device-serial + user binding, liveness checks, randomised verification windows, statistical anomaly detection (too-perfect streaks, implausible deltas), commissioner-visible verification-confidence scores per outcome (verified / corroborated / self-report).

## 3.7 Universal Relapse Engine
One state machine reused everywhere: **stable → at-risk → lapse → debrief → plan-repair → re-engagement → stable**, with vertical-specific definitions of "lapse" (cigarette, heavy-drinking day, bet placed, 3 nights <85% sleep efficiency, 7-day exercise non-adherence, missed doses, PHQ-9 reliable-deterioration).
- **[TS]** Lapse-sensitive prompts; AVE-counter messaging; streak logic that survives lapses (no "back to zero" punishment mechanics — "days won" framing, not unbroken-chain framing, configurable per evidence).
- **[D]** Re-engagement ladders: channel-escalating, tone-calibrated win-back sequences (app push → SMS → voice note → human-coach outreach for commissioned cohorts), with hard opt-out respect.
- **[D]** Post-discharge/maintenance mode: low-frequency long-tail monitoring (monthly pulse + instrument re-administration at 3/6/12 months) feeding commissioner long-term outcome reporting.
- **[BS]** Predictive relapse models per vertical (gradient: rules → survival models → sequence models), used to *time support*, never to label users; all predictions explainable in user-facing language ("evenings after missed weigh-ins have been tricky before — want a plan?").

## 3.8 Commissioner Dashboard & Outcomes Reporting
- **[TS]** Cohort dashboards: reach, activation, engagement, retention curves, outcome trajectories on vertical KPIs, verification-confidence breakdowns, equity cuts (IMD quintile, ethnicity, age, sex, language, channel), funnel diagnostics.
- **[TS]** KPI presets per commissioning frame: LA smoking (4-week CO-validated quits, 12-week, 6-month), Talking-Therapies-style reliable improvement/recovery analogues, NHS DPP-style milestone completion, MSK referral-avoidance proxies.
- **[D]** Contract & payment-by-results module: per-outcome tariff configuration, invoice-grade verified-outcome exports, audit trails.
- **[D]** FHIR outcome feeds + flat-file/NHS-DSPT-compliant exports into LA/ICB BI estates; SNOMED-coded outcome events.
- **[BS]** Counterfactual analytics: matched-comparison and synthetic-control views (clearly labelled as observational) + native support for commissioner-sanctioned stepped-wedge evaluations.
- **[BS]** Capacity-relief modelling: appointments/referrals/prescriptions-avoided estimators with transparent assumptions, exportable for business cases.

## 3.9 Equity & Accessibility Rail
- **[TS]** SMS as a first-class full-service channel (complete pathways, not reminders): structured keyword grammar (STOP/HELP/PLAN/CRAVE/SLIP/COACH), threaded state, free-to-user shortcode for commissioned cohorts.
- **[TS]** IVR voice service: full intake, daily check-ins, craving rescue line, instrument administration by voice, callback scheduling.
- **[TS]** Plain-language engine: reading-age-9 default, easy-read variants, dyslexia-friendly typography, WCAG 2.2 AA minimum (AAA targets for older-adult modes).
- **[TS]** 20+ language packs with human-reviewed clinical content; interpreter-mode for human-coach calls.
- **[D]** Shared-device & low-data modes: PIN-separated profiles, SMS fallback when data absent, offline-first app caching, sub-50MB app footprint target.
- **[D]** Older-adult mode: giant-button UX, TV/tablet casting, voice-first navigation, carer-linked views (consented).
- **[BS]** WhatsApp/RCS rich-channel parity; BSL video library; print/QR hybrid packs for outreach workers; library/pharmacy kiosk mode.

## 3.10 Interoperability Layer
- **[TS]** FHIR-native internal event and outcome schemas (don't bolt FHIR on later — author in it): Patient, Observation (outcomes, biometrics), QuestionnaireResponse (instruments), CarePlan (plans), Communication (coach contacts), Consent.
- **[D]** SMART-on-FHIR app launch for clinician-facing views inside EHR contexts; GP Connect read (problem lists, meds) and structured update messaging to GP records for commissioned pathways.
- **[D]** NHS login identity federation; PDS demographic verification; ODS-coded organisational routing.
- **[BS]** Open-banking (FCA-regulated AISP partner) for gambling/savings signals; e-RS integration for step-up referrals; EPS/pharmacy APIs for pharmacotherapy support (NRT, varenicline/cytisine pathways with prescriber-in-the-loop).

## 3.11 Identity, Consent & Privacy Infrastructure
- **[TS]** Granular consent ledger: per-purpose, per-signal, per-recipient consents; immutable audit log; one-screen "what we hold on you / change anything" centre; data export & erasure self-service.
- **[TS]** Age-assurance & safeguarding tiering: 13–17 pathway with structurally minimised data, no parental visibility by default (configurable per service spec and law), safeguarding-escalation duty routing; Children's Code (AADC) conformance.
- **[TS]** Workplace privacy firewall: employers receive cohort aggregates above k-anonymity thresholds only; no individual data, ever; this is a marketed guarantee.
- **[D]** Per-cohort data-sharing contracts compiled into runtime policy (purpose-based access control), so commissioner visibility is technically enforced, not procedurally promised.
- **[BS]** On-device processing defaults for Phase-3 sensing; differential-privacy aggregation for research datasets; federated analytics for cross-site model improvement without raw-data pooling.

## 3.12 Content Management, Localisation & Clinical Governance Tooling
- **[TS]** Clinical content CMS with versioning, BCT/COM-B tagging, reading-age scoring, approval workflows (author → clinical reviewer → safety reviewer → release), rollback, and per-cohort content pinning (a commissioned service can freeze its content version for evaluation integrity).
- **[D]** Variant testing harness wired to the experiment framework; localisation pipeline with translation memory + clinical-reviewer sign-off per locale.
- **[BS]** Generative tooling (offline) for variant drafting (§3.2) with mandatory human lock.

## 3.13 Escalation & Safety Subsystem
- **[TS]** Risk-signal taxonomy (self-harm, suicidality, overdose risk, safeguarding, DV, acute medical red flags per vertical — chest pain, BP crisis thresholds, MSK red flags) → scripted immediate-response flows + routing matrix (999/111/crisis lines/local service handoffs/duty clinician queues for commissioned cohorts).
- **[TS]** Human-in-the-loop queues with SLA timers, case notes, and closure audit; out-of-hours coverage models specified per contract.
- **[D]** Escalation rehearsal/testing harness (synthetic red-team conversations run continuously against the Coach; failures block release).
- **[TS]** Clinical safety case maintained as living artefacts: DCB0129 (manufacturer) hazard log integrated with incident reporting; DCB0160 support packs for deploying organisations.

## 3.14 Incentives & Rewards Engine
- **[TS]** Savings trackers (money-not-spent on cigarettes/alcohol/bets) framed as concrete household wins; milestone recognition; loss-sensitive framing options.
- **[D]** Commissioner-funded contingency-management workflows (voucher/credit issuance on verified outcomes — CO-verified abstinence, verified attendance), with fraud controls riding the anti-gaming layer; configurable per contract and ethics approval.
- **[D]** Proportionate incentive partnerships (BetterPoints/Sweatcoin-style activity credits) for activity and engagement, never for clinical-risk outcomes without governance sign-off.
- **[BS]** Deposit-contract mechanics (user stakes own money against own goal) — high evidence interest, deployed only under ethics + FCA-compliance review.

## 3.15 Social & Supporter Layer
- **[TS]** Nominated-supporter flows: invite a quit buddy/carer; supporter receives coaching on *how to help* (evidence-based supporter scripts), and only the signals the user consents to share.
- **[D]** Moderated peer communities per vertical with trained-moderator + classifier safety mesh; small-group "crews" (6–12 users, same quit week) with group streaks.
- **[D]** Affected-other pathways (gambling, alcohol): standalone support tracks for family members, including safety planning and finance-protection education.
- **[BS]** Mentor marketplaces (vetted lived-experience mentors, DBS-checked for relevant cohorts) with scheduling, supervision, and quality monitoring.

## 3.16 Hardware Device Ecosystem & Fleet Logistics
- **[D]** Device catalogue: CO monitors, BIHS-validated BP cuffs, scales, breathalysers, smart pill caps; procurement, pairing UX, firmware-update management, battery telemetry.
- **[D]** Fleet logistics for commissioned cohorts: postal dispatch with prepaid return, refurbishment loop, loss/attrition modelling, per-contract fleet dashboards; pharmacy/community-hub pickup options.
- **[BS]** Device-lending library model with deposit-free access for deprived cohorts (funded line item in commissioner contracts).


---

# PART 4 — CHANNELS (FULL SPECIFICATION)

Channel parity is a binding principle (§1.3). Every vertical ships on every Tier-1 channel.

## 4.1 Native mobile apps (iOS/Android) — Tier 1
- Offline-first architecture (local store + sync queue); sub-50MB install; low-end Android performance budget (60fps on 4-year-old devices).
- Home surface = "next best action", not a dashboard: one primary action, one secondary, craving/rescue button always one tap away.
- Widgets & complications: craving button, streak, today's plan; lock-screen rescue access.
- Push with deep-linked micro-interventions (a push *is* the intervention where possible — actionable notification with inline response).
- App-clip / instant-app entry: scan a QR in a pharmacy → 30-second start without install.

## 4.2 Web (responsive PWA) — Tier 1
- Full-pathway parity; installable PWA; large-text mode; works on library/shared computers with privacy timeouts and no-trace mode.

## 4.3 SMS — Tier 1 (first-class, not fallback)
- Complete pathways: intake, daily loops, craving rescue (text CRAVE), lapse debrief (text SLIP), plan editing (text PLAN), instrument administration, appointment booking, human-coach bridge (text COACH).
- Stateful threading server-side; free-to-end-user shortcodes for commissioned cohorts; long-code fallback; delivery-receipt-aware retry logic.
- Tone-engineered two-line craft: every SMS template is a designed intervention atom, not a truncated app message.

## 4.4 WhatsApp / RCS — Tier 2
- Rich-card versions of SMS pathways; voice-note coach replies; document delivery (easy-read plans); template-message compliance management.

## 4.5 Voice / IVR (+ conversational voice agent) — Tier 1 for older-adult & no-smartphone cohorts
- **[TS]** Touch-tone + simple-speech IVR: scheduled check-in calls, craving rescue line ("press 1 to ride this out with me"), instrument administration by voice, callback booking.
- **[BS]** LLM voice agent on the phone line: natural conversation within identical guardrails; configurable human-handoff thresholds; voiceprint-free authentication (knowledge factors + caller-ID binding) by default.
- **[BS]** Smart-speaker skills (Alexa/Google) for sleep wind-down routines, older-adult exercise guidance, medication prompts.

## 4.6 Email — Tier 3
- Weekly digests, plan documents, commissioner-cohort onboarding; never primary intervention channel.

## 4.7 Wearables & devices — Tier 2
- Watch apps: craving SOS on the wrist, activity prompts at detected sedentary stretches, sleep-diary nudges; verification-device pairing flows (§3.16).

## 4.8 TV / large-screen mode — Tier 2 (older-adult, MSK, activity)
- Cast/native TV apps for balance-and-strength sessions and physio routines, with remote-friendly giant UI and carer co-view.

## 4.9 Human-mediated channels — Tier 1 for commissioned services
- Coach console: caseloads, escalation queues, session-summary handoffs, co-browse/co-edit of user plans, outcome entry (e.g. pharmacy CO readings keyed by an advisor).
- Outreach-worker mode: assisted onboarding in community settings, paper/QR hybrid packs, on-behalf-of consent capture with audit.

## 4.10 Channel orchestration rules
- One orchestrator (§3.4) owns all outbound contact across channels; global burden budget; per-channel quiet hours; channel preference learning; automatic downgrade/upgrade (app-dormant user slides to SMS; SMS user who installs app gets upgraded continuity with full history).

---

# PART 5 — VERTICAL MODULE SPECIFICATIONS

Format per vertical: **Outcomes & instruments → Segments → Feature set ([TS]/[D]/[BS]/[R]) → Verification → Escalation → Commissioning hooks.** All modules inherit the entire core (Part 3); only deltas are specified.

## CLUSTER A — ADDICTION & DEPENDENCY

### 5.1 Smoking Cessation ("QuitKit") — LAUNCH WEDGE
**Outcomes & instruments:** 4-week CO-validated quit (primary commissioned KPI); 12-week & 6-month abstinence; HSI dependence; cigarettes/day trajectory; quit-attempt count.
**Segments:** not-ready (reduction-first pathway), ready-to-quit, mental-health comorbidity, pregnant smokers (specialised content + escalation), deprived heavy smokers (SMS/voice-first defaults), dual users (cigarettes + vapes).
**Features**
- **[TS]** Minute-one onboarding → choice of quit-date or cut-down-to-quit pathway; pre-quit reduction scheduler (scheduled gradual reduction with adherence-aware re-planning).
- **[TS]** Craving toolkit: urge-surfing audio (90s/3min/5min variants), delay timers, substitution menus, distraction packs, breathing pacers; trigger logging with one tap (or text CRAVE).
- **[TS]** If-then plan builder for top-3 personal triggers; morning-after-lapse debrief protocol; "days won" streaks; savings tracker tied to real prices the user enters, with goal-pegging ("£312 = your boiler service + Christmas float").
- **[TS]** Pharmacotherapy support: NRT product chooser, usage technique coaching, side-effect coping, varenicline/cytisine adherence loops (prescriber-in-the-loop; no dosing decisions in-product); pharmacy-finder + e-voucher integration for commissioned cohorts.
- **[D]** Optional remote CO verification: camera-guided exhalation, liveness checks, advisor-witnessed video option; verification-confidence scoring to commissioner dashboard.
- **[D]** Risk-window JITAI: learned windows (first-cigarette time, commute, after-work, payday, post-meal, drinking occasions) trigger pre-emptive micro-support; "drinking tonight?" Friday-afternoon plan prompts.
- **[D]** Identity-shift programme: "becoming a non-smoker" narrative arc, milestone identity reflections, ex-smoker story library matched by demographic similarity.
- **[BS]** Household quitting: partner/household co-quit mode with synchronised plans and shared milestones; smoke-free-home pathway for parents (different goal frame).
- **[BS]** Financial-rail integration: open-banking-verified savings sweep into a named savings pot ("your quit pays your quit").
- **[R]** Voice-sampled craving/stress timing signal as JITAI input (pilot-only); front-camera attentional-bias micro-tests (research-grade).
**Verification:** self-report (relapse-sensitive repeated prompts) → optional Bluetooth CO → pharmacy/advisor-witnessed CO.
**Escalation:** pregnancy → specialist services; MH deterioration markers → mood pathway/GP; chest-pain-type red flags → urgent-care signposting.
**Commissioning hooks:** NG209/NCSCT alignment; LA contracts on ring-fenced grant; per-verified-quit tariff support; Russell-Standard-compatible outcome definitions.

### 5.2 Vaping Cessation incl. Youth ("Exhale")
**Outcomes & instruments:** self-reported 7- & 30-day abstinence; use-days; dependence proxies (time-to-first-vape); symptom trajectories; (later) home cotinine.
**Segments:** adult exclusive vapers, adult dual users (route into 5.1 logic), adolescents 13–17 (structurally separate privacy/safeguarding build).
**Features**
- **[TS]** Text-first teen pathway: anonymous-feeling onboarding, no parental visibility by default, school-schedule-aware quiet hours, panic-button support before parties/school ("text PANIC"), refusal-script rehearsal with the Coach.
- **[TS]** Withdrawal coaching, boredom-replacement menus, stealth-use functional analysis ("what does the toilet-break vape do for you?"), appearance/performance/savings framing (autonomy-supportive, never disease-scare-led).
- **[D]** Identity framings for sport/gaming subcultures; peer-norm correction content (actual prevalence vs perceived).
- **[D]** Optional parent/guardian module: parallel coaching for parents on supportive (not punitive) responses — informationally firewalled from the teen's data.
- **[BS]** School-service mode: cohort onboarding via school nurses with anonymous aggregate reporting only; safeguarding routing duty-compliant.
- **[BS]** Device-tapering tools: puff-budget plans, nicotine-strength step-down ladders with product-mapping database.
**Verification:** self-report + dependence and use-day trajectories; home cotinine lateral-flow with camera read as later add-on.
**Escalation:** safeguarding signals → designated-safeguarding-lead routing per service spec; MH comorbidity step-ups.
**Commissioning hooks:** LA youth-health and school-commissioned pilots; framed honestly as feasibility-then-effectiveness (evidence is [M]).

### 5.3 Alcohol Reduction & AUD ("Steady")
**Outcomes & instruments:** AUDIT/AUDIT-C; drinking days, heavy-drinking days, units/week; (commissioned cohorts) verified-BrAC sampling; treatment-engagement events for higher acuity.
**Segments:** increasing-risk, higher-risk, harmful, dependent (the product *ladders*: moderation permitted where clinically appropriate; dependence routes to assess-and-refer + adjunct mode, never unsupported solo detox — explicit withdrawal-risk screening with hard stop + referral, since unsupervised alcohol withdrawal is dangerous).
**Features**
- **[TS]** Emotionally-safe drink diary (quick-log, retro-fill mercy, no red shaming ink); normative feedback ("people your age in your area actually drink…"); goal types: drink-free days, unit caps, spend caps.
- **[TS]** "Tomorrow-morning" framing engine (prospective consequence salience); binge-risk countdowns before learned drinking windows; social-event survival plans (drink spacing, alternation scripts, exit plans).
- **[TS]** Lapse debriefs tuned for abstinence-violation spirals; craving rescue (urge surfing + delay + call-someone flows).
- **[D]** Payday/fixture/Friday risk-window JITAI; venue-category-aware prompts (consented, on-device geofence categories, no location retention).
- **[D]** Adjunct mode for treatment services: appointment reminders, between-session skill practice, recovery-network mapping, medication adherence (acamprosate/naltrexone — adherence support only).
- **[BS]** Connected-breathalyser moderation pilots: randomised-window BrAC sampling with liveness; morning-after verified-sober streaks.
- **[BS]** Open-banking spend signals (consented) → "alcohol spend trajectory" mirrors and savings framing.
**Verification:** AUDIT trajectories + drinking-day self-report → breathalyser subcohorts.
**Escalation:** dependence/withdrawal-risk screen → local-service referral with warm handoff; DV/safeguarding lexicon active (alcohol contexts elevate risk).
**Commissioning hooks:** LA drug-and-alcohol grant alignment; employer occupational-health offers; NICE CG115-anchored pathway definitions.

### 5.4 Other Substance Use ("Anchor") — adjunct-only posture
**Outcomes:** treatment retention, attendance, self-reported use-days, craving intensity trajectories, re-engagement after relapse; (later) home saliva/urine with camera read.
**Segments:** severity-tiered — experimental/problem use; treatment-engaged; recently discharged (highest-value window); MAT patients (opioid agonist therapy adherence support).
**Features**
- **[TS]** Recovery-network mapper (who/where/when of support); "reach someone now" one-tap flows; discreet UX (neutral app face option, PIN lock).
- **[TS]** Post-discharge relapse-prevention programme: highest-risk-window scheduling (first 90 days), daily anchors, service re-entry pathways that pre-authorise "coming back is success".
- **[D]** Payday/location-category risk alerts; MAT medication prompts + collection-window reminders; contingency-management workflows where commissioned (verified attendance → incentives).
- **[BS]** Peer-mentor matching (lived-experience, supervised); family/affected-other parallel track.
**Escalation:** overdose-risk lexicon (incl. use-after-abstinence tolerance warnings as harm-vital safety information), naloxone-availability signposting, crisis routing; this module runs the strictest risk classifiers.
**Commissioning hooks:** adjunct to commissioned treatment services (drug & alcohol grant); honest [E/M] evidence posture; service-attendance data integration as verification.

### 5.5 Gambling Harm ("Stake-Free")
**Outcomes & instruments:** PGSI; gambling-days, spend (self-report → open-banking-verified); self-exclusion coverage status; debt-action milestones; affected-other reach.
**Segments:** young men (sports/online casino), debt-coincident, anxiety/depression-comorbid, affected others (own pathway).
**Features**
- **[TS]** "Take control" onboarding (control framing, not treatment framing): one session sets up the **protection stack** — GAMSTOP enrolment hand-off, bank gambling-block walkthroughs (per-bank guides), device blocker (Gamban-class) setup, marketing unsubscribe sweep.
- **[TS]** Urge management: cooling-off frictions, urge surfing tuned to near-miss/chasing cognitions, "the next bet" cognitive drills; payday-eve and fixture-day pre-emptive plans.
- **[TS]** Debt triage: shame-safe money-harm assessment → StepChange/Citizens-Advice-class routing; bill-priority education; "ringfence tonight" emergency moves.
- **[D]** Event-risk JITAI: fixture lists + learned bet-timing + payday cycles → pre-emptive support windows; big-event blackout plans (e.g. major tournaments).
- **[D]** Affected-other track: financial-protection education, conversation scripts, own-wellbeing support, (consented) relapse-alert sharing.
- **[BS]** Open-banking integration (read-only, consented): spend-pattern signals as outcome verification + early-warning (resumed-gambling transaction categories trigger support, never punishment); block-status attestation to commissioners.
- **[R]** Attentional-bias coping drills with eye-tracking micro-tasks (research-grade only).
**Verification:** PGSI + self-exclusion status + bank-block status + (consented) open-banking signals — the strongest non-biometric verification story in the platform.
**Escalation:** suicidality classifiers at maximum sensitivity (gambling-harm cohorts carry elevated risk); debt-crisis fast routing.
**Commissioning hooks:** statutory-levy-funded ecosystem; NHSE commissioning (from April 2026); NG248 alignment; positioning = integrated harm-reduction infrastructure + structured support, honestly distinct from "digital therapy" claims.

## CLUSTER B — METABOLIC & CHRONIC RISK

### 5.6 Weight Management & Obesity ("Stride")
**Outcomes:** weight trajectory (% loss at 12/26/52/104 weeks); waist; engagement-with-eating-pattern goals; QoL PROMs.
**Segments:** BMI/risk tier, deprivation, GLP-1 users (initiation/maintenance/off-ramp), emotional-eating profile, shift workers, minority-ethnic dietary contexts; **ED screen at intake → ED-flagged users are routed out of weight-loss framing entirely** (hard content contraindication).
**Features**
- **[TS]** Weekly weight loop (connected scale or photo-assisted manual); non-judgemental trend smoothing (trend line, not daily noise); plateau-aware dynamic goal resets.
- **[TS]** Meal planning under real constraints: budget-first planner (cost-per-portion database), cuisine-specific packs, batch-cook modes, food-insecurity-aware swaps; supermarket-list export.
- **[TS]** "Real life" coping packs: holidays, shift work, stress-eating functional analysis, family-meal negotiation.
- **[D]** GLP-1 companion: side-effect coping, protein/muscle-preservation guidance, titration-window check-ins, off-ramp maintenance programme (prescriber-in-the-loop), supply-disruption contingency support.
- **[D]** Identity & stigma work: weight-stigma-safe language throughout; mobility/energy goal framing as default, not appearance.
- **[BS]** Photo-meal logging with on-device food recognition as *friction reducer* (portion estimates stated as rough, never kcal-precision theatre); barcode + UK supermarket product database.
- **[BS]** Connected-kitchen integrations; family-account meal planning.
**Verification:** connected scales → photo-assisted manual → plain self-report (plausibility-scored).
**Commissioning hooks:** NICE weight-management digital-technology pathway; NHS Digital Weight Management Programme referral compatibility; tier-2/3 service adjacency.

### 5.7 T2D Prevention & Remission ("Reverse")
**Outcomes:** weight (proxy), NDH→T2D conversion (via GP-linked HbA1c), programme completion (NHS-DPP-style milestones), remission-pathway adherence; medication-change events (deprescribing tracked with prescriber).
**Segments:** NDH/prediabetes, early-T2D remission candidates, GLP-1/metformin users, food-insecure households.
**Features**
- **[TS]** DPP-class structured programme (9–12 month curriculum) digitised with full channel parity (SMS-deliverable session summaries); glucose-awareness education; meal-pattern coaching shared with 5.6.
- **[D]** Remission-candidacy pathway: eligibility education, total-diet-replacement support modules where clinically supervised, food-reintroduction coaching, weight-loss-maintenance long tail.
- **[D]** Lab-feed integration: GP-Connect/pathology HbA1c ingestion → milestone verification without clinic friction.
- **[BS]** CGM-integration mode (where prescribed/consumer): glucose-response education loops (careful framing; not diagnostic).
**Commissioning hooks:** NHS DPP ecosystem compatibility; ICB prevention budgets; verified-HbA1c outcomes as the commercial differentiator.

### 5.8 Hypertension & CVD Risk ("Pressure Point")
**Outcomes:** home BP trajectories (validated-cuff), control-rate (% <target), medication adherence proxies, salt/alcohol/activity behaviour shifts, QRISK-style risk-score movement.
**Segments:** suspected HTN (diagnostic-support monitoring), diagnosed-uncontrolled, medicated-stable, multi-risk employer cohorts.
**Features**
- **[TS]** Guided home-BP loops: rest-timer + posture/cuff-position camera coaching + paired-reading protocol; manual-entry fallback; GP-shareable BP diaries (structured, guideline-formatted).
- **[TS]** "What raised my BP?" journalling: tagged context (salt, alcohol, stress, sleep, missed meds) correlated into personal insight cards (associational language only).
- **[TS]** Medication adherence loops (statins/antihypertensives) with "why this matters to *your* goals" reinforcement; titration-friendly design (readings packaged for prescriber review).
- **[D]** Software-first design: full value with zero hardware (education, salt/alcohol/activity behaviour programmes, manual readings) — much stronger with a cuff (fleet-supplied for commissioned cohorts).
- **[BS]** Pharmacy-BP-check integration (community pharmacy readings flow in via advisor console); BP-crisis threshold safety-netting (urgent-care routing at red-flag readings).
- **[R]** rPPG camera vitals as engagement/trend signal only — never a clinical BP claim.
**Commissioning hooks:** home-BP-monitoring guidance alignment (incl. Scottish guidance and Connect-Me-style remote-monitoring precedent); employer CVD offers.

### 5.9 Physical Activity & Sedentary Behaviour ("Momentum") — foundation layer
**Outcomes:** steps, brisk minutes, sedentary-bout reduction, strength-session adherence; maintenance at 6/12/24 months (the honest hard metric).
**Features**
- **[TS]** "Ten-minute wins" architecture: micro-session library (walk, bodyweight, chair-based, stretch); commute/lunch-break timing intelligence; inactivity-rescue prompts after long sedentary stretches (watch/phone-detected).
- **[TS]** Context-aware suggestion engine (HeartSteps-pattern): weather-adapted, daylight-aware, location-category-aware (consented) walking prompts; neighbourhood-safe route packs (with LA input).
- **[D]** Proportionate incentives (partner credits) for verified activity; workplace team challenges with privacy firewall.
- **[D]** Maintenance science build: the module's KPI is the 6-month retention curve — re-engagement ladders, seasonal re-onboarding, identity consolidation ("you're someone who walks") get first-class investment because Active-10-style drop-off is the known failure mode.
- **[BS]** AR/computer-vision form coaching for strength sessions (on-device pose estimation, also feeds MSK and falls modules).
**Positioning:** rarely sold alone; embedded as the engine inside weight, CVD, mood, MSK, and ageing pathways.


## CLUSTER C — MENTAL & COGNITIVE WELLBEING

### 5.10 Anxiety & Depression Guided Self-Help ("Steadier Minds")
**Outcomes & instruments:** PHQ-9, GAD-7 trajectories mapped to reliable-improvement / reliable-recovery logic (Talking-Therapies-compatible definitions); WSAS functioning; module completion; waiting-list-bridge engagement.
**Segments:** less-severe vs more-severe (severity gates the offer — more-severe routes to services with the product as adjunct), new episode vs relapse-prevention, LTC-comorbid, neurodivergent users (adapted pacing/formats), waiting-list cohorts.
**Features**
- **[TS]** Low-friction AI-supported self-referral & intake (Limbic-Access-class): conversational, validating, short first session with one concrete win; instrument administration verbatim.
- **[TS]** Structured guided self-help: behavioural-activation programme (activity scheduling + mood-energy loops), cognitive-restructuring micro-modules, worry-time/postponement, problem-solving therapy frames, exposure-ladder builder for anxiety (graded, user-paced).
- **[TS]** Daily mood/energy loop (2-tap), weekly instrument pulse, trajectory visible to the user in reliable-change language ("a 6-point drop like yours is a real change, not noise").
- **[TS]** Sleep and worry cross-modules auto-offered (comorbidity is the norm); voice-safe journalling (audio diary with on-device transcription, user-controlled retention).
- **[D]** Waiting-list bridge product: explicitly commissioned mode for Talking-Therapies waitlists — holding support, deterioration monitoring (instrument-based), fast-lane escalation on reliable deterioration, warm handoff packets to the human therapist (consented summaries).
- **[D]** Relapse-prevention long tail post-treatment: early-warning-sign personal signature builder, monthly pulses, booster sessions.
- **[BS]** Human-in-the-loop blended care: in-product messaging with assigned practitioners (commissioned tiers), shared plan canvases, session-prep summaries.
- **[R]** Passive-signal deterioration hints (sleep regularity, activity, typing cadence) as *prompts to ask*, never as diagnoses (pilot-gated).
**Escalation:** risk lexicon at high sensitivity; scripted safety flows; same-day human review queues for commissioned cohorts; crisis-routing matrix localised per ICB.
**Commissioning hooks:** NG222 alignment; Talking-Therapies-compatible metrics; digitally-enabled-therapies EVA posture; SaMD up-regulation candidate (second after insomnia).

### 5.11 Stress & Burnout ("Decompress") — employer-led
**Outcomes:** PSS trajectories, work-engagement measures, absence/presenteeism (employer-aggregate), sleep co-metrics; **never individual data to employers** (§3.11 firewall is the headline feature).
**Features**
- **[TS]** Skills core: recovery micro-breaks (90-second decompression on calendar-gap detection, consented), boundary plans ("shutdown ritual" builder), workload-conversation scripts, decision-fatigue self-checks.
- **[TS]** Honest framing: content explicitly distinguishes individual coping from organisational causes; "too much on" flows route to practical support (manager-conversation prep, HR signposting, occupational-health referral) rather than mindfulness-as-sedative.
- **[D]** Sleep/activity/stress integration (the dossier's whitespace): one combined recovery index and programme rather than three silos.
- **[D]** Aggregate organisational-insight reports (k-anonymised): hotspot teams, demand-pattern flags — sold as management information for *organisational* fixes.
- **[BS]** Calendar-integrated recovery engineering: meeting-load shaping suggestions, focus-block protection, on-call-rota recovery scheduling for frontline/NHS-staff deployments.
**Commissioning hooks:** employer/OH contracts; NHS-staff-wellbeing programmes; DiGA-style evidence posture (HelloBetter-class) for future regulated ambitions.

### 5.12 Sleep & Insomnia ("Nightshift") — FLAGSHIP REGULATED CANDIDATE
**Outcomes & instruments:** ISI / Sleep Condition Indicator; sleep-efficiency from diaries; WASO/SOL; medication-reliance reduction; (device sleep as supplementary).
**Segments:** chronic insomnia, anxiety/depression-comorbid, older adults, shift workers (dedicated protocol), medication-reliant sleepers, short-sleep-belief profiles.
**Features**
- **[TS]** Full digital CBT-I: stimulus-control coaching, **sleep-restriction therapy with algorithmic titration** (prescribed sleep window computed from diary efficiency, weekly adjustment rules, safety screens — excessive-daytime-sleepiness occupations flagged), cognitive restructuring for sleep beliefs, relaxation/wind-down library.
- **[TS]** Frictionless sleep diary (morning 4-tap; SMS-completable; voice-completable); sleep-efficiency feedback loops in plain language.
- **[TS]** "Can't sleep right now" rescue mode: 2am-safe (dark UI, no blue-light hypocrisy, audio-first) stimulus-control walkthroughs.
- **[TS]** Medication-avoidance education and (prescriber-in-the-loop) hypnotic-deprescribing support content.
- **[D]** Shift-worker protocol: rotating-pattern-aware windows, anchor-sleep strategies, light-exposure timing guidance.
- **[D]** Stepped integration: insomnia-plus-anxiety combined pathway (the comorbid majority), with single shared diary burden.
- **[BS]** Wearable-informed (not wearable-led) titration: device sleep as corroboration with diary primacy (orthosomnia-aware design — the product actively de-escalates sleep-tracker obsession).
- **[BS]** Smart-home wind-down: lights/thermostat/speaker routines as stimulus-control aids.
**Regulatory posture:** this module is the **first SaMD candidate** (Sleepio precedent; treatment claims justify the burden). Built from day one with clinical-investigation-ready data discipline.
**Commissioning hooks:** ICB mental-health and MSK-adjacent pathways (pain-sleep), staff-wellbeing deployments; strongest evidence story in the platform.

## CLUSTER D — LIFE-STAGE & LONG-TERM CONDITION

### 5.13 Healthy Ageing, Falls Prevention & Frailty ("Steadfast")
**Outcomes:** falls incidence (self/carer-reported), falls-related-injury proxy, strength-balance adherence minutes, fear-of-falling scale, functional milestones (chair-rise counts), loneliness pulse.
**Segments:** prefrail vs frail, falls-history, sensory-impaired, low digital confidence (default to TV/voice/carer-assisted), care-home vs community.
**Features**
- **[TS]** Progressive strength-and-balance programme (StandingTall-pattern): graded exercise videos with TV mode, giant-button UX, session timers, confidence-building progression logic, "wobble day" easier alternatives.
- **[TS]** Voice-first option: scheduled IVR exercise-guidance calls and check-ins; medication prompts by voice.
- **[TS]** Carer/family link (consented): adherence visibility, sudden-drop alerts ("Mum hasn't done her exercises in 6 days and didn't answer Tuesday's call"), shared celebration moments.
- **[D]** Safety-net engine: adherence-drop + non-response patterns trigger graduated outreach (message → call → nominated-contact alert per consent).
- **[D]** Loneliness-sensitive engagement: conversation-forward coach style for isolated users (within dependency guards), local-group signposting (walking groups, strength classes) with LA directories.
- **[BS]** Phone-based gait/balance micro-assessments (timed-up-and-go with phone sensors, sway measurement) as progress feedback (research-validated before any clinical claim).
- **[BS]** Home-hazard self-assessment with camera-guided room walkthrough and checklist generation; OT-referral routing.
**Commissioning hooks:** LA prevention + ICB frailty pathways; falls-related-admission avoidance business case; accessibility as first-order proof.

### 5.14 Medication Adherence ("OnTrack") — cross-cutting utility, not a standalone wedge
**Outcomes:** adherence proxies (self-confirmation, refill timing, smart-cap events), downstream biometric response (BP/HbA1c improvement as the *real* outcome), persistence at 6/12 months.
**Features**
- **[TS]** Regimen model: full schedule capture (incl. complex regimens), simplification views, interaction-with-routine anchoring ("with your morning coffee"), side-effect coping content per drug class, "why this medicine serves *your* goal" reinforcement.
- **[TS]** Smart reminders with alert-fatigue management (escalate modality, not frequency; confirm-or-snooze; quiet success).
- **[D]** Caregiver-shared regimens (consented), multi-carer coordination, device-sharing-aware profiles.
- **[D]** Pharmacy integration: refill-timing signals, collection reminders, new-medicine-service-style onboarding for key drug classes.
- **[BS]** Smart pill-cap fleet support; EPS-linked dispensing-event ingestion; deprescribing-conversation prep tools.
**Positioning rule:** ships only *inside* hypertension, T2D, smoking-pharmacotherapy, mental-health, and pain pathways.

### 5.15 MSK & Chronic Pain Digital Physiotherapy ("Reclaim")
**Outcomes:** pain & function PROMs (e.g. MSK-HQ-class), exercise completion, range-of-motion progress (CV-measured), return-to-work where relevant, referral/appointment avoidance proxies.
**Segments:** acute vs chronic, waiting-list patients (bridge mode), work-disrupting MSK, arthritis, post-injury, high-catastrophising profiles (psychologically-informed track).
**Features**
- **[TS]** Symptom triage at entry (red-flag screening with hard-stop urgent routing: cauda-equina-pattern symptoms, etc.) → body-area-specific graded programmes.
- **[TS]** Personalised exercise progression: video-guided sessions, difficulty auto-adjustment from feedback, flare-day alternative plans ("today's gentler version"), pacing education (boom-bust pattern coaching).
- **[TS]** Pain-neuroscience education curriculum (fear-reduction, graded-exposure logic, recovery-expectation setting); pain-sleep-mood integration (cross-module).
- **[D]** Waiting-list-bridge commissioned mode (the getUBetter-pattern system fit): safety-netted self-management while queued, deterioration triggers fast-lane review, discharge-prevention data to the ICB.
- **[D]** Work-support layer: work-friendly routine packs (desk/driving/manual-labour variants), fit-note-conversation prep, phased-return planning content.
- **[BS]** Computer-vision form & ROM measurement (on-device pose estimation): form correction cues, objective ROM trajectories as verification-grade outcomes.
- **[BS]** Group physio rooms (video classes with consented cohort peers); optional wearable-EMG/inertial-sensor integrations for rehab-grade tracking.
**Commissioning hooks:** ICB elective-recovery/waiting-list funds; employer OH; CE/UKCA-marked-class posture as required by claims.

---

# PART 6 — BLUE-SKY & RESEARCH-GATED CAPABILITY PROGRAMME

These are platform-level capabilities beyond Part 3/5 baselines. Each carries deployment gates.

## 6.1 Conversational voice agent everywhere [BS]
Full-duplex LLM voice agent on ordinary phone lines (no smartphone required): natural-language intake, coaching sessions, instrument administration, craving-rescue calls, older-adult companionship-bounded check-ins. Gate: guardrail-parity certification with text coach; latency <800ms turn-taking; human-handoff always one utterance away.

## 6.2 Affective & physiological sensing suite [R]
- **Voice biomarkers** (Kintsugi-class sensitivity/specificity is screening-grade, not diagnostic): timing/receptivity signal for JITAI in consented pilots only.
- **Keystroke & touch dynamics** for mood/cognition trend hints (bipolar/MCI literature is emerging).
- **Smartphone pupillometry/eye-tracking micro-tasks**: attentional-bias measurement (gambling/smoking cues), fatigue, alcohol-related oculomotor effects.
- **rPPG camera vitals**: HR/HRV trend capture in calm conditions.
**Gates (all):** separate ethics-approved protocols; on-device feature extraction; bias/generalisation audits across demographic strata; never sole risk markers; never commissioner-facing endpoints until peer-reviewed validation; user-facing language stays at "signal we're checking," never diagnosis.

## 6.3 Digital-twin behavioural modelling [BS/H]
Per-user generative simulation of habit dynamics (craving cycles, sleep-debt interactions, activity-mood coupling) to (a) preview plan changes ("if you moved your sleep window 45 min, the model expects…"), (b) stress-test JITAI policies offline, (c) power synthetic-cohort planning for commissioners. Gate: clearly labelled as model estimates; offline policy-testing first use.

## 6.4 Federated learning & privacy-preserving research mesh [BS]
Cross-site model improvement (relapse-timing, receptivity, engagement models) without raw-data pooling; differential-privacy aggregates for public-health research partnerships; secure research enclaves for NIHR-funded analyses.

## 6.5 Open-banking behavioural finance rail [BS]
Beyond gambling: consented spend-category mirrors for alcohol and tobacco; automated savings-sweep products ("your quit funds your holiday pot"); deposit-contract mechanics (gated by FCA-compliance review and ethics).

## 6.6 Ambient & IoT integration [BS]
Smart-home stimulus-control (sleep), kitchen-scale/food-system integrations (weight), TV-native rehab (MSK/ageing), car-system integration for commute-window coaching (audio-only, driver-safe).

## 6.7 Genomics/biomarker-informed personalisation [H]
Pharmacogenomic-aware pharmacotherapy content (e.g. NRT response variation) — flagged as hypothesis-tier; no build until evidence and governance mature.

## 6.8 LLM-native service operations [BS]
Coach-conversation quality auditing at 100% coverage (model-scored MI-fidelity metrics, human-sampled calibration); synthetic red-team conversation generation for safety regression suites; commissioner-report drafting from outcome data (human-approved).


---

# PART 7 — DATA ARCHITECTURE

## 7.1 Canonical data model (FHIR-native authorship)
| Domain object | FHIR resource(s) | Notes |
|---|---|---|
| User | Patient (+ RelatedPerson for supporters/carers) | NHS-number-linked where commissioned; pseudonymous D2C profiles supported |
| Instrument administration | Questionnaire / QuestionnaireResponse | Versioned instruments; verbatim-item integrity enforced at schema level |
| Outcomes & biometrics | Observation (LOINC/SNOMED-coded) | CO ppm, BP, weight, units/week, PGSI, ISI, PHQ-9, steps, sleep efficiency; each Observation carries a **verification-confidence extension** (verified / corroborated / self-report) and provenance |
| Plans | CarePlan + Goal | If-then plans, quit plans, sleep windows, exercise programmes |
| Coach & outbound contacts | Communication / CommunicationRequest | Channel, content-atom ID, BCT codes, JITAI decision ID |
| Consents | Consent | Per-purpose, per-signal, per-recipient; runtime-enforced |
| Devices | Device / DeviceMetric | Fleet serials, firmware, calibration, user binding |
| Escalations | Flag + Task | Risk events, queue routing, SLA clocks, closure audit |
| Enrolment & cohorts | EpisodeOfCare / Group | Commissioned-contract scoping |

## 7.2 Event backbone
- Append-only event stream (every user action, decision-point evaluation, message send/receive, sensor reading, guardrail trigger) → immutable event lake.
- **JITAI decision records** are first-class events: state snapshot, candidate actions, policy version, chosen action, randomisation probability (MRT-ready by construction).
- Stream processing for real-time triggers (risk lexicon hits, verification events, adherence drops) with <2s end-to-end latency budget for safety-class events.

## 7.3 Analytics & ML data plane
- Feature store (user-level tailoring variables, risk-window features, receptivity features) with point-in-time correctness for honest model training.
- Experiment assignment service with cluster/cohort stratification, guardrail-metric monitoring, and sequential-testing support.
- Model registry with mandatory model cards (intended use, training population, bias audit, performance strata) and staged rollout (shadow → canary → ramp) plus automatic rollback hooks.
- Pseudonymisation boundary: analytics plane runs on pseudonymised data; re-identification keys held in a separate, audited service.

## 7.4 Retention & minimisation
- Per-datatype retention schedules (raw Phase-3 sensor features: shortest; outcome records: contract-defined; safety/audit logs: statutory periods).
- Default-deletion of raw location and raw audio (on-device extraction); derived-feature-only retention.
- User-initiated erasure honoured within statutory windows, with safety/audit carve-outs explained in plain language.

---

# PART 8 — INFRASTRUCTURE & TECHNOLOGY STACK

(Blue-sky assumption removes build-time constraints, not engineering judgement. Stack choices below are reference architecture; equivalents acceptable.)

## 8.1 Reference stack
| Layer | Reference choice | Requirements driving it |
|---|---|---|
| Cloud | UK-region hyperscaler (multi-AZ; UK data residency) | NHS DSPT, commissioner data-residency expectations |
| Service architecture | Modular monolith → services along Part-3 module boundaries; event-driven (Kafka-class bus) | The "one core, thin verticals" thesis must be literal in the code |
| APIs | FHIR R4 REST + GraphQL BFFs per channel | §3.10 |
| Mobile | Native iOS (Swift) + Android (Kotlin), shared KMP domain layer; offline-first local store | Low-end-device + offline budgets |
| Web | PWA (TypeScript/React-class), SSR for low-power devices | Library/shared-computer use |
| Messaging/telephony | CPaaS (SMS shortcodes, voice, WhatsApp BSP) + programmable IVR; UK number estate | Channel-parity Tier-1 SMS/voice |
| Voice agent | Streaming ASR + LLM orchestration + low-latency TTS; telephony media servers | §6.1 latency budget |
| LLM layer | Hosted frontier models behind a policy-enforcement proxy (prompt/response filters, risk classifiers, logging); fine-tuned smaller models for classification tasks; on-device small models for sensing-feature extraction | Guardrails outside the model; data-protection boundaries |
| Rules/policy engine | Deterministic decision service (versioned, testable, replayable) | Clinical-safety auditability |
| ML serving | Feature store + online inference service; bandit/RL policy server with off-policy evaluation harness | §3.4 |
| Data | Event lake (object store + table format), warehouse for BI, stream processor | §7.2–7.3 |
| Device/IoT | BLE device SDKs in-app; device-management service; firmware-update pipeline | §3.16 |
| Identity | NHS login federation + own IdP; step-up auth for sensitive views | §3.11 |
| Observability | Full-stack tracing, clinical-event audit trail (separate, immutable), SLO dashboards | §9 |

## 8.2 Non-functional requirements
- **Availability:** 99.9% core platform; 99.95% for safety-escalation path (independent degraded-mode: if the platform is down, crisis keywords on SMS still return static crisis-routing content from an isolated responder).
- **Latency:** in-app interactions <300ms p95; coach first-token <1.5s; voice-agent turn <800ms; safety-classifier in-line budget <500ms.
- **Scale targets:** 5M registered users, 500k DAU, 50M events/day, 1M outbound messages/day, 100k concurrent SMS sessions — without architectural change.
- **Offline:** 30-day fully-offline app operation (content packs cached, queued sync).
- **Accessibility:** WCAG 2.2 AA platform-wide; AAA for older-adult mode.
- **Penetration & resilience:** annual CHECK-class pentest; chaos drills on escalation paths; DR RPO ≤ 5min / RTO ≤ 1h.

## 8.3 Key external dependencies & integrations
| Dependency | Purpose | Risk posture |
|---|---|---|
| NHS login / PDS / ODS | Identity, demographics, org routing | Onboarding via NHS England assurance processes |
| GP Connect / pathology feeds | Problem lists, meds, HbA1c verification | Per-ICB enablement variance — design for partial availability |
| e-RS / local referral routes | Step-up referrals | Contract-specific |
| EPS / pharmacy APIs | Pharmacotherapy & refill signals | Phased |
| GAMSTOP | Self-exclusion status | Partnership agreement required |
| Open-banking AISP partner | Spend signals, savings rails | FCA-regulated partner; consent UX burden |
| CPaaS / shortcode provider | SMS/voice estate | Dual-provider failover |
| Wearable platform APIs (HealthKit, Health Connect, Fitbit, Garmin, Oura, Withings) | Activity/sleep corroboration | API-change monitoring |
| Device manufacturers (CO, BP, breathalyser, scales) | Verification fleet | Multi-vendor per category to avoid lock-in |
| LLM provider(s) | Coach & tooling | Dual-provider abstraction; no raw special-category data in prompts beyond DPIA-approved scopes |
| StepChange/Citizens-Advice-class partners | Debt triage routing | Referral agreements |

---

# PART 9 — SECURITY, PRIVACY & CLINICAL GOVERNANCE

- **Standards baseline:** ISO 27001 + ISO 27701; NHS DSPT "standards exceeded" target; Cyber Essentials Plus; SOC 2 Type II for employer market.
- **Clinical safety:** DCB0129 compliance with named Clinical Safety Officer; hazard log integrated with incident management; DCB0160 deployment packs for NHS customers; clinical-risk classification per module.
- **Data protection:** UKGDPR special-category processing under Art. 9 conditions mapped per cohort (consent for D2C; health/social-care basis for commissioned); DPIAs per module and per sensing phase; Children's Code conformance for the youth build; LLM data-flow DPIA with prompt-content minimisation rules.
- **Safeguarding:** policy + technical routing for under-18 and adult-at-risk signals; designated-safeguarding-lead integration per service contract; staff training and audit.
- **AI governance:** model risk register; bias audits across IMD/ethnicity/age/sex strata for every deployed model; guardrail regression suites in CI (release-blocking); 100% coach-conversation logging with tiered human QA; MHRA AI-as-medical-device horizon scanning.
- **Auditability:** every escalation, guardrail trigger, JITAI decision, and verification event is replayable; commissioner audit-access provisions built into the dashboard.

---

# PART 10 — REGULATORY & COMMISSIONING COMPLIANCE MAP

## 10.1 The boundary rule (binding)
The platform launches and predominantly operates on the **non-device side** of the MHRA line: behaviour support, self-management, education, monitoring, signposting. Crossing triggers (treatment claims, clinically-consequential prediction, medication-decision driving) require an explicit, per-module regulatory decision.

## 10.2 Per-module posture
| Module | Launch posture | Up-regulation path |
|---|---|---|
| Smoking, alcohol, activity, weight (behaviour support), gambling control-stack, ageing, adherence, stress | DTAC + NICE ESF (tier-appropriate evidence) | Only if treatment claims become commercially necessary |
| Sleep/insomnia (CBT-I with treatment claim) | Built clinical-investigation-ready from day one | **First SaMD candidate** — UKCA Class IIa-type pathway, Sleepio precedent |
| Anxiety/depression guided self-help | ESF behaviour-support initially; Talking-Therapies-adjacent deployments under service governance | **Second SaMD candidate** if structured-treatment claims pursued |
| MSK triage & programmes | Claims-dependent; red-flag triage functionality assessed against SaMD criteria early | CE/UKCA-marked-class posture as claims require |
| Phase-3 sensing | Research-only protocols | No commissioner-facing claims until validated |

## 10.3 Assurance artefact checklist (maintained continuously)
DTAC submission pack (clinical safety, data protection, security, interoperability, usability/accessibility) • NICE ESF evidence dossier per module, tiered by function/risk • DCB0129 hazard log + safety case • DPIA library • DSPT submission • Children's Code conformance statement (youth module) • Penetration-test reports • Accessibility audit (WCAG 2.2) • Equality & Health-Inequalities Impact Assessment per commissioned deployment.

## 10.4 Commissioning route map (operational)
- **LA route (smoking, alcohol, weight, activity, youth):** public-health-grant-funded services; procurement via LA frameworks/tenders; KPI contracts on verified outcomes; mobilisation playbooks incl. service-spec mapping to NCSCT-class guidance.
- **ICB/NHSE route (sleep, anxiety/depression, MSK, hypertension, T2D, gambling-from-2026):** pathway-integration cases (waiting-list relief, capacity avoidance); evidence packs aligned to NICE programme guidance; information-governance onboarding (DSPT, DPS frameworks, e.g. Health Systems Support / Spark-class DPS listings).
- **Employer/OH route (stress, sleep, MSK, alcohol, CVD):** privacy-firewall guarantee as the differentiator; aggregate ROI reporting.
- **Funding sequence:** SBRI-class competitions for focused development/evaluation packages → NIHR i4i (Connect-scale early awards; PDA for pivotal development) → NHS Innovation Accelerator for spread → targeted Innovate UK calls. Grant artefacts are generated from this PRD's module sections by design.


---

# PART 11 — MEASUREMENT, EXPERIMENTATION & EVIDENCE GENERATION

## 11.1 Outcome definitions are productised
Every vertical ships with machine-readable outcome definitions (numerators, denominators, windows, verification tiers) matching the commissioning frame — e.g. Russell-Standard-compatible 4-week quits; reliable-improvement/recovery analogues on PHQ-9/GAD-7; DPP-style milestone completion. Definitions are versioned; a commissioned cohort pins its definition version for the contract term.

## 11.2 Native trial machinery
- **Micro-randomised trials:** because every JITAI decision logs randomisation probabilities (§7.2), MRTs are a configuration, not a project. Proximal-outcome analysis pipelines ship in-platform.
- **A/B & bandit experiments** at every content-selection point with burden/distress guardrail metrics and automatic stop rules.
- **Stepped-wedge & matched-comparison support** for commissioner evaluations; data-extract packs for independent academic evaluation (the credibility play: invite external evaluation early).
- **Equity-stratified analysis by default:** every experiment reports effects by IMD quintile, ethnicity, age band, sex, and channel; an intervention that wins on average but loses in deprived quintiles fails review.

## 11.3 The cheap-experiment slate (resolving the dossier's named uncertainties)
1. LA smoking pilot, 3 arms (SMS-only / app-only / blended), same content, CO-verification subcohort.
2. Youth-vaping feasibility: framing, privacy model, guardianship settings — before any cessation claims.
3. Breathalyser-enabled alcohol moderation pilot: self-report vs mixed verification concordance.
4. Equity onboarding experiment: smartphone vs SMS/voice onboarding in deprived neighbourhoods.
5. JITAI optimisation MRT before scaling adaptive complexity.
6. Privacy-acceptability study before any Phase-3 sensing deployment.

---

# PART 12 — ROADMAP (CAPABILITY-SEQUENCED, NOT TIME-BOXED)

Per the blue-sky brief, phases are dependency-ordered capability waves; no calendar constraints assumed.

## Phase 0 — Core spine
Identity/consent ledger • intake engine v1 • BCT content graph + CMS • rules-based decision layer • SMS + app + web channels at parity • escalation subsystem + safety case v1 • commissioner dashboard v1 • event backbone with MRT-ready decision logging • DTAC pack v1.
**Exit criterion:** a full smoking pathway deliverable end-to-end on SMS alone.

## Phase 1 — Smoking wedge live
QuitKit complete ([TS]+[D] set incl. CO verification fleet + advisor console) • LA pilot (3-arm) • relapse engine v1 • savings/incentive engine v1 • IVR v1.
**Exit:** first commissioned contract reporting verified quits; equity reach targets met (≥40% of cohort from IMD quintiles 1–2 where the contract serves a deprived population).

## Phase 2 — Addiction platform
Vaping (feasibility-first) • alcohol ([TS]+[D]) • gambling control-stack + support ([TS]+[D] incl. GAMSTOP/bank-block integrations) • substance-use adjunct mode • risk-window JITAI v2 (learned windows) • coach v2 (proactive check-ins, lapse debriefs at full fidelity) • open-banking pilot (gambling verification).

## Phase 3 — Sleep & mood
Nightshift full CBT-I (clinical-investigation-ready; SaMD programme initiated) • Steadier Minds guided self-help + waiting-list-bridge mode • combined insomnia-anxiety pathway • voice agent v1 (phone-line coach) • blended human-coach tooling.

## Phase 4 — Metabolic & physical
Stride (weight) incl. GLP-1 companion • Reverse (T2D prevention/remission; HbA1c lab feeds) • Pressure Point (hypertension; cuff fleet) • Momentum embedded across all modules • pharmacy/EPS integrations.

## Phase 5 — Life-stage & system depth
Steadfast (ageing/falls; TV + voice + carer link) • Reclaim (MSK; CV-based ROM) • OnTrack embedded everywhere • SMART-on-FHIR clinician surfaces • payment-by-results contracting module • counterfactual analytics.

## Phase 6 — Frontier
Phase-3 sensing pilots (voice, keystroke, pupillometry, rPPG) under ethics protocols • digital-twin policy testing • federated research mesh • smart-home/ambient integrations • deposit contracts (post-governance) • export-market regulatory adaptations (DiGA/FDA postures).

**Standing rule:** no phase ships a vertical without its escalation rules, instrument set, outcome definitions, equity-rail parity, and content clinically signed off.

---

# PART 13 — RISKS & MITIGATIONS

| # | Risk | Severity | Mitigation (designed-in) |
|---|---|---|---|
| 1 | Attrition (the sector's killer) | High | Accountability + measurable-progress design over novelty; relapse/re-engagement engine; channel-downgrade continuity; maintenance-mode long tails; retention as a first-class KPI per module |
| 2 | Inequity amplification via app-first or sensing-first assumptions | High | Equity rail is core, not add-on; SMS/voice parity; equity-stratified experiment gating (§11.2); device-lending fleets |
| 3 | AI coach clinical drift | High | Policy-owned guardrails, deterministic risk routing, 100% logging, red-team regression suites blocking release, DCB0129 hazard integration |
| 4 | Thin-evidence verticals oversold (youth vaping, gambling therapy, substance use) | Med-High | Honest evidence posture in commissioning materials; feasibility-first contracts; adjunct positioning |
| 5 | Self-report scepticism from payers | Med-High | Verification stack + confidence-scored outcomes; anti-gaming architecture; independent evaluation invitations |
| 6 | Regulatory creep (features drifting over the SaMD line) | Medium | Boundary rule (§10.1) enforced at design review; claims register; per-module posture table maintained |
| 7 | Sensing privacy backlash | Medium | Phase-gated rollout, on-device extraction, value-exchange consent UX, acceptability studies first |
| 8 | Dependency fragility (GP Connect variance, CPaaS, LLM providers, device vendors) | Medium | Partial-availability design, dual-provider abstractions, multi-vendor device catalogue |
| 9 | Commissioning-cycle and funding-landscape shifts | Medium | Multi-buyer surface (LA + ICB + employer + D2C); grant-artefact generation from modular PRD; funding figures re-verified per business case |
| 10 | Safeguarding failure in youth deployments | Critical | Structurally separate youth build; Children's Code conformance; safeguarding routing tested in feasibility phase before scale |
| 11 | Contingency-management fraud | Medium | Anti-gaming layer (liveness, randomised windows, anomaly detection); incentive caps; audit trails |
| 12 | Orthosomnia/measurement-obsession harms | Low-Med | Diary-primacy design, de-escalation content, burden governor |

---

# PART 14 — OPEN QUESTIONS (FOR STRATEGY REVIEW)

1. **Brand architecture:** one consumer brand with modules, or per-vertical brands on a shared engine? (Affects youth and gambling especially, where "health platform" branding may suppress uptake.)
2. **Human-coach staffing model:** in-house clinical team vs partner-delivered for commissioned tiers — affects escalation SLAs and margin.
3. **SaMD timing for sleep:** initiate clinical investigation in Phase 3 as specced, or earlier to compound the regulatory moat?
4. **D2C pricing posture:** free-with-commissioned-subsidy vs freemium vs employer-only — equity principles constrain paywall design.
5. **Open-banking partner selection and consent-UX burden:** is the gambling verification win worth the funnel cost at Phase-2, or defer?
6. **Data-altruism research offer:** how aggressively to build the federated research mesh as a public-good differentiator with NIHR partners?

---

# APPENDIX A — INSTRUMENT LIBRARY (per module, primary/secondary)
Smoking: HSI; CO ppm; Russell-Standard quit definitions • Vaping: time-to-first-vape, use-days, adapted dependence indices • Alcohol: AUDIT-C/AUDIT; TLFB-style drinking diaries; BrAC • Substance use: TLFB adaptation, craving VAS, treatment-attendance • Gambling: PGSI; spend/bet-days; exclusion-coverage index • Weight: kg/%, waist; EQ-5D-class QoL • T2D: HbA1c; DPP milestones • Hypertension: home-BP protocol means; adherence proxies • Activity: steps, brisk minutes, sedentary bouts • Anxiety/Depression: PHQ-9, GAD-7, WSAS; reliable-change logic • Stress: PSS; engagement measures • Sleep: ISI, SCI, diary-derived SE/SOL/WASO • Ageing: falls counts, FES-I-class fear-of-falling, chair-rise • Adherence: MARS-class self-report + refill/cap events • MSK: MSK-HQ-class PROMs, pain NRS, ROM (CV-measured), return-to-work.

# APPENDIX B — BCT BACKBONE (cross-vertical core set)
Goal setting (behaviour & outcome) • action planning • implementation intentions • self-monitoring (behaviour & outcomes) • feedback on behaviour/outcomes • problem solving • social support (practical & emotional) • prompts/cues • habit formation/rehearsal • behaviour substitution • reward & self-reward (incl. loss-framed milestones) • identity-associated change • normative feedback • urge/craving management (surfing, delay, distraction) • relapse prevention/coping planning • graded tasks/exposure • cognitive restructuring • pacing & energy management.

# APPENDIX C — TRACEABILITY
Every Part-3 module and Part-5 feature traces to the evidence dossier's mechanism maps, whitespace analyses, and verdicts; the build sequence implements the dossier's recommended wedge order (smoking → vaping/alcohol → sleep → anxiety/depression → weight/T2D → hypertension/MSK) with gambling's commissioning logic upgraded to reflect NHSE responsibility from April 2026. Funding figures, levy values, and grant amounts cited in commissioning sections are time-sensitive and must be re-verified at each business-case issuance.

---
*End of document. v1.0 — prepared for strategy review and decomposition into per-module build specs and funding annexes.*
