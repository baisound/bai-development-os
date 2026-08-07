# TASK-004 Phase 1.5 — Context Guard MVP Design Critic Re-review 01

## 1. Document Control

| Item | Value |
|---|---|
| Active Role / Session | Critic / `TASK-004 Phase 1.5 Design Critic Re-review 01` |
| Runtime Interface | `INLINE_CHAT_LINUX` |
| Result | `PHASE1_5_DESIGN_REREVIEW_01_OWNER_DECISION_REQUIRED` |
| Implementation Authorization | `NOT_AUTHORIZED` |
| Allowed persistent output | This file only |

## 2. Role Activation Record

```yaml
foundation_root: /home/baisound/projects/ai-team
project_root: /home/baisound/projects/javascript-roulette
runtime_check:
  command: mandatory prompt command
  working_directory: /home/baisound
  observed:
    HOME: /home/baisound
    USER: baisound
    SHELL: /bin/bash
    UNAME: Linux
    marker: PHASE1_5_DESIGN_REREVIEW01_RUNTIME_COMPLETE
  exit_code: 0
  result: PASS
integrity:
  critic_specification: 610d3e652e437c3c14ec4bb12c0aef749893af27c70b1202ec62ee88e780e1b0
  evidence_specification: a81b65133bc45ca7e044e7484229f2b1731be85c25508b425852e23fed4759c6
  authority_specification: 38459f8a96a21e03bd55cdd219dfe21ae017c8edbf0027ebc12df66e14c0076d
  original_design: 58cbc95a213389b68140d016f9f3e774b66e1c8043ffde88139b8db07b5539ee
  original_review: 93e002427da10dd58d4b8564bbed43d8946cbad17448b0085a2d83a08cb93067
  revision_01: 55d673624e577a9981286de5ec6385c1b849ea4099d093b866ff1e1bee4b5e51
role_activation_result: READY
```

Owner authorization covers one re-review only. Protected files are the original
design/review/revision, source, tests, schemas, configuration, runtime data,
Status, Registry, and Git. The Critic performed only reads and created this report.

## 3. Context Preflight

```yaml
context_preflight:
  requested_inputs: 9
  selected_inputs:
    full_read:
      - README-Critic.md
      - Evidence-Specification.md
      - Authority-Specification.md
      - phase1.5-context-guard-design-final-plan.md
      - phase1.5-context-guard-design-review.md
      - phase1.5-context-guard-design-final-plan-revision-01.md
    supporting_inputs:
      - package.json
      - .gitignore
  excluded_inputs:
    - src/lifecycle/phase1/index.mjs (no Phase 1 source amendment is proposed)
  total_selected_files: 8
  total_selected_bytes: 114688
  estimated_input_tokens: 45876
  estimated_output_tokens: 6500
  decision: PASS_WITH_REDUCTION
```

Byte/token values are conservative estimates, not observed runtime totals. The
six full-read and two supporting-input limits are met. No Phase 5A evidence was
read.

## 4. Executive Verdict and Reviewed Inputs

Revision 01 closes the deterministic-limit and estimate-label issues, and it
substantially improves path safety. It does not close the two implementation
blocking activation/evidence defects because Permit consumption cannot be both
immutable and reliably single-use under the specified evidence structure, and
because no actual universal Role-activation integration owner is identified.

Reviewed inputs are the six required full-read artifacts listed in Section 3 plus
`package.json` and `.gitignore`. The supporting files confirm that no new
dependency is currently declared and that `.context-guard-runtime/` is not yet
ignored; both are future planned changes only.

## 5. Original Finding Extraction

| ID | Original status / evidence | Required closure criteria and method |
|---|---|---|
| F-01 HIGH | The original design exposed only a caller-facing Guard helper, so another caller could activate a Role without it. | Mandatory activation boundary, no unguarded API, and direct-bypass rejection test. |
| F-02 HIGH | Runtime evidence beneath `docs/ai-team/context-guard/.../evidence/` was not in the exact allowlist. | Exact runtime root, runtime-write targets separated from tracked files, and creation/collision tests. |
| F-03 HIGH | Input reads had no realpath containment or symlink enforcement. | Root containment, symlink/path-traversal rejection, and Safe-Stop tests. |
| F-04 MEDIUM | Artifact bytes and section split trigger were non-deterministic. | UTF-8 byte rule plus exact threshold tests. |
| F-05 LOW | Design-preflight totals were unmeasured. | Preserve estimated labeling and require implementation-time measured evidence. |

## 6. Revision Scope Review

PASS. Revision 01 is confined to F-01–F-05: Gateway/Permit, runtime evidence,
path safety, deterministic limits, and estimate labeling. It does not add
pricing, Cost Ledger, provider/model control, Phase 1.6–1.8 design, TASK-006, or
Phase 5A work.

## 7. F-01 Role Activation Review

Status: `OPEN` — HIGH remains.

The proposed `activation-gateway.mjs` and permit checks are a valid local
component design. However, “CLI, Orchestrator, and manual adapters must call the
same Gateway” is a rule, not an enforceable integration boundary: no exact
production adapter paths or existing Role-activation entrypoints are identified,
and the Gateway has “no direct Role import.” Consequently, the plan cannot prove
that a standard Role is unable to be started elsewhere.

## 8. Permit Contract and Direct Bypass Review

The request, Permit, validation, issuance, consumption, TTL, task/role/session
binding, canonical input-checksum ordering, and replay tests are described.
`role-activation-permit.schema.json` has an exact path and requires expiry,
`single_use=true`, `consumed_at`, and checksum.

The contract remains internally inconsistent:

1. `role-activation-permit.json` is declared immutable create.
2. `consumed_at` must change from `null` to a time after consumption.
3. The revision proposes an “atomic consumed-state companion record,” but gives it
   no exact filename, schema, required fields, writer/reader, retention rule, or
   allowlist/runtime-target entry.

Thus a validator has no complete, immutable, independently checkable consumed-state
authority. A failed or concurrent consume cannot yet be proven replay-safe.

## 9. F-02 Evidence Storage／Allowlist Review

Status: `OPEN` — HIGH remains.

The root is exact and project-local:
`.context-guard-runtime/tasks/<task-id>/sessions/<session-id>/`. The intended
records, modes, exclusive session creation, checksums, atomic writes, syncs,
corruption Safe Stop, retention, and planned `.gitignore` entry are material
improvements. The tracked implementation list and runtime target are also
conceptually separated.

But the undefined “consumed-state companion record” is a required runtime evidence
object absent from the required structure, evidence authority table, schema
inventory, test matrix, and runtime write target. Therefore the exact evidence
contract and allowlist reconciliation required by F-02 are incomplete.

## 10. Evidence Write Safety Review

PASS_WITH_CONDITIONS. The plan specifies `0700` directories, `0600` files,
exclusive session creation, temporary-file `fsync`, same-directory atomic rename,
parent-directory `fsync`, corruption Safe Stop, and final-evidence retention.
Those safety requirements are sufficient for the listed immutable files. They
cannot yet validate the missing Permit-consumption evidence described in Sections
8–9.

## 11. F-03 Path／Symlink Security Review

Status: `CLOSED_WITH_CONDITIONS`.

Revision 01 fixes the original gap by using allowed-root `realpath`, rejecting
traversal and all symlinks, testing containment with `path.relative` rather than
prefixes, requiring a readable regular file, and collecting identity evidence.
The selected `REJECT_ALL_SYMLINK_INPUTS` policy is appropriately conservative.
Foundation and Active Project roots are explicit; arbitrary root expansion and
security overrides are disallowed.

Condition: the future implementation must use the specified descriptor path and
tests; this is design evidence, not a runtime verification.

## 12. Path Safety APIs, Errors, and Tests

PASS. `path-safety.mjs` assigns exact APIs, input/return types, I/O behavior,
errors, and test IDs to normalization, containment, object inspection, pre-read
revalidation, and post-read stability verification. The error table covers every
required path/security code with non-overridable Safe Stop and evidence fields.

`PS-01..18` covers normal Foundation/Project files, traversal, prefix spoofing,
internal/external/broken/loop symlinks, FIFO/socket/directory, before/during-read
replacement, identity changes, invalid roots, hard links, duplicates, and
unreadability. The prescribed `O_NOFOLLOW` plus descriptor `fstat` comparison is
an appropriate Linux MVP TOCTOU defense.

## 13. F-04 Deterministic Limits

Status: `CLOSED`.

`estimateArtifactBytes(text) = Buffer.byteLength(text, "utf8")`; `65536` bytes
and 16 top-level sections are inclusive limits. One byte or one section over is
`SPLIT_REQUIRED`. The schema carries `estimated_artifact_bytes` and
`expected_top_level_sections`, while `CG-EST-09..12` covers exact and one-over
boundaries. Unsupported/binary input retains the original fail-closed policy and
the 20% token safety margin remains explicit.

## 14. F-05 Estimate／Measured Evidence

Status: `CLOSED_WITH_CONDITIONS`.

Revision 01 keeps design quantities as `estimated` and requires runtime preflight
evidence to record observed bytes, estimation method, and distinct estimated
tokens. `CG-EVID-08` is named for label verification. Token usage is not falsely
called measured without a provider tokenizer. The condition is that actual
artifact-byte recording and estimate-difference evidence must be implemented and
tested before implementation completion.

## 15. Revised Architecture Review

PASS_WITH_CONDITIONS. The proposed dependency direction is acyclic:
`errors/config/path-safety → inventory/estimate → evaluate/override →
evidence-store/permit → activation-gateway → index`. `permit` has no Gateway
dependency; Phase 1 is not imported or modified. The responsibilities of Path
Safety and Evidence Store are distinct.

The remaining condition is F-01: the architecture must name the concrete
production activation adapters or boundary that Gateway exclusively owns.

## 16. Schema／Allowlist Review

PASS_WITH_CONDITIONS. The four schema paths are exact, versions and producers/
consumers/checksum policies are stated, no wildcard is used in the final
implementation allowlist, `.gitignore` is explicitly listed, and Status/Registry
are excluded.

The Permit-consumption companion record must be made an exact schema or an
explicit, immutable event definition within an existing schema and added to the
runtime evidence contract. Until then, this is not a fully closed F-02 allowlist.

## 17. Revised Test Plan Review

PASS_WITH_CONDITIONS. Exact test paths and commands cover the original Context
Guard tests, Permit invalid/expiry/reuse/binding, Gateway bypass, runtime evidence,
path security, Phase 1 D-01–D-06/88 regression, and `npm test`.

The test plan must add exact tests for two competing consumes of the same Permit,
crash/failure between Permit validation and consumption, and the completed
immutable consumed-state evidence. Those are required to close F-01/F-02.

## 18. Phase 1 Compatibility and Revision Budget

PASS. The revision adds only new Context Guard paths, tests, schemas, and one
planned `.gitignore` line; it leaves Phase 1 code/tests/fixtures untouched and
requires their regression. The design-revision budget is respected:

```yaml
maximum: 1
consumed: 1
additional_revision_without_owner_decision: PROHIBITED
```

## 19. New Finding Scan

New findings are limited to the targeted F-01/F-02 closure gaps:

- No exact universal integration owner prevents direct Role start outside Gateway.
- Immutable Permit representation conflicts with mutable `consumed_at`.
- The needed consumption record lacks an exact path/schema/authority/allowlist and
  concurrency/crash verification.

No Cost Guard expansion, Phase 1 source requirement, root-prefix bypass, security
override, or cyclic Permit/Gateway dependency was identified.

## 20. Finding Inventory

| ID | Title | Severity | Status | Affected section | Evidence / risk | Required correction | Blocking | Verification |
|---|---|---|---|---|---|---|---|---|
| F-01-RR01 | Universal Gateway enforcement and Permit consumption are incomplete | HIGH | OPEN | Revision §§7–9, 17, 20 | Gateway has no exact owned adapters; immutable Permit conflicts with `consumed_at`; replay safety is not defined. | Owner decision must select a single enforceable activation integration boundary and immutable consumption-event authority. | Yes | Adapter ownership audit; direct-bypass, concurrent-consume, crash, and replay tests. |
| F-02-RR01 | Permit-consumption evidence is absent from the exact runtime contract | HIGH | OPEN | Revision §§10–12, 18–20 | Companion record is referenced but has no exact file/schema/writer/reader/retention/test entry. | Owner decision must define it as an exact immutable evidence event or revise the Permit persistence model. | Yes | Runtime structure/allowlist reconciliation and corruption/replay tests. |
| F-03-RR01 | Path safety is design-closed pending implementation verification | MEDIUM | CLOSED_WITH_CONDITIONS | Revision §§13–15, 20 | Root containment, reject-all symlink, descriptor checks, and tests are complete as a design. | Implement exactly as specified. | No | `PS-01..18`. |
| F-04-RR01 | Deterministic bytes and sections | MEDIUM | CLOSED | Revision §16 | Exact UTF-8 and boundary rules replace subjective language. | None. | No | `CG-EST-09..12`. |
| F-05-RR01 | Estimate/measured separation | LOW | CLOSED_WITH_CONDITIONS | Revision §16, 20 | Runtime labels and test ID are specified. | Implement evidence fields/test. | No | `CG-EVID-08`. |

## 21. Critical／High／Medium／Low Counts

```yaml
critical: 0
high: 2
medium: 2
low: 1
```

## 22. Conditions and Final Judgment

Critical/High findings remain, so the permitted re-review cannot pass and no
additional Builder revision is authorized or proposed. The required resolution is
an Owner decision on the activation integration boundary and Permit-consumption
evidence model.

Final Judgment: `PHASE1_5_DESIGN_REREVIEW_01_OWNER_DECISION_REQUIRED`

## 23. Implementation Entry Conditions and Owner Decision Required

Implementation entry is `NOT_READY` and implementation authorization remains
`NOT_AUTHORIZED`. Before a later implementation authorization, an Owner must
provide a bounded decision that resolves F-01-RR01 and F-02-RR01 without creating
an unbounded redesign, followed by the required governed validation. This report
does not authorize any implementation, test execution, file update, or Git action.

## 24. Recommended Next Role／Artifact and Gate Readiness

Recommended Next Role: Owner / Orchestrator, for the bounded decision only.  
Recommended Next Artifact: Owner-authorized decision artifact addressing
F-01-RR01 and F-02-RR01; not a second Builder design revision.  
Gate Readiness: `NOT_READY`  
Owner Approval Required: `YES`

## 25. Completion Pause

This re-review created one artifact only. Original design/review/revision, source,
tests, schemas, configuration, runtime, Status, Registry, and Git remain
unchanged. IDE lint diagnostics for this artifact contain no errors. Stop pending
Owner direction; do not start another design revision, implementation authorization,
implementation, Tester, Judge, Git work, Phase 1.6, or Phase 5A.
