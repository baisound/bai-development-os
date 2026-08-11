# Consumer Evidence Canonical Contract Ver.1.0

Status: `TASK-016 PHASE0 RC2 CANONICAL CONTRACT`

The canonical runtime unit is `Consumer Evidence Event`; the canonical transport unit is `Consumer Evidence Batch`. The same Batch is used by Local Outbox batching, temporary Object Storage artifacts and final Knowledge Hub submission. No storage-specific Evidence schema is permitted.

## Canonical sources

- `schemas/knowledge-evolution/consumer-evidence-event.schema.json`
- `schemas/knowledge-evolution/consumer-evidence-batch.schema.json`
- `schemas/knowledge-evolution/delivery-receipt.schema.json`
- `schemas/knowledge-evolution/client-policy.schema.json`
- `schemas/knowledge-evolution/consumer-evidence-event-catalog.v1.json`

`consumer-evidence-envelope.schema.json` is a deprecated compatibility alias to the canonical Event schema.

## Identity

`event_id` is immutable from Product creation through Outbox, Object Storage retry, Hub backfill and Candidate provenance. `batch_id` identifies one deterministic transport group; Hub deduplication is Event-effect idempotency, not an assumption of exactly-once transport.

## Hash

Optional API field `content_sha256` is SHA-256 over canonical JSON of the Batch with `content_sha256` omitted. The Object Storage Profile requires it.

## RC2 fail-closed identity and Receipt rules

- exactly one of `feature` or `operation` is present on each canonical Event; both/neither is invalid,
- `product_id`, `installation_id`, `batch_id` and `event_id` use transport-safe record identifiers and cannot introduce path separators/traversal,
- Delivery Receipt outcomes are mutually exclusive per `event_id`; an Event cannot be simultaneously accepted, already-seen and rejected,
- artifact deletion/backfill acknowledgement verifies Receipt `batch_id` and rejects unknown Event IDs,
- Client Policy Event Catalog version mismatch fails closed; a server policy cannot silently switch a Product to a different catalog contract.
