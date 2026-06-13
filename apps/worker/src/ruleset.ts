import { ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD, ruleSetSchema, type RuleSet } from "@preventos/decisions";

/**
 * Default anchor rules for the decision tick — daily morning/evening
 * touchpoints per vertical, arbitrated into one cross-programme budget.
 * Atom refs are placeholders until the canonical content migration (WP4.2m)
 * pins real atom ids; the worker records refs, it never renders content.
 * Vertical packs will ship richer rule sets through content/ config.
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
      then: { kind: "send_atom", ref: "smoking.anchor.morning.v0" },
    },
    {
      id: "smoking-evening-anchor",
      vertical: "smoking",
      priority: 40,
      when: [
        { field: "kind", op: "eq", value: "evening_anchor" },
        { field: "vertical", op: "eq", value: "smoking" },
      ],
      then: { kind: "send_atom", ref: "smoking.anchor.evening.v0" },
    },
    {
      id: "smoking-quit-countdown",
      vertical: "smoking",
      priority: 70,
      when: [
        { field: "kind", op: "eq", value: "quit_countdown" },
        { field: "vertical", op: "eq", value: "smoking" },
      ],
      then: { kind: "send_atom", ref: "smoking.quit-countdown.v0" },
    },
    {
      id: "smoking-outcome-window",
      vertical: "smoking",
      priority: 90,
      when: [
        { field: "kind", op: "eq", value: "outcome_window" },
        { field: "vertical", op: "eq", value: "smoking" },
      ],
      then: { kind: "schedule_check_in", ref: "smoking.outcome.russell-28d.v0" },
    },
    {
      id: "vaping-morning-anchor",
      vertical: "vaping",
      priority: 45,
      when: [
        { field: "kind", op: "eq", value: "morning_anchor" },
        { field: "vertical", op: "eq", value: "vaping" },
      ],
      then: { kind: "send_atom", ref: "vaping.anchor.morning.v0" },
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
      then: { kind: "send_atom", ref: "alcohol.anchor.morning.v0" },
    },
    {
      id: "alcohol-evening-anchor",
      vertical: "alcohol",
      priority: 35,
      when: [
        { field: "kind", op: "eq", value: "evening_anchor" },
        { field: "vertical", op: "eq", value: "alcohol" },
      ],
      then: { kind: "send_atom", ref: "alcohol.anchor.evening.v0" },
    },
    {
      id: "sleep-morning-diary",
      vertical: "sleep",
      priority: 55,
      when: [
        { field: "kind", op: "eq", value: "morning_anchor" },
        { field: "vertical", op: "eq", value: "sleep" },
      ],
      then: { kind: "send_atom", ref: "sleep.diary.morning-prompt.v0" },
    },
    {
      id: "sleep-evening-winddown",
      vertical: "sleep",
      priority: 45,
      when: [
        { field: "kind", op: "eq", value: "evening_anchor" },
        { field: "vertical", op: "eq", value: "sleep" },
      ],
      then: { kind: "send_atom", ref: "sleep.winddown.evening.v0" },
    },
  ],
});
