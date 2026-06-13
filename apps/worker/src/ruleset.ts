import { ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD, ruleSetSchema, type RuleSet } from "@preventos/decisions";

/**
 * Default anchor rules for the decision tick — daily morning/evening
 * touchpoints per vertical, arbitrated into one cross-programme budget.
 *
 * Every `send_atom` ref names a real atom in the content catalog and the one
 * `schedule_check_in` ref names a recognised outcome id; the worker fails fast
 * at boot (and CI fails) if any ref dangles — see refguard.ts. Vertical packs
 * will ship richer rule sets through content/ config and supersede this default.
 * The worker records refs, it never renders content.
 *
 * The alcohol dependence hard-stop (invariant 4 / E17) is unbypassable: it
 * preempts arbitration and the burden governor so an AUDIT-C-flagged person is
 * always routed to the scripted referral, never to a moderation atom. It routes
 * to a real, hash-pinned referral atom (content/alcohol/referral-hard-stop.yaml).
 */
export const DEFAULT_RULE_SET: RuleSet = ruleSetSchema.parse({
  version: "svc-default-1",
  rules: [
    {
      id: "smoking-morning-anchor",
      vertical: "smoking",
      priority: 50,
      when: [
        { field: "kind", op: "eq", value: "morning_anchor" },
        { field: "vertical", op: "eq", value: "smoking" },
      ],
      then: { kind: "send_atom", ref: "smoking.jitai.morning-1" },
    },
    {
      id: "smoking-evening-anchor",
      vertical: "smoking",
      priority: 40,
      when: [
        { field: "kind", op: "eq", value: "evening_anchor" },
        { field: "vertical", op: "eq", value: "smoking" },
      ],
      then: { kind: "send_atom", ref: "smoking.jitai.after-work-1" },
    },
    {
      id: "smoking-quit-countdown",
      vertical: "smoking",
      priority: 70,
      when: [
        { field: "kind", op: "eq", value: "quit_countdown" },
        { field: "vertical", op: "eq", value: "smoking" },
      ],
      then: { kind: "send_atom", ref: "smoking.jitai.quit-eve" },
    },
    {
      id: "smoking-outcome-window",
      vertical: "smoking",
      priority: 90,
      when: [
        { field: "kind", op: "eq", value: "outcome_window" },
        { field: "vertical", op: "eq", value: "smoking" },
      ],
      then: { kind: "schedule_check_in", ref: "smoking.quit.russell_standard_4w" },
    },
    {
      id: "vaping-morning-anchor",
      vertical: "vaping",
      priority: 45,
      when: [
        { field: "kind", op: "eq", value: "morning_anchor" },
        { field: "vertical", op: "eq", value: "vaping" },
      ],
      then: { kind: "send_atom", ref: "vaping.withdrawal.morning-pull-ttfv" },
    },
    {
      id: "alcohol-dependence-hardstop",
      vertical: "alcohol",
      priority: 100,
      unbypassable: true,
      when: [
        { field: "vertical", op: "eq", value: "alcohol" },
        { field: "auditScore", op: "gte", value: ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD },
      ],
      then: { kind: "send_atom", ref: "alcohol.hardstop.screen.main" },
    },
    {
      id: "alcohol-morning-anchor",
      vertical: "alcohol",
      priority: 40,
      when: [
        { field: "kind", op: "eq", value: "morning_anchor" },
        { field: "vertical", op: "eq", value: "alcohol" },
      ],
      then: { kind: "send_atom", ref: "alcohol.norm.perception-check" },
    },
    {
      id: "alcohol-evening-anchor",
      vertical: "alcohol",
      priority: 35,
      when: [
        { field: "kind", op: "eq", value: "evening_anchor" },
        { field: "vertical", op: "eq", value: "alcohol" },
      ],
      then: { kind: "send_atom", ref: "alcohol.social.builder.intro" },
    },
    {
      id: "sleep-morning-diary",
      vertical: "sleep",
      priority: 55,
      when: [
        { field: "kind", op: "eq", value: "morning_anchor" },
        { field: "vertical", op: "eq", value: "sleep" },
      ],
      then: { kind: "send_atom", ref: "sleep.sc.morning-light" },
    },
    {
      id: "sleep-evening-winddown",
      vertical: "sleep",
      priority: 45,
      when: [
        { field: "kind", op: "eq", value: "evening_anchor" },
        { field: "vertical", op: "eq", value: "sleep" },
      ],
      then: { kind: "send_atom", ref: "sleep.sc.nudge-winddown" },
    },
  ],
});
