# Consumer Evidence Integration Kit Planning Specification Ver.1.0

Status: `PLANNING_SPECIFICATION / NOT_IMPLEMENTED / NOT_AUTHORIZED`
Owners: TASK-016 Phase 0 contract foundation -> TASK-017 Phase 0 pilot implementation

## 1. Purpose

Provide reusable development-time technology that a Consumer Project can copy/generate into Product-owned source so a standalone built Product can submit privacy-minimized Evidence to BAI Knowledge Hub without requiring BAI Development OS at runtime.

## 2. Runtime Independence

Generated/copied client code MUST NOT import or discover BAI Development OS at runtime. The Consumer owns its generated source, dependencies, packaging and release artifact.

## 3. Reference Modules

- `EvidenceClient`: narrow submit interface.
- `Sanitizer`: strips prohibited fields/content.
- `Aggregator`: local reduction for high-volume low-value events.
- `LocalOutbox`: bounded durable queue.
- `DeliveryWorker`: background batch/retry.
- `ClientPolicy`: server policy bounded by local privacy cap.
- `ConsentPolicy`: Product/user consent state.
- `CredentialProvider`: external secret retrieval interface.

## 4. Credential Provider Contract

Illustrative interface:

```text
is_configured() -> bool
get_secret() -> secret | None
set_secret_from_user_input(secret) -> result
clear_secret() -> result
```

Rules:

- raw secret is not persisted by the generic client,
- no logs/diagnostics/Evidence contain the raw secret,
- provider implementation is platform/Product-specific,
- BAI VIDEO PRODUCT chooses Microsoft Password Manager,
- missing/unavailable provider pauses Evidence delivery without failing the Product.

## 5. Open-Source Threat Assumption

Client source, endpoint and wire schema are public/inspectable. Security depends on external credential secrecy and server-side enforcement, not hidden implementation details.

## 6. Local Outbox

Required properties:

- bounded size,
- durable event IDs,
- idempotent resend behavior,
- retry/backoff policy,
- privacy-aware eviction/aggregation,
- ACK-based deletion,
- no raw credential persistence.

Initial recommended cap: 5 MiB, configurable by policy.

## 7. Product Integration Boundary

Product Domain should call narrow methods such as:

```text
record_feature_result(...)
record_diagnostic(...)
record_performance(...)
record_correction(...)
submit_feedback(...)
```

Domain logic does not know Hub HTTP, credential storage or outbox internals.

## 8. Mock Hub / Contract Tests

The kit includes deterministic contract testing against success, auth failure, rate limit, transient server failure, timeout, duplicate and invalid-schema behavior.

## 9. Build Acceptance

A Consumer integration passes when:

- build succeeds with no BAI Development OS runtime package,
- produced artifact runs with OS repository absent,
- Hub unavailable => primary function continues,
- credential missing => Evidence disabled/degraded only,
- no source/config/build artifact contains a fixed Hub API key.
