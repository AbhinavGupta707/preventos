-- W3-DATA: the decision tick fetches a person's enrolments every cycle
-- (per-vertical, multi-programme). Index the FK so that scan stays cheap as
-- enrolment volume grows.
CREATE INDEX IF NOT EXISTS enrolment_person_idx ON core.enrolment (person_id);
