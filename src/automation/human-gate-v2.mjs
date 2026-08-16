import { checksumObject, deepFreeze, requireArray, requireString } from './util.mjs';

export class HumanGateV2Error extends Error {
  constructor(code, message){ super(message); this.name = 'HumanGateV2Error'; this.code = code; }
}

const unique = (values, name) => {
  requireArray(values, name, HumanGateV2Error);
  const normalized = values.map((value, index) => requireString(value, `${name}[${index}]`, HumanGateV2Error));
  if(new Set(normalized).size !== normalized.length) throw new HumanGateV2Error('HUMAN_GATE_V2_DUPLICATE', name);
  return [...normalized].sort();
};

export function createHumanGateV2(input){
  const gate = {
    schema: 'BAI_HUMAN_GATE_V2',
    gate_id: requireString(input?.gate_id, 'gate_id', HumanGateV2Error),
    lane_id: requireString(input?.lane_id, 'lane_id', HumanGateV2Error),
    blocked_resource_scope: unique(input?.blocked_resource_scope ?? [], 'blocked_resource_scope'),
    blocked_capabilities: unique(input?.blocked_capabilities ?? [], 'blocked_capabilities'),
    safe_fallback_lane_ids: unique(input?.safe_fallback_lane_ids ?? [], 'safe_fallback_lane_ids'),
    system_wide_block: input?.system_wide_block === true,
    status: input?.status ?? 'WAITING_OWNER',
    reason_code: requireString(input?.reason_code, 'reason_code', HumanGateV2Error),
    authority_epoch: Number(input?.authority_epoch),
    created_at: requireString(input?.created_at, 'created_at', HumanGateV2Error),
  };
  if(!['WAITING_OWNER', 'SATISFIED', 'CANCELLED', 'EXPIRED'].includes(gate.status)) throw new HumanGateV2Error('HUMAN_GATE_V2_STATUS_INVALID', gate.status);
  if(!Number.isSafeInteger(gate.authority_epoch) || gate.authority_epoch < 1) throw new HumanGateV2Error('HUMAN_GATE_V2_EPOCH_INVALID', String(gate.authority_epoch));
  if(gate.system_wide_block && gate.safe_fallback_lane_ids.length) throw new HumanGateV2Error('HUMAN_GATE_V2_SYSTEM_FALLBACK_CONFLICT', gate.gate_id);
  gate.content_checksum = checksumObject(gate);
  return deepFreeze(gate);
}

export function assessGateContinuation(gate, lanes){
  if(!gate || checksumObject(gate) !== gate.content_checksum) throw new HumanGateV2Error('HUMAN_GATE_V2_TAMPERED', gate?.gate_id ?? 'unknown');
  if(gate.status !== 'WAITING_OWNER') return { result: 'GATE_NOT_BLOCKING', fallback: null };
  if(gate.system_wide_block) return { result: 'SYSTEM_BLOCKED', fallback: null };
  const fallback = gate.safe_fallback_lane_ids.map((id) => lanes.find((lane) => lane.lane_id === id)).find((lane) => lane?.state === 'RUNNABLE') ?? null;
  return fallback ? { result: 'FALLBACK_RUNNABLE', fallback } : { result: 'LANE_PARKED_NO_FALLBACK', fallback: null };
}

export function classifyLegacyHumanGate(gate){
  if(gate?.human_gate_schema_version !== '1.0.0') throw new HumanGateV2Error('HUMAN_GATE_LEGACY_SCHEMA_INVALID', 'version');
  return gate.safe_to_continue_other_tasks === false
    ? { result: 'LEGACY_FAIL_CLOSED_SYSTEM_BLOCK', migration_required: true }
    : { result: 'LEGACY_TASK_LOCAL_WITHOUT_SIGNED_SCOPE', migration_required: true };
}
