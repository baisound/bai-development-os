# BAI Development OS — Consumer Design Intake / Roadmap Reconciliation
# Full Detailed Design Mandate Ver.1.0

Status: `MANDATORY_DESIGN_BRIEF / OWNER_REVIEW_REQUIRED / NO_IMPLEMENTATION_AUTHORITY`
Date: `2026-08-14`

---

# 1. Instruction to the receiving design team

Do not implement directly from the handoff package.

Treat every handoff statement as a claim to be tested.

The next team must independently inspect the current BAI Development OS repository and produce a complete, implementation-ready detailed design for the proposed Consumer Design Governance capability.

The detailed design is required even where the handoff appears explicit.

---

# 2. Mandatory design questions

For every proposed feature, answer:

- Does this already exist?
- Which current Task/subsystem owns the closest capability?
- Is modification safer than new implementation?
- What existing behavior can regress?
- Is the proposal OS-generic or Consumer-specific?
- Is it a Domain capability, Application Service, Adapter, Evidence projection or UI?
- What is the source of truth?
- What is the lifecycle/state machine?
- What becomes stale after change?
- What migration is required?
- How is old data read?
- How is rollback performed?
- What is the Authority?
- What requires Human approval?
- What is paid/external/destructive?
- What happens on timeout with unknown state?
- What is idempotent?
- What is retriable?
- What is quarantined?
- What Evidence is recorded?
- What is redacted?
- What can be learned?
- What must never be auto-learned?
- What native/real acceptance proves completion?
- Which docs/registry/roadmap records must synchronize?

---

# 3. Candidate detailed-design work packages

The team must validate, merge, split or reject these work packages rather than assuming all are required.

## DD-01 Handoff Intake Contract
- manifest schema
- provenance
- freshness
- source identity
- trust state
- completeness state
- sensitivity
- canonical-authority=false default

## DD-02 Independent Revalidation
- current Git/repository probe
- Registry/Architecture reconciliation
- claim classification
- contradiction handling
- missing source
- stale handoff rules
- fail-closed conditions

## DD-03 Relevance / Curation
- attachment classification
- OS vs Consumer ownership
- unrelated material handling
- supersession
- source retention
- redaction

## DD-04 Existing Implementation Coverage
- requirement-to-code mapping
- requirement-to-task mapping
- schema/store/test/UI mapping
- partial implementation
- reuse decision
- duplicate prevention

## DD-05 Roadmap Impact
- dependency graph
- insertion position
- safe checkpoint
- paused task interaction
- new task candidate criteria
- roadmap losslessness
- current-state synchronization

## DD-06 Feature Gap Discovery
- structured missing-capability review
- Critic questions
- implicit non-functional requirements
- generated suggestion confidence
- Human adjudication

## DD-07 Design Completeness Gate
- mandatory sections
- profile-dependent floors
- allowed N/A justification
- gate state
- evidence
- Critic/Judge flow

## DD-08 Regression Surface
- baseline inventory
- feature preservation
- command/state preservation
- native evidence preservation
- expected diff
- regression acceptance

## DD-09 Interaction / Native Acceptance
- dead-control detection
- actual event semantics
- clipping/layout
- scroll/drag
- native picker
- DPI
- accessibility
- long-data cases
- browser/native execution evidence

## DD-10 Improvement Candidate Lifecycle
- Consumer observation
- independent reproduction
- severity
- recurrence
- project-vs-global scope
- Critic adjudication
- Task/Knowledge/Reject/Defer
- TASK-017 later integration

## DD-11 Unknown / Assumption Register
- known
- unverified
- unknown source
- conflict
- assumption
- owner decision required

## DD-12 Context / Cost
- minimum safe loading plan
- context manifest
- no full-repo reread by default
- no Safety/Authority omission for token saving
- reuse TASK-018 Context Cost Observatory

## DD-13 Security / Privacy / Supply Chain
- untrusted attachments
- archive traversal
- secret scanning
- prompt/document injection
- raw Consumer content
- source hash
- signed provenance where applicable

## DD-14 Recovery / Idempotency
- interrupted intake
- partial analysis
- stale repository state
- session rotation
- resumed design
- repeated roadmap proposal
- duplicate candidate prevention

## DD-15 Schemas / Migration / Compatibility
- new schemas if justified
- versions
- compatibility
- migration
- rollback
- fixtures
- conformance

## DD-16 Observability / Metrics
Candidate:
- handoff_claim_confirmation_rate
- already_implemented_detection_rate
- missing_requirement_discovery_rate
- roadmap_reconciliation_rate
- design_gate_reject_rate
- regression_escape_rate
- interaction_acceptance_failure_rate
- false_improvement_candidate_rate
- context_tokens_per_intake
- time_to_authorized_design

Metrics must not become automatic policy authority.

---

# 4. Mandatory output artifacts before implementation

The receiving team must produce at minimum:

1. Current-state audit
2. Source curation/adjudication record
3. Existing implementation coverage matrix
4. Gap register
5. Roadmap impact analysis
6. Full detailed design
7. Schema/version/migration plan
8. Security/privacy review
9. Authority/risk matrix
10. Failure/recovery/idempotency design
11. Regression plan
12. Native/interaction acceptance plan
13. Test plan
14. Context loading plan
15. Critic design review
16. Judge/Owner decision
17. exact implementation authorization / allowed-files boundary

No implementation is considered authorized by the presence of this mandate.

---

# 5. Explicit anti-patterns

- Copying handoff statements directly into Canonical Architecture.
- Assuming the handoff lists every required feature.
- Assuming every requested feature is new.
- Creating a second implementation where a current subsystem exists.
- Reopening a completed Task to avoid making a proper new boundary decision.
- Creating a new Task only because a document suggested a number.
- Starting coding before migration/compatibility design.
- Passing UI based only on JavaScript syntax/static HTML.
- Treating mock behavior as native acceptance.
- Treating Consumer-specific Domain rules as generic OS Core.
- Treating WebMCP as required for the capability.
- Suppressing unknowns to make the plan look complete.
