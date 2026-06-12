# Domain → FHIR R4 mapping (plan E9, PRD §7.1)

The domain model is FHIR-aligned, not FHIR-hosted: each entity carries a defined R4 mapping
so a future export module (and eventual FHIR server) is a projection, not a redesign.

| Domain entity | FHIR R4 resource | Mapping notes |
|---|---|---|
| `Person` | Patient | `pseudonym` → identifier (system: preventos/pseudonym). Direct identifiers live only in the identity schema and map to Patient.telecom/address in commissioned exports under lawful basis |
| identity row | Patient (same resource) | phone → telecom, postcode → address.postalCode; never exported by default |
| `Enrolment` | EpisodeOfCare | vertical → type (coded); stage → extension |
| `ConsentRecord` | Consent | purpose/signal/recipient → provision scopes; append-only history maps to Consent versioning |
| `BfoSection` | Observation (survey) + extensions | COM-B deficits as components; profile to be authored pre-export |
| instrument responses | QuestionnaireResponse | verbatim items; instrument id+version → Questionnaire canonical |
| `PlanObject` | CarePlan + Goal | slots → activity detail; sleep_window plans also project to the SleepWindow audit trail |
| `OutcomeRecord` | Observation | LOINC/SNOMED coding per outcome definition; `verificationTier` → custom extension `verification-confidence`; provenance → Provenance |
| `ContactRecord` | Communication | contentAtomId + bctCodes → extensions; decisionId links to the JITAI decision event |
| `EventRecord` / `DecisionRecord` | (event lake — no FHIR projection) | AuditEvent only where a clinical-audit view is required |
| `EscalationCase` | Flag + Task | riskClass → Flag.code; queue lifecycle → Task.status; closure audit → Provenance |
| `SleepDiaryEntry` | Observation (sleep diary panel) | SE/SOL/WASO derived metrics coded per LOINC sleep panel where available |
| `SleepWindow` | CarePlan activity | versioned titration history retained natively; CarePlan reflects current window |
| `DrinkLogEntry` | Observation | units (UK) → valueQuantity; TLFB-style aggregation handled by outcome definitions |

Status: mapping maintained alongside the domain model. Export module is deferred until the
commissioner/contract phase (plan §3); this table is the contract that keeps it cheap.
