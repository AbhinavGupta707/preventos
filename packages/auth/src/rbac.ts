export const STAFF_ROLES = ["advisor", "service_admin", "analyst", "platform_admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ACTIONS = [
  "view_caseload",
  "claim_escalation",
  "close_escalation",
  "enter_verification_reading",
  "manage_cohorts",
  "manage_content_pins",
  "view_aggregates",
  "export_aggregates",
  "manage_staff",
] as const;
export type StaffAction = (typeof STAFF_ACTIONS)[number];

/**
 * Deny-by-default permission matrix. The analyst role NEVER appears on any
 * row-level action — the k-anonymity firewall (PRD §3.11) starts here and is
 * re-enforced in the query layer.
 */
const MATRIX: Readonly<Record<StaffAction, readonly StaffRole[]>> = {
  view_caseload: ["advisor", "service_admin"],
  claim_escalation: ["advisor", "service_admin"],
  close_escalation: ["advisor", "service_admin"],
  enter_verification_reading: ["advisor"],
  manage_cohorts: ["service_admin"],
  manage_content_pins: ["service_admin"],
  view_aggregates: ["analyst", "service_admin", "platform_admin"],
  export_aggregates: ["analyst", "service_admin"],
  manage_staff: ["platform_admin"],
};

export function can(role: StaffRole, action: StaffAction): boolean {
  return MATRIX[action].includes(role);
}

export const ROW_LEVEL_ACTIONS: readonly StaffAction[] = [
  "view_caseload",
  "claim_escalation",
  "close_escalation",
  "enter_verification_reading",
];
