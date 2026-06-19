CREATE TABLE core.push_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES core.person(id),
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  status text NOT NULL CHECK (status IN ('active', 'revoked')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, token)
);

CREATE INDEX push_token_person_active_idx
  ON core.push_token (person_id, updated_at)
  WHERE status = 'active';
