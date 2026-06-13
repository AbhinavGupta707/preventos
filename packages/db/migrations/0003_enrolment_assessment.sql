-- W3-STEADY: per-enrolment intake assessment snapshot (e.g. AUDIT-C for alcohol).
-- Coded values only (instrument id, numeric score, derived safety flags) — the
-- `flags` array drives the deterministic alcohol dependence hard-stop (invariant 4).
-- Additive and nullable: existing enrolments are unaffected.
ALTER TABLE core.enrolment ADD COLUMN IF NOT EXISTS assessment jsonb;
