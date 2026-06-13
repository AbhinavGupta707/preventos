/**
 * Alcohol dependence hard-stop primitives — safety invariant 4 (CLAUDE.md) and
 * plan decision E17: dependence/withdrawal-risk indicators trigger a hard stop +
 * scripted referral with NO in-app reduction pathway. Moderation pathways stay
 * available only for the increasing/higher-risk tiers.
 *
 * This module is the single deterministic source of the routing decision so the
 * rules engine (positive route: the referral) and the worker's contact-send gate
 * (negative guarantee: never deliver a contraindicated atom) agree by construction.
 * It is pure and content-free; the content-layer `isContraindicated(atom, flags)`
 * in @preventos/content performs the per-atom check at send time.
 */

/**
 * Hard-stop threshold = the AUDIT-C "possible dependence" band lower bound (>=11)
 * declared verbatim in the AUDIT_C instrument bands (@preventos/instruments). The
 * increasing-risk (5–7) and higher-risk (8–10) tiers stay moderation-eligible per
 * E17. PENDING WP10.3 clinical parameter sign-off — change this constant, never
 * bypass the gate.
 */
export const ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD = 11;

/**
 * Assessment flag that contraindicates every moderation / goal / normative /
 * drink-diary atom in the alcohol pack. This literal MUST match the
 * contraindication taxonomy authored in `content/alcohol/*.yaml`
 * (`dependence-flagged`); a content↔engine alignment test guards against drift.
 */
export const DEPENDENCE_FLAG = "dependence-flagged";

/**
 * Derives assessment flags from an AUDIT-C consumption score. Returns the
 * dependence flag at/above threshold, and nothing below it or when no score is
 * available. Other signals (full AUDIT, withdrawal lexicon) may set the same flag
 * upstream — this covers the AUDIT-C intake path.
 */
export function deriveAlcoholFlags(auditScore: number | undefined): readonly string[] {
  return typeof auditScore === "number" && auditScore >= ALCOHOL_DEPENDENCE_AUDIT_C_THRESHOLD
    ? [DEPENDENCE_FLAG]
    : [];
}
