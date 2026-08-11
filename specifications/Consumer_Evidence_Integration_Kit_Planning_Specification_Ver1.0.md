# Consumer Evidence Integration Kit Planning Specification Ver.1.0

Status: `PHASE0_CONTRACT_IMPLEMENTED / INTEGRATION_KIT_RC_ACCEPTED / TASK017_PRODUCTION_NOT_AUTHORIZED`
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


## 10. TASK-016 Phase 0 realized surfaces

The development-time contract/reference baseline is now implemented at:

- `templates/consumer-evidence/python/` — Product-owned Python reference/scaffold; standard library only; no BAI Development OS runtime import.
- `src/knowledge-evolution/generator.mjs` — guarded scaffold copy operation.
- `src/knowledge-evolution/contracts.mjs` — event/batch validation, local/server privacy-policy intersection and sanitized Knowledge Evidence mapping.
- `src/knowledge-evolution/mock-hub.mjs` — deterministic development-only transport scenarios.
- `scripts/scaffold-consumer-evidence-python.mjs` and `scripts/run-consumer-evidence-mock-hub.mjs` — developer tooling.

This status does not authorize the production Knowledge Hub or Product-specific Microsoft credential implementation. BAI VIDEO PRODUCT remains responsible for its concrete Microsoft Password Manager provider behind the generic `CredentialProvider`.

## RC2 Canonical Contract

Canonical runtime formats are now owned by `Consumer_Evidence_Canonical_Contract_Ver1.0.md` and the canonical JSON Schemas. This planning document remains historical/design rationale and must not be treated as a second schema.


## 11. TASK-017 Phase 0 Integration Kit RC

The Product-owned Python reference now includes `object_storage.py` and `EvidenceClient.flush_to_object_storage()`. This is a provider-neutral presigned-URL fallback transport, not an Object Storage SDK or a second Evidence schema.

Rules:

- production upload URL MUST be HTTPS; plaintext HTTP exists only behind an explicit loopback-test flag,
- redirects are rejected,
- generic upload headers cannot carry `Authorization`, Cookie or proxy credentials,
- the callback that obtains a short-lived presigned URL is Product/deployment-owned,
- successful Object Storage upload does not acknowledge/delete Local Outbox Events,
- only a validated Hub Delivery Receipt may ACK accepted/already-seen Event IDs,
- `event_id`, canonical Batch body, artifact key and `content_sha256` remain stable for later Hub backfill.
