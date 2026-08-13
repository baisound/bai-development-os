import { createHash } from 'node:crypto';

const SHA = /^sha256:[a-f0-9]{64}$/;
const GATE = new Set(['PASS', 'FAIL', 'WAITING', 'PARKED_HUMAN_GATE', 'NOT_PROVEN']);
const PLAN_KEYS = Object.freeze([
  'closure_checklist', 'changelog_draft', 'release_plan_draft', 'rollback_plan', 'evidence_index',
]);

export class Task018I0ReadinessError extends Error {
  constructor(code, message = code) { super(message); this.name = 'Task018I0ReadinessError'; this.code = code; }
}
const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const checksum = (value) => {
  const copy = structuredClone(value); delete copy.content_checksum;
  return `sha256:${createHash('sha256').update(JSON.stringify(sort(copy))).digest('hex')}`;
};
const freeze = (value) => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const text = (value, name) => { if (typeof value !== 'string' || !value.trim()) throw new Task018I0ReadinessError('TASK018_I0_INPUT_INVALID', `${name} required`); return value.trim(); };
const bool = (value, name) => { if (typeof value !== 'boolean') throw new Task018I0ReadinessError('TASK018_I0_INPUT_INVALID', `${name} invalid`); return value; };
const count = (value, name) => { if (!Number.isSafeInteger(value) || value < 0) throw new Task018I0ReadinessError('TASK018_I0_INPUT_INVALID', `${name} invalid`); return value; };
const gate = (value, name) => { const normalized = text(value, name); if (!GATE.has(normalized)) throw new Task018I0ReadinessError('TASK018_I0_INPUT_INVALID', `${name} invalid`); return normalized; };

export function assessTask018I0ClosureReadiness(input = {}) {
  if (input.task_id !== 'TASK-018') throw new Task018I0ReadinessError('TASK018_I0_TASK_MISMATCH');
  const planning = Object.fromEntries(PLAN_KEYS.map((key) => [key, bool(input.planning_artifacts?.[key], key)]));
  const evidence = {
    phase_g: gate(input.evidence?.phase_g, 'phase_g'),
    phase_h2: gate(input.evidence?.phase_h2, 'phase_h2'),
    consumer_regression: gate(input.evidence?.consumer_regression, 'consumer_regression'),
    conversation_free_restart: gate(input.evidence?.conversation_free_restart, 'conversation_free_restart'),
    context_cost_report: gate(input.evidence?.context_cost_report, 'context_cost_report'),
    full_os_regression: gate(input.evidence?.full_os_regression, 'full_os_regression'),
  };
  const evidenceIndexChecksum = text(input.evidence_index_checksum, 'evidence_index_checksum');
  if (!SHA.test(evidenceIndexChecksum)) throw new Task018I0ReadinessError('TASK018_I0_INPUT_INVALID');
  const unresolvedCritical = count(input.unresolved_critical, 'unresolved_critical');
  const unresolvedHigh = count(input.unresolved_high, 'unresolved_high');
  const worktreeClean = bool(input.worktree_clean, 'worktree_clean');
  const exactReleaseDecisionVerified = bool(input.exact_release_decision_verified, 'exact_release_decision_verified');
  const completionRecordCreated = bool(input.completion_record_created, 'completion_record_created');
  const tagCreated = bool(input.tag_created, 'tag_created');
  const releaseCreated = bool(input.release_created, 'release_created');
  if (completionRecordCreated || tagCreated || releaseCreated) {
    throw new Task018I0ReadinessError('TASK018_I0_EXTERNAL_EFFECT_CLAIM_FORBIDDEN');
  }

  const i0Blockers = PLAN_KEYS.filter((key) => !planning[key]).map((key) => `PLANNING_ARTIFACT_MISSING:${key}`);
  const finalizationBlockers = [];
  for (const [key, status] of Object.entries(evidence)) if (status !== 'PASS') finalizationBlockers.push(`EVIDENCE_NOT_PASS:${key}:${status}`);
  if (unresolvedCritical > 0 || unresolvedHigh > 0) finalizationBlockers.push('UNRESOLVED_CRITICAL_OR_HIGH');
  if (!worktreeClean) finalizationBlockers.push('WORKTREE_NOT_CLEAN');
  if (!exactReleaseDecisionVerified) finalizationBlockers.push('EXACT_RELEASE_DECISION_NOT_VERIFIED');
  if (i0Blockers.length) finalizationBlockers.push('I0_NOT_PREPARED');

  const i0Prepared = i0Blockers.length === 0;
  const finalizationEligible = finalizationBlockers.length === 0;
  const result = {
    task018_i0_readiness_version: '1.0.0',
    task_id: 'TASK-018',
    i0_result: i0Prepared ? 'I0_PREPARED' : 'I0_BLOCKED',
    i0_blockers: i0Blockers,
    finalization_result: finalizationEligible ? 'I1_RELEASE_FINALIZATION_ELIGIBLE' : 'I1_RELEASE_FINALIZATION_BLOCKED',
    finalization_blockers: finalizationBlockers,
    planning_artifacts: planning,
    evidence,
    evidence_index_checksum: evidenceIndexChecksum,
    unresolved_critical: unresolvedCritical,
    unresolved_high: unresolvedHigh,
    worktree_clean: worktreeClean,
    exact_release_decision_verified: exactReleaseDecisionVerified,
    completion_record_created: false,
    tag_created: false,
    release_created: false,
    external_effect_performed: false,
  };
  result.content_checksum = checksum(result);
  return freeze(result);
}

export function verifyTask018I0ClosureReadiness(result) {
  if (!result || result.task018_i0_readiness_version !== '1.0.0' || result.task_id !== 'TASK-018'
    || !SHA.test(result.content_checksum ?? '') || checksum(result) !== result.content_checksum
    || result.completion_record_created !== false || result.tag_created !== false
    || result.release_created !== false || result.external_effect_performed !== false) {
    throw new Task018I0ReadinessError('TASK018_I0_RESULT_INVALID');
  }
  const expectedI0Blockers = PLAN_KEYS
    .filter((key) => result.planning_artifacts?.[key] !== true)
    .map((key) => `PLANNING_ARTIFACT_MISSING:${key}`);
  const expectedFinalizationBlockers = [];
  const evidenceKeys = [
    'phase_g', 'phase_h2', 'consumer_regression', 'conversation_free_restart',
    'context_cost_report', 'full_os_regression',
  ];
  for (const key of evidenceKeys) {
    const status = result.evidence?.[key];
    if (!GATE.has(status)) throw new Task018I0ReadinessError('TASK018_I0_RESULT_INVALID');
    if (status !== 'PASS') expectedFinalizationBlockers.push(`EVIDENCE_NOT_PASS:${key}:${status}`);
  }
  if (!Number.isSafeInteger(result.unresolved_critical) || result.unresolved_critical < 0
    || !Number.isSafeInteger(result.unresolved_high) || result.unresolved_high < 0
    || typeof result.worktree_clean !== 'boolean'
    || typeof result.exact_release_decision_verified !== 'boolean'
    || !SHA.test(result.evidence_index_checksum ?? '')) {
    throw new Task018I0ReadinessError('TASK018_I0_RESULT_INVALID');
  }
  if (result.unresolved_critical > 0 || result.unresolved_high > 0) expectedFinalizationBlockers.push('UNRESOLVED_CRITICAL_OR_HIGH');
  if (!result.worktree_clean) expectedFinalizationBlockers.push('WORKTREE_NOT_CLEAN');
  if (!result.exact_release_decision_verified) expectedFinalizationBlockers.push('EXACT_RELEASE_DECISION_NOT_VERIFIED');
  if (expectedI0Blockers.length) expectedFinalizationBlockers.push('I0_NOT_PREPARED');
  if (JSON.stringify(result.i0_blockers) !== JSON.stringify(expectedI0Blockers)
    || JSON.stringify(result.finalization_blockers) !== JSON.stringify(expectedFinalizationBlockers)
    || result.i0_result !== (expectedI0Blockers.length ? 'I0_BLOCKED' : 'I0_PREPARED')
    || result.finalization_result !== (expectedFinalizationBlockers.length
      ? 'I1_RELEASE_FINALIZATION_BLOCKED' : 'I1_RELEASE_FINALIZATION_ELIGIBLE')) {
    throw new Task018I0ReadinessError('TASK018_I0_RESULT_INVALID');
  }
  return freeze({ result: 'TASK018_I0_READINESS_VALID', content_checksum: result.content_checksum });
}
