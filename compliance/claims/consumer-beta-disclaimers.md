# Consumer Beta Required Disclaimers — WP10.10/G5

> **DRAFT — 2026-06-18.** These are required limiting statements for the
> consumer beta. They are not marketing claims and do not create formal clinical
> sign-off. Keep them aligned with `claims-register.json`.

## Required statements

| Placement | Text |
|-----------|------|
| Core app/store disclaimer | PreventOS is a wellbeing and habit-support app for adults. It is not a medical device and does not diagnose, treat, cure, or prevent any disease or condition. |
| Professional advice | Information in PreventOS is general support, not medical advice. Speak to a qualified health professional about symptoms, medicines, nicotine replacement products, alcohol withdrawal, sleep problems, or any health concern. |
| Emergency care | PreventOS is not an emergency service and is not monitored for urgent help. If you or someone else is in immediate danger, call 999 or your local emergency number. |
| AI coach | The coach is AI-assisted and is not a clinician. Safety messages are scripted by policy rules; the AI does not decide emergency care. |
| Alcohol safety | PreventOS does not provide alcohol detox or withdrawal support. If you might be dependent on alcohol, seek medical advice before cutting down. |
| Beta scope | Consumer beta currently enables adult smoking and adult vaping habit support. Alcohol and sleep features are internal or limited until further review. |

## Placement requirements

- Store listing: include the core and professional-advice statements in the
  long description or equivalent disclosure area.
- Onboarding: show core, professional-advice, and emergency-care statements
  before account creation or programme enrolment.
- Coach: show the AI-coach statement before the first coach session and in the
  coach settings/about panel.
- Steady/Nightshift internal builds: show the alcohol or sleep blocker statement
  wherever a public user might otherwise expect access.
- Settings/legal: keep the full set available with privacy policy and terms.

## Claims-register notes

- Required negative disclaimers must pass claims lint. The blocklists should
  catch positive medical, regulatory, emergency, and efficacy claims without
  blocking phrases such as "not a medical device" or "does not diagnose".
- Do not weaken blocklists to make promotional copy pass. Rewrite promotional
  copy or add a reviewed exception with rationale.
- Store metadata should use QuitKit + Exhale support language only. It should not
  mention sleep treatment, alcohol detox, disease prevention, clinical efficacy,
  or regulatory clearance.
