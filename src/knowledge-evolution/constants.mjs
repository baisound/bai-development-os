export const PRIVACY_LEVELS = Object.freeze(['P0', 'P1', 'P2']);
export const TRUST_LEVELS = Object.freeze([
  'TRUSTED_OS',
  'TRUSTED_CI',
  'TRUSTED_MANUAL_REVIEW',
  'REGISTERED_CLIENT',
  'ANONYMOUS_CLIENT',
  'UNVERIFIED'
]);
export const CONSUMER_EVENT_TYPES = Object.freeze([
  'feature_result',
  'diagnostic',
  'performance',
  'capability',
  'user_feedback',
  'incident',
  'correction',
  'adoption'
]);
export const MAX_BATCH_EVENTS = 100;
export const MAX_BATCH_BYTES = 1024 * 1024;
export const DEFAULT_CLIENT_POLICY = Object.freeze({
  policy_version: '1.0',
  sampling: {},
  enabled_features: [],
  max_batch_events: 100,
  max_payload_bytes: 262144,
  max_outbox_bytes: 5 * 1024 * 1024,
  max_privacy_level: 'P1'
});
export const SNAPSHOT_STATES = Object.freeze([
  'RECEIVED',
  'INVENTORIED',
  'PROVENANCE_RECOVERED',
  'SANITIZED',
  'EVIDENCE_EXTRACTED',
  'CANDIDATES_GENERATED',
  'CONFLICT_CHECKED',
  'REVIEW_READY',
  'QUARANTINED'
]);
