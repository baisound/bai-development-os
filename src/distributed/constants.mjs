export const DISTRIBUTED_VERSION = '1.0.0';
export const DISTRIBUTED_EVENT_STATES = Object.freeze(['PENDING','IN_FLIGHT','ACKNOWLEDGED','DEAD_LETTER']);
export const DISTRIBUTED_EVIDENCE_CLASSES = Object.freeze(['REAL','SANDBOX','SIMULATED','DECLARED']);
export const DISTRIBUTED_WORKER_TRUST = Object.freeze(['ATTESTED','UNATTESTED','REVOKED']);
export const DISTRIBUTED_RUN_KINDS = Object.freeze(['CONFORMANCE','CALIBRATION_COUNTERFACTUAL','CALIBRATION_SHADOW','EXTENSION','MAINTENANCE','INTEGRATION','RELEASE','GENERIC']);
export const DISTRIBUTED_SENSITIVE_DOMAINS = Object.freeze(['SECURITY','AUTHORITY','TRUST','RELEASE','MAINTENANCE','EXTERNAL_SIDE_EFFECT']);
export const DISTRIBUTED_ROLLOUT_STATES = Object.freeze(['PENDING','CANARY','SOAKING','PROMOTED','ROLLED_BACK','BLOCKED']);
export const DEFAULT_DISTRIBUTED_LIMITS = Object.freeze({
  max_queue_depth: 10000,
  max_inflight: 256,
  max_attempts: 5,
  ack_timeout_ms: 30000,
  max_payload_bytes: 1024 * 1024,
  max_replays_per_event: 3,
  max_cost_microusd: 10_000_000,
});
