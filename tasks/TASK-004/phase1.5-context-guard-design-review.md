# TASK-004 Phase 1.5 — Context Guard MVP Design Review

## 1. Document Control

| Item | Value |
|---|---|
| Authoring Role | Critic |
| Active Project / Task | `/home/baisound/projects/javascript-roulette` / `TASK-004` |
| Phase | `1.5 — DESIGN_REVIEW` |
| Review limit | Single independent review; no automatic revision |
| Implementation Authorization | `NOT_AUTHORIZED` |
| Result | `PHASE1_5_DESIGN_REVIEW_REVISION_REQUIRED` |

## 2. Role Activation Record

The Owner authorized this Critic review and this file only. The Critic performed
no design edit, implementation, test execution, Status/Registry operation, or Git
operation. Runtime was the requested `INLINE_CHAT_LINUX` environment.

## 3. Context Preflight

```yaml
context_preflight:
  requested_inputs: 10
  selected_inputs:
    full_read:
      - README-Critic.md
      - Evidence-Specification.md
      - Authority-Specification.md
      - phase1.5-context-guard-kickoff.md
      - phase1.5-context-guard-design-final-plan.md
      - foundation-improvement-integration-plan.md
    supporting_excerpts:
      - src/lifecycle/phase1/index.mjs:1-40
      - tests/lifecycle/phase1/lifecycle-store.test.mjs:1-60
  excluded_inputs:
    - package.json (not needed after the design's stated no-new-dependency condition)
    - .gitignore (not needed to evaluate the design)
  total_selected_files: 8
  total_selected_bytes: 98304
  estimated_input_tokens: 39324
  estimated_output_tokens: 6000
  decision: PASS_WITH_REDUCTION
```

The byte and token amounts are conservative estimates, not measured runtime
values. The two supporting files were limited to the stated ranges to confirm that
Phase 1 owns independent lifecycle behavior and tests. No Phase 5A evidence was
read. The review continues because the six full-read and two supporting-input caps
are satisfied.

## 4. Executive Verdict

The plan is properly bounded to Context Guard and has conservative exact defaults,
but it has three implementation-blocking design defects: no non-bypassable
activation enforcement point, a contradiction between planned evidence writes and
the exact allowlist, and no project-root/symlink safety rule for input reads.

## 5. Reviewed Inputs

- `README-Critic.md`, `Evidence-Specification.md`, and
  `Authority-Specification.md`.
- `phase1.5-context-guard-kickoff.md`.
- `phase1.5-context-guard-design-final-plan.md`.
- `foundation-improvement-integration-plan.md`.
- Supporting excerpts: `src/lifecycle/phase1/index.mjs:1-40` and
  `tests/lifecycle/phase1/lifecycle-store.test.mjs:1-60`.

## 6. Scope Review

PASS. The plan excludes pricing, provider selection, billing, Cost Ledger, Phase
1.7/1.8 work, and TASK-006 Advanced Guard. It retains Phase 2 as blocked and
Phase 5A as paused. Its review/revision counters are scoped to context growth, not
cost accounting.

## 7. Context Inventory／Estimation

PASS_WITH_CONDITIONS. Inventory, byte/token/output/section estimates, supported
encoding fallback, and fail-closed treatment of unreadable/unknown binary inputs
are specified. The artifact-byte estimator needs an explicit UTF-8 byte rule;
without it, a non-ASCII artifact can be underestimated (F-04).

## 8. Limit Review

PASS. All eight required limits have exact values, units, Hard/Soft class, decision
mapping, override eligibility, scope, and a 60-minute expiration. The values are
conservative: 12 files, 128 KiB, 32,000 estimated input tokens, 8,000 estimated
output tokens, 16 sections, 64 KiB, one review, and one revision.

## 9. Classification／Selection Review

REVISION_REQUIRED. Classification vocabulary, priority, hash-plus-purpose
deduplication, historical reduction, mandatory preservation, and canonical
conflict Safe Stop are defined. However, the design permits file reads from
candidate paths without defining canonical project-root containment after resolving
symlinks (F-03). That can read protected evidence outside the Active Project.

## 10. Decision Model Review

PASS_WITH_CONDITIONS. All five decisions contain trigger, activation status,
allowed/prohibited actions, evidence, approval, and retry handling. The soft
section threshold uses the non-deterministic phrase “when size or readability would
be impaired”; it must have an explicit measurable trigger (F-04).

## 11. Owner Override Review

PASS. The override is Owner-only, single-limit, single-session, checksum-bound,
single-use, expires in at most 60 minutes, cannot transfer to another Role, and is
historical evidence. Validation covers wrong scope, expiry, changed inputs, and
reuse.

## 12. Architecture Review

REVISION_REQUIRED. Exact source/schema/test paths and public exports are listed,
but `assertRoleActivationAllowed` is only a caller-facing function. The plan says
callers “must” invoke it but identifies no required activation entry point that
cannot call a Role without it (F-01).

## 13. Role Activation Integration

REVISION_REQUIRED. A non-`PASS` result throws when the proposed helper is used,
but no interface makes use mandatory. Tests of a cooperating caller do not prove
that another caller cannot bypass the Guard. The correction must define one
activation API/entry point as the only supported path and test direct/bypass
attempts are rejected.

## 14. Schema Review

PASS_WITH_CONDITIONS. Three schemas are a minimal set and `additionalProperties:
false` is appropriate. Their table describes required field groups but should
explicitly declare the artifact-byte estimate unit and the normalized checksum
algorithm in the preflight schema or its validation contract (F-04).

## 15. Error Review

PASS. The error list covers unreadability, inventory/estimation failure, canonical
uncertainty, unresolved duplicates, all limits, split, invalid/missing override,
and final hard stop. Error evidence is specified.

## 16. Test Review

REVISION_REQUIRED. The unit/integration inventory is broad and includes Phase 1
regression. It lacks required tests for symlink escape/out-of-project paths and
for a caller attempting activation without the enforced Guard entry point (F-01,
F-03). It also needs a UTF-8 multibyte artifact-byte boundary test (F-04).

## 17. Artifact／Review Budget

PASS. The design has one combined design/Final Plan artifact, this is the sole
permitted Critic review, and it permits at most one later Builder revision. It
requires Owner reporting rather than repeated subdivision after an additional High.

## 18. Phase 1 Compatibility

PASS. The plan explicitly leaves Phase 1 source and tests unchanged, does not
reuse Phase 1 fixtures as Guard state, and requires fresh D-01–D-06 and 88-test
regression evidence. The reviewed Phase 1 excerpts show separate lifecycle exports
and fixture-managed tests, consistent with the isolation claim.

## 19. Phase 1.7／1.8／TASK-006 Boundary

PASS. Context size, artifact size, review depth, and revision cycles are limited
only as context controls. Provider pricing, billing, retry charging, model routing,
and Advanced Guard automation remain excluded.

## 20. Critical Review Questions

1. **粒度:** F-01–F-03 prevent implementation; after correction, the remaining
   design is implementable.
2. **初期Limit:** Conservative and adequate for an MVP.
3. **Token estimate:** Byte-based estimate plus 20% margin is conservative for
   UTF-8; binary/unsupported input fails closed.
4. **巨大Artifact:** Size limits route to `SPLIT_REQUIRED`, but the byte rule and
   soft-section trigger need F-04.
5. **重複Evidence:** Hash-plus-purpose supports correct exclusion.
6. **必須Evidence:** Selection order preserves mandatory classes.
7. **Override:** Scope, checksum, expiry, and single-use rules prevent blanket
   Guard disablement.
8. **Activation bypass:** Not prevented; F-01 is High.
9. **Review/Revision:** One each is enforceable once recorded in the preflight
   evidence; it does not authorize an additional cycle by itself.
10. **Cost Guard separation:** Sufficiently separated.

## 21. Finding Inventory

| ID | Title | Severity | Status | Evidence / Risk | Required correction | Blocking | Verification |
|---|---|---|---|---|---|---|---|
| F-01 | Role activation can bypass Guard | HIGH | OPEN | Design §8 makes the Guard caller-facing; a caller can start a Role without calling it. | Define one mandatory activation boundary/API, forbid direct activation, and add bypass-rejection tests. | Yes | Integration tests show direct activation is rejected and only `PASS` crosses the boundary. |
| F-02 | Evidence-write paths are outside exact allowlist | HIGH | OPEN | Design §9 writes immutable evidence under `docs/ai-team/context-guard/phase1.5/evidence/`, but §11 allowlists only schemas and the task implementation report. | Add exact evidence directory/file creation rules and exact allowed paths, or remove runtime persistence from MVP. | Yes | Allowlist reconciliation and evidence creation/collision tests. |
| F-03 | Input read boundary lacks realpath/symlink enforcement | HIGH | OPEN | Inventory reads candidate files but does not require resolved paths to remain below the Active Project root. | Require normalized `realpath` containment, reject symlink/path traversal escapes, and test both. | Yes | Unit/integration escape and symlink tests produce Safe Stop without an external read. |
| F-04 | Artifact byte/section split trigger is not deterministic | MEDIUM | OPEN | `estimateArtifactBytes` has no UTF-8 calculation; “readability impaired” is subjective. | Define `Buffer.byteLength(text, "utf8")`, exact projected-byte comparison, and an objective section rule. | No after High fixes | Multibyte exact-boundary, one-over, and section-threshold tests. |
| F-05 | Design-preflight size figures are unmeasured | LOW | ACCEPTABLE_WITH_CONDITION | Design §§2 and 16 label totals as estimates. | Retain labels and require implementation-time measured preflight. | No | Implementation preflight records observed bytes and estimated tokens. |

## 22. Critical／High／Medium／Low Counts

```yaml
critical: 0
high: 3
medium: 1
low: 1
informational: 0
```

## 23. Conditions

Correct F-01 through F-03 in the single permitted Builder design revision. Correct
F-04 in that same revision because it directly supports a stated acceptance
criterion. Do not widen the design to Cost Guard, Registry, or TASK-006.

## 24. Final Judgment

`PHASE1_5_DESIGN_REVIEW_REVISION_REQUIRED`

## 25. Implementation Entry Conditions

NOT READY. Implementation remains `NOT_AUTHORIZED` until the bounded revision has
resolved all High findings, this review's corrections are independently validated
as required by the approved workflow, and the Owner explicitly authorizes a
bounded implementation scope.

## 26. Recommended Next Role

Builder, only after separate Owner authorization for the one bounded design
revision. This is advisory and does not activate the Builder.

## 27. Recommended Next Artifact

One new, Owner-authorized Phase 1.5 design revision artifact. It must not overwrite
the integrated design/Final Plan or this review.

## 28. Gate Readiness

`NOT_READY`

## 29. Owner Approval Required

`YES`

Owner action is required before any revision or implementation. This review created
one artifact only; no protected implementation, configuration, runtime, Status,
Registry, or Git change was made. IDE diagnostics for this artifact report no
linter errors.
