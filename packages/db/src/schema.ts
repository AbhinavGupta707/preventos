import {
  bigint,
  date,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgSchema,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const core = pgSchema("core");
export const identity = pgSchema("identity");

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const person = core.table("person", {
  id: uuid("id").primaryKey().defaultRandom(),
  pseudonym: text("pseudonym").notNull().unique(),
  ageBand: text("age_band"),
  sex: text("sex"),
  language: text("language").notNull().default("en-GB"),
  nation: text("nation"),
  deprivationQuintile: smallint("deprivation_quintile"),
  acquisitionSource: text("acquisition_source"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const personIdentity = identity.table("person_identity", {
  personId: uuid("person_id").primaryKey().references(() => person.id),
  clerkUserId: text("clerk_user_id").unique(),
  phoneE164: text("phone_e164").unique(),
  email: text("email"),
  postcode: text("postcode"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const enrolment = core.table("enrolment", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  vertical: text("vertical").notNull(),
  status: text("status").notNull(),
  stage: text("stage").notNull(),
  pathwayVariant: text("pathway_variant"),
  contentVersionPin: text("content_version_pin"),
  enrolledAt: ts("enrolled_at").notNull().defaultNow(),
});

export const consentRecord = core.table("consent_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  purpose: text("purpose").notNull(),
  signal: text("signal"),
  recipient: text("recipient"),
  action: text("action").notNull(),
  evidence: jsonb("evidence"),
  occurredAt: ts("occurred_at").notNull().defaultNow(),
});

export const event = core.table("event", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  type: text("type").notNull(),
  personId: uuid("person_id").references(() => person.id),
  payload: jsonb("payload").notNull().default({}),
  occurredAt: ts("occurred_at").notNull().defaultNow(),
});

export const decisionRecord = core.table("decision_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  vertical: text("vertical").notNull(),
  stateSnapshot: jsonb("state_snapshot").notNull(),
  candidates: jsonb("candidates").notNull(),
  policyVersion: text("policy_version").notNull(),
  chosenAction: jsonb("chosen_action").notNull(),
  randomisationProbability: doublePrecision("randomisation_probability").notNull(),
  occurredAt: ts("occurred_at").notNull().defaultNow(),
});

export const planObject = core.table("plan_object", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  vertical: text("vertical").notNull(),
  type: text("type").notNull(),
  slots: jsonb("slots").notNull().default({}),
  version: integer("version").notNull().default(1),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const outcomeRecord = core.table("outcome_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  vertical: text("vertical").notNull(),
  definitionId: text("definition_id").notNull(),
  definitionVersion: text("definition_version").notNull(),
  windowStart: ts("window_start").notNull(),
  windowEnd: ts("window_end").notNull(),
  value: jsonb("value").notNull(),
  verificationTier: text("verification_tier").notNull(),
  provenance: jsonb("provenance").notNull().default({}),
  recordedAt: ts("recorded_at").notNull().defaultNow(),
});

export const escalationCase = core.table("escalation_case", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  riskClass: text("risk_class").notNull(),
  tier: smallint("tier").notNull(),
  triggerEventId: bigint("trigger_event_id", { mode: "bigint" }).notNull().references(() => event.id),
  state: text("state").notNull().default("open"),
  slaDeadline: ts("sla_deadline").notNull(),
  claimedBy: text("claimed_by"),
  closedDisposition: text("closed_disposition"),
  createdAt: ts("created_at").notNull().defaultNow(),
  closedAt: ts("closed_at"),
});

export const contactRecord = core.table("contact_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  direction: text("direction").notNull(),
  channel: text("channel").notNull(),
  contentAtomId: text("content_atom_id"),
  bctCodes: text("bct_codes").array().notNull().default([]),
  decisionId: uuid("decision_id").references(() => decisionRecord.id),
  status: text("status").notNull(),
  occurredAt: ts("occurred_at").notNull().defaultNow(),
});

export const sleepDiaryEntry = core.table("sleep_diary_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  date: date("date").notNull(),
  bedTime: time("bed_time").notNull(),
  sleepOnsetLatencyMin: integer("sleep_onset_latency_min").notNull(),
  wasoMin: integer("waso_min").notNull(),
  wakeCount: integer("wake_count"),
  finalWakeTime: time("final_wake_time").notNull(),
  riseTime: time("rise_time").notNull(),
  quality: smallint("quality"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const sleepWindow = core.table("sleep_window", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  version: integer("version").notNull(),
  windowStart: time("window_start").notNull(),
  windowEnd: time("window_end").notNull(),
  computedFrom: jsonb("computed_from").notNull().default({}),
  effectiveFrom: date("effective_from").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const drinkLogEntry = core.table("drink_log_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull().references(() => person.id),
  date: date("date").notNull(),
  units: numeric("units", { precision: 6, scale: 2 }).notNull(),
  drinkType: text("drink_type"),
  context: text("context"),
  loggedAt: ts("logged_at").notNull().defaultNow(),
});
