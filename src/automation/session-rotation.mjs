import { createHash } from 'node:crypto';
import { deepFreeze } from './util.mjs';

const SHA = /^sha256:[a-f0-9]{64}$/;
const HEAD = /^[a-f0-9]{7,64}$/;
export class SessionRotationError extends Error {
  constructor(code, message = code) { super(message); this.name = 'SessionRotationError'; this.code = code; }
}
const sort = (v) => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;
const digest = (v, field) => { const x = structuredClone(v); delete x[field]; return `sha256:${createHash('sha256').update(JSON.stringify(sort(x))).digest('hex')}`; };
const str = (v, n) => { if (typeof v !== 'string' || !v.trim()) throw new SessionRotationError('SESSION_STATE_INVALID', `${n} required`); return v; };
const int = (v, n) => { if (!Number.isSafeInteger(v) || v < 0) throw new SessionRotationError('SESSION_STATE_INVALID', `${n} invalid`); return v; };
const bool = (v, n) => { if (typeof v !== 'boolean') throw new SessionRotationError('SESSION_STATE_INVALID', `${n} invalid`); return v; };
const sha = (v, n) => { if (typeof v !== 'string' || !SHA.test(v)) throw new SessionRotationError('SESSION_STATE_INVALID', `${n} invalid`); return v; };

export const DEFAULT_SESSION_ROTATION_POLICY = deepFreeze({
  max_elapsed_minutes: 180,
  max_completed_units: 3,
  max_commits: 5,
  max_estimated_context_tokens: 64000,
  handoff_max_estimated_tokens: 2000,
});

const policy = (value = {}) => {
  const p = { ...DEFAULT_SESSION_ROTATION_POLICY, ...value };
  for (const key of Object.keys(DEFAULT_SESSION_ROTATION_POLICY)) int(p[key], key);
  if (Object.values(p).some((v) => v < 1)) throw new SessionRotationError('SESSION_ROTATION_POLICY_INVALID');
  return deepFreeze(p);
};

export function evaluateSessionRotation(metrics, options = {}) {
  const p = policy(options.policy);
  const observed = {
    elapsed_minutes: int(metrics?.elapsed_minutes, 'elapsed_minutes'),
    completed_units: int(metrics?.completed_units, 'completed_units'),
    commit_count: int(metrics?.commit_count, 'commit_count'),
    estimated_context_tokens: int(metrics?.estimated_context_tokens, 'estimated_context_tokens'),
    provider_limit_reached: bool(metrics?.provider_limit_reached, 'provider_limit_reached'),
    unsafe_atomic_unit_active: bool(metrics?.unsafe_atomic_unit_active, 'unsafe_atomic_unit_active'),
  };
  const reasons = [
    observed.elapsed_minutes >= p.max_elapsed_minutes && 'ELAPSED_TIME',
    observed.completed_units >= p.max_completed_units && 'COMPLETED_UNITS',
    observed.commit_count >= p.max_commits && 'COMMIT_COUNT',
    observed.estimated_context_tokens >= p.max_estimated_context_tokens && 'CONTEXT_BUDGET',
    observed.provider_limit_reached && 'PROVIDER_LIMIT',
  ].filter(Boolean);
  return deepFreeze({
    result: reasons.length === 0 ? 'SESSION_CONTINUE' : observed.unsafe_atomic_unit_active ? 'ROTATION_DEFERRED_ATOMIC_UNIT' : 'SESSION_ROTATION_REQUIRED',
    reasons,
    policy: p,
    observed,
  });
}

export function sessionCheckpointChecksum(value) { return digest(value, 'content_checksum'); }
export function createSessionCheckpoint(input) {
  const head = str(input?.head, 'head'); if (!HEAD.test(head)) throw new SessionRotationError('SESSION_CHECKPOINT_FAILED');
  const testStatus = str(input.test_status, 'test_status');
  if (!['PASS', 'FAIL', 'UNKNOWN'].includes(testStatus)) throw new SessionRotationError('SESSION_STATE_INVALID');
  const critical = int(input.unresolved_critical, 'unresolved_critical');
  const high = int(input.unresolved_high, 'unresolved_high');
  const success = testStatus === 'PASS' && critical === 0 && high === 0;
  if (input.claimed_success === true && !success) throw new SessionRotationError('SESSION_CHECKPOINT_FAILED');
  const dirty = bool(input.dirty, 'dirty');
  const dirtyPaths = (input.dirty_paths ?? []).map((v) => str(v, 'dirty_path'));
  if (!dirty && dirtyPaths.length > 0) throw new SessionRotationError('SESSION_STATE_INVALID', 'clean checkpoint has dirty paths');
  const createdAt = str(input.created_at, 'created_at');
  if (Number.isNaN(Date.parse(createdAt))) throw new SessionRotationError('SESSION_STATE_INVALID');
  const checkpoint = {
    checkpoint_schema_version: '1.0.0', checkpoint_id: str(input.checkpoint_id, 'checkpoint_id'),
    session_id: str(input.session_id, 'session_id'), task_id: str(input.task_id, 'task_id'), head,
    branch: str(input.branch, 'branch'), dirty, dirty_paths: dirtyPaths,
    test_status: testStatus, unresolved_critical: critical, unresolved_high: high,
    checkpoint_status: success ? 'SUCCESS' : 'INCOMPLETE',
    last_completed_unit: str(input.last_completed_unit, 'last_completed_unit'),
    created_at: new Date(createdAt).toISOString(),
  };
  checkpoint.content_checksum = sessionCheckpointChecksum(checkpoint); return deepFreeze(checkpoint);
}

export function compressedHandoffChecksum(value) { return digest(value, 'content_checksum'); }
export function createCompressedHandoff(input, options = {}) {
  const p = policy(options.policy); const c = input?.checkpoint;
  if (!c || c.content_checksum !== sessionCheckpointChecksum(c)) throw new SessionRotationError('SESSION_CHECKPOINT_FAILED');
  const refs = (input.source_references ?? []).map((r) => ({ path_or_ref: str(r.path_or_ref, 'path_or_ref'), sha256: sha(r.sha256, 'sha256'), estimated_tokens: int(r.estimated_tokens, 'estimated_tokens') }));
  if (new Set(refs.map((r) => r.path_or_ref)).size !== refs.length) throw new SessionRotationError('SESSION_STATE_INVALID', 'duplicate source reference');
  const estimated = int(input.summary_estimated_tokens, 'summary_estimated_tokens') + refs.reduce((n, r) => n + r.estimated_tokens, 0);
  if (estimated > p.handoff_max_estimated_tokens) throw new SessionRotationError('SESSION_HANDOFF_TOO_LARGE');
  const handoff = {
    handoff_schema_version: '1.0.0', handoff_id: str(input.handoff_id, 'handoff_id'),
    project_id: str(input.project_id, 'project_id'), task_id: c.task_id, branch: c.branch, head: c.head,
    dirty: c.dirty, dirty_paths: [...c.dirty_paths], checkpoint_id: c.checkpoint_id,
    checkpoint_checksum: c.content_checksum, last_completed_unit: c.last_completed_unit,
    gates: (input.gates ?? []).map((v) => str(v, 'gate')), next_action: str(input.next_action, 'next_action'),
    files_to_read: (input.files_to_read ?? []).map((v) => str(v, 'files_to_read')),
    files_not_to_touch: (input.files_not_to_touch ?? []).map((v) => str(v, 'files_not_to_touch')),
    source_references: refs, summary_estimated_tokens: int(input.summary_estimated_tokens, 'summary_estimated_tokens'),
    estimated_total_tokens: estimated, previous_conversation_required: false,
  };
  handoff.content_checksum = compressedHandoffChecksum(handoff); return deepFreeze(handoff);
}

export function validateConversationFreeResume({ handoff, checkpoint, current_project_id, current_task_id, current_head, source_observations = [] } = {}) {
  if (!handoff || handoff.content_checksum !== compressedHandoffChecksum(handoff)) throw new SessionRotationError('SESSION_HANDOFF_INVALID');
  if (!checkpoint || checkpoint.content_checksum !== handoff.checkpoint_checksum || checkpoint.content_checksum !== sessionCheckpointChecksum(checkpoint)) throw new SessionRotationError('SESSION_CHECKPOINT_FAILED');
  if (handoff.previous_conversation_required !== false) throw new SessionRotationError('SESSION_HANDOFF_INVALID');
  if (handoff.project_id !== current_project_id || handoff.task_id !== current_task_id || handoff.head !== current_head) throw new SessionRotationError('SESSION_RESUME_STATE_CHANGED');
  const observed = new Map(source_observations.map((v) => [v.path_or_ref, v.sha256]));
  for (const ref of handoff.source_references) if (observed.get(ref.path_or_ref) !== ref.sha256) throw new SessionRotationError('SESSION_HANDOFF_SOURCE_CHANGED');
  return deepFreeze({ result: 'CONVERSATION_FREE_RESUME_READY', task_id: handoff.task_id, next_action: handoff.next_action });
}
