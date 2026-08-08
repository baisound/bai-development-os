# TASK-008 BAI Development OS External Integration Detailed Design Ver.1.0

## Document Control

- Product: BAI Development OS
- Task: TASK-008 — External Integration
- Version: 1.0
- Status: CURRENT_CANONICAL
- Development Profile: DEV_4_FOUNDATION_CRITICAL
- Effective date: 2026-08-08
- Canonical root: `/home/baisound/bai-development-os`
- Machine canonical: this Markdown
- Human companion: `TASK-008_BAI_Development_OS_External_Integration_Ver1.0.docx`

## 1. Purpose

TASK-008 provides the governed boundary between BAI Development OS and external systems. It standardizes connector discovery, capability declaration, authorization, credential references, cost/rate/timeout controls, idempotency, trust conversion, inbound webhook verification, audit evidence and monitoring integration without allowing an external system to become canonical authority by itself.

The implementation is vendor-neutral. GitHub, MCP, External AI, Video, Audio, Communication and Storage are connector categories, not hard-coded product dependencies.

## 2. Non-negotiable authority boundaries

1. TASK-004 remains Lifecycle/Guard/Cost authority.
2. TASK-005 remains Knowledge authority.
3. TASK-006 remains Orchestration/Automation authority and may request integration execution, but cannot self-authorize external side effects.
4. TASK-007 remains read-only Monitoring authority and only observes Integration evidence.
5. TASK-008 owns connector execution policy and external side-effect gatewaying, not canonicalization of external responses.
6. External responses are references. A connector may assert `VERIFIED`, but `canonical` remains `false` until an owning domain review/process promotes information under the relevant authority.
7. Publish, send, delete, external mutation and irreversible external actions require a fully bound authorization.
8. Credentials are referenced, resolved at execution time, and never stored inline in Integration Request/Audit artifacts.

## 3. Internal phase roadmap

| Phase | Name | Primary outcome |
|---:|---|---|
| 1 | Integration Vocabulary & Contracts | Connector kinds, side effects, trust, data classes |
| 2 | Connector Manifest & Registry | Checksummed capability registry |
| 3 | Capability / Operation Resolution | Least-privilege operation resolution |
| 4 | Credential Reference Boundary | Reference-only credential model and scope checks |
| 5 | Integration Request Envelope | Immutable checksummed request and data classification |
| 6 | Authorization / Side-effect Policy | Bound Owner authorization and payload/data constraints |
| 7 | Idempotency & Replay Control | External effect deduplication and collision detection |
| 8 | Retry / Timeout / Rate Control | Bounded retry, AbortSignal timeout, local rate guard |
| 9 | Cost / License Integration | TASK-004 Cost Guard reservation/actual/release; license context |
| 10 | Response Trust & Normalization | Noncanonical normalized responses with trust metadata |
| 11 | Inbound Webhook Boundary | HMAC verification and untrusted inbound references |
| 12 | Audit / Monitoring Integration | Hash-chained audit plus TASK-007 monitoring events |
| 13 | Reference Connector Profiles / Service | GitHub, MCP, AI, Communication, Storage profiles and service API |
| 14 | E2E / Critic / Completion | Failure cases, full regression, canonical synchronization |

All 14 phases are completed by TASK-008 Ver.1.0.

## 4. Connector Manifest

A Connector Manifest is immutable and checksummed. It declares:

- `connector_id`
- connector kind and version
- status: ENABLED / DISABLED / DEGRADED
- response trust level
- credential provider reference
- capabilities
- operations per capability
- side-effect class
- authorization requirement
- retry safety
- idempotency requirement
- cost metering
- license sensitivity
- required credential scopes
- allowed data classifications
- maximum payload size
- maximum estimated cost
- maximum execution timeout

The manifest is an execution contract, not proof that the external system is healthy.

## 5. Side-effect classes

| Class | Meaning | Default behavior |
|---|---|---|
| NONE | Read/search/inspect without external mutation | Automation allowed if credentials/policy pass |
| REVERSIBLE | External mutation with explicit safe rollback semantics | Capability policy decides authorization/idempotency |
| EXTERNAL | Send/publish/write/create side effect outside OS | Authorization + idempotency required by default |
| IRREVERSIBLE | Delete/destructive/public irreversible effect | Authorization + idempotency required; high assurance |

Unknown operations fail closed.

## 6. Authorization binding

An authorization for a capability that requires authorization MUST bind all of:

- task_id
- connector_id
- capability
- operation
- authorization status
- optional expiry

A bare `{ authorized: true }` is invalid for an external side effect. This prevents an approval for one external action from being reused for another.

## 7. Credential handling

Credentials use a `Credential Reference` object containing only provider metadata, scopes and expiry. Inline values named token, password, secret, api_key, private_key or equivalent are rejected from requests.

The actual secret is obtained through a runtime `credential_resolver`. It is passed only to the connector invocation. If a connector echoes the resolved input credential back in its result, the Gateway fails the call with `INTEGRATION_CREDENTIAL_LEAK_DETECTED`.

TASK-008 does not implement a vault product or credential rotation service. Those are future hardening/release responsibilities.

## 8. Data classification and payload constraints

Requests classify data as PUBLIC, INTERNAL, CONFIDENTIAL or RESTRICTED. Each capability declares allowed classes and maximum payload bytes. The Gateway rejects a request before external execution when the capability does not allow the data class or the payload exceeds its limit.

## 9. Idempotency semantics

External/irreversible effects require an idempotency key by default. A successful execution stores a deterministic request fingerprint with its sanitized response evidence.

Reusing the same idempotency key:

- with the same semantic request: returns the prior sanitized normalized result and does not invoke the connector again;
- with a changed payload/cost/license binding: fails with `INTEGRATION_IDEMPOTENCY_CONFLICT`;
- on a different operation: is treated as a different idempotency scope.

The request ID itself is intentionally excluded from the semantic idempotency fingerprint so a retried envelope may use a new request ID.

## 10. Retry, timeout and rate behavior

Retry is bounded. Transient network/rate/timeout failures may retry only when the capability is retry-safe or an idempotency key provides external effect protection. Deterministic/schema/auth failures do not retry.

Capability timeout is enforced with `AbortController`. The connector receives `context.signal`; well-behaved adapters MUST stop work when aborted.

A local in-memory rate guard can limit calls per connector/capability window. This is not a distributed rate limiter and is intentionally lightweight for TASK-008.

## 11. Cost Guard integration

If the Integration Gateway is configured with TASK-004 cost budgets and a request has a non-zero estimate, it performs:

1. `reserveCost()` before external execution;
2. `recordActualCost()` after success, using connector-reported `actual_cost_microusd` when valid, otherwise the estimate;
3. `releaseCostReservation()` on terminal failure.

Role and session bindings are mandatory for cost-controlled requests.

This provides accounting and hard-stop integration without creating a second cost ledger.

## 12. License-sensitive generation

External AI generation profiles are cost-metered and license-sensitive. A request must explicitly include:

- `usage_allowed: true`
- a non-empty `terms_ref`

TASK-008 records the decision context but does not itself interpret all third-party licenses. Domain/Owner policy remains authoritative for whether a particular use is acceptable.

## 13. Response trust model

Normalized Integration Response includes:

- request/connector/capability/operation binding
- success status
- trust level
- `canonical: false`
- whether review is required before canonicalization
- attempt count and receive time
- data and metadata

Trust levels are `UNTRUSTED`, `REFERENCE`, `REVIEW_REQUIRED`, and `VERIFIED`. Even `VERIFIED` means connector verification, not automatic domain canonicalization.

## 14. Inbound webhook contract

TASK-008 supports HMAC-SHA256 webhook verification with optional timestamp freshness tolerance. Verified inbound transport is converted into an `Inbound Reference` that is still `UNTRUSTED`, `canonical: false`, and requires review before canonical use.

Webhook replay nonce persistence and distributed webhook ingestion are future hardening/distributed responsibilities.

## 15. Audit ledger

Integration Audit is an append-only, hash-chained JSONL ledger under the OS root. It records:

- accepted/blocked requests
- execution start
- retry
- success/failure
- idempotent replay
- request/connector/capability/operation binding
- sanitized details
- previous record checksum and record checksum

Secrets are redacted and audit paths use root/symlink confinement.

## 16. Monitoring integration

The Gateway emits TASK-007 Monitoring Events with component `INTEGRATION`, including:

- `integration.success`
- `integration.failure`
- `integration.retry`
- `integration.blocked`
- `integration.idempotent_replay`

Monitoring remains derived/read-only and cannot authorize an Integration operation.

## 17. Reference connector profiles

TASK-008 provides vendor-neutral reference profiles:

- GitHub: repository read/write/PR/issue/release semantics
- Communication: message read/send semantics
- External AI: image/video/audio/text generation with cost/license controls
- Storage: object read/list/write/delete semantics
- MCP: tool invocation semantics
- Generic: custom connector capability contract

The connector runtime is supplied by `createFunctionConnector()` or another compatible adapter. No third-party SDK is canonical.

## 18. Integration Service API

`createIntegrationService()` composes registry, runtime connector map, credential resolver, monitoring sink, retry policy and optional cost budgets. It exposes request creation and execution through the same Gateway contract.

## 19. Failure classes and safe-stop behavior

Representative fail-closed conditions:

- unknown/disabled connector
- undeclared capability or operation
- expired/missing credential scope
- missing or mismatched authorization
- idempotency key missing or conflicting
- forbidden data class
- payload/cost limit exceeded
- missing license context
- inline secret material
- credential echo/leak
- local rate limit
- timeout
- audit corruption/path escape
- invalid webhook signature/freshness

## 20. Critic findings resolved during implementation

1. External Owner authorization binding was initially optional; changed to full task/connector/capability/operation binding.
2. Credential Reference input could initially bypass the inline-secret check; request construction now re-validates credential references.
3. Idempotency initially keyed only by operation/key; semantic request fingerprint collision detection was added.
4. License-sensitive generation initially accepted `usage_allowed` without terms provenance; `terms_ref` is now mandatory.
5. Initial Promise.race timeout leaked active timers after successful calls; replaced with a cleanup-safe timeout wrapper.
6. Timeout initially did not signal connector cancellation; AbortSignal propagation was added.
7. Cost control initially existed only as capability ceiling; TASK-004 Cost Guard reservation/actual/release integration was added.

Blocking Critic findings after correction: 0.

## 21. Accepted residual / future ownership

TASK-008 deliberately does not solve all later productization:

- crash-atomic audit/idempotency journal, cryptographic signatures, credential rotation and durable webhook replay protection → TASK-009;
- connector/schema/version migration and distribution compatibility → TASK-010;
- real multi-project connector conformance/isolation and noisy-neighbor validation → TASK-011;
- audit/outbox/integration-state repair and rebuild → TASK-012;
- vendor/domain connector plugin SDK and richer adapter lifecycle → TASK-013;
- evidence-based retry/rate/timeout/authorization calibration → TASK-014;
- distributed connector execution, durable distributed rate limits, queues, leases and cross-machine event transport → TASK-015.

The local rate limiter is intentionally process-local. Connector cancellation relies on adapters honoring AbortSignal. The audit JSONL is fail-detecting but not WAL/journal crash-recovering.

## 22. Completion verification

- TASK-008 dedicated Integration suite: 77 / 77 PASS
- Full BAI Development OS suite after TASK-008: 561 / 561 PASS
- IntegrationOS root export: PASS
- Integration JSON schemas: 6 / 6 parse PASS
- Product Boundary: PASS
- Reference Consumer regression: recorded in final completion evidence
- Blocking Critic findings: 0

## 23. Completion status

TASK-008 External Integration is `COMPLETED` at the Ver.1.0 technical/canonical baseline.

The next canonical route is TASK-009 — Security / Supply Chain / Integrity Hardening. TASK-009 remains unstarted until separately activated; TASK-008 completion does not authorize future tasks.
