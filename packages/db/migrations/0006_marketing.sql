-- WP8.2: marketing waitlist + first-party conversion funnel.
--
-- These live in their OWN schema, deliberately isolated from the clinical core.
-- A waitlist signup is a PRE-account lead, NOT a person: there is no FK to
-- core.person, no consent record, no enrolment. The schema boundary is the
-- privacy control — marketing data is never joined to a clinical record, and a
-- lead becomes a person only later, through the normal pseudonymous sign-up.
CREATE SCHEMA IF NOT EXISTS marketing;

CREATE TABLE IF NOT EXISTS marketing.waitlist_signup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  -- Coded programme interest (quitkit | exhale | steady | nightshift | unsure),
  -- enforced by the api allow-list schema. Never free text.
  programme text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS waitlist_signup_programme_idx ON marketing.waitlist_signup (programme);

CREATE TABLE IF NOT EXISTS marketing.funnel_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Coded event name (allow-list enum), e.g. waitlist_joined, savings_calculated.
  name text NOT NULL,
  path text NOT NULL,
  -- Coded properties only: short strings / numbers. No identifiers, no free
  -- text, no special-category data (enforced by the api allow-list schema).
  properties jsonb NOT NULL DEFAULT '{}',
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS funnel_event_name_idx ON marketing.funnel_event (name);
