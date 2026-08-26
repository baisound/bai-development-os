import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { hostname } from 'node:os';
import path from 'node:path';
import { assertNoSymlinkPath, resolveExistingInside, resolveWritableInside } from '../../security/path.mjs';
import { verifyAuthorizationEnvelope } from '../../security/authorization.mjs';
import {
  DESIGN_ONLY_OPERATIONS, DesignOnlyClosureError, createDesignOnlyCommitReceipt,
  createCanonicalTaskBinding, createDesignOnlyOperationAudit, designOnlyChecksum, validateDesignOnlyOperationBundle,
  validateDesignOnlyCriticEvidence, validateDesignOnlyJudgeEvidence, verifyDesignOnlyCommitReceipt, verifyDesignOnlyOperationAudit,
} from './design-only-closure.mjs';

export const ENUMS = Object.freeze({
  task_status: ['DRAFT', 'ACTIVE', 'PAUSED', 'BLOCKED', 'STALLED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'ARCHIVED'],
  current_phase: ['TASK_DEFINITION', 'DESIGN', 'FINAL_PLAN', 'IMPLEMENTATION_AUTHORIZATION', 'IMPLEMENTATION', 'TESTING', 'IMPLEMENTATION_REVIEW', 'FINAL_JUDGMENT', 'POLICY_REVIEW', 'CLOSURE', 'ARCHIVE'],
  gate_status: ['NOT_EVALUATED', 'READY', 'NOT_READY', 'PASS', 'FAIL', 'NOT_CONFIRMED', 'BLOCKED'],
  authorization_status: ['NOT_REQUIRED', 'PENDING', 'AUTHORIZED', 'DENIED', 'EXPIRED', 'REVOKED'],
  archive_status: ['NOT_ELIGIBLE', 'REVIEW_PENDING', 'READY', 'DEFERRED', 'ARCHIVED'],
});

const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'REJECTED', 'ARCHIVED']);
const CORE_ROLES = new Set(['Orchestrator', 'Builder', 'Critic', 'Tester', 'Judge', 'Project Policy Agent']);
const FORWARD = new Map(ENUMS.current_phase.slice(0, -1).map((value, i) => [value, ENUMS.current_phase[i + 1]]));
const REWORK = new Map([
  ['DESIGN:DESIGN', { gates: ['FAIL', 'NOT_CONFIRMED'], code: 'REWORK_DESIGN' }],
  ['FINAL_PLAN:FINAL_PLAN', { gates: ['FAIL'], code: 'REWORK_FINAL_PLAN' }],
  ['FINAL_PLAN:DESIGN', { gates: ['FAIL', 'NOT_CONFIRMED'], code: 'REDESIGN_REQUIRED', judge: true }],
  ['IMPLEMENTATION_AUTHORIZATION:FINAL_PLAN', { gates: ['FAIL', 'NOT_CONFIRMED'], code: 'AUTHORIZATION_PLAN_REWORK' }],
  ['TESTING:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_TEST_FAILURE', implementation: true }],
  ['IMPLEMENTATION_REVIEW:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_REVIEW_FINDING', implementation: true }],
  ['FINAL_JUDGMENT:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_JUDGE_FIX', implementation: true }],
  ['FINAL_JUDGMENT:IMPLEMENTATION_REVIEW', { gates: ['NOT_CONFIRMED'], code: 'REVIEW_EVIDENCE_REQUIRED' }],
  ['POLICY_REVIEW:POLICY_REVIEW', { gates: ['FAIL'], code: 'REWORK_POLICY_VERIFY' }],
  ['POLICY_REVIEW:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_POLICY_IMPLEMENTATION', implementation: true }],
]);

export class LifecycleError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export const canonicalJson = (value) => JSON.stringify(sort(value));
export const checksum = (value) => `sha256:${createHash('sha256').update(canonicalJson(withoutChecksum(value))).digest('hex')}`;
const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const withoutChecksum = (value) => {
  if (!value || typeof value !== 'object') return value;
  const copy = structuredClone(value);
  delete copy.content_checksum; delete copy.entry_checksum;
  return copy;
};
const sameCanonical = (left, right) => canonicalJson(left) === canonicalJson(right);
const assertEnum = (field, value) => {
  if (!ENUMS[field].includes(value)) throw new LifecycleError('SCHEMA_INVALID', `${field} is invalid`);
};
const assertChecksum = (value, field = 'content_checksum') => {
  if (value[field] !== checksum(value)) throw new LifecycleError('CHECKSUM_INVALID', `${field} does not match canonical JSON`);
};
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const EVENT_ACKNOWLEDGEMENT_FIELDS = Object.freeze([
  'transition_id',
  'entry_checksum',
  'resulting_revision',
  'event_appended',
  'log_file_synced',
  'log_directory_synced',
  'event_verified',
]);
const EVENT_12_OPERATION_TYPES = new Set(['TASK_CLASSIFICATION', 'DESIGN_ONLY_CLOSURE', 'LEGACY_COMPLETION_ATTEST', 'PHASE1', 'RECOVERY', 'CLOSURE', 'ARCHIVE', 'LIFECYCLE_RECOVERY']);
const EVENT_12_FIELDS = new Set(['event_schema_version', 'transition_id', 'task_id', 'expected_revision', 'resulting_revision', 'resulting_canonical_checksum', 'record_mutation', 'from', 'to', 'outcome', 'reason_code', 'reason', 'failure_code', 'failure_reason', 'requested_by', 'authorized_by', 'applied_by', 'authorization_reference', 'evidence', 'lease_id', 'fencing_token', 'created_at', 'verified_at', 'operation_type', 'audit_id', 'original_request_id', 'sanitized_request_digest', 'source_record_schema_version', 'resulting_record_schema_version', 'source_classification', 'resulting_classification', 'operation_bundle', 'operation_audit', 'operation_audit_checksum', 'design_only_receipt_coordinates', 'archive_authority', 'original_transition_id', 'recovery_metadata', 'attested_log_prefix_length', 'attested_log_prefix_head_checksum', 'previous_entry_checksum', 'entry_checksum']);
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const assertTime = (value, field) => {
  if (typeof value !== 'string' || !RFC3339.test(value) || Number.isNaN(Date.parse(value))) throw new LifecycleError('SCHEMA_INVALID', `${field} must be RFC 3339 UTC`);
};
const exactKeys = (value, required, optional = []) => isPlainObject(value)
  && required.every((field) => field in value)
  && Object.keys(value).every((field) => required.includes(field) || optional.includes(field));
const validateEvent12Contract = (event) => {
  if (!isPlainObject(event) || event.event_schema_version !== '1.2.0' || Object.keys(event).some((field) => !EVENT_12_FIELDS.has(field)) || !CANONICAL_UUID.test(event.transition_id ?? '') || !EVENT_12_OPERATION_TYPES.has(event.operation_type) || !/^TASK-\d{3,}$/.test(event.task_id ?? '')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 event identity');
  const validAxes = (axes) => axes === null || (exactKeys(axes, Object.keys(ENUMS)) && Object.entries(axes).every(([field, value]) => ENUMS[field].includes(value)));
  if (!validAxes(event.from) || !validAxes(event.to)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 axes');
  for (const actor of ['requested_by', 'authorized_by', 'applied_by']) {
    if (!exactKeys(event[actor], ['actor_id', 'actor_type', 'role_id', 'session_id', 'run_id'])) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 actor');
    validateActor(event[actor]);
  }
  const referenceFields = ['authorization_id', 'authority_type', 'authority_path', 'authority_checksum', 'decision', 'effective_at', 'expires_at', 'scope'];
  if (event.authorization_reference !== null && (!exactKeys(event.authorization_reference, referenceFields, ['authority_envelope_payload_checksum', 'authority_envelope_key_id']) || !exactKeys(event.authorization_reference.scope, ['task_id', 'phases', 'operations']))) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 authorization reference');
  if (!Array.isArray(event.evidence) || event.evidence.some((item) => !exactKeys(item, ['path', 'checksum', 'authoring_role', 'result', 'observed_at'], ['source_id']))) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 evidence');
  const coordinatesValid = (coordinates, completedRequired = false) => exactKeys(coordinates, ['classification'], ['completion'])
    && exactKeys(coordinates.classification, ['transition_id', 'event_checksum', 'receipt_checksum'])
    && CANONICAL_UUID.test(coordinates.classification.transition_id ?? '') && SHA256.test(coordinates.classification.event_checksum ?? '') && SHA256.test(coordinates.classification.receipt_checksum ?? '')
    && (!completedRequired || exactKeys(coordinates.completion, ['transition_id', 'event_checksum', 'receipt_checksum']))
    && (coordinates.completion == null || (CANONICAL_UUID.test(coordinates.completion.transition_id ?? '') && SHA256.test(coordinates.completion.event_checksum ?? '') && SHA256.test(coordinates.completion.receipt_checksum ?? '')));
  assertTime(event.created_at, 'event.created_at'); if (event.verified_at !== null) assertTime(event.verified_at, 'event.verified_at');
  const forbidden = (...fields) => fields.some((field) => field in event);
  if (['REJECTED', 'VERIFICATION_FAILED'].includes(event.outcome)) {
    if (event.authorization_reference !== null || event.evidence.length !== 0 || event.lease_id !== null || event.fencing_token !== null || event.verified_at !== null || !CANONICAL_UUID.test(event.audit_id ?? '') || event.audit_id !== event.transition_id || !SHA256.test(event.sanitized_request_digest ?? '') || typeof event.failure_code !== 'string' || typeof event.failure_reason !== 'string' || forbidden('operation_bundle', 'operation_audit', 'operation_audit_checksum', 'archive_authority', 'design_only_receipt_coordinates', 'attested_log_prefix_length', 'attested_log_prefix_head_checksum', 'original_transition_id', 'recovery_metadata', 'resulting_canonical_checksum')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 rejection branch');
  } else if (event.outcome === 'RECOVERED') {
    try { validateAuthorization(event.authorization_reference); validateEvidence(event.evidence); } catch { throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 recovery evidence'); }
    const designRecovery = event.source_classification === 'DESIGN_ONLY';
    if (event.lease_id !== null || event.fencing_token !== null || event.verified_at !== event.created_at || !CANONICAL_UUID.test(event.original_transition_id ?? '') || !exactKeys(event.recovery_metadata, ['recovered_stage', 'recovery_actor', 'result']) || (designRecovery ? !coordinatesValid(event.design_only_receipt_coordinates, event.from?.task_status === 'COMPLETED') : 'design_only_receipt_coordinates' in event) || forbidden('operation_bundle', 'operation_audit', 'operation_audit_checksum', 'archive_authority', 'failure_code', 'failure_reason', 'audit_id', 'sanitized_request_digest', 'resulting_canonical_checksum', 'attested_log_prefix_length', 'attested_log_prefix_head_checksum')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 recovery branch');
  } else if (event.outcome === 'COMMITTED') {
    try { validateAuthorization(event.authorization_reference); validateEvidence(event.evidence); } catch { throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 committed evidence'); }
    const leaseValid = event.operation_type === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST ? event.lease_id === null && event.fencing_token === null : CANONICAL_UUID.test(event.lease_id ?? '') && Number.isSafeInteger(event.fencing_token);
    if (!leaseValid || event.verified_at !== event.created_at || event.authorization_reference === null || event.evidence.length === 0 || !SHA256.test(event.resulting_canonical_checksum ?? '') || !exactKeys(event.from, Object.keys(ENUMS)) || !exactKeys(event.to, Object.keys(ENUMS)) || forbidden('failure_code', 'failure_reason', 'audit_id', 'sanitized_request_digest', 'original_transition_id', 'recovery_metadata')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 committed branch');
    const governed = [DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE, DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST].includes(event.operation_type);
    if (governed) {
      const audit = event.operation_audit; const auditFields = ['audit_schema_version', 'operation', 'transition_id', 'task_id', 'source_revision', 'resulting_revision', 'source_record_schema_version', 'resulting_record_schema_version', 'source_classification', 'resulting_classification', 'from', 'to', 'skipped_phases', 'context_manifest_checksum', 'decision_checksum', 'operation_coordinate_checksum', 'owner_authorization_payload_checksum', 'authority_attestation_payload_checksum', 'resulting_canonical_checksum', 'created_at', 'content_checksum'];
      const skippedRowsValid = Array.isArray(audit?.skipped_phases) && audit.skipped_phases.every((row) => exactKeys(row, ['phase', 'entered', 'gate_result', 'authorization']));
      const expectedSkipped = event.operation_type === DESIGN_ONLY_OPERATIONS.COMPLETE ? ['IMPLEMENTATION_AUTHORIZATION', 'IMPLEMENTATION', 'TESTING', 'IMPLEMENTATION_REVIEW', 'FINAL_JUDGMENT', 'POLICY_REVIEW'] : [];
      const skippedExact = skippedRowsValid && sameCanonical(audit.skipped_phases, expectedSkipped.map((phase) => ({ phase, entered: false, gate_result: 'NOT_APPLICABLE', authorization: 'NOT_REQUIRED' })));
      try { verifyDesignOnlyOperationAudit(audit, { event }); } catch { throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 governed operation branch'); }
      if (!isPlainObject(event.operation_bundle) || !exactKeys(audit, auditFields) || !skippedExact || event.operation_audit_checksum !== audit.content_checksum) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 governed operation branch');
    }
    if (!governed && forbidden('operation_bundle', 'operation_audit', 'operation_audit_checksum')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'unexpected governed fields on ordinary 1.2 event');
    if (governed && 'design_only_receipt_coordinates' in event) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'unexpected design-only provenance on governed operation');
    if (!governed) {
      const designSource = event.source_classification === 'DESIGN_ONLY';
      if ((designSource && !coordinatesValid(event.design_only_receipt_coordinates, event.from?.task_status === 'COMPLETED')) || (!designSource && 'design_only_receipt_coordinates' in event)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid design-only receipt provenance');
    }
    if (event.operation_type === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST) {
      if (!Number.isSafeInteger(event.attested_log_prefix_length) || !SHA256.test(event.attested_log_prefix_head_checksum ?? '')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'legacy prefix proof missing');
    } else if (forbidden('attested_log_prefix_length', 'attested_log_prefix_head_checksum')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'unexpected legacy prefix proof');
    if (event.operation_type === 'ARCHIVE' && event.source_classification === 'DESIGN_ONLY') {
      if (!isPlainObject(event.archive_authority) || event.archive_authority.archive_authority_schema_version !== '1.0.0' || !exactKeys(event.archive_authority, ['archive_authority_schema_version', 'owner_authorization', 'authority_ledger_coordinate', 'history_proof', 'content_checksum']) || event.archive_authority.content_checksum !== checksum(event.archive_authority)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'archive authority proof missing');
    } else if ('archive_authority' in event) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'unexpected archive authority proof');
  } else throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 outcome');
  return true;
};
const assertProjectPath = (value) => {
  if (typeof value !== 'string' || !value || path.isAbsolute(value) || value.split('/').includes('..')) throw new LifecycleError('EVIDENCE_INVALID', 'evidence path must remain project-relative');
};

export function validateActor(actor) {
  if (!actor || typeof actor.actor_id !== 'string' || !actor.actor_id) throw new LifecycleError('SCHEMA_INVALID', 'actor_id is required');
  if (!['ROLE', 'SYSTEM_COMPONENT', 'OWNER'].includes(actor.actor_type)) throw new LifecycleError('SCHEMA_INVALID', 'actor_type is invalid');
  if (actor.actor_type === 'ROLE' && !CORE_ROLES.has(actor.role_id)) throw new LifecycleError('SCHEMA_INVALID', 'role_id must be a core role');
  if (actor.actor_type !== 'ROLE' && actor.role_id !== null) throw new LifecycleError('SCHEMA_INVALID', 'non-role actor must have null role_id');
  for (const key of ['session_id', 'run_id']) if (!(key in actor) || (actor[key] !== null && typeof actor[key] !== 'string')) throw new LifecycleError('SCHEMA_INVALID', `${key} must be string or null`);
}
export function validateEvidence(evidence) {
  if (!Array.isArray(evidence) || !evidence.length) throw new LifecycleError('EVIDENCE_INVALID', 'evidence is required');
  for (const item of evidence) {
    if (!exactKeys(item, ['path', 'checksum', 'authoring_role', 'result', 'observed_at'], ['source_id'])) throw new LifecycleError('EVIDENCE_INVALID', 'evidence entry is invalid');
    assertProjectPath(item.path);
    if (!SHA256.test(item.checksum) || typeof item.result !== 'string' || !item.result) throw new LifecycleError('EVIDENCE_INVALID', 'evidence fields are invalid');
    if (!(CORE_ROLES.has(item.authoring_role) || item.authoring_role === 'Owner')) throw new LifecycleError('EVIDENCE_INVALID', 'evidence author is invalid');
    assertTime(item.observed_at, 'evidence.observed_at');
  }
}
export function validateAuthorization(reference) {
  if (!exactKeys(reference, ['authorization_id', 'authority_type', 'authority_path', 'authority_checksum', 'decision', 'effective_at', 'expires_at', 'scope'], ['authority_envelope_payload_checksum', 'authority_envelope_key_id']) || typeof reference.authorization_id !== 'string' || !reference.authorization_id) throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization reference is required');
  if (!['RULE', 'JUDGE', 'OWNER'].includes(reference.authority_type) || !SHA256.test(reference.authority_checksum) || typeof reference.decision !== 'string') throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization fields are invalid');
  assertProjectPath(reference.authority_path); assertTime(reference.effective_at, 'authorization.effective_at');
  if (reference.expires_at !== null) assertTime(reference.expires_at, 'authorization.expires_at');
  if (!exactKeys(reference.scope, ['task_id', 'phases', 'operations']) || !/^TASK-\d{3,}$/.test(reference.scope.task_id) || !Array.isArray(reference.scope.phases) || !Array.isArray(reference.scope.operations)) throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization scope is invalid');
}

export function validateRecord(record) {
  const required = ['record_schema_version', 'task_id', 'project_id', 'record_revision', 'status_reason', 'entered_at', 'updated_at', 'last_verified_at', 'requested_by', 'authorized_by', 'applied_by', 'authorization_reference', 'authoritative_evidence', 'blocking_items', 'next_eligible_phases', 'verification_result', 'last_transition_id', 'content_checksum'];
  if (required.some((field) => !(field in record)) || !['1.1.0', '1.2.0'].includes(record.record_schema_version) || !/^TASK-\d{3,}$/.test(record.task_id) || typeof record.project_id !== 'string' || !record.project_id.trim() || !Number.isInteger(record.record_revision) || record.record_revision < 1 || typeof record.status_reason !== 'string' || !record.status_reason) throw new LifecycleError('SCHEMA_INVALID', 'record identity is invalid');
  if (record.record_schema_version === '1.1.0' && 'task_classification' in record) throw new LifecycleError('SCHEMA_INVALID', 'legacy record cannot carry classification');
  if (record.record_schema_version === '1.2.0' && !['DESIGN_ONLY', 'IMPLEMENTATION', 'UNKNOWN'].includes(record.task_classification)) throw new LifecycleError('SCHEMA_INVALID', '1.2 record classification is invalid');
  for (const field of Object.keys(ENUMS)) assertEnum(field, record[field]);
  for (const actor of ['requested_by', 'authorized_by', 'applied_by']) validateActor(record[actor]);
  for (const field of ['entered_at', 'updated_at', 'last_verified_at']) assertTime(record[field], field);
  if (Date.parse(record.updated_at) < Date.parse(record.entered_at) || !['PASS', 'FAIL', 'NOT_CONFIRMED'].includes(record.verification_result)) throw new LifecycleError('SCHEMA_INVALID', 'verification state is invalid');
  validateAuthorization(record.authorization_reference); validateEvidence(record.authoritative_evidence);
  if (!Array.isArray(record.blocking_items) || (record.task_status === 'BLOCKED' && !record.blocking_items.length)) throw new LifecycleError('SCHEMA_INVALID', 'blocking_items is invalid');
  if (record.archive_status === 'ARCHIVED' && record.task_status !== 'ARCHIVED') throw new LifecycleError('SCHEMA_INVALID', 'archive state is inconsistent');
  assertChecksum(record);
}

export function validateTransition(current, request) {
  if (request.expected_revision !== current.record_revision) throw new LifecycleError('REVISION_CONFLICT', 'expected revision differs from canonical revision');
  const from = request.from; const to = request.to;
  for (const field of Object.keys(ENUMS)) {
    if (from[field] !== current[field]) throw new LifecycleError('SCHEMA_INVALID', `from.${field} differs from canonical state`);
    assertEnum(field, to[field]);
  }
  const domain = request.operation_domain ?? 'PHASE1';
  const lateDomain = ['RECOVERY', 'CLOSURE', 'ARCHIVE', 'TASK_CLASSIFICATION', 'DESIGN_ONLY_CLOSURE'].includes(domain);
  const classification = current.task_classification ?? 'UNKNOWN';
  if (current.record_schema_version === '1.2.0' && classification === 'DESIGN_ONLY' && !TERMINAL.has(current.task_status)) {
    if (['PAUSED', 'BLOCKED', 'STALLED'].includes(current.task_status) && domain !== 'RECOVERY') throw new LifecycleError('TASK_CLASSIFICATION_IMMUTABLE', 'non-active design-only task accepts recovery only');
    if (!['RECOVERY', 'DESIGN_ONLY_CLOSURE'].includes(domain)) throw new LifecycleError('TASK_CLASSIFICATION_IMMUTABLE', 'design-only task cannot enter implementation lifecycle');
  }
  if (TERMINAL.has(current.task_status) && to.task_status !== current.task_status && !(domain === 'ARCHIVE' && current.task_status === 'COMPLETED' && to.task_status === 'ARCHIVED')) throw new LifecycleError('TERMINAL_REOPEN_FORBIDDEN', 'terminal task cannot reopen');
  if (!lateDomain && to.archive_status !== 'NOT_ELIGIBLE' && to.archive_status !== current.archive_status) throw new LifecycleError('UNDEFINED_TRANSITION', 'archive operation is outside phase 1');
  if (domain === 'RECOVERY') {
    if (from.current_phase !== to.current_phase || from.gate_status !== to.gate_status || from.authorization_status !== to.authorization_status || from.archive_status !== to.archive_status) throw new LifecycleError('UNDEFINED_TRANSITION', 'recovery control changes only task status');
    const edge = `${from.task_status}:${to.task_status}`;
    if (!['ACTIVE:PAUSED','ACTIVE:BLOCKED','ACTIVE:STALLED','PAUSED:ACTIVE','BLOCKED:ACTIVE','STALLED:ACTIVE'].includes(edge)) throw new LifecycleError('UNDEFINED_TRANSITION', 'recovery status edge is not allowed');
    if (from.task_status === 'PAUSED' && to.task_status === 'ACTIVE' && !(request.owner_authorized || request.scheduled_time_reached)) throw new LifecycleError('AUTHORIZATION_MISSING', 'paused resume condition not met');
    if (from.task_status === 'BLOCKED' && to.task_status === 'ACTIVE' && !request.condition_verified) throw new LifecycleError('NOT_CONFIRMED', 'blocked condition is not verified');
    if (from.task_status === 'STALLED' && to.task_status === 'ACTIVE' && !(request.environment_recovered || request.hypothesis_changed || request.handoff_present)) throw new LifecycleError('NOT_CONFIRMED', 'stalled recovery evidence missing');
    if (request.emergency_stop && to.task_status === 'ACTIVE' && !request.owner_authorized) throw new LifecycleError('AUTHORIZATION_MISSING', 'emergency stop requires Owner resume');
    return;
  }
  if (domain === 'TASK_CLASSIFICATION') {
    if (current.task_status !== 'ACTIVE' || current.current_phase !== 'FINAL_PLAN' || current.gate_status !== 'PASS' || classification !== 'UNKNOWN') throw new LifecycleError(classification === 'IMPLEMENTATION' ? 'TASK_CLASSIFICATION_IMMUTABLE' : 'DESIGN_ONLY_CLASSIFICATION_INVALID');
    if (Object.keys(ENUMS).some((field) => from[field] !== to[field]) || request.record_patch?.task_classification !== 'DESIGN_ONLY') throw new LifecycleError('DESIGN_ONLY_CLASSIFICATION_INVALID');
    if (!request.owner_authorized || request.authorized_by?.actor_type !== 'OWNER') throw new LifecycleError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
    return;
  }
  if (domain === 'DESIGN_ONLY_CLOSURE') {
    if (current.record_schema_version !== '1.2.0' || classification !== 'DESIGN_ONLY' || from.task_status !== 'ACTIVE' || from.current_phase !== 'FINAL_PLAN' || from.gate_status !== 'PASS'
      || to.task_status !== 'COMPLETED' || to.current_phase !== 'CLOSURE' || to.gate_status !== 'PASS' || to.authorization_status !== 'NOT_REQUIRED' || to.archive_status !== 'REVIEW_PENDING') throw new LifecycleError('DESIGN_ONLY_CLOSURE_INVALID');
    if (!request.owner_authorized || !request.closure_ready || request.authorized_by?.actor_type !== 'OWNER') throw new LifecycleError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
    return;
  }
  if (domain === 'CLOSURE') {
    if (from.current_phase !== 'CLOSURE' || to.current_phase !== 'CLOSURE' || from.task_status !== 'ACTIVE' || to.task_status !== 'COMPLETED' || to.gate_status !== 'PASS' || !['REVIEW_PENDING','READY'].includes(to.archive_status)) throw new LifecycleError('UNDEFINED_TRANSITION', 'closure transition preconditions are invalid');
    if (!request.closure_ready || !request.owner_authorized) throw new LifecycleError('AUTHORIZATION_MISSING', 'closure readiness and Owner authorization required');
    return;
  }
  if (domain === 'ARCHIVE') {
    if (from.task_status !== 'COMPLETED' || to.task_status !== 'ARCHIVED' || from.current_phase !== 'ARCHIVE' || to.current_phase !== 'ARCHIVE' || to.archive_status !== 'ARCHIVED' || !request.archive_verified) throw new LifecycleError('UNDEFINED_TRANSITION', 'archive transition preconditions are invalid');
    if (!request.owner_authorized) throw new LifecycleError('AUTHORIZATION_MISSING', 'archive requires Owner authorization');
    return;
  }
  const phaseChanged = from.current_phase !== to.current_phase;
  if (phaseChanged) {
    const key = `${from.current_phase}:${to.current_phase}`;
    const rule = REWORK.get(key);
    if (FORWARD.get(from.current_phase) !== to.current_phase && !rule) throw new LifecycleError('UNDEFINED_TRANSITION', 'phase edge is not allowed');
    if (rule) {
      if (!rule.gates.includes(to.gate_status) || request.reason_code !== rule.code) throw new LifecycleError('UNDEFINED_TRANSITION', 'rework preconditions are invalid');
      if (rule.implementation && to.authorization_status !== 'AUTHORIZED') throw new LifecycleError('AUTHORIZATION_MISSING', 'implementation rework requires authorization');
    } else {
      if (to.gate_status !== 'PASS') throw new LifecycleError('PHASE_SKIP_FORBIDDEN', 'forward phase requires PASS gate');
      if (to.current_phase === 'IMPLEMENTATION' && to.authorization_status !== 'AUTHORIZED') throw new LifecycleError('AUTHORIZATION_MISSING', 'implementation requires authorization');
    }
  }
  if (['PAUSED', 'BLOCKED', 'STALLED', 'COMPLETED', 'ARCHIVED'].includes(to.task_status) && to.task_status !== current.task_status) throw new LifecycleError('UNDEFINED_TRANSITION', 'later phase task status operation');
}

async function syncFile(file) { const handle = await open(file, 'r'); try { await handle.sync(); } finally { await handle.close(); } }
async function syncDirectory(directory) { const handle = await open(directory, 'r'); try { await handle.sync(); } finally { await handle.close(); } }
async function readJson(file) { return JSON.parse(await readFile(file, 'utf8')); }

export class LifecycleStore {
  constructor(taskDir, { clock = () => new Date(), crashAt = null, projectRoot = null, beforeCommit = null, durability = { syncFile, syncDirectory }, designOnlySecurity = null } = {}) {
    this.dir = path.resolve(taskDir); this.clock = clock; this.crashAt = crashAt; this.projectRoot = path.resolve(projectRoot ?? path.dirname(taskDir)); this.beforeCommit = beforeCommit; this.durability = durability;
    this.designOnlySecurity = designOnlySecurity;
    this.recordPath = path.join(this.dir, 'canonical-status.json');
    this.logPath = path.join(this.dir, 'transition-log.jsonl');
    this.journalPath = path.join(this.dir, 'transaction-journal.json');
    this.leasePath = path.join(this.dir, 'lease.json');
    this.txDir = path.join(this.dir, 'transactions');
    this.preparationDir = path.join(this.dir, 'preparations');
    this.receiptDir = path.join(this.dir, 'audit-receipts');
    this.auditAppendLockPath = path.join(this.dir, 'audit-append.lock');
    this.legacyAttestationJournalPath = path.join(this.dir, 'legacy-attestation-journal.json');
    this.instanceId = randomUUID(); this.hostId = hostname();
  }
  async assertTrustedTaskDir() {
    const relative = path.relative(this.projectRoot, this.dir).replaceAll('\\', '/');
    if (!relative || relative.startsWith('../') || path.isAbsolute(relative)) throw new LifecycleError('SECURITY_PATH_ESCAPE', 'task store is outside project root');
    let resolved; try { resolved = await resolveExistingInside(this.projectRoot, relative); }
    catch { throw new LifecycleError('SECURITY_PATH_ESCAPE', 'task store root is not trusted'); }
    if (path.resolve(resolved) !== this.dir) throw new LifecycleError('SECURITY_PATH_ESCAPE', 'task store root changed');
  }
  async writeDurable(file, content) {
    const target = await this.trustedWritable(file);
    await writeFile(target, content);
    try { await this.durability.syncFile(target); }
    catch (error) { throw new LifecycleError('DURABILITY_SYNC_FAILED', `file sync failed: ${error.code ?? error.message}`); }
  }
  async trustedWritable(file) {
    await this.assertTrustedTaskDir();
    const absolute = path.resolve(file); const insideTask = path.relative(this.dir, absolute);
    if (!insideTask || path.isAbsolute(insideTask) || insideTask === '..' || insideTask.startsWith(`..${path.sep}`)) throw new LifecycleError('SECURITY_PATH_ESCAPE', 'internal lifecycle path escaped task store');
    const relative = path.relative(this.projectRoot, absolute).replaceAll('\\', '/');
    try {
      await assertNoSymlinkPath(this.projectRoot, relative);
      const resolved = await resolveWritableInside(this.projectRoot, relative);
      if (path.resolve(resolved) !== absolute) throw new Error('path changed');
      return resolved;
    } catch { throw new LifecycleError('SECURITY_PATH_ESCAPE', 'internal lifecycle write path is not trusted'); }
  }
  async trustedExisting(file) {
    await this.assertTrustedTaskDir();
    const absolute = path.resolve(file); const insideTask = path.relative(this.dir, absolute);
    if (!insideTask || path.isAbsolute(insideTask) || insideTask === '..' || insideTask.startsWith(`..${path.sep}`)) throw new LifecycleError('SECURITY_PATH_ESCAPE', 'internal lifecycle path escaped task store');
    const relative = path.relative(this.projectRoot, absolute).replaceAll('\\', '/');
    try { return await resolveExistingInside(this.projectRoot, relative); }
    catch { throw new LifecycleError('SECURITY_PATH_ESCAPE', 'internal lifecycle read path is not trusted'); }
  }
  async readInternal(file, encoding = 'utf8') { return readFile(await this.trustedExisting(file), encoding); }
  async readJsonInternal(file) { return JSON.parse(await this.readInternal(file, 'utf8')); }
  transactionPaths(transitionId) {
    if (!CANONICAL_UUID.test(transitionId ?? '')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'transaction identity is invalid');
    return { snapshot_tmp: path.join(this.txDir, `${transitionId}.snapshot.tmp`), event_tmp: path.join(this.txDir, `${transitionId}.event.tmp`) };
  }
  validateJournalPaths(journal) {
    const expected = this.transactionPaths(journal?.transition_id);
    if (path.resolve(journal?.snapshot_tmp ?? '') !== expected.snapshot_tmp || path.resolve(journal?.event_tmp ?? '') !== expected.event_tmp) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'transaction journal path is invalid');
    return expected;
  }
  async cleanupTransactionFiles(journal) {
    const expected = this.validateJournalPaths(journal);
    for (const file of Object.values(expected)) if (await exists(file)) await rm(await this.trustedExisting(file), { force: true });
  }
  async syncDirectory(directory) {
    const target = path.resolve(directory) === this.dir ? (await this.assertTrustedTaskDir(), this.dir) : await this.trustedExisting(directory);
    try { await this.durability.syncDirectory(target); }
    catch (error) { throw new LifecycleError('DURABILITY_SYNC_FAILED', `directory sync failed: ${error.code ?? error.message}`); }
  }
  async init(initialRecord) {
    await this.assertTrustedTaskDir();
    await this.trustedWritable(path.join(this.txDir, '.path-check')); await this.trustedWritable(path.join(this.preparationDir, '.path-check')); await this.trustedWritable(path.join(this.receiptDir, '.path-check'));
    if (!(await exists(this.recordPath))) { validateRecord(initialRecord); await this.writeDurable(this.recordPath, canonicalJson(initialRecord)); await this.writeDurable(this.logPath, ''); }
    await this.recover();
  }
  async readRecord() { const record = await this.readJsonInternal(this.recordPath); validateRecord(record); return record; }
  async prepareDesignOnlyOperation(operation, { ttl_ms = 300_000 } = {}) {
    if (!Object.values(DESIGN_ONLY_OPERATIONS).includes(operation) || !Number.isSafeInteger(ttl_ms) || ttl_ms < 1 || ttl_ms > 900_000) throw new LifecycleError('DESIGN_ONLY_OPERATION_INVALID');
    await this.recover(); const record = await this.readRecord();
    if (operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST && (record.record_schema_version !== '1.1.0' || record.task_status !== 'COMPLETED' || record.current_phase !== 'CLOSURE' || record.gate_status !== 'PASS')) throw new LifecycleError('LEGACY_COMPLETION_ATTEST_INVALID');
    const preparation = { preparation_schema_version: '1.0.0', preparation_id: randomUUID(), operation, task_id: record.task_id, project_id: record.project_id, source_revision: record.record_revision, source_canonical_checksum: record.content_checksum, created_at: this.clock().toISOString(), expires_at: new Date(this.clock().getTime() + ttl_ms).toISOString(), state: 'PREPARED' };
    if (operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST) {
      const log = await this.readInternal(this.logPath); const lines = log.split('\n').filter(Boolean);
      preparation.log_prefix_length = lines.length;
      preparation.log_prefix_head_checksum = lines.length ? JSON.parse(lines.at(-1)).entry_checksum : `sha256:${createHash('sha256').update('').digest('hex')}`;
      preparation.migration_epoch = this.designOnlySecurity?.current_authority_epoch ?? null;
    }
    preparation.content_checksum = checksum(preparation);
    const file = path.join(this.preparationDir, `${preparation.preparation_id}.json`);
    const handle = await open(await this.trustedWritable(file), 'wx'); try { await handle.writeFile(canonicalJson(preparation)); await handle.sync(); } finally { await handle.close(); }
    await this.syncDirectory(this.preparationDir); return Object.freeze(preparation);
  }
  async readPreparation(preparationId) {
    if (!CANONICAL_UUID.test(preparationId ?? '')) throw new LifecycleError('DESIGN_ONLY_OPERATION_INVALID');
    let preparation;
    try { preparation = await this.readJsonInternal(path.join(this.preparationDir, `${preparationId}.json`)); }
    catch { throw new LifecycleError('DESIGN_ONLY_OPERATION_PREPARATION_INVALID'); }
    if (preparation.content_checksum !== checksum(preparation) || preparation.state !== 'PREPARED' || Date.parse(preparation.expires_at) <= this.clock().getTime()) throw new LifecycleError('DESIGN_ONLY_OPERATION_PREPARATION_INVALID');
    return preparation;
  }
  async consumePreparation(preparation, request) {
    const current = await this.readRecord();
    if (preparation.preparation_id !== request.request_id || preparation.operation !== request.operation_domain || preparation.source_revision !== current.record_revision || preparation.source_canonical_checksum !== current.content_checksum) throw new LifecycleError('DESIGN_ONLY_OPERATION_PREPARATION_INVALID');
    const source = path.join(this.preparationDir, `${preparation.preparation_id}.json`);
    const target = path.join(this.preparationDir, `${preparation.preparation_id}.consumed.json`);
    try { await rename(await this.trustedExisting(source), await this.trustedWritable(target)); await this.syncDirectory(this.preparationDir); }
    catch { throw new LifecycleError('DESIGN_ONLY_OPERATION_PREPARATION_INVALID'); }
  }
  receiptPath(transitionId) {
    if (!CANONICAL_UUID.test(transitionId ?? '')) throw new LifecycleError('AUDIT_RECEIPT_INVALID');
    const digest = createHash('sha256').update(transitionId).digest('hex');
    return path.join(this.receiptDir, `${digest}.json`);
  }
  async persistDesignOnlyReceipt(event, record, journal, operationAudit, at) {
    const receipt = createDesignOnlyCommitReceipt({ event, record, acknowledgement: journal.event_acknowledgement, operationAudit, at });
    const file = this.receiptPath(event.transition_id);
    const handle = await open(await this.trustedWritable(file), 'wx'); try { await handle.writeFile(canonicalJson(receipt)); await handle.sync(); } finally { await handle.close(); }
    await this.syncDirectory(this.receiptDir);
    const verified = await this.readJsonInternal(file);
    try { verifyDesignOnlyCommitReceipt(verified, { event, record }); }
    catch (error) { throw new LifecycleError(error.code ?? 'AUDIT_RECEIPT_INVALID'); }
    journal.audit_receipt_checksum = receipt.content_checksum;
    journal.audit_receipt_path = path.relative(this.dir, file).replaceAll('\\', '/');
    await this.writeDurable(this.journalPath, canonicalJson(journal));
    return receipt;
  }
  async readDesignOnlyReceipt(transitionId) {
    await this.verifyLogIntegrity();
    const record = await this.readRecord(); const event = await this.readCommittedEvent(transitionId);
    let receipt; try { receipt = await this.readJsonInternal(this.receiptPath(transitionId)); } catch { throw new LifecycleError('AUDIT_RECEIPT_INVALID'); }
    try { verifyDesignOnlyCommitReceipt(receipt, { event, record }); }
    catch (error) { throw new LifecycleError(error.code ?? 'AUDIT_RECEIPT_INVALID'); }
    return Object.freeze(receipt);
  }
  assertCanonicalAuthorizationSummary(reference, validated, current) {
    const ownerEnvelope = validated.owner_authorization; const coordinate = validated.coordinate;
    const decision = coordinate.operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? 'COMPLETE_TASK' : coordinate.operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST ? 'CANONICAL_QUEUE_BINDING' : 'CLASSIFY_DESIGN_ONLY';
    if (!reference || reference.authority_type !== 'OWNER' || reference.decision !== decision || reference.authorization_id !== ownerEnvelope.approval_id || reference.authority_path !== ownerEnvelope.authority_path || reference.authority_checksum !== ownerEnvelope.authority_checksum || reference.effective_at !== ownerEnvelope.effective_at || reference.expires_at !== ownerEnvelope.expires_at || reference.authority_envelope_payload_checksum !== ownerEnvelope.payload_checksum || reference.authority_envelope_key_id !== ownerEnvelope.key_id || reference.scope?.task_id !== current.task_id || !sameCanonical(reference.scope.phases, [coordinate.phase]) || !sameCanonical([...reference.scope.operations].sort(), coordinate.capabilities)) throw new LifecycleError('AUTHORIZATION_MISSING', 'Canonical authorization reference does not exactly summarize the signed Owner envelope');
    return true;
  }
  async designOnlyReceiptCoordinates(record = null) {
    const current = record ?? await this.readRecord();
    if (current.record_schema_version !== '1.2.0' || current.task_classification !== 'DESIGN_ONLY') return null;
    const events = (await this.readInternal(this.logPath)).split('\n').filter(Boolean).map((line) => JSON.parse(line));
    const coordinateFor = async (operation) => {
      const event = events.findLast((row) => row.outcome === 'COMMITTED' && row.operation_type === operation);
      if (!event) return null;
      const receipt = await this.readDesignOnlyReceipt(event.transition_id);
      return { transition_id: event.transition_id, event_checksum: event.entry_checksum, receipt_checksum: receipt.content_checksum };
    };
    return { classification: await coordinateFor(DESIGN_ONLY_OPERATIONS.CLASSIFY), completion: await coordinateFor(DESIGN_ONLY_OPERATIONS.COMPLETE) };
  }
  async attestLegacyCompletion(request, appliedBy) {
    await this.recover(); const current = await this.readRecord();
    if (!request || request.operation_domain !== DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST || request.request_id !== request.operation_bundle?.operation_coordinate?.preparation_id) throw new LifecycleError('LEGACY_COMPLETION_ATTEST_INVALID');
    this.validateRequestIdentity({ ...request, from: request.from ?? Object.fromEntries(Object.keys(ENUMS).map((key) => [key, current[key]])), to: request.to ?? Object.fromEntries(Object.keys(ENUMS).map((key) => [key, current[key]])), reason_code: request.reason_code ?? DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, reason: request.reason ?? 'Owner-authorized legacy completion attestation' }, current);
    const validated = await this.validateRequestAuthorizationAndEvidence(request, current);
    const log = await this.readInternal(this.logPath); const lines = log.split('\n').filter(Boolean);
    const currentHead = lines.length ? JSON.parse(lines.at(-1)).entry_checksum : `sha256:${createHash('sha256').update('').digest('hex')}`;
    if (lines.length !== validated.preparation.log_prefix_length || currentHead !== validated.preparation.log_prefix_head_checksum) throw new LifecycleError('LEGACY_COMPLETION_ATTEST_INVALID');
    const now = this.clock().toISOString(); const axes = Object.fromEntries(Object.keys(ENUMS).map((key) => [key, current[key]]));
    const operationAudit = createDesignOnlyOperationAudit({ operation: request.operation_domain, current, next: current, request: { ...request, from: axes, to: axes }, validated: validated.validated, at: now });
    const event = { event_schema_version: '1.2.0', transition_id: request.request_id, task_id: current.task_id, expected_revision: current.record_revision, resulting_revision: current.record_revision, resulting_canonical_checksum: current.content_checksum, record_mutation: false, from: axes, to: axes, outcome: 'COMMITTED', reason_code: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, reason: request.reason, requested_by: request.requested_by, authorized_by: request.authorized_by, applied_by: appliedBy, authorization_reference: request.authorization_reference, evidence: request.evidence, lease_id: null, fencing_token: null, created_at: now, verified_at: now, operation_type: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, operation_bundle: structuredClone(request.operation_bundle), operation_audit: operationAudit, operation_audit_checksum: operationAudit.content_checksum, source_record_schema_version: '1.1.0', resulting_record_schema_version: '1.1.0', source_classification: 'UNKNOWN', resulting_classification: 'UNKNOWN', attested_log_prefix_length: validated.preparation.log_prefix_length, attested_log_prefix_head_checksum: validated.preparation.log_prefix_head_checksum };
    const appendLock = await this.acquireAuditAppendLock();
    try {
      const finalCurrent = await this.readRecord();
      if (finalCurrent.record_revision !== current.record_revision || finalCurrent.content_checksum !== current.content_checksum) throw new LifecycleError('LEGACY_COMPLETION_ATTEST_INVALID');
      const finalValidation = await this.validateRequestAuthorizationAndEvidence(request, finalCurrent);
      if (finalValidation.bundle_checksum !== validated.bundle_checksum) throw new LifecycleError('LEGACY_COMPLETION_ATTEST_INVALID');
      const finalLines = (await this.readInternal(this.logPath)).split('\n').filter(Boolean);
      const finalHead = finalLines.length ? JSON.parse(finalLines.at(-1)).entry_checksum : `sha256:${createHash('sha256').update('').digest('hex')}`;
      if (finalLines.length !== finalValidation.preparation.log_prefix_length || finalHead !== finalValidation.preparation.log_prefix_head_checksum) throw new LifecycleError('LEGACY_COMPLETION_ATTEST_INVALID');
      const legacyJournal = { journal_schema_version: '1.0.0', kind: 'LEGACY_COMPLETION_ATTEST', stage: 'PREPARED', transition_id: event.transition_id, record_revision: current.record_revision, record_checksum: current.content_checksum, append_lock_token: appendLock.lock_token, append_lock_fencing_token: appendLock.fencing_token, event };
      await this.writeDurable(this.legacyAttestationJournalPath, canonicalJson(legacyJournal)); await this.syncDirectory(this.dir);
      await this.consumePreparation(finalValidation.preparation, request);
      const committed = await this.appendSerializedAuditEvent(event, { lock_held: true });
      legacyJournal.stage = 'EVENT_APPENDED'; legacyJournal.event = committed;
      await this.writeDurable(this.legacyAttestationJournalPath, canonicalJson(legacyJournal)); await this.syncDirectory(this.dir);
      if (this.crashAt === 'LEGACY_EVENT_APPENDED') throw new Error('SIMULATED_CRASH');
      const receipt = await this.persistLegacyAttestationReceipt(committed, current, operationAudit, now);
      await rm(this.legacyAttestationJournalPath); await this.syncDirectory(this.dir);
      return Object.freeze({ result: 'LEGACY_COMPLETION_ATTESTED', event: Object.freeze(committed), receipt: Object.freeze(receipt) });
    } finally { await this.releaseAuditAppendLock(appendLock.lock_token); }
  }
  async persistLegacyAttestationReceipt(event, record, operationAudit = event.operation_audit, at = event.created_at) {
    const acknowledgement = { transition_id: event.transition_id, entry_checksum: event.entry_checksum, resulting_revision: event.resulting_revision, event_appended: true, log_file_synced: true, log_directory_synced: true, event_verified: true };
    const receipt = createDesignOnlyCommitReceipt({ event, record, acknowledgement, operationAudit, at });
    const file = this.receiptPath(event.transition_id);
    if (!(await exists(file))) {
      const handle = await open(await this.trustedWritable(file), 'wx');
      try { await handle.writeFile(canonicalJson(receipt)); await handle.sync(); } finally { await handle.close(); }
      await this.syncDirectory(this.receiptDir);
    }
    verifyDesignOnlyCommitReceipt(await this.readJsonInternal(file), { event, record });
    return receipt;
  }
  async readVerifiedCanonical() {
    await this.recover(); await this.verifyLogIntegrity();
    if (await exists(this.journalPath) || await exists(this.leasePath) || await exists(this.legacyAttestationJournalPath)) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
    const record = await this.readRecord(); const event = await this.readCommittedEvent(record.last_transition_id);
    if (record.record_revision > 1 && !(record.record_schema_version === '1.1.0' && record.task_status === 'COMPLETED') && (!event || event.outcome !== 'COMMITTED' || event.resulting_revision !== record.record_revision || event.resulting_canonical_checksum !== record.content_checksum)) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
    let receipt = null;
    const events = (await this.readInternal(this.logPath)).split('\n').filter(Boolean).map((line) => JSON.parse(line));
    let bindingEvent = event;
    if (record.record_schema_version === '1.1.0' && record.task_status === 'COMPLETED') {
      const attestationEvent = events.findLast((row) => row.outcome === 'COMMITTED' && row.operation_type === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST);
      if (!attestationEvent || attestationEvent.record_mutation !== false) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
      const operationReceipt = await this.readDesignOnlyReceipt(attestationEvent.transition_id); const bundle = attestationEvent.operation_bundle; const coordinate = bundle?.operation_coordinate;
      if (!bundle || !coordinate) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
      const prefix = events.slice(0, events.findIndex((row) => row.transition_id === attestationEvent.transition_id));
      const prefixHead = prefix.length ? prefix.at(-1).entry_checksum : `sha256:${createHash('sha256').update('').digest('hex')}`;
      if (attestationEvent.attested_log_prefix_length !== prefix.length || attestationEvent.attested_log_prefix_head_checksum !== prefixHead) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
      try { const validated = validateDesignOnlyOperationBundle(bundle, { operation: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, current: record, preparation: { preparation_id: coordinate.preparation_id, log_prefix_length: prefix.length, log_prefix_head_checksum: prefixHead }, security: this.designOnlySecurity, clock: () => new Date(operationReceipt.committed_at), historical: true }); this.assertCanonicalAuthorizationSummary(attestationEvent.authorization_reference, validated, record); }
      catch { throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED'); }
      receipt = operationReceipt; bindingEvent = attestationEvent;
    } else if (record.record_schema_version === '1.2.0' && record.task_classification === 'DESIGN_ONLY') {
      const requiredOperations = [DESIGN_ONLY_OPERATIONS.CLASSIFY];
      if (['COMPLETED', 'ARCHIVED'].includes(record.task_status)) requiredOperations.push(DESIGN_ONLY_OPERATIONS.COMPLETE);
      for (const operation of requiredOperations) {
        const operationEvent = events.findLast((row) => row.outcome === 'COMMITTED' && row.operation_type === operation);
        if (!operationEvent) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
        const operationReceipt = await this.readDesignOnlyReceipt(operationEvent.transition_id);
        const bundle = operationEvent.operation_bundle; const coordinate = bundle?.operation_coordinate;
        if (!bundle || !coordinate) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
        const pseudoCurrent = { task_id: record.task_id, project_id: record.project_id, record_revision: coordinate.source_revision, content_checksum: coordinate.source_canonical_checksum, record_schema_version: operationEvent.operation_audit?.source_record_schema_version, task_classification: operationEvent.operation_audit?.source_classification, ...operationEvent.from };
        try {
          const validated = validateDesignOnlyOperationBundle(bundle, {
            operation, current: pseudoCurrent,
            preparation: { preparation_id: coordinate.preparation_id },
            security: this.designOnlySecurity,
            clock: () => new Date(operationReceipt.committed_at),
            historical: true,
          }); this.assertCanonicalAuthorizationSummary(operationEvent.authorization_reference, validated, pseudoCurrent);
        } catch { throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED'); }
        if (operation === DESIGN_ONLY_OPERATIONS.COMPLETE) {
          const exactTarget = { task_status: 'COMPLETED', current_phase: 'CLOSURE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'REVIEW_PENDING' };
          if (!sameCanonical(operationEvent.to, exactTarget)
            || !sameCanonical(operationEvent.operation_audit?.to, exactTarget)
            || operationEvent.operation_audit?.resulting_classification !== 'DESIGN_ONLY'
            || operationEvent.operation_audit?.resulting_record_schema_version !== '1.2.0'
            || operationReceipt.operation !== DESIGN_ONLY_OPERATIONS.COMPLETE
            || !sameCanonical(operationEvent.operation_audit?.skipped_phases?.map((row) => row.phase), ['IMPLEMENTATION_AUTHORIZATION', 'IMPLEMENTATION', 'TESTING', 'IMPLEMENTATION_REVIEW', 'FINAL_JUDGMENT', 'POLICY_REVIEW'])
            || operationEvent.operation_audit.skipped_phases.some((row) => row.entered !== false)) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
          if (record.task_status === 'COMPLETED' && record.task_classification !== 'DESIGN_ONLY') throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
        }
        receipt = operationReceipt;
      }
      if (event && ![DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE].includes(event.operation_type)) {
        if (event.operation_type === 'ARCHIVE') {
          const archiveSource = { task_id: record.task_id, project_id: record.project_id, record_schema_version: event.source_record_schema_version, task_classification: event.source_classification, record_revision: event.expected_revision, ...event.from };
          try { await this.validateDesignOnlyArchiveAuthority({ authorization_reference: event.authorization_reference, archive_authority: event.archive_authority }, archiveSource, { historical: true, at: event.created_at }); }
          catch { throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED'); }
          const exactArchiveTarget = { task_status: 'ARCHIVED', current_phase: 'ARCHIVE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'ARCHIVED' };
          if (!sameCanonical(event.to, exactArchiveTarget) || record.task_status !== 'ARCHIVED' || record.current_phase !== 'ARCHIVE' || record.archive_status !== 'ARCHIVED') throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
        }
        const expectedCoordinates = await this.designOnlyReceiptCoordinates(record);
        if (!sameCanonical(event.design_only_receipt_coordinates, expectedCoordinates)) throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED');
      }
    }
    let binding;
    try {
      const observedAt = this.clock();
      binding = createCanonicalTaskBinding({ source: 'LIFECYCLE_STORE_VERIFIED_READ', observation_id: randomUUID(), project_id: record.project_id, task_id: record.task_id, task_status: record.task_status, task_classification: record.task_classification ?? 'UNKNOWN', record_revision: record.record_revision, canonical_checksum: record.content_checksum, transition_id: bindingEvent?.transition_id ?? record.last_transition_id, event_checksum: bindingEvent?.entry_checksum ?? null, receipt_checksum: receipt?.content_checksum ?? null, canonical_authority: false, observed_at: observedAt.toISOString(), expires_at: new Date(observedAt.getTime() + 60_000).toISOString() }, { private_key: this.designOnlySecurity?.binding_private_key, key_id: this.designOnlySecurity?.binding_key_id, clock: this.clock });
    } catch { throw new LifecycleError('CANONICAL_READ_NOT_VERIFIED'); }
    return Object.freeze({ result: 'CANONICAL_READ_VERIFIED', record: Object.freeze(record), binding: Object.freeze(binding) });
  }
  async inspectDesignOnlyMigrationBoundary() {
    await this.verifyLogIntegrity(); await this.verifyMigrationMappings();
    const record = await this.readRecord();
    const events = (await this.readInternal(this.logPath)).split('\n').filter(Boolean).map((line) => JSON.parse(line));
    for (const event of events.filter((row) => row.event_schema_version === '1.2.0' && row.outcome === 'COMMITTED' && [DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE, DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST].includes(row.operation_type))) await this.readDesignOnlyReceipt(event.transition_id);
    return Object.freeze({ result: 'DESIGN_ONLY_MIGRATION_BOUNDARY_VERIFIED', project_id: record.project_id, task_id: record.task_id, record_revision: record.record_revision, record_checksum: record.content_checksum, record_schema_version: record.record_schema_version, committed_1_2: record.record_schema_version === '1.2.0' || events.some((row) => row.event_schema_version === '1.2.0'), journal_present: await exists(this.journalPath), lease_present: await exists(this.leasePath), legacy_journal_present: await exists(this.legacyAttestationJournalPath) });
  }
  async acquireLease(record, holder) {
    if (await exists(this.leasePath)) {
      const lease = await this.readJsonInternal(this.leasePath);
      if (Date.parse(lease.expires_at) > this.clock().getTime()) throw new LifecycleError('LEASE_INVALID', 'active lease exists');
      await unlink(this.leasePath);
    }
    const lease = { lease_id: randomUUID(), task_id: record.task_id, holder, bound_revision: record.record_revision, lease_generation: record.record_revision + 1, fencing_token: record.record_revision + 1, owner_pid: process.pid, owner_host: this.hostId, owner_instance_id: this.instanceId, acquired_at: this.clock().toISOString(), expires_at: new Date(this.clock().getTime() + 60_000).toISOString(), purpose: 'CANONICAL_STATE_COMMIT', nonce: randomBytes(16).toString('hex') };
    try { const handle = await open(await this.trustedWritable(this.leasePath), 'wx'); await handle.writeFile(canonicalJson(lease)); await handle.sync(); await handle.close(); return lease; }
    catch { throw new LifecycleError('LEASE_INVALID', 'lease acquisition failed'); }
  }
  async transition(request, appliedBy) {
    await this.recover();
    const current = await this.readRecord();
    let validatedOperation = null;
    try { this.validateRequestIdentity(request, current); validateTransition(current, request); validatedOperation = await this.validateRequestAuthorizationAndEvidence(request, current); }
    catch (error) { await this.recordFailure(current, request, appliedBy, error, 'REJECTED'); throw error; }
    const designOnlyArchive = current.record_schema_version === '1.2.0' && current.task_classification === 'DESIGN_ONLY' && request.operation_domain === 'ARCHIVE';
    let archiveAuthority = designOnlyArchive ? await this.validateDesignOnlyArchiveAuthority(request, current) : null;
    let lease;
    try { lease = await this.acquireLease(current, appliedBy); }
    catch (error) { await this.recordFailure(current, request, appliedBy, error, 'REJECTED'); throw error; }
    try {
      if (validatedOperation) {
        const revalidated = await this.validateRequestAuthorizationAndEvidence(request, current);
        if (revalidated.bundle_checksum !== validatedOperation.bundle_checksum) throw new LifecycleError('DESIGN_ONLY_OPERATION_BUNDLE_INVALID');
      }
      if (designOnlyArchive) archiveAuthority = await this.validateDesignOnlyArchiveAuthority(request, current);
      const now = this.clock().toISOString();
      const allowedPatch = {};
      if (request.record_patch) {
        const permitted = request.operation_domain === 'TASK_CLASSIFICATION'
          ? ['task_classification'] : ['blocking_items', 'next_eligible_phases', 'checkpoint_reference'];
        const unknown = Object.keys(request.record_patch).filter((key) => !permitted.includes(key));
        if (unknown.length) throw new LifecycleError('SCHEMA_INVALID', `record_patch fields are not allowed: ${unknown.join(',')}`);
        for (const key of permitted) if (key in request.record_patch) allowedPatch[key] = structuredClone(request.record_patch[key]);
        if ('blocking_items' in allowedPatch && !Array.isArray(allowedPatch.blocking_items)) throw new LifecycleError('SCHEMA_INVALID', 'blocking_items patch must be an array');
        if ('next_eligible_phases' in allowedPatch && !Array.isArray(allowedPatch.next_eligible_phases)) throw new LifecycleError('SCHEMA_INVALID', 'next_eligible_phases patch must be an array');
        if ('checkpoint_reference' in allowedPatch && allowedPatch.checkpoint_reference !== null && typeof allowedPatch.checkpoint_reference !== 'string') throw new LifecycleError('SCHEMA_INVALID', 'checkpoint_reference patch must be string or null');
      }
      if (request.operation_domain === 'TASK_CLASSIFICATION') allowedPatch.record_schema_version = '1.2.0';
      if (request.operation_domain === 'DESIGN_ONLY_CLOSURE') {
        allowedPatch.blocking_items = []; allowedPatch.next_eligible_phases = ['ARCHIVE'];
      }
      const next = { ...current, ...request.to, ...allowedPatch, record_revision: current.record_revision + 1, status_reason: request.reason, requested_by: request.requested_by, authorized_by: request.authorized_by, applied_by: appliedBy, authorization_reference: request.authorization_reference, authoritative_evidence: request.evidence, entered_at: request.operation_domain === 'DESIGN_ONLY_CLOSURE' ? now : current.entered_at, updated_at: now, last_verified_at: now, verification_result: 'PASS', last_transition_id: request.request_id };
      next.content_checksum = checksum(next);
      validateRecord(next);
      const previous = await this.lastEventChecksum();
      const operationAudit = validatedOperation ? createDesignOnlyOperationAudit({ operation: request.operation_domain, current, next, request, validated: validatedOperation.validated, at: now }) : null;
      const event = { event_schema_version: validatedOperation || current.record_schema_version === '1.2.0' || next.record_schema_version === '1.2.0' ? '1.2.0' : '1.1.0', transition_id: request.request_id, task_id: current.task_id, expected_revision: current.record_revision, resulting_revision: next.record_revision, resulting_canonical_checksum: next.content_checksum, from: request.from, to: request.to, outcome: 'COMMITTED', reason_code: request.reason_code, reason: request.reason, requested_by: request.requested_by, authorized_by: request.authorized_by, applied_by: appliedBy, authorization_reference: request.authorization_reference, evidence: request.evidence, lease_id: lease.lease_id, fencing_token: lease.fencing_token, created_at: now, verified_at: now, previous_entry_checksum: previous };
      if (validatedOperation) {
        event.operation_type = request.operation_domain;
        event.operation_bundle = structuredClone(request.operation_bundle);
        event.operation_audit = operationAudit;
        event.operation_audit_checksum = operationAudit.content_checksum;
        event.source_record_schema_version = current.record_schema_version;
        event.resulting_record_schema_version = next.record_schema_version;
        event.source_classification = current.task_classification ?? 'UNKNOWN';
        event.resulting_classification = next.task_classification ?? 'UNKNOWN';
      } else if (event.event_schema_version === '1.2.0') {
        event.operation_type = request.operation_domain ?? 'PHASE1';
        event.source_classification = current.task_classification;
        event.resulting_classification = next.task_classification;
        event.source_record_schema_version = current.record_schema_version;
        event.resulting_record_schema_version = next.record_schema_version;
        if (current.task_classification === 'DESIGN_ONLY') event.design_only_receipt_coordinates = await this.designOnlyReceiptCoordinates(current);
        if (designOnlyArchive) event.archive_authority = structuredClone(archiveAuthority);
      }
      event.entry_checksum = checksum(event);
      const { snapshot_tmp: snapshotTmp, event_tmp: eventTmp } = this.transactionPaths(request.request_id);
      await this.writeDurable(snapshotTmp, canonicalJson(next)); await this.writeDurable(eventTmp, `${canonicalJson(event)}\n`); await this.syncDirectory(this.txDir);
      const journal = {
        transition_id: request.request_id,
        stage: 'PREPARED',
        snapshot_tmp: snapshotTmp,
        event_tmp: eventTmp,
        snapshot_checksum: next.content_checksum,
        event_checksum: event.entry_checksum,
        lease_id: lease.lease_id,
        fencing_token: lease.fencing_token,
        lease_expires_at: lease.expires_at,
        lease_owner_pid: lease.owner_pid,
        lease_owner_host: lease.owner_host,
        lease_owner_instance_id: lease.owner_instance_id,
        event_acknowledgement: {
          transition_id: event.transition_id,
          entry_checksum: event.entry_checksum,
          resulting_revision: event.resulting_revision,
          event_appended: false,
          log_file_synced: false,
          log_directory_synced: false,
          event_verified: false,
        },
      };
      await this.writeDurable(this.journalPath, canonicalJson(journal)); await this.syncDirectory(this.dir);
      if (this.beforeCommit) await this.beforeCommit(this.leasePath, this.journalPath);
      if (validatedOperation) {
        const finalValidation = await this.validateRequestAuthorizationAndEvidence(request, current);
        if (finalValidation.bundle_checksum !== validatedOperation.bundle_checksum) throw new LifecycleError('DESIGN_ONLY_OPERATION_BUNDLE_INVALID');
        await this.consumePreparation(finalValidation.preparation, request);
      }
      if (designOnlyArchive) {
        const finalArchiveAuthority = await this.validateDesignOnlyArchiveAuthority(request, current);
        if (!sameCanonical(finalArchiveAuthority, archiveAuthority)) throw new LifecycleError('DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED');
      }
      await this.verifyCommitEligibility(lease, current, request); if (this.crashAt === 'PREPARED') { await this.expireLeaseForSimulation(); throw new Error('SIMULATED_CRASH'); }
      await rename(await this.trustedExisting(snapshotTmp), await this.trustedWritable(this.recordPath)); await this.syncDirectory(this.dir); journal.stage = 'APPLIED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      if (this.crashAt === 'APPLIED') { await this.expireLeaseForSimulation(); throw new Error('SIMULATED_CRASH'); }
      await this.appendEventWithDurableAcknowledgement(event, eventTmp, journal);
      if (this.crashAt === 'ACKNOWLEDGED') { await this.expireLeaseForSimulation(); throw new Error('SIMULATED_CRASH'); }
      const verifyRecord = await this.readRecord();
      const verifiedEvent = await this.readCommittedEvent(event.transition_id);
      if (verifyRecord.content_checksum !== next.content_checksum
        || !verifiedEvent
        || verifiedEvent.entry_checksum !== event.entry_checksum
        || verifiedEvent.resulting_revision !== next.record_revision) {
        journal.stage = 'RECOVERY_REQUIRED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
        throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'verification failed');
      }
      try { await this.assertCompleteEventAcknowledgement(journal, verifyRecord, verifiedEvent); }
      catch (error) {
        journal.stage = 'RECOVERY_REQUIRED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
        throw error;
      }
      if (validatedOperation) await this.persistDesignOnlyReceipt(verifiedEvent, verifyRecord, journal, operationAudit, now);
      journal.stage = 'VERIFIED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      if (this.crashAt === 'VERIFIED') { await this.expireLeaseForSimulation(); throw new Error('SIMULATED_CRASH'); }
      journal.stage = 'COMMITTED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      if (this.crashAt === 'COMMITTED') { await this.expireLeaseForSimulation(); throw new Error('SIMULATED_CRASH'); }
      await rm(this.journalPath); await unlink(this.leasePath); await rm(eventTmp, { force: true }); await this.syncDirectory(this.dir); return next;
    } catch (error) {
      if (error.message === 'SIMULATED_CRASH') throw error;
      const failure = error.code === 'DURABILITY_SYNC_FAILED' ? error : error;
      await this.abortFailedTransition(current, request, appliedBy, failure);
      throw failure;
    }
  }
  validateRequestIdentity(request, current) {
    if (!request || typeof request !== 'object') throw new LifecycleError('SCHEMA_INVALID', 'TransitionRequest is required');
    if (typeof request.request_id !== 'string' || !CANONICAL_UUID.test(request.request_id) || typeof request.task_id !== 'string' || !request.task_id.trim() || request.task_id !== current.task_id || path.basename(this.dir) !== current.task_id) throw new LifecycleError('SCHEMA_INVALID', 'TransitionRequest identity is invalid');
    if (!Number.isInteger(request.expected_revision) || request.expected_revision < 1 || !request.from || typeof request.from !== 'object' || !request.to || typeof request.to !== 'object' || typeof request.reason_code !== 'string' || !request.reason_code.trim() || typeof request.reason !== 'string' || !request.reason.trim()) throw new LifecycleError('SCHEMA_INVALID', 'TransitionRequest required fields are invalid');
    validateActor(request.requested_by); validateActor(request.authorized_by);
  }
  async validateRequestAuthorizationAndEvidence(request, current = null) {
    validateEvidence(request.evidence); validateAuthorization(request.authorization_reference);
    const reference = request.authorization_reference;
    if (current?.record_schema_version === '1.2.0' && current.task_classification === 'DESIGN_ONLY' && request.operation_domain === 'ARCHIVE') {
      await this.validateDesignOnlyArchiveAuthority(request, current);
    }
    const requiresImplementation = request.to.current_phase === 'IMPLEMENTATION';
    if (requiresImplementation) {
      if (request.to.gate_status !== 'PASS' || request.to.authorization_status !== 'AUTHORIZED' || reference.authority_type === 'RULE' || reference.decision !== 'AUTHORIZED' || reference.expires_at === null || Date.parse(reference.expires_at) <= this.clock().getTime() || reference.scope.task_id !== request.task_id || !reference.scope.phases.includes('IMPLEMENTATION') || !reference.scope.operations.includes('CANONICAL_STATE_COMMIT')) throw new LifecycleError('AUTHORIZATION_MISSING', 'implementation authorization is invalid');
    }
    const evidenceRows = [];
    for (const item of request.evidence) {
      const resolved = await resolveExistingInside(this.projectRoot, item.path).catch(() => { throw new LifecycleError('EVIDENCE_INVALID', 'evidence path is not trusted'); });
      const info = await stat(resolved); if (!info.isFile()) throw new LifecycleError('EVIDENCE_INVALID', 'evidence path is not a regular file');
      const body = await readFile(resolved);
      const actual = `sha256:${createHash('sha256').update(body).digest('hex')}`;
      if (actual !== item.checksum) throw new LifecycleError('EVIDENCE_INVALID', 'evidence checksum mismatch');
      evidenceRows.push({ source_id: item.source_id ?? null, path: item.path.replaceAll('\\', '/'), checksum: item.checksum, body });
    }
    if (Object.values(DESIGN_ONLY_OPERATIONS).includes(request.operation_domain)) {
      const authorityFile = await resolveExistingInside(this.projectRoot, reference.authority_path).catch(() => { throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization authority path is not trusted'); });
      const authorityInfo = await stat(authorityFile); if (!authorityInfo.isFile()) throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization authority is not a regular file');
      const authorityChecksum = `sha256:${createHash('sha256').update(await readFile(authorityFile)).digest('hex')}`;
      if (authorityChecksum !== reference.authority_checksum) throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization authority checksum mismatch');
      if (!current || !request.operation_bundle) throw new LifecycleError('DESIGN_ONLY_OPERATION_BUNDLE_INVALID');
      const preparation = await this.readPreparation(request.request_id);
      let validated;
      try { validated = validateDesignOnlyOperationBundle(request.operation_bundle, { operation: request.operation_domain, current, preparation, security: this.designOnlySecurity, clock: this.clock }); }
      catch (error) { throw new LifecycleError(error.code ?? 'DESIGN_ONLY_OPERATION_BUNDLE_INVALID', error.message); }
      this.assertCanonicalAuthorizationSummary(reference, validated, current);
      const expected = validated.manifest.required_sources.map((source) => ({ source_id: source.source_id, path: source.path.replaceAll('\\', '/'), checksum: source.content_checksum })).sort((a, b) => a.source_id.localeCompare(b.source_id));
      const supplied = evidenceRows.map((row) => ({ source_id: row.source_id, path: row.path, checksum: row.checksum })).sort((a, b) => String(a.source_id).localeCompare(String(b.source_id)));
      if (!sameCanonical(expected, supplied)) throw new LifecycleError('CONTEXT_EVIDENCE_BINDING_INVALID');
      if (request.operation_domain === DESIGN_ONLY_OPERATIONS.COMPLETE) {
        const criticRows = evidenceRows.filter((row) => row.source_id?.startsWith('critic-round-'));
        if (criticRows.length !== 3) throw new LifecycleError('CRITIC_EVIDENCE_INVALID');
        const rounds = new Set();
        for (const row of criticRows) {
          let artifact; try { artifact = validateDesignOnlyCriticEvidence(JSON.parse(row.body.toString('utf8'))); }
          catch { throw new LifecycleError('CRITIC_EVIDENCE_INVALID'); }
          if (artifact.result !== 'PASS' || artifact.unresolved_critical !== 0 || artifact.unresolved_high !== 0) throw new LifecycleError('CRITIC_EVIDENCE_INVALID');
          rounds.add(artifact.round);
        }
        if (!sameCanonical([...rounds].sort(), [1, 2, 3])) throw new LifecycleError('CRITIC_EVIDENCE_INVALID');
        const judgeRow = evidenceRows.find((row) => row.source_id === 'judge-decision');
        let judge; try { judge = validateDesignOnlyJudgeEvidence(JSON.parse(judgeRow?.body.toString('utf8') ?? '')); }
        catch { throw new LifecycleError('JUDGE_EVIDENCE_INVALID'); }
        if (judge.decision !== 'PASS_DESIGN_READY_FOR_CLOSURE') throw new LifecycleError('JUDGE_EVIDENCE_INVALID');
      }
      return { validated, preparation, bundle_checksum: request.operation_bundle.content_checksum };
    }
    return null;
  }
  async validateDesignOnlyArchiveAuthority(request, current, { historical = false, at = null } = {}) {
    const retained = request.archive_authority;
    const envelope = historical ? retained?.owner_authorization : request.owner_authorization;
    const state = historical
      ? typeof this.designOnlySecurity?.get_historical_authority_state === 'function' ? this.designOnlySecurity.get_historical_authority_state({ authority_epoch: envelope?.authority_epoch, authority_ledger_coordinate: retained?.authority_ledger_coordinate, history_proof: retained?.history_proof }) : null
      : typeof this.designOnlySecurity?.get_authority_state === 'function' ? this.designOnlySecurity.get_authority_state() : this.designOnlySecurity;
    const now = at === null ? this.clock().getTime() : Date.parse(at);
    const reference = request.authorization_reference;
    const envelopeFields = ['authorization_envelope_version', 'approval_id', 'authorized', 'task_id', 'project_id', 'phase', 'role', 'operation', 'authority_epoch', 'revocation_proof_checksum', 'authority_path', 'authority_checksum', 'effective_at', 'expires_at', 'key_id', 'signature_algorithm', 'signed_at', 'signature', 'payload_checksum'];
    try {
      if (!exactKeys(envelope, envelopeFields) || !state?.owner_public_key || !Number.isSafeInteger(state.current_authority_epoch) || !SHA256.test(state.revocation_proof_checksum ?? '') || !Number.isFinite(now) || (historical && state.history_proof_verified !== true)) throw new Error();
      verifyAuthorizationEnvelope(envelope, { public_key: state.owner_public_key, expected_key_id: state.owner_key_id, required_binding: { task_id: current.task_id, project_id: current.project_id, phase: 'ARCHIVE', role: 'Owner', operation: 'ARCHIVE', authority_epoch: state.current_authority_epoch, revocation_proof_checksum: state.revocation_proof_checksum }, now });
    } catch { throw new LifecycleError('DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED'); }
    if (reference?.authority_type !== 'OWNER' || reference.decision !== 'ARCHIVE' || reference.authorization_id !== envelope.approval_id || reference.authority_path !== envelope.authority_path || reference.authority_checksum !== envelope.authority_checksum || reference.effective_at !== envelope.effective_at || reference.expires_at !== envelope.expires_at || reference.authority_envelope_payload_checksum !== envelope.payload_checksum || reference.authority_envelope_key_id !== envelope.key_id || !sameCanonical(reference.scope, { task_id: current.task_id, phases: ['ARCHIVE'], operations: ['ARCHIVE', 'CANONICAL_STATE_COMMIT'] })) throw new LifecycleError('DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED');
    const authorityFile = await resolveExistingInside(this.projectRoot, reference.authority_path).catch(() => { throw new LifecycleError('DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED'); });
    if (!(await stat(authorityFile)).isFile() || `sha256:${createHash('sha256').update(await readFile(authorityFile)).digest('hex')}` !== reference.authority_checksum) throw new LifecycleError('DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED');
    const archiveAuthority = historical ? retained : { archive_authority_schema_version: '1.0.0', owner_authorization: structuredClone(envelope), authority_ledger_coordinate: structuredClone(state.authority_ledger_coordinate), history_proof: structuredClone(state.history_proof) };
    if (!historical) archiveAuthority.content_checksum = checksum(archiveAuthority);
    const ledgerValid = exactKeys(archiveAuthority?.authority_ledger_coordinate, ['source_id', 'revision', 'content_checksum', 'observed_at']);
    const historyValid = exactKeys(archiveAuthority?.history_proof, ['proof_schema_version', 'epoch_source_coordinate', 'revocation_source_coordinate', 'inclusion_checksum']) && exactKeys(archiveAuthority?.history_proof?.epoch_source_coordinate, ['source_id', 'revision', 'content_checksum']) && exactKeys(archiveAuthority?.history_proof?.revocation_source_coordinate, ['source_id', 'revision', 'content_checksum', 'observed_at']);
    if (!archiveAuthority || Object.keys(archiveAuthority).sort().join('|') !== ['archive_authority_schema_version', 'authority_ledger_coordinate', 'content_checksum', 'history_proof', 'owner_authorization'].sort().join('|') || archiveAuthority.archive_authority_schema_version !== '1.0.0' || archiveAuthority.content_checksum !== checksum(archiveAuthority) || !exactKeys(archiveAuthority.owner_authorization, envelopeFields) || !ledgerValid || !historyValid || !sameCanonical(archiveAuthority.owner_authorization, envelope) || !sameCanonical(archiveAuthority.authority_ledger_coordinate, state.authority_ledger_coordinate) || !sameCanonical(archiveAuthority.history_proof, state.history_proof)) throw new LifecycleError('DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED');
    return Object.freeze(archiveAuthority);
  }
  async recordFailure(current, request, appliedBy, error, outcome) {
    const now = this.clock().toISOString();
    const special = [DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE, DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST].includes(request?.operation_domain)
      || current.record_schema_version === '1.2.0';
    const safeAxes = (axes) => exactKeys(axes, Object.keys(ENUMS)) && Object.entries(axes).every(([field, value]) => ENUMS[field].includes(value)) ? structuredClone(axes) : null;
    const fallbackActor = { actor_id: 'lifecycle', actor_type: 'SYSTEM_COMPONENT', role_id: null, session_id: null, run_id: null };
    const safeActor = (actor, fallback = fallbackActor) => {
      try {
        if (!exactKeys(actor, ['actor_id', 'actor_type', 'role_id', 'session_id', 'run_id'])) throw new Error();
        validateActor(actor);
        return structuredClone(actor);
      } catch { return structuredClone(fallback); }
    };
    const safeAppliedBy = safeActor(appliedBy);
    const safeRequest = {
      request_id: CANONICAL_UUID.test(request?.request_id ?? '') ? request.request_id : null,
      task_id: typeof request?.task_id === 'string' ? request.task_id : null,
      expected_revision: Number.isSafeInteger(request?.expected_revision) ? request.expected_revision : null,
      operation_domain: typeof request?.operation_domain === 'string' ? request.operation_domain : null,
      from: safeAxes(request?.from),
      to: safeAxes(request?.to),
      reason_code: typeof request?.reason_code === 'string' ? request.reason_code : null,
    };
    const auditId = randomUUID();
    const event = { event_schema_version: special ? '1.2.0' : '1.1.0', transition_id: auditId, task_id: current.task_id, expected_revision: safeRequest.expected_revision, resulting_revision: null, from: safeRequest.from, to: safeRequest.to, outcome, reason_code: safeRequest.reason_code ?? 'REQUEST_REJECTED', reason: 'Lifecycle request rejected before commit.', failure_code: error.code ?? 'VERIFY_FAILED', failure_reason: String(error.message ?? error.code ?? 'verification failed').slice(0, 512), requested_by: safeActor(request?.requested_by, safeAppliedBy), authorized_by: safeActor(request?.authorized_by, safeAppliedBy), applied_by: safeAppliedBy, authorization_reference: null, evidence: [], lease_id: null, fencing_token: null, created_at: now, verified_at: null };
    if (special) {
      event.operation_type = EVENT_12_OPERATION_TYPES.has(safeRequest.operation_domain) ? safeRequest.operation_domain : 'PHASE1';
      event.audit_id = auditId;
      event.original_request_id = safeRequest.request_id;
      event.sanitized_request_digest = checksum(safeRequest);
      event.source_record_schema_version = current.record_schema_version;
      event.resulting_record_schema_version = null;
      event.source_classification = current.task_classification ?? 'UNKNOWN';
      event.resulting_classification = null;
    }
    await this.appendSerializedAuditEvent(event);
  }

  async appendSerializedAuditEvent(event, { lock_held = false } = {}) {
    if (event.event_schema_version === '1.2.0') validateEvent12Contract(event);
    const appendLock = lock_held ? null : await this.acquireAuditAppendLock();
    try {
      await this.verifyLogIntegrity();
      event.previous_entry_checksum = await this.lastEventChecksum();
      event.entry_checksum = checksum(event);
      if (event.event_schema_version === '1.2.0') validateEvent12Contract(event);
      await this.appendEventLine(event);
      await this.verifyLogIntegrity();
      const committed = await this.readCommittedEvent(event.transition_id);
      if (!committed || committed.entry_checksum !== event.entry_checksum) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'audit append verification failed');
      return committed;
    } finally {
      if (!lock_held) await this.releaseAuditAppendLock(appendLock.lock_token);
    }
  }
  isLocalProcessAlive(pid) {
    if (!Number.isSafeInteger(pid) || pid < 1) return false;
    try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
  }
  async acquireAuditAppendLock() {
    if (await exists(this.auditAppendLockPath)) {
      let prior; try { prior = await this.readJsonInternal(this.auditAppendLockPath); } catch { throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'audit append lock is invalid'); }
      const structurallyValid = prior?.lock_schema_version === '1.0.0' && CANONICAL_UUID.test(prior.lock_token ?? '') && Number.isSafeInteger(prior.pid) && typeof prior.host === 'string' && CANONICAL_UUID.test(prior.owner_instance_id ?? '') && Number.isSafeInteger(prior.fencing_token) && prior.fencing_token > 0;
      if (!structurallyValid || prior.host !== this.hostId || this.isLocalProcessAlive(prior.pid)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'audit append is busy');
      await rm(await this.trustedExisting(this.auditAppendLockPath)); await this.syncDirectory(this.dir);
    }
    const now = this.clock(); const lock = { lock_schema_version: '1.0.0', lock_token: randomUUID(), pid: process.pid, host: this.hostId, owner_instance_id: this.instanceId, fencing_token: now.getTime(), acquired_at: now.toISOString(), expires_at: new Date(now.getTime() + 60_000).toISOString() };
    let handle;
    try {
      handle = await open(await this.trustedWritable(this.auditAppendLockPath), 'wx');
      await handle.writeFile(canonicalJson(lock)); await handle.sync(); await handle.close(); handle = null;
      await this.syncDirectory(this.dir);
      return lock;
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      throw new LifecycleError('COMMIT_STATE_UNKNOWN', error.code === 'EEXIST' ? 'audit append is busy' : 'audit append lock failed');
    }
  }
  async releaseAuditAppendLock(lockToken) {
    const lock = await this.readJsonInternal(this.auditAppendLockPath);
    if (lock.lock_token !== lockToken) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'audit append lock ownership changed');
    await rm(await this.trustedExisting(this.auditAppendLockPath));
    await this.syncDirectory(this.dir);
  }
  async appendEventLine(event) {
    const handle = await open(await this.trustedWritable(this.logPath), 'a');
    try { await handle.writeFile(`${canonicalJson(event)}\n`); await handle.sync(); }
    finally { await handle.close(); }
    await this.syncDirectory(this.dir);
  }
  async abortFailedTransition(current, request, appliedBy, error) {
    const journal = await exists(this.journalPath) ? await this.readJsonInternal(this.journalPath) : null;
    const snapshotApplied = journal && await exists(this.recordPath)
      && (await this.readRecord()).content_checksum === journal.snapshot_checksum;
    if (journal) {
      journal.stage = snapshotApplied ? 'RECOVERY_REQUIRED' : 'ABORTED';
      journal.failure_code = error.code ?? 'VERIFY_FAILED';
      journal.failure_reason = error.message;
      await this.writeDurable(this.journalPath, canonicalJson(journal));
    }
    // After the Snapshot is canonical, an Event append may have reached the log
    // even when its durability acknowledgement failed. Preserve all transaction
    // evidence and make no further log writes; a failure Event could otherwise
    // obscure the authoritative tail or create a duplicate transition.
    if (snapshotApplied) {
      // The writer is no longer executing this transaction. Expire its lease
      // explicitly so recovery can inspect the preserved evidence without
      // treating the still-alive process as an active concurrent writer.
      await this.expireLeaseForSimulation();
      return;
    }
    await this.recordFailure(current, request, appliedBy, error, 'VERIFICATION_FAILED');
    if (journal && !snapshotApplied) {
      await this.cleanupTransactionFiles(journal);
    }
    await rm(this.leasePath, { force: true });
    await this.syncDirectory(this.dir);
  }
  async verifyCommitEligibility(lease, record, request) {
    const persisted = await this.readJsonInternal(this.leasePath);
    const journal = await this.readJsonInternal(this.journalPath);
    const log = await this.readInternal(this.logPath);
    if (journal.transition_id !== request.request_id || journal.stage !== 'PREPARED' || journal.lease_id !== lease.lease_id || journal.fencing_token !== lease.fencing_token || journal.lease_owner_pid !== lease.owner_pid || journal.lease_owner_host !== lease.owner_host || journal.lease_owner_instance_id !== lease.owner_instance_id || journal.superseded_by || ['SUPERSEDED', 'ABORTED', 'RECOVERED', 'COMMITTED'].includes(journal.stage)) throw new LifecycleError('TRANSACTION_SUPERSEDED', 'transaction is not commit eligible');
    if (log.split('\n').filter(Boolean).some((line) => JSON.parse(line).transition_id === request.request_id && JSON.parse(line).outcome === 'COMMITTED')) throw new LifecycleError('TRANSACTION_ALREADY_FINALIZED', 'transaction already committed');
    if (persisted.lease_id !== lease.lease_id || canonicalJson(persisted.holder) !== canonicalJson(lease.holder) || persisted.bound_revision !== record.record_revision || persisted.lease_generation !== lease.lease_generation || persisted.fencing_token !== lease.fencing_token || Date.parse(persisted.expires_at) <= this.clock().getTime() || request.expected_revision !== record.record_revision || (await this.readRecord()).record_revision !== record.record_revision) throw new LifecycleError('STALE_FENCING_TOKEN', 'persisted lease no longer valid');
  }
  async expireLeaseForSimulation() {
    if (!(await exists(this.leasePath))) return;
    const lease = await this.readJsonInternal(this.leasePath); lease.expires_at = this.clock().toISOString();
    await this.writeDurable(this.leasePath, canonicalJson(lease)); await this.syncDirectory(this.dir);
    if (await exists(this.journalPath)) { const journal = await this.readJsonInternal(this.journalPath); journal.lease_expires_at = lease.expires_at; await this.writeDurable(this.journalPath, canonicalJson(journal)); await this.syncDirectory(this.dir); }
  }
  async persistJournalAcknowledgement(journal) {
    await this.writeDurable(this.journalPath, canonicalJson(journal));
    await this.syncDirectory(this.dir);
  }
  async appendEventWithDurableAcknowledgement(event, eventTmp, journal) {
    if (event.event_schema_version === '1.2.0') validateEvent12Contract(event);
    const appendLock = await this.acquireAuditAppendLock();
    try {
      await this.verifyLogIntegrity({ allow_record_ahead: true });
      const existing = await this.readCommittedEvent(event.transition_id);
      if (existing) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'existing transition event has no durable acknowledgement');
      event.previous_entry_checksum = await this.lastEventChecksum();
      event.entry_checksum = checksum(event);
      journal.event_checksum = event.entry_checksum;
      journal.event_acknowledgement.entry_checksum = event.entry_checksum;
      await this.writeDurable(eventTmp, `${canonicalJson(event)}\n`);
      await this.persistJournalAcknowledgement(journal);
      const handle = await open(await this.trustedWritable(this.logPath), 'a');
      try { await handle.writeFile(await this.readInternal(eventTmp)); }
      finally { await handle.close(); }
      journal.event_acknowledgement.event_appended = true;
      await this.persistJournalAcknowledgement(journal);
      try { await this.durability.syncFile(this.logPath); }
      catch (error) { throw new LifecycleError('DURABILITY_SYNC_FAILED', `event file sync failed: ${error.code ?? error.message}`); }
      journal.event_acknowledgement.log_file_synced = true;
      await this.persistJournalAcknowledgement(journal);
      await this.syncDirectory(this.dir);
      journal.event_acknowledgement.log_directory_synced = true;
      await this.persistJournalAcknowledgement(journal);
      await this.verifyLogIntegrity();
      const appended = await this.readCommittedEvent(event.transition_id);
      if (!appended || appended.entry_checksum !== event.entry_checksum || appended.resulting_revision !== event.resulting_revision) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'durable event verification failed');
      journal.event_acknowledgement.event_verified = true;
      await this.persistJournalAcknowledgement(journal);
    } finally {
      await this.releaseAuditAppendLock(appendLock.lock_token);
    }
  }
  async assertCompleteEventAcknowledgement(journal, record, event) {
    const ack = journal.event_acknowledgement;
    if (!isPlainObject(journal)
      || typeof journal.transition_id !== 'string'
      || !journal.transition_id.trim()
      || typeof journal.event_checksum !== 'string'
      || !SHA256.test(journal.event_checksum)
      || typeof journal.snapshot_checksum !== 'string'
      || !SHA256.test(journal.snapshot_checksum)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'journal transaction identity is invalid');
    if (!isPlainObject(ack) || Object.keys(ack).length !== EVENT_ACKNOWLEDGEMENT_FIELDS.length
      || EVENT_ACKNOWLEDGEMENT_FIELDS.some((field) => !(field in ack))) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement schema is invalid');
    if (typeof ack.transition_id !== 'string' || !ack.transition_id.trim()
      || typeof ack.entry_checksum !== 'string' || !SHA256.test(ack.entry_checksum)
      || !Number.isInteger(ack.resulting_revision) || ack.resulting_revision < 1) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement identity is invalid');
    for (const field of ['event_appended', 'log_file_synced', 'log_directory_synced', 'event_verified']) {
      if (typeof ack[field] !== 'boolean') throw new LifecycleError('COMMIT_STATE_UNKNOWN', `event acknowledgement ${field} must be boolean`);
    }
    if ((ack.event_appended === false && (ack.log_file_synced === true || ack.log_directory_synced === true || ack.event_verified === true))
      || (ack.log_file_synced === false && (ack.log_directory_synced === true || ack.event_verified === true))
      || (ack.log_directory_synced === false && ack.event_verified === true)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement order is impossible');
    if (ack.event_appended !== true || ack.log_file_synced !== true || ack.log_directory_synced !== true || ack.event_verified !== true) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement is incomplete');
    if (ack.transition_id !== journal.transition_id
      || ack.entry_checksum !== journal.event_checksum
      || ack.resulting_revision !== record.record_revision
      || !event
      || event.outcome !== 'COMMITTED'
      || event.transition_id !== journal.transition_id
      || event.entry_checksum !== journal.event_checksum
      || event.resulting_revision !== record.record_revision) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'durable event acknowledgement is mismatched');
  }
  async requireRecovery(journal, message) {
    journal.stage = 'RECOVERY_REQUIRED';
    await this.writeDurable(this.journalPath, canonicalJson(journal));
    throw new LifecycleError('COMMIT_STATE_UNKNOWN', message);
  }
  async readCommittedEvent(transitionId) {
    const events = (await this.readInternal(this.logPath)).split('\n').filter(Boolean).map((line) => JSON.parse(line));
    const matches = events.filter((event) => event.transition_id === transitionId);
    if (matches.length > 1) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'duplicate transition_id in log');
    return matches[0] ?? null;
  }
  async lastEventChecksum() {
    const log = await this.readInternal(this.logPath); const lines = log.trim().split('\n').filter(Boolean);
    return lines.length ? JSON.parse(lines.at(-1)).entry_checksum : 'sha256:GENESIS';
  }
  async recover() {
    await this.verifyLogIntegrity();
    await this.verifyMigrationMappings();
    await this.recoverLegacyAttestation();
    if (!(await exists(this.journalPath))) return;
    const journal = await this.readJsonInternal(this.journalPath);
    this.validateJournalPaths(journal);
    await this.assertRecoverableJournalLease(journal);
    if (journal.stage === 'PREPARED') {
      await this.cleanupTransactionFiles(journal);
      await this.recordRecovery(journal, 'ABORTED');
      await rm(this.journalPath); await rm(this.leasePath, { force: true }); await this.syncDirectory(this.dir); return;
    }
    if (journal.stage === 'ABORTED') {
      await this.cleanupTransactionFiles(journal);
      await rm(this.journalPath); await rm(this.leasePath, { force: true }); await this.syncDirectory(this.dir); return;
    }
    if (journal.stage === 'APPLIED') {
      const record = await this.readRecord();
      if (record.content_checksum !== journal.snapshot_checksum || record.last_transition_id !== journal.transition_id) {
        await this.requireRecovery(journal, 'journal snapshot mismatch in APPLIED');
      }
      let event;
      try { event = JSON.parse(await this.readInternal(journal.event_tmp)); }
      catch { await this.requireRecovery(journal, 'journal pending event is unreadable in APPLIED'); }
      if (!isPlainObject(event)
        || event.transition_id !== journal.transition_id
        || event.entry_checksum !== journal.event_checksum
        || event.resulting_revision !== record.record_revision) {
        await this.requireRecovery(journal, 'journal event mismatch in APPLIED');
      }
      const committedEvent = await this.readCommittedEvent(journal.transition_id);
      try { await this.assertCompleteEventAcknowledgement(journal, record, committedEvent); }
      catch (error) { await this.requireRecovery(journal, error.message); }
      if ([DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE].includes(committedEvent?.operation_type)) {
        const receiptFile = this.receiptPath(committedEvent.transition_id);
        if (!(await exists(receiptFile))) {
          try { await this.persistDesignOnlyReceipt(committedEvent, record, journal, committedEvent.operation_audit, committedEvent.created_at); }
          catch (error) { await this.requireRecovery(journal, error.message); }
        }
      }
      journal.stage = 'VERIFIED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      // fall through to VERIFIED
    }
    if (journal.stage === 'VERIFIED' || journal.stage === 'COMMITTED') {
      const record = await this.readRecord();
      const committedEvent = await this.readCommittedEvent(journal.transition_id);
      try { await this.assertCompleteEventAcknowledgement(journal, record, committedEvent); }
      catch (error) { await this.requireRecovery(journal, error.message); }
      if ([DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE].includes(committedEvent?.operation_type)) {
        try {
          const receipt = await this.readJsonInternal(this.receiptPath(committedEvent.transition_id));
          verifyDesignOnlyCommitReceipt(receipt, { event: committedEvent, record });
        } catch { await this.requireRecovery(journal, 'design-only receipt missing or invalid after VERIFIED'); }
      }
      if (journal.stage === 'VERIFIED') {
        journal.stage = 'COMMITTED';
        await this.writeDurable(this.journalPath, canonicalJson(journal));
      }
      await this.cleanupTransactionFiles(journal); await rm(this.journalPath); await rm(this.leasePath, { force: true }); await this.syncDirectory(this.dir); return;
    }
    throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'manual recovery required');
  }
  async assertRecoverableJournalLease(journal) {
    const fieldsValid = CANONICAL_UUID.test(journal?.lease_id ?? '') && Number.isSafeInteger(journal?.fencing_token) && Number.isSafeInteger(journal?.lease_owner_pid) && typeof journal?.lease_owner_host === 'string' && CANONICAL_UUID.test(journal?.lease_owner_instance_id ?? '') && Number.isFinite(Date.parse(journal?.lease_expires_at));
    if (!fieldsValid) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'transaction journal lease coordinates are invalid');
    let lease = null; if (await exists(this.leasePath)) lease = await this.readJsonInternal(this.leasePath);
    if (lease && (lease.lease_id !== journal.lease_id || lease.fencing_token !== journal.fencing_token || lease.owner_pid !== journal.lease_owner_pid || lease.owner_host !== journal.lease_owner_host || lease.owner_instance_id !== journal.lease_owner_instance_id || lease.expires_at !== journal.lease_expires_at)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'transaction journal and lease disagree');
    const unexpired = Date.parse(journal.lease_expires_at) > this.clock().getTime();
    const ownerMayBeAlive = journal.lease_owner_host !== this.hostId || this.isLocalProcessAlive(journal.lease_owner_pid);
    if (unexpired && ownerMayBeAlive) throw new LifecycleError('TRANSACTION_IN_PROGRESS', 'live transaction lease cannot be recovered');
    return true;
  }
  async recoverLegacyAttestation() {
    if (!(await exists(this.legacyAttestationJournalPath))) return;
    const journal = await this.readJsonInternal(this.legacyAttestationJournalPath);
    if (journal?.journal_schema_version !== '1.0.0' || journal.kind !== 'LEGACY_COMPLETION_ATTEST' || !CANONICAL_UUID.test(journal.transition_id ?? '') || !['PREPARED', 'EVENT_APPENDED'].includes(journal.stage)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'legacy attestation journal is invalid');
    let appendLock = null;
    if (await exists(this.auditAppendLockPath)) {
      appendLock = await this.readJsonInternal(this.auditAppendLockPath);
      if (appendLock.lock_token !== journal.append_lock_token || appendLock.fencing_token !== journal.append_lock_fencing_token) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'legacy journal append lock mismatch');
      const unexpired = Date.parse(appendLock.expires_at) > this.clock().getTime(); const ownerMayBeAlive = appendLock.host !== this.hostId || this.isLocalProcessAlive(appendLock.pid);
      if (unexpired && ownerMayBeAlive) throw new LifecycleError('TRANSACTION_IN_PROGRESS', 'live legacy attestation cannot be recovered');
    }
    const event = await this.readCommittedEvent(journal.transition_id);
    if (!event) {
      if (journal.stage !== 'PREPARED') throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'legacy attestation event is missing');
      await rm(this.legacyAttestationJournalPath); if (appendLock) await this.releaseAuditAppendLock(appendLock.lock_token); await this.syncDirectory(this.dir); return;
    }
    const record = await this.readRecord();
    if (record.record_revision !== journal.record_revision || record.content_checksum !== journal.record_checksum || event.operation_type !== DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST || event.record_mutation !== false) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'legacy attestation recovery coordinates mismatch');
    await this.persistLegacyAttestationReceipt(event, record);
    await rm(this.legacyAttestationJournalPath); if (appendLock) await this.releaseAuditAppendLock(appendLock.lock_token); await this.syncDirectory(this.dir);
  }
  async recordRecovery(journal, outcome) {
    const current = await this.readRecord(); const now = this.clock().toISOString();
    const system = { actor_id: 'lifecycle-manager-recovery', actor_type: 'SYSTEM_COMPONENT', role_id: null, session_id: null, run_id: null };
    const event = { event_schema_version: current.record_schema_version === '1.2.0' ? '1.2.0' : '1.1.0', transition_id: randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, resulting_revision: null, from: Object.fromEntries(Object.keys(ENUMS).map((key) => [key, current[key]])), to: Object.fromEntries(Object.keys(ENUMS).map((key) => [key, current[key]])), outcome: 'RECOVERED', reason_code: outcome, reason: 'Prepared transaction aborted during safe recovery.', requested_by: system, authorized_by: system, applied_by: system, authorization_reference: current.authorization_reference, evidence: current.authoritative_evidence, lease_id: null, fencing_token: null, created_at: now, verified_at: now };
    if (event.event_schema_version === '1.2.0') {
      event.operation_type = 'LIFECYCLE_RECOVERY';
      event.original_transition_id = journal.transition_id;
      event.recovery_metadata = { recovery_actor: system.actor_id, recovered_stage: journal.stage, result: outcome };
      event.source_record_schema_version = current.record_schema_version;
      event.resulting_record_schema_version = current.record_schema_version;
      event.source_classification = current.task_classification;
      event.resulting_classification = current.task_classification;
      if (current.task_classification === 'DESIGN_ONLY') event.design_only_receipt_coordinates = await this.designOnlyReceiptCoordinates(current);
    }
    await this.appendSerializedAuditEvent(event);
  }
  async verifyLogIntegrity({ allow_record_ahead = false } = {}) {
    if (!(await exists(this.logPath))) return;
    const log = await this.readInternal(this.logPath);
    const lines = log.split('\n').filter(Boolean);
    let previousChecksum = 'sha256:GENESIS';
    const seenTransitionIds = new Set();
    const seenRevisions = new Set();
    let maxRevision = 0;
    let lastMutatingRevision = null;
    for (const line of lines) {
      let event;
      try { event = JSON.parse(line); } catch { throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'malformed JSON in log'); }
      if (!['1.1.0', '1.2.0'].includes(event.event_schema_version)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'unknown schema version in log');
      if (event.event_schema_version === '1.2.0') {
        validateEvent12Contract(event);
        if (Object.keys(event).some((field) => !EVENT_12_FIELDS.has(field)) || !CANONICAL_UUID.test(event.transition_id ?? '') || !EVENT_12_OPERATION_TYPES.has(event.operation_type) || !/^TASK-\d{3,}$/.test(event.task_id ?? '')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 event identity');
        for (const actor of ['requested_by', 'authorized_by', 'applied_by']) validateActor(event[actor]);
        assertTime(event.created_at, 'event.created_at'); if (event.verified_at !== null) assertTime(event.verified_at, 'event.verified_at');
        const forbidden = (...fields) => fields.some((field) => field in event);
        if (['REJECTED', 'VERIFICATION_FAILED'].includes(event.outcome)) {
          if (!CANONICAL_UUID.test(event.audit_id ?? '') || event.audit_id !== event.transition_id || !SHA256.test(event.sanitized_request_digest ?? '') || typeof event.failure_code !== 'string' || typeof event.failure_reason !== 'string' || forbidden('operation_bundle', 'operation_audit', 'operation_audit_checksum', 'original_transition_id', 'recovery_metadata', 'resulting_canonical_checksum')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 rejection branch');
        } else if (event.outcome === 'RECOVERED') {
          if (!CANONICAL_UUID.test(event.original_transition_id ?? '') || !isPlainObject(event.recovery_metadata) || Object.keys(event.recovery_metadata).sort().join('|') !== ['recovered_stage', 'recovery_actor', 'result'].sort().join('|') || forbidden('operation_bundle', 'operation_audit', 'operation_audit_checksum', 'failure_code', 'failure_reason', 'audit_id', 'sanitized_request_digest', 'resulting_canonical_checksum')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 recovery branch');
        } else if (event.outcome === 'COMMITTED') {
          if (!SHA256.test(event.resulting_canonical_checksum ?? '') || forbidden('failure_code', 'failure_reason', 'audit_id', 'sanitized_request_digest', 'original_transition_id', 'recovery_metadata')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 committed branch');
          if (!isPlainObject(event.from) || !isPlainObject(event.to) || Object.keys(ENUMS).some((field) => !(field in event.from) || !(field in event.to)) || Object.keys(event.from).some((field) => !(field in ENUMS)) || Object.keys(event.to).some((field) => !(field in ENUMS))) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 state axes');
          const governedOperation = [DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE, DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST].includes(event.operation_type);
          if (governedOperation) {
            if (!event.operation_bundle || !event.operation_audit || event.operation_audit_checksum !== event.operation_audit.content_checksum || event.operation_audit.content_checksum !== designOnlyChecksum(event.operation_audit) || event.operation_audit.transition_id !== event.transition_id) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 governed operation branch');
          } else if (forbidden('operation_bundle', 'operation_audit', 'operation_audit_checksum', 'attested_log_prefix_length', 'attested_log_prefix_head_checksum')) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'unexpected governed fields on ordinary 1.2 event');
          if (!governedOperation && event.source_classification === 'DESIGN_ONLY') {
            if (!event.design_only_receipt_coordinates?.classification) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'design-only provenance missing');
            if (event.from?.task_status === 'COMPLETED' && !event.design_only_receipt_coordinates?.completion) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'design-only completion provenance missing');
          }
        } else throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'invalid 1.2 outcome');
      }
      if (event.previous_entry_checksum !== previousChecksum) throw new LifecycleError('CHECKSUM_MISMATCH', 'broken previous_entry_checksum chain');
      if (event.entry_checksum !== checksum(event)) throw new LifecycleError('CHECKSUM_MISMATCH', 'invalid entry_checksum in log');
      if (seenTransitionIds.has(event.transition_id)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'duplicate transition_id in log');
      seenTransitionIds.add(event.transition_id);
      if (event.outcome === 'COMMITTED') {
        if (!Number.isInteger(event.resulting_revision)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'illegal outcome/revision combination');
        if (event.record_mutation !== false) {
          if (!Number.isInteger(event.expected_revision) || event.resulting_revision !== event.expected_revision + 1
            || (lastMutatingRevision !== null && event.expected_revision !== lastMutatingRevision)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'non-contiguous committed revision');
          if (seenRevisions.has(event.resulting_revision)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'duplicate resulting_revision in log');
          seenRevisions.add(event.resulting_revision);
          lastMutatingRevision = event.resulting_revision;
        } else if (event.resulting_revision !== event.expected_revision) {
          throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'non-mutating event changed revision');
        }
        maxRevision = Math.max(maxRevision, event.resulting_revision);
      } else {
        if (event.resulting_revision !== null) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'illegal outcome/revision combination');
      }
      previousChecksum = event.entry_checksum;
    }
    if (await exists(this.recordPath)) {
      const record = await this.readRecord();
      if (maxRevision > 0 && record.record_revision !== maxRevision
        && !(allow_record_ahead && record.record_revision === maxRevision + 1)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'snapshot/log revision disagreement');
    }
  }
  async verifyMigrationMappings() {
    const mappingPath = path.join(this.dir, 'migration-mapping.jsonl');
    if (!(await exists(mappingPath))) return;
    const lines = (await this.readInternal(mappingPath)).split('\n').filter(Boolean);
    const seenIds = new Set();
    const seenEvidence = new Set();
    for (const line of lines) {
      let mapping;
      try { mapping = JSON.parse(line); } catch { throw new LifecycleError('NOT_CONFIRMED', 'malformed JSON in migration mapping'); }
      const required = ['mapping_id', 'source_task_id', 'legacy_expression', 'mapped_state', 'confidence', 'source_evidence', 'mapped_by', 'created_at', 'checksum'];
      if (required.some(field => !(field in mapping))) throw new LifecycleError('NOT_CONFIRMED', 'missing required fields in migration mapping');
      if (mapping.checksum !== checksum(mapping)) throw new LifecycleError('NOT_CONFIRMED', 'invalid checksum in migration mapping');
      if (seenIds.has(mapping.mapping_id)) throw new LifecycleError('NOT_CONFIRMED', 'duplicate mapping_id');
      seenIds.add(mapping.mapping_id);
      if (!Array.isArray(mapping.source_evidence) || mapping.source_evidence.length === 0) throw new LifecycleError('NOT_CONFIRMED', 'empty source_evidence in migration mapping');
      const evidenceKey = mapping.source_evidence.map(e => `${e.path}:${e.checksum}`).sort().join('|');
      if (seenEvidence.has(evidenceKey)) throw new LifecycleError('NOT_CONFIRMED', 'duplicate source-evidence/checksum mapping');
      seenEvidence.add(evidenceKey);
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(mapping.confidence)) throw new LifecycleError('NOT_CONFIRMED', 'invalid confidence in migration mapping');
      if (mapping.confidence === 'LOW') throw new LifecycleError('NOT_CONFIRMED', 'LOW confidence migration mapping is not confirmed');
      for (const axis of Object.keys(ENUMS)) {
        if (!(axis in mapping.mapped_state) || !ENUMS[axis].includes(mapping.mapped_state[axis])) throw new LifecycleError('NOT_CONFIRMED', 'invalid mapped_state in migration mapping');
      }
      for (const item of mapping.source_evidence) {
        assertProjectPath(item.path);
        if (!item.path.replaceAll('\\', '/').split('/').includes(mapping.source_task_id)) throw new LifecycleError('NOT_CONFIRMED', 'source_task_id does not match evidence path');
        try {
          const resolved = await resolveExistingInside(this.projectRoot, item.path);
          if (!(await stat(resolved)).isFile()) throw new LifecycleError('NOT_CONFIRMED', 'migration evidence is not a regular file');
          const body = await readFile(resolved);
          const actual = `sha256:${createHash('sha256').update(body).digest('hex')}`;
          if (actual !== item.checksum) throw new LifecycleError('NOT_CONFIRMED', 'evidence checksum mismatch in migration mapping');
        } catch {
          throw new LifecycleError('NOT_CONFIRMED', 'missing evidence in migration mapping');
        }
      }
    }
  }
}
const exists = async (file) => stat(file).then(() => true).catch(() => false);
export * from './design-only-closure.mjs';
