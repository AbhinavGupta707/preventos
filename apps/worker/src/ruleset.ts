import { ruleSetSchema, type RuleSet } from "@preventos/decisions";

/**
 * Default anchor rules for the decision tick — daily morning/evening
 * touchpoints per vertical, arbitrated into one cross-programme budget.
 *
 * Every `send_atom` ref names a real atom in the content catalog and the one
 * `schedule_check_in` ref names a recognised outcome id; the worker fails fast
 * at boot (and CI fails) if any ref dangles — see refguard.ts. This maps onto
 * existing pack atoms as an interim anchor set: vertical packs will ship richer
 * rule sets through content/ config and supersede this default. The worker
 * records refs, it never renders content.
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
