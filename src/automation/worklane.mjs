import { checksumObject, deepFreeze, requireArray, requireString } from './util.mjs';

export class WorklaneError extends Error {
  constructor(code, message){ super(message); this.name = 'WorklaneError'; this.code = code; }
}

export const WORKLANE_STATES = Object.freeze([
  'PLANNED', 'RUNNABLE', 'ACTIVE', 'GATE_PARKED', 'STALLED',
  'RECOVERY_REQUIRED', 'HANDOFF_PENDING', 'COMPLETED', 'REVOKED',
]);

const TRANSITIONS = Object.freeze({
  PLANNED: ['RUNNABLE', 'REVOKED'],
  RUNNABLE: ['ACTIVE', 'GATE_PARKED', 'REVOKED'],
  ACTIVE: ['RUNNABLE', 'GATE_PARKED', 'STALLED', 'RECOVERY_REQUIRED', 'HANDOFF_PENDING', 'COMPLETED', 'REVOKED'],
  GATE_PARKED: ['RUNNABLE', 'REVOKED'],
  STALLED: ['RUNNABLE', 'RECOVERY_REQUIRED', 'HANDOFF_PENDING', 'REVOKED'],
  RECOVERY_REQUIRED: ['RUNNABLE', 'HANDOFF_PENDING', 'REVOKED'],
  HANDOFF_PENDING: ['RUNNABLE', 'REVOKED'],
  COMPLETED: [],
  REVOKED: [],
});

function exactSet(values, name){
  requireArray(values, name, WorklaneError);
  const normalized = values.map((value, index) => requireString(value, `${name}[${index}]`, WorklaneError));
  if(new Set(normalized).size !== normalized.length) throw new WorklaneError('WORKLANE_DUPLICATE_RESOURCE', name);
  return [...normalized].sort();
}

export function createAutonomousWorklane(input){
  const lane = {
    schema: 'BAI_AUTONOMOUS_WORKLANE_V1',
    lane_id: requireString(input?.lane_id, 'lane_id', WorklaneError),
    task_id: requireString(input?.task_id, 'task_id', WorklaneError),
    subject_id: requireString(input?.subject_id, 'subject_id', WorklaneError),
    authority_grant_id: requireString(input?.authority_grant_id, 'authority_grant_id', WorklaneError),
    authority_epoch: Number(input?.authority_epoch),
    state: input?.state ?? 'PLANNED',
    resource_ownership: exactSet(input?.resource_ownership ?? [], 'resource_ownership'),
    allowed_capabilities: exactSet(input?.allowed_capabilities ?? [], 'allowed_capabilities'),
    denied_capabilities: exactSet(input?.denied_capabilities ?? [], 'denied_capabilities'),
    fallback_lane_ids: exactSet(input?.fallback_lane_ids ?? [], 'fallback_lane_ids'),
    transition_sequence: Number(input?.transition_sequence ?? 0),
    previous_transition_checksum: input?.previous_transition_checksum ?? null,
    updated_at: requireString(input?.updated_at, 'updated_at', WorklaneError),
  };
  if(!Number.isSafeInteger(lane.authority_epoch) || lane.authority_epoch < 1) throw new WorklaneError('WORKLANE_AUTHORITY_EPOCH_INVALID', String(lane.authority_epoch));
  if(!Number.isSafeInteger(lane.transition_sequence) || lane.transition_sequence < 0) throw new WorklaneError('WORKLANE_SEQUENCE_INVALID', String(lane.transition_sequence));
  if(!WORKLANE_STATES.includes(lane.state)) throw new WorklaneError('WORKLANE_STATE_INVALID', lane.state);
  if(lane.allowed_capabilities.some((item) => lane.denied_capabilities.includes(item))) throw new WorklaneError('WORKLANE_CAPABILITY_CONFLICT', lane.lane_id);
  lane.content_checksum = checksumObject(lane);
  return deepFreeze(lane);
}

export function verifyAutonomousWorklane(lane){
  if(!lane || lane.schema !== 'BAI_AUTONOMOUS_WORKLANE_V1') throw new WorklaneError('WORKLANE_SCHEMA_INVALID', 'schema');
  if(checksumObject(lane) !== lane.content_checksum) throw new WorklaneError('WORKLANE_TAMPERED', lane.lane_id ?? 'unknown');
  createAutonomousWorklane({ ...lane, content_checksum: undefined });
  return { result: 'WORKLANE_VALID', lane_id: lane.lane_id };
}

export function transitionWorklane(lane, { to_state, at, reason_code }){
  verifyAutonomousWorklane(lane);
  if(!TRANSITIONS[lane.state].includes(to_state)) throw new WorklaneError('WORKLANE_TRANSITION_FORBIDDEN', `${lane.state}->${to_state}`);
  requireString(reason_code, 'reason_code', WorklaneError);
  return createAutonomousWorklane({
    ...lane,
    state: to_state,
    transition_sequence: lane.transition_sequence + 1,
    previous_transition_checksum: lane.content_checksum,
    updated_at: at,
  });
}

export function assertDisjointWorklaneOwnership(lanes){
  const owners = new Map();
  for(const lane of lanes){
    verifyAutonomousWorklane(lane);
    for(const resource of lane.resource_ownership){
      const prior = owners.get(resource);
      if(prior) throw new WorklaneError('WORKLANE_RESOURCE_CONFLICT', `${resource}:${prior}:${lane.lane_id}`);
      owners.set(resource, lane.lane_id);
    }
  }
  return { result: 'WORKLANE_OWNERSHIP_DISJOINT', resources: owners.size };
}

export function selectRunnableFallback(lanes, blockedLaneId){
  const byId = new Map(lanes.map((lane) => [lane.lane_id, lane]));
  const blocked = byId.get(blockedLaneId);
  if(!blocked) throw new WorklaneError('WORKLANE_NOT_FOUND', blockedLaneId);
  verifyAutonomousWorklane(blocked);
  if(!['GATE_PARKED', 'STALLED', 'RECOVERY_REQUIRED'].includes(blocked.state)) return null;
  for(const id of blocked.fallback_lane_ids){
    const candidate = byId.get(id);
    if(candidate && candidate.state === 'RUNNABLE'){
      verifyAutonomousWorklane(candidate);
      return candidate;
    }
  }
  return null;
}
