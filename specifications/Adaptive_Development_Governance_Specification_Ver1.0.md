# Adaptive Development Governance Specification Ver.1.0

## 1. Purpose

BAI Development OS MUST vary development-process depth according to the actual size and importance of the requested change. A small peripheral change must not consume the same governance, review, context, and token budget as a foundation-critical change. Conversely, foundation-critical functionality MUST receive stronger design review and test coverage than ordinary features.

This specification changes **workflow depth**. It does not replace or permanently alter the system's model-selection policy.

## 2. Classification Inputs

Every executable change is classified using the minimum useful set of dimensions below.

| Dimension | Values | Meaning |
|---|---|---|
| System Scale | LOCAL / PROJECT / MULTI_PROJECT / FOUNDATION | How widely the change can affect systems or projects |
| Feature Scale | MICRO / SMALL / MEDIUM / LARGE | Size of the changed function or implementation |
| Criticality | AUXILIARY / STANDARD / CORE / FOUNDATION | Whether the function is peripheral, ordinary, core, or part of the shared foundation |
| Failure Impact | LOW / MODERATE / HIGH / CRITICAL | Consequence if the change is wrong |
| Reversibility | EASY / MODERATE / HARD | Difficulty of safe rollback |
| Novelty | ROUTINE / ADAPTATION / NEW_ARCHITECTURE | Design uncertainty |
| Change Kind | DOC_ONLY / TEST_ONLY / CONFIG / BUGFIX / FEATURE / REFACTOR / ARCHITECTURE | Nature of the work |

High-risk flags can raise the minimum profile: security, authorization, state machine, data migration, cross-project contract, and external side effects.

## 3. Development Profiles

### DEV-0 QUICK

Use for micro, local, low-impact work such as obvious documentation corrections or very small reversible edits.

- Builder only by default.
- No mandatory Critic or Judge ceremony.
- Executable behavior changes still require targeted validation.
- Documentation-only changes require link/consistency validation.
- No review-cycle loop.

### DEV-1 LIGHT

Use for small, ordinary, reversible changes.

- Short change plan.
- Targeted unit or smoke test.
- Critic/Tester only when the change characteristics justify them.
- Maximum one review/fix cycle.

### DEV-2 STANDARD

Use for normal production features and bug fixes.

- Focused design.
- Tester required.
- Critic required on design or implementation, not necessarily both.
- Unit, relevant integration, and targeted regression tests.
- Judge only where an actual gate/high-risk decision exists.
- Maximum one review/fix cycle before escalation rather than repeated full reruns.

### DEV-3 HIGH ASSURANCE

Use for core functions, multi-project behavior, authorization/security/state-machine changes, data migration, or other high-risk work.

- Detailed design.
- Critic required for design and implementation.
- Independent Tester when execution environment supports independence.
- Unit, boundary/negative, integration, and regression coverage.
- Judge required when a gate or high-risk decision is involved.
- Maximum two review/fix cycles. After the cap, unresolved issues are escalated instead of repeating the entire workflow.

### DEV-4 FOUNDATION CRITICAL

Use for BAI Development OS foundation functions or changes with critical failure impact.

- Architecture and failure-mode design required.
- Independent Critic for design and implementation.
- Independent Tester required.
- Judge required.
- Unit, boundary/negative, integration, regression, contract, fault-injection/recovery, and consumer-fixture tests when applicable.
- Revalidation covers impacted areas plus core regression, not arbitrary unrelated artifacts.
- Maximum two review/fix cycles before explicit escalation.

## 4. Mandatory Safety Floors

The calculated score is not allowed to under-classify the following cases:

- Criticality CORE => minimum DEV-3.
- Criticality FOUNDATION => DEV-4.
- Failure Impact CRITICAL => DEV-4.
- System Scale FOUNDATION => DEV-4.
- System Scale MULTI_PROJECT => minimum DEV-3.
- Security, authorization, state-machine, or data-migration change => minimum DEV-3.
- Cross-project contract change => minimum DEV-3.
- LARGE feature with HIGH failure impact => DEV-4.

## 5. Cost / Token Economy Rules

Adaptive governance MUST reduce unnecessary cost by changing process depth rather than lowering safety blindly.

1. Load summaries and impacted artifacts first.
2. Do not re-run a full Builder -> Critic -> Judge -> Tester chain for a localized fix when only one gate is affected.
3. Re-run impacted tests plus the regression set required by the selected profile.
4. Do not generate duplicate narrative artifacts merely to record that nothing changed.
5. Cap review/fix cycles; unresolved defects after the cap become explicit blockers or owner decisions.
6. Model selection remains controlled by the separate model-routing policy. Development profile must not silently rewrite it.

## 6. Manual Override

Manual escalation is always allowed.

De-escalation requires explicit Owner authorization and a concrete justification. De-escalation is forbidden when the change is FOUNDATION-critical, has CRITICAL failure impact, or has FOUNDATION system scale.

## 7. Runtime Contract

Canonical implementation:

```text
src/governance/adaptive-development-profile.mjs
```

Machine input schema:

```text
schemas/governance/adaptive-development-profile.schema.json
```

The selector returns:

- selected profile ID,
- score and elevation reasons,
- required Roles,
- design depth,
- test requirements,
- review-cycle cap,
- revalidation scope,
- evidence level,
- an explicit `model_policy: UNCHANGED_BY_PROFILE` marker.

## 8. Acceptance Criteria

- A micro documentation edit can resolve to DEV-0.
- A small CORE change cannot resolve below DEV-3.
- A FOUNDATION function cannot resolve below DEV-4.
- A CRITICAL failure-impact change cannot resolve below DEV-4.
- High-risk flags cannot resolve below DEV-3.
- Localized fix revalidation never defaults to a full workflow restart.
- Model policy is not changed by profile selection.
- Foundation-critical profiles include fault/recovery and consumer-fixture testing where applicable.
