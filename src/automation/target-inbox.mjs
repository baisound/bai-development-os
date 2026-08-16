import { deepFreeze, requireString } from './util.mjs';

export class TargetInboxError extends Error {
  constructor(code, message){ super(message); this.name = 'TargetInboxError'; this.code = code; }
}

export const TARGET_INBOX_STATES = Object.freeze(['RECEIVED', 'CLAIMED', 'EXECUTING', 'EFFECT_STARTED', 'EFFECT_RECONCILING', 'EFFECT_COMMITTED', 'RESULT_RECORDED', 'TERMINAL_PASS', 'TERMINAL_FAIL', 'TERMINAL_BLOCKED', 'TERMINAL_CANCELLED', 'TERMINAL_UNKNOWN', 'REJECTED', 'RECOVERY_REQUIRED']);

export function createDurableTargetInbox(inbox_id){
  const operations = new Map();
  return {
    schema: 'BAI_TARGET_INBOX_V1', inbox_id: requireString(inbox_id, 'inbox_id', TargetInboxError), operations,
    receive({ semantic_operation_id, payload_checksum, persisted_coordinate }){
      for(const [field, value] of [['semantic_operation_id', semantic_operation_id], ['payload_checksum', payload_checksum]]) if(!/^sha256:[a-f0-9]{64}$/.test(value)) throw new TargetInboxError('TARGET_INBOX_CHECKSUM_INVALID', field);
      const existing = operations.get(semantic_operation_id);
      if(existing && existing.payload_checksum !== payload_checksum) throw new TargetInboxError('TARGET_INBOX_SEMANTIC_COLLISION', semantic_operation_id);
      if(existing) return deepFreeze(structuredClone(existing));
      const row = { schema: 'BAI_TARGET_INBOX_OPERATION_V1', inbox_id: this.inbox_id, semantic_operation_id, payload_checksum, persisted_coordinate: requireString(persisted_coordinate, 'persisted_coordinate', TargetInboxError), state: 'RECEIVED', claim: null, effect_coordinate: null, result_coordinate: null, terminal_coordinate: null };
      operations.set(semantic_operation_id, row); return deepFreeze(structuredClone(row));
    },
    claim(semanticId, { worker_id, fence_epoch }){
      const row = required(operations, semanticId);
      if(row.state !== 'RECEIVED') throw new TargetInboxError('TARGET_INBOX_NOT_CLAIMABLE', row.state);
      if(!Number.isSafeInteger(fence_epoch) || fence_epoch < 1) throw new TargetInboxError('TARGET_INBOX_FENCE_INVALID', semanticId);
      row.state = 'CLAIMED'; row.claim = { worker_id: requireString(worker_id, 'worker_id', TargetInboxError), fence_epoch }; return deepFreeze(structuredClone(row));
    },
    transition(semanticId, nextState, input = {}){
      const row = required(operations, semanticId);
      const allowed = {
        CLAIMED: ['EXECUTING', 'EFFECT_STARTED', 'TERMINAL_BLOCKED', 'TERMINAL_CANCELLED'],
        EXECUTING: ['RESULT_RECORDED', 'TERMINAL_FAIL', 'TERMINAL_UNKNOWN'],
        EFFECT_STARTED: ['EFFECT_COMMITTED', 'EFFECT_RECONCILING', 'TERMINAL_UNKNOWN', 'TERMINAL_FAIL'],
        EFFECT_RECONCILING: ['EFFECT_COMMITTED', 'TERMINAL_UNKNOWN'],
        EFFECT_COMMITTED: ['RESULT_RECORDED', 'TERMINAL_FAIL', 'RECOVERY_REQUIRED'],
        RESULT_RECORDED: ['TERMINAL_PASS', 'TERMINAL_FAIL', 'RECOVERY_REQUIRED'],
      };
      if(!(allowed[row.state] ?? []).includes(nextState)) throw new TargetInboxError('TARGET_INBOX_TRANSITION_INVALID', `${row.state}->${nextState}`);
      if(['EFFECT_STARTED', 'EFFECT_COMMITTED'].includes(nextState)) row.effect_coordinate = requireString(input.effect_coordinate, 'effect_coordinate', TargetInboxError);
      if(nextState === 'RESULT_RECORDED') row.result_coordinate = requireString(input.result_coordinate, 'result_coordinate', TargetInboxError);
      if(nextState.startsWith('TERMINAL_')) row.terminal_coordinate = requireString(input.terminal_coordinate, 'terminal_coordinate', TargetInboxError);
      row.state = nextState; return deepFreeze(structuredClone(row));
    },
    get(semanticId){ const row = operations.get(semanticId); return row ? deepFreeze(structuredClone(row)) : null; },
    snapshot(){ return deepFreeze([...operations.entries()].map(([key, row]) => [key, structuredClone(row)])); },
  };
}
function required(operations, semanticId){ const row = operations.get(semanticId); if(!row) throw new TargetInboxError('TARGET_INBOX_OPERATION_MISSING', semanticId); return row; }
