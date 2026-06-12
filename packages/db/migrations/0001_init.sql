CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE core.person (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudonym text NOT NULL UNIQUE,
  age_band text,
  sex text,
  language text NOT NULL DEFAULT 'en-GB',
  nation text CHECK (nation IN ('england', 'scotland', 'wales', 'northern_ireland')),
  deprivation_quintile smallint CHECK (deprivation_quintile BETWEEN 1 AND 5),
  acquisition_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pseudonymisation boundary (plan §4.2): direct identifiers live ONLY here.
-- Application roles for the analytics plane are granted core but never identity.
CREATE TABLE identity.person_identity (
  person_id uuid PRIMARY KEY REFERENCES core.person(id) ON DELETE CASCADE,
  clerk_user_id text UNIQUE,
  phone_e164 text UNIQUE,
  email text,
  postcode text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.enrolment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  vertical text NOT NULL CHECK (vertical IN ('smoking', 'vaping', 'alcohol', 'sleep')),
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'withdrawn')),
  stage text NOT NULL,
  pathway_variant text,
  content_version_pin text,
  enrolled_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_active_enrolment_per_vertical
  ON core.enrolment (person_id, vertical) WHERE status = 'active';

CREATE TABLE core.consent_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  purpose text NOT NULL,
  signal text,
  recipient text,
  action text NOT NULL CHECK (action IN ('granted', 'revoked')),
  evidence jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consent_record_person_idx ON core.consent_record (person_id, occurred_at);

CREATE TABLE core.event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text NOT NULL,
  person_id uuid REFERENCES core.person(id),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX event_person_idx ON core.event (person_id, occurred_at);
CREATE INDEX event_type_idx ON core.event (type, occurred_at);

CREATE TABLE core.decision_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  vertical text NOT NULL CHECK (vertical IN ('smoking', 'vaping', 'alcohol', 'sleep')),
  state_snapshot jsonb NOT NULL,
  candidates jsonb NOT NULL,
  policy_version text NOT NULL,
  chosen_action jsonb NOT NULL,
  randomisation_probability double precision NOT NULL
    CHECK (randomisation_probability >= 0 AND randomisation_probability <= 1),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX decision_record_person_idx ON core.decision_record (person_id, occurred_at);

CREATE TABLE core.plan_object (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  vertical text NOT NULL CHECK (vertical IN ('smoking', 'vaping', 'alcohol', 'sleep')),
  type text NOT NULL CHECK (type IN ('if_then', 'quit', 'coping', 'relapse', 'sleep_window')),
  slots jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.outcome_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  vertical text NOT NULL CHECK (vertical IN ('smoking', 'vaping', 'alcohol', 'sleep')),
  definition_id text NOT NULL,
  definition_version text NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  value jsonb NOT NULL,
  verification_tier text NOT NULL CHECK (verification_tier IN ('self_report', 'corroborated', 'verified')),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (window_end > window_start)
);

CREATE TABLE core.escalation_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  risk_class text NOT NULL CHECK (risk_class IN ('self_harm', 'abuse_dv', 'safeguarding', 'overdose', 'withdrawal_risk', 'acute_medical')),
  tier smallint NOT NULL CHECK (tier BETWEEN 1 AND 3),
  trigger_event_id bigint NOT NULL REFERENCES core.event(id),
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'claimed', 'closed')),
  sla_deadline timestamptz NOT NULL,
  claimed_by text,
  closed_disposition text,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX escalation_open_idx ON core.escalation_case (state, sla_deadline) WHERE state <> 'closed';

CREATE TABLE core.contact_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel text NOT NULL CHECK (channel IN ('app', 'web', 'push', 'email')),
  content_atom_id text,
  bct_codes text[] NOT NULL DEFAULT '{}',
  decision_id uuid REFERENCES core.decision_record(id),
  status text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.sleep_diary_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  date date NOT NULL,
  bed_time time NOT NULL,
  sleep_onset_latency_min integer NOT NULL CHECK (sleep_onset_latency_min >= 0),
  waso_min integer NOT NULL CHECK (waso_min >= 0),
  wake_count integer CHECK (wake_count >= 0),
  final_wake_time time NOT NULL,
  rise_time time NOT NULL,
  quality smallint CHECK (quality BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, date)
);

CREATE TABLE core.sleep_window (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  version integer NOT NULL,
  window_start time NOT NULL,
  window_end time NOT NULL,
  computed_from jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, version)
);

CREATE TABLE core.drink_log_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  date date NOT NULL,
  units numeric(6, 2) NOT NULL CHECK (units >= 0),
  drink_type text,
  context text,
  logged_at timestamptz NOT NULL DEFAULT now()
);

-- Append-only enforcement at the database level (plan WP1.2 acceptance).
-- Erasure (UK GDPR) is a deliberate, separate mechanism designed in WP1.3 —
-- not ad-hoc UPDATE/DELETE.
CREATE FUNCTION core.forbid_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'table %.% is append-only', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER consent_record_append_only
  BEFORE UPDATE OR DELETE ON core.consent_record
  FOR EACH ROW EXECUTE FUNCTION core.forbid_mutation();

CREATE TRIGGER event_append_only
  BEFORE UPDATE OR DELETE ON core.event
  FOR EACH ROW EXECUTE FUNCTION core.forbid_mutation();

CREATE TRIGGER decision_record_append_only
  BEFORE UPDATE OR DELETE ON core.decision_record
  FOR EACH ROW EXECUTE FUNCTION core.forbid_mutation();

CREATE TRIGGER sleep_window_append_only
  BEFORE UPDATE OR DELETE ON core.sleep_window
  FOR EACH ROW EXECUTE FUNCTION core.forbid_mutation();
