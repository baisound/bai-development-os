import { validateContextCostRecord } from '../context-control/context-cost-observatory.mjs';
import { createKnowledgeCandidateFromHandoff } from '../knowledge/candidate.mjs';
import { checksumObject, deepFreeze, requireArray, requireString } from './util.mjs';
import { createSessionCheckpoint, sessionCheckpointChecksum } from './session-rotation.mjs';

const SHA = /^sha256:[a-f0-9]{64}$/;
const OVERFETCH_SEVERITIES = new Set(['MAJOR', 'CRITICAL']);
const EVIDENCE_STATUSES = new Set(['COMPLETE', 'PARTIAL', 'INVALID']);
const TEST_STATUSES = new Set(['PASS', 'FAIL', 'UNKNOWN']);
const PROVIDER_STATUSES = new Set(['AVAILABLE', 'UNAVAILABLE', 'NOT_REQUIRED']);

export class AutonomyHardeningError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'AutonomyHardeningError';
    this.code = code;
  }
}

const text = (value, name) => requireString(value, name, AutonomyHardeningError, 'AUTONOMY_HARDENING_INPUT_INVALID');
const strings = (value, name) => requireArray(value, name, AutonomyHardeningError, 'AUTONOMY_HARDENING_INPUT_INVALID')
  .map((item) => text(item, name));
const date = (value, name) => {
  const normalized = text(value, name);
  if (Number.isNaN(Date.parse(normalized))) throw new AutonomyHardeningError('AUTONOMY_HARDENING_INPUT_INVALID', `${name} invalid`);
  return new Date(normalized).toISOString();
};
const bool = (value, name) => {
  if (typeof value !== 'boolean') throw new AutonomyHardeningError('AUTONOMY_HARDENING_INPUT_INVALID', `${name} invalid`);
  return value;
};
const validText = (value) => typeof value === 'string' && value.trim().length > 0;
const unique = (values) => [...new Set(values)].sort();

export function createContextFailureEvidence({ project_id, context_record: record } = {}) {
  validateContextCostRecord(record);
  const finding = record.findings.find((item) => item.code === 'CONTEXT_OVERFETCH');
  if (!finding) {
    return deepFreeze({
      result: 'NO_CONTEXT_FAILURE',
      project_id: text(project_id, 'project_id'),
      task_id: record.task_id,
      record_checksum: record.content_checksum,
    });
  }
  const evidence = {
    autonomy_failure_evidence_version: '1.0.0',
    evidence_type: 'CONTEXT_OVERFETCH',
    project_id: text(project_id, 'project_id'),
    task_id: record.task_id,
    session_id: record.session_id,
    phase: record.phase,
    severity: finding.severity,
    repeated_occurrences: finding.repeated_occurrences,
    avoidable_ratio: finding.avoidable_ratio,
    avoidable_tokens: record.metrics.avoidable_tokens,
    duplicate_tokens: record.metrics.duplicate_tokens,
    stale_tokens: record.metrics.stale_tokens,
    quality_gate_status: record.quality_gate.status,
    context_record_id: record.record_id,
    context_record_checksum: record.content_checksum,
    canonical: false,
    policy_change_authorized: false,
  };
  evidence.content_checksum = checksumObject(evidence);
  return deepFreeze(evidence);
}

export function proposeContextFailureKnowledge({ failure_evidence: evidence, clock = () => new Date() } = {}) {
  if (!evidence || evidence.autonomy_failure_evidence_version !== '1.0.0'
    || evidence.evidence_type !== 'CONTEXT_OVERFETCH'
    || !SHA.test(evidence.content_checksum ?? '')
    || checksumObject(evidence) !== evidence.content_checksum
    || !validText(evidence.project_id) || !validText(evidence.task_id)
    || !validText(evidence.session_id) || !validText(evidence.phase)
    || !validText(evidence.context_record_id)
    || !SHA.test(evidence.context_record_checksum ?? '')
    || !['INFO', 'WARNING', 'MAJOR', 'CRITICAL'].includes(evidence.severity)
    || !Number.isSafeInteger(evidence.repeated_occurrences) || evidence.repeated_occurrences < 0
    || typeof evidence.avoidable_ratio !== 'number' || evidence.avoidable_ratio < 0 || evidence.avoidable_ratio > 1
    || !Number.isSafeInteger(evidence.avoidable_tokens) || evidence.avoidable_tokens < 0
    || !Number.isSafeInteger(evidence.duplicate_tokens) || evidence.duplicate_tokens < 0
    || !Number.isSafeInteger(evidence.stale_tokens) || evidence.stale_tokens < 0
    || !['PASS', 'FAIL', 'UNKNOWN'].includes(evidence.quality_gate_status)
    || evidence.canonical !== false || evidence.policy_change_authorized !== false) {
    throw new AutonomyHardeningError('AUTONOMY_FAILURE_EVIDENCE_INVALID');
  }
  if (!OVERFETCH_SEVERITIES.has(evidence.severity) || evidence.repeated_occurrences < 2) {
    return deepFreeze({
      result: 'KNOWLEDGE_CANDIDATE_NOT_YET_ELIGIBLE',
      reason: 'RECURRENCE_OR_SEVERITY_FLOOR_NOT_MET',
      evidence_checksum: evidence.content_checksum,
    });
  }
  const suffix = evidence.content_checksum.slice(-16);
  const evidenceRef = `context-cost:${evidence.context_record_id}:${evidence.context_record_checksum}`;
  const candidate = createKnowledgeCandidateFromHandoff({
    candidate_id: `CONTEXT-OVERFETCH-${suffix}`,
    title: `Repeated CONTEXT_OVERFETCH in ${evidence.task_id}`,
    project_id: evidence.project_id,
    source_task: evidence.task_id,
    knowledge_type: 'FAILURE_CASE',
    summary: `Repeated ${evidence.severity} context overfetch was observed in ${evidence.phase}.`,
    guidance: ['Use summary-first and symbol/range-targeted loading before full-document retrieval.'],
    required_actions: ['Review source selection and update the bounded Context Loading Plan.'],
    prohibited_actions: ['Do not weaken Quality, Security or Authority gates to reduce context usage.'],
    verification_steps: ['Re-run the same bounded work with equivalent quality gates and compare verified context metrics.'],
    evidence_refs: [evidenceRef],
    source_trust: 'VERIFIED_INTERNAL',
    confidence: evidence.severity === 'CRITICAL' ? 0.8 : 0.7,
    tags: ['TASK-018', 'CONTEXT_OVERFETCH', 'AUTONOMY_HARDENING'],
    applicability: { phases: [evidence.phase], project_tags: [evidence.project_id] },
    failure: {
      fingerprint: `CONTEXT_OVERFETCH:${evidence.project_id}:${evidence.task_id}:${evidence.phase}`,
      failure_mode: 'Repeated avoidable context loading',
      environment_scope: ['BAI Development OS autonomous development'],
      safe_action: 'Generate a narrower Context Loading Plan and validate equivalent Quality Gate results.',
      prohibited_inference: ['Context reduction implies quality equivalence', 'Estimated tokens equal billed tokens'],
      evidence_refs: [evidenceRef],
      recurrence_key: `CONTEXT_OVERFETCH:${evidence.project_id}:${evidence.task_id}`,
    },
    created_by: 'TASK-018 Autonomy Hardening Bridge',
  }, { clock });
  return deepFreeze({
    result: 'KNOWLEDGE_CANDIDATE_PROPOSED',
    candidate,
    activation_authorized: false,
    policy_change_authorized: false,
  });
}

export function autonomySessionLeaseChecksum(lease) { return checksumObject(lease); }

export function createAutonomySessionLease(input = {}) {
  const acquiredAt = date(input.acquired_at, 'acquired_at');
  const expiresAt = date(input.expires_at, 'expires_at');
  const heartbeatAt = date(input.heartbeat_at, 'heartbeat_at');
  if (Date.parse(expiresAt) <= Date.parse(acquiredAt)
    || Date.parse(heartbeatAt) < Date.parse(acquiredAt)
    || Date.parse(heartbeatAt) > Date.parse(expiresAt)) {
    throw new AutonomyHardeningError('AUTONOMY_LEASE_INVALID');
  }
  const lease = {
    lease_schema_version: '1.0.0',
    lease_id: text(input.lease_id, 'lease_id'),
    project_id: text(input.project_id, 'project_id'),
    session_id: text(input.session_id, 'session_id'),
    branch: text(input.branch, 'branch'),
    task_id: text(input.task_id, 'task_id'),
    acquired_at: acquiredAt,
    expires_at: expiresAt,
    heartbeat_at: heartbeatAt,
  };
  lease.content_checksum = autonomySessionLeaseChecksum(lease);
  return deepFreeze(lease);
}

export function verifyAutonomySessionLease(lease) {
  let rebuilt;
  try { rebuilt = createAutonomySessionLease(lease); } catch { throw new AutonomyHardeningError('AUTONOMY_LEASE_INVALID'); }
  if (!SHA.test(lease?.content_checksum ?? '') || lease.content_checksum !== rebuilt.content_checksum) {
    throw new AutonomyHardeningError('AUTONOMY_LEASE_TAMPERED');
  }
  return deepFreeze({ result: 'AUTONOMY_LEASE_VALID', content_checksum: lease.content_checksum });
}

export function assessAutonomySessionLease({ lease, current_session_id, now } = {}) {
  verifyAutonomySessionLease(lease);
  const observedAt = date(now, 'now');
  const expired = Date.parse(lease.expires_at) <= Date.parse(observedAt);
  if (expired) return deepFreeze({ result: 'STALE_LEASE_REVIEW_REQUIRED', automatic_takeover_allowed: false, lease_id: lease.lease_id });
  if (lease.session_id !== text(current_session_id, 'current_session_id')) {
    return deepFreeze({ result: 'AUTOMATION_LEASE_CONFLICT', automatic_takeover_allowed: false, lease_id: lease.lease_id });
  }
  return deepFreeze({ result: 'AUTONOMY_LEASE_OWNED_ACTIVE', automatic_takeover_allowed: false, lease_id: lease.lease_id });
}

export function assessAutonomyRecovery(input = {}) {
  const reasons = [];
  const actions = [];
  let checkpointValid = false;
  try {
    const rebuilt = createSessionCheckpoint(input.checkpoint);
    checkpointValid = rebuilt.content_checksum === input.checkpoint?.content_checksum
      && sessionCheckpointChecksum(input.checkpoint) === input.checkpoint.content_checksum;
  } catch { checkpointValid = false; }
  if (!checkpointValid) { reasons.push('SESSION_CHECKPOINT_FAILED'); actions.push('REBUILD_CHECKPOINT_FROM_VERIFIED_STATE'); }
  if (checkpointValid && input.current_head !== input.checkpoint.head) { reasons.push('SESSION_RESUME_STATE_CHANGED'); actions.push('RECONCILE_HEAD_AND_CHECKPOINT'); }
  if (bool(input.merge_conflict, 'merge_conflict')) { reasons.push('MERGE_CONFLICT'); actions.push('RESOLVE_MERGE_CONFLICT'); }
  const dirtyPaths = unique(strings(input.dirty_paths ?? [], 'dirty_path'));
  const ownedPaths = new Set(strings(input.owned_dirty_paths ?? [], 'owned_dirty_path'));
  if (checkpointValid && new Set(input.checkpoint.dirty_paths).size !== input.checkpoint.dirty_paths.length) {
    reasons.push('DUPLICATE_CHECKPOINT_DIRTY_PATH'); actions.push('REBUILD_CHECKPOINT_FROM_VERIFIED_STATE');
  }
  if (dirtyPaths.some((path) => !ownedPaths.has(path))) { reasons.push('UNKNOWN_DIRTY_CHANGES'); actions.push('IDENTIFY_DIRTY_CHANGE_OWNERSHIP'); }
  if (checkpointValid && (input.checkpoint.checkpoint_status !== 'SUCCESS'
    || unique(input.checkpoint.dirty_paths).join('\n') !== dirtyPaths.join('\n'))) {
    reasons.push('PARTIAL_OR_CHANGED_CHECKPOINT'); actions.push('REVALIDATE_ATOMIC_UNIT');
  }
  const evidenceStatus = text(input.evidence_status, 'evidence_status');
  const testStatus = text(input.test_status, 'test_status');
  const providerStatus = text(input.provider_status, 'provider_status');
  const usageLimitReached = bool(input.usage_limit_reached, 'usage_limit_reached');
  const missedSchedule = bool(input.missed_schedule, 'missed_schedule');
  if (!EVIDENCE_STATUSES.has(evidenceStatus) || !TEST_STATUSES.has(testStatus)
    || !PROVIDER_STATUSES.has(providerStatus)) throw new AutonomyHardeningError('AUTONOMY_HARDENING_INPUT_INVALID');
  if (evidenceStatus !== 'COMPLETE') { reasons.push(`EVIDENCE_${evidenceStatus}`); actions.push('COMPLETE_AND_VERIFY_EVIDENCE'); }
  if (testStatus === 'UNKNOWN') { reasons.push('TEST_STATUS_UNKNOWN'); actions.push('RUN_FOCUSED_TESTS'); }
  if (testStatus === 'FAIL') { reasons.push('TEST_FAILURE'); actions.push('REPAIR_AND_RERUN_TESTS'); }

  let result = 'RECOVERY_GATE_REQUIRED';
  let safeToResume = false;
  if (reasons.length === 0) { result = 'RECOVERY_RESUME_READY'; safeToResume = true; }
  else if (reasons.length === 1 && reasons[0] === 'TEST_FAILURE') result = 'TEST_FAILURE_REPAIR';
  if (safeToResume && providerStatus === 'UNAVAILABLE') { result = 'PROVIDER_UNAVAILABLE_SUSPENDED'; safeToResume = false; reasons.push('PROVIDER_UNAVAILABLE'); actions.push('WAIT_FOR_PROVIDER_RECOVERY'); }
  if (safeToResume && usageLimitReached) { result = 'USAGE_LIMIT_SUSPENDED'; safeToResume = false; reasons.push('USAGE_LIMIT_REACHED'); actions.push('WAIT_FOR_USAGE_BUDGET'); }
  if (safeToResume && missedSchedule) { result = 'MISSED_SCHEDULE_REPLAN'; safeToResume = false; reasons.push('AUTOMATION_MISSED_SCHEDULE'); actions.push('REPLAN_WITHOUT_DUPLICATE_DISPATCH'); }
  const assessment = {
    recovery_assessment_version: '1.0.0',
    result,
    safe_to_resume: safeToResume,
    automatic_mutation_allowed: false,
    reasons: unique(reasons),
    required_actions: unique(actions),
  };
  assessment.content_checksum = checksumObject(assessment);
  return deepFreeze(assessment);
}
