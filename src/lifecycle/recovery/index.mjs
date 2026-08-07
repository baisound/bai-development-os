import { createHash, randomUUID } from 'node:crypto';

const STATUS = new Set(['ACTIVE','PAUSED','BLOCKED','STALLED']);
const canonical = (v) => JSON.stringify(sort(v));
const sort = (v) => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])) : v;
const digest = (v) => `sha256:${createHash('sha256').update(canonical(withoutChecksum(v))).digest('hex')}`;
const withoutChecksum = (v) => { const c=structuredClone(v); delete c.content_checksum; return c; };
const requiredString = (v,n) => { if(typeof v !== 'string'||!v.trim()) throw new RecoveryError('RECOVERY_SCHEMA_INVALID',`${n} is required`); };
const array = (v,n) => { if(!Array.isArray(v)) throw new RecoveryError('RECOVERY_SCHEMA_INVALID',`${n} must be an array`); };

export class RecoveryError extends Error { constructor(code,message=code){ super(message); this.code=code; } }

export function createCheckpoint(input, { clock = () => new Date() } = {}) {
  const now = clock();
  if (!Number.isInteger(input.status_revision) || input.status_revision < 1) throw new RecoveryError('RECOVERY_SCHEMA_INVALID','status_revision must be >= 1');
  for (const field of ['task_id','saved_status','saved_phase','last_completed_action','next_action']) requiredString(input[field],field);
  if (!STATUS.has(input.saved_status)) throw new RecoveryError('RECOVERY_SCHEMA_INVALID','saved_status invalid');
  for (const field of ['required_files','running_processes','external_dependencies','unconfirmed_items','invalidation_triggers']) array(input[field] ?? [],field);
  if (!input.working_tree_state || typeof input.working_tree_state !== 'object') throw new RecoveryError('RECOVERY_SCHEMA_INVALID','working_tree_state required');
  if (!input.environment_fingerprint || typeof input.environment_fingerprint !== 'object') throw new RecoveryError('RECOVERY_SCHEMA_INVALID','environment_fingerprint required');
  if (!input.authorization_snapshot || typeof input.authorization_snapshot !== 'object') throw new RecoveryError('RECOVERY_SCHEMA_INVALID','authorization_snapshot required');
  if (!input.budget_snapshot || typeof input.budget_snapshot !== 'object') throw new RecoveryError('RECOVERY_SCHEMA_INVALID','budget_snapshot required');
  const expires = input.expires_at ?? new Date(now.getTime()+24*60*60*1000).toISOString();
  if (Number.isNaN(Date.parse(expires)) || Date.parse(expires) <= now.getTime()) throw new RecoveryError('RECOVERY_SCHEMA_INVALID','expires_at invalid');
  const checkpoint = {
    checkpoint_schema_version:'1.0.0', checkpoint_id: input.checkpoint_id ?? randomUUID(), task_id:input.task_id,
    status_revision:input.status_revision, saved_status:input.saved_status, saved_phase:input.saved_phase,
    last_completed_action:input.last_completed_action, next_action:input.next_action,
    required_files:Object.freeze([...(input.required_files??[])]), working_tree_state:structuredClone(input.working_tree_state),
    environment_fingerprint:structuredClone(input.environment_fingerprint), running_processes:Object.freeze([...(input.running_processes??[])]),
    external_dependencies:Object.freeze([...(input.external_dependencies??[])]), authorization_snapshot:structuredClone(input.authorization_snapshot),
    budget_snapshot:structuredClone(input.budget_snapshot), unconfirmed_items:Object.freeze([...(input.unconfirmed_items??[])]),
    invalidation_triggers:Object.freeze([...(input.invalidation_triggers??[])]), created_at: now.toISOString(), expires_at:expires,
    emergency_stop:Boolean(input.emergency_stop), resume_requires_owner:Boolean(input.resume_requires_owner ?? input.emergency_stop),
  };
  checkpoint.content_checksum=digest(checkpoint);
  return Object.freeze(checkpoint);
}

export function validateCheckpoint(checkpoint, current, { clock = () => new Date() } = {}) {
  if (!checkpoint || checkpoint.checkpoint_schema_version !== '1.0.0' || checkpoint.content_checksum !== digest(checkpoint)) throw new RecoveryError('CHECKPOINT_TAMPERED');
  if (checkpoint.task_id !== current.task_id) throw new RecoveryError('CHECKPOINT_TASK_MISMATCH');
  if (checkpoint.status_revision !== current.status_revision) throw new RecoveryError('CHECKPOINT_STATUS_REVISION_CHANGED');
  if (checkpoint.saved_phase !== current.phase) throw new RecoveryError('CHECKPOINT_PHASE_CHANGED');
  if (Date.parse(checkpoint.expires_at) <= clock().getTime()) throw new RecoveryError('CHECKPOINT_EXPIRED');
  const wt = current.working_tree_state ?? {};
  if (checkpoint.working_tree_state.branch !== wt.branch || checkpoint.working_tree_state.commit !== wt.commit) throw new RecoveryError('CHECKPOINT_WORKTREE_CHANGED');
  const env = canonical(current.environment_fingerprint ?? {});
  if (canonical(checkpoint.environment_fingerprint) !== env) throw new RecoveryError('CHECKPOINT_ENVIRONMENT_CHANGED');
  if (canonical(checkpoint.authorization_snapshot) !== canonical(current.authorization_snapshot ?? {})) throw new RecoveryError('CHECKPOINT_AUTHORIZATION_CHANGED');
  if (canonical(checkpoint.budget_snapshot) !== canonical(current.budget_snapshot ?? {})) throw new RecoveryError('CHECKPOINT_BUDGET_CHANGED');
  if (Array.isArray(current.changed_sources) && current.changed_sources.length) throw new RecoveryError('CHECKPOINT_CANONICAL_SOURCE_CHANGED');
  return Object.freeze({ result:'CHECKPOINT_VALID', checkpoint_id:checkpoint.checkpoint_id, next_action:checkpoint.next_action });
}

export function evaluateSafeStop({ type, reason, blocking_owner=null, required_condition=null, last_progress_at=null, attempted_actions=[], resume_after=null, emergency=false } = {}) {
  if (!['PAUSED','BLOCKED','STALLED'].includes(type)) throw new RecoveryError('RECOVERY_SCHEMA_INVALID','safe stop type invalid');
  requiredString(reason,'reason');
  if (type==='BLOCKED' && (!blocking_owner || !required_condition)) throw new RecoveryError('BLOCK_DETAILS_REQUIRED');
  if (type==='STALLED' && (!last_progress_at || !attempted_actions.length)) throw new RecoveryError('STALL_DETAILS_REQUIRED');
  if (type==='PAUSED' && resume_after != null && Number.isNaN(Date.parse(resume_after))) throw new RecoveryError('RECOVERY_SCHEMA_INVALID','resume_after invalid');
  return Object.freeze({ target_status:type, reason, blocking_owner, required_condition, last_progress_at, attempted_actions:Object.freeze([...attempted_actions]), resume_after, emergency_stop:Boolean(emergency), side_effects_allowed:false });
}

export function evaluateResume({ current_status, checkpoint_result, condition_verified=false, owner_authorized=false, environment_recovered=false, hypothesis_changed=false, handoff_present=false, scheduled_time_reached=false, emergency_stop=false } = {}) {
  if (!['PAUSED','BLOCKED','STALLED'].includes(current_status)) throw new RecoveryError('RESUME_SOURCE_INVALID');
  if (checkpoint_result !== 'CHECKPOINT_VALID') throw new RecoveryError('RESUME_CHECKPOINT_INVALID');
  if (emergency_stop && !owner_authorized) throw new RecoveryError('RESUME_OWNER_AUTH_REQUIRED');
  if (current_status==='PAUSED' && !(owner_authorized || scheduled_time_reached)) throw new RecoveryError('RESUME_CONDITION_NOT_MET');
  if (current_status==='BLOCKED' && !condition_verified) throw new RecoveryError('RESUME_CONDITION_NOT_MET');
  if (current_status==='STALLED' && !(environment_recovered || hypothesis_changed || handoff_present)) throw new RecoveryError('RESUME_CONDITION_NOT_MET');
  return Object.freeze({ result:'RESUME_ALLOWED', target_status:'ACTIVE' });
}

export function createRollbackPlan({ rollback_type, target, method, irreversible=false, compensating_action=null, authorization='NOT_REQUIRED', verification=[] } = {}) {
  if (!['CODE','STATUS','POLICY','ARCHIVE','EXTERNAL_ACTION'].includes(rollback_type)) throw new RecoveryError('ROLLBACK_TYPE_INVALID');
  requiredString(target,'target'); requiredString(method,'method'); array(verification,'verification');
  if ((rollback_type==='EXTERNAL_ACTION' || irreversible) && !compensating_action) throw new RecoveryError('COMPENSATING_ACTION_REQUIRED');
  if ((rollback_type==='EXTERNAL_ACTION' || irreversible) && authorization!=='AUTHORIZED') throw new RecoveryError('ROLLBACK_AUTHORIZATION_REQUIRED');
  return Object.freeze({ rollback_id:randomUUID(), rollback_type,target,method,irreversible:Boolean(irreversible),compensating_action,authorization,verification:Object.freeze([...verification]), result:'ROLLBACK_PLAN_READY' });
}

export function validateRecoveryStatusTransition(from, to, request={}) {
  if (!STATUS.has(from) || !STATUS.has(to)) throw new RecoveryError('RECOVERY_STATUS_INVALID');
  const allowed = new Set(['ACTIVE:PAUSED','ACTIVE:BLOCKED','ACTIVE:STALLED','PAUSED:ACTIVE','BLOCKED:ACTIVE','STALLED:ACTIVE']);
  if (!allowed.has(`${from}:${to}`)) throw new RecoveryError('RECOVERY_TRANSITION_FORBIDDEN');
  if (from==='BLOCKED' && to==='ACTIVE' && !request.condition_verified) throw new RecoveryError('RESUME_CONDITION_NOT_MET');
  if (from==='STALLED' && to==='ACTIVE' && !(request.environment_recovered || request.hypothesis_changed || request.handoff_present)) throw new RecoveryError('RESUME_CONDITION_NOT_MET');
  if (from==='PAUSED' && to==='ACTIVE' && !(request.owner_authorized || request.scheduled_time_reached)) throw new RecoveryError('RESUME_CONDITION_NOT_MET');
  if (request.emergency_stop && to==='ACTIVE' && !request.owner_authorized) throw new RecoveryError('RESUME_OWNER_AUTH_REQUIRED');
  return true;
}

export { digest as recoveryChecksum };
