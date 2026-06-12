-- Transactional outbox: rows are written in the same transaction as their
-- event, then dispatched by the worker. Status is mutable by design (the
-- event itself stays in the append-only core.event table).
CREATE TABLE core.outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id bigint NOT NULL REFERENCES core.event(id),
  topic text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  dispatched_at timestamptz
);

CREATE INDEX outbox_pending_idx ON core.outbox (next_attempt_at) WHERE status = 'pending';
