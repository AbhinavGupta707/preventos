-- 100% audit log of every coach turn (plan WP6.1). Holds free text — the user's
-- message and the raw model output — for red-team and clinical audit, so it is
-- person-scoped personal data: GDPR erasure DELETES it (see @preventos/consent
-- erasePerson), and it is deliberately NOT append-only. The safety-of-record on
-- a crisis turn is the retained core.escalation_case (which carries no free
-- text). The application only ever inserts here; a logged turn is never edited.
CREATE TABLE core.coach_interaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  vertical text NOT NULL,
  frame text NOT NULL,
  inbound_text text NOT NULL,
  pre_tier smallint NOT NULL,
  pre_risk_class text,
  disposition text NOT NULL CHECK (disposition IN ('replied', 'crisis_bypass', 'blocked_post_filter', 'fallback')),
  llm_provider text,
  llm_model text,
  llm_raw_text text,
  post_violations text[] NOT NULL DEFAULT '{}',
  final_text text,
  crisis_flow_id text,
  latency_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coach_interaction_person_idx ON core.coach_interaction (person_id, created_at);
