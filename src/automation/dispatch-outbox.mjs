import { deepFreeze, requireString } from './util.mjs';
import { verifyDispatchEnvelope } from './durable-dispatch.mjs';

export class DispatchOutboxError extends Error {
  constructor(code, message){ super(message); this.name = 'DispatchOutboxError'; this.code = code; }
}

export const DISPATCH_OUTBOX_STATES = Object.freeze(['PENDING', 'LEASED', 'DELIVERED', 'TARGET_PERSISTED', 'TERMINAL', 'EXPIRED', 'SUPERSEDED', 'REJECTED', 'DEAD_LETTER']);

export function createDispatchOutbox(){
  const rows = new Map();
  return {
    schema: 'BAI_DISPATCH_OUTBOX_V1', rows,
    enqueue(envelope){
      verifyDispatchEnvelope(envelope);
      const existing = rows.get(envelope.semantic_operation_id);
      if(existing && existing.envelope.payload_checksum !== envelope.payload_checksum) throw new DispatchOutboxError('DISPATCH_SEMANTIC_COLLISION', envelope.semantic_operation_id);
      if(existing) return deepFreeze(structuredClone(existing));
      const row = { envelope, state: 'PENDING', attempt_count: 0, lease: null, delivered_at: null, target_coordinate: null, terminal_coordinate: null, failure_code: null };
      rows.set(envelope.semantic_operation_id, row);
      return deepFreeze(structuredClone(row));
    },
    claim(semanticId, { worker_id, lease_epoch, lease_expires_at, now }){
      const row = required(rows, semanticId);
      if(row.state === 'LEASED'){
        if(Date.parse(row.lease.lease_expires_at) > Date.parse(now)) throw new DispatchOutboxError('DISPATCH_LEASE_ACTIVE', semanticId);
        row.state = 'PENDING'; row.lease = null;
      }
      if(row.state !== 'PENDING') throw new DispatchOutboxError('DISPATCH_NOT_CLAIMABLE', row.state);
      if(!Number.isSafeInteger(lease_epoch) || lease_epoch < 1 || !(Date.parse(lease_expires_at) > Date.parse(now))) throw new DispatchOutboxError('DISPATCH_LEASE_INVALID', semanticId);
      row.state = 'LEASED'; row.attempt_count += 1;
      row.lease = { worker_id: requireString(worker_id, 'worker_id', DispatchOutboxError), lease_epoch, claimed_at: now, lease_expires_at };
      return deepFreeze(structuredClone(row));
    },
    markDelivered(semanticId, { worker_id, lease_epoch, at }){
      const row = assertLease(rows, semanticId, worker_id, lease_epoch);
      row.state = 'DELIVERED'; row.delivered_at = at;
      return deepFreeze(structuredClone(row));
    },
    acknowledgeTarget(semanticId, { target_coordinate, at }){
      const row = required(rows, semanticId);
      if(row.state === 'TARGET_PERSISTED') return deepFreeze(structuredClone(row));
      if(row.state !== 'DELIVERED') throw new DispatchOutboxError('DISPATCH_ACK_BEFORE_DELIVERY', row.state);
      row.state = 'TARGET_PERSISTED'; row.target_coordinate = requireString(target_coordinate, 'target_coordinate', DispatchOutboxError); row.acknowledged_at = at; row.lease = null;
      return deepFreeze(structuredClone(row));
    },
    complete(semanticId, { terminal_coordinate, at }){
      const row = required(rows, semanticId);
      if(row.state !== 'TARGET_PERSISTED') throw new DispatchOutboxError('DISPATCH_TERMINAL_BEFORE_TARGET_ACK', row.state);
      row.state = 'TERMINAL'; row.terminal_coordinate = requireString(terminal_coordinate, 'terminal_coordinate', DispatchOutboxError); row.terminal_at = at;
      return deepFreeze(structuredClone(row));
    },
    reconcileLease(semanticId, { now, target_query_state = 'NOT_PERSISTED', max_attempts = 3 }){
      const row = required(rows, semanticId);
      if(row.state !== 'LEASED' || Date.parse(row.lease.lease_expires_at) > Date.parse(now)) return deepFreeze(structuredClone(row));
      if(target_query_state === 'PERSISTED') throw new DispatchOutboxError('DISPATCH_TARGET_COORDINATE_REQUIRED', semanticId);
      if(target_query_state === 'UNKNOWN') { row.state = 'DEAD_LETTER'; row.failure_code = 'DELIVERY_UNKNOWN_NO_RETRY'; }
      else if(row.attempt_count >= max_attempts) { row.state = 'DEAD_LETTER'; row.failure_code = 'ATTEMPTS_EXHAUSTED_PROVEN_NONPERSISTENCE'; }
      else { row.state = 'PENDING'; row.lease = null; }
      return deepFreeze(structuredClone(row));
    },
    close(semanticId, state, { failure_code, at }){
      if(!['EXPIRED', 'SUPERSEDED', 'REJECTED', 'DEAD_LETTER'].includes(state)) throw new DispatchOutboxError('DISPATCH_CLOSE_STATE_INVALID', state);
      const row = required(rows, semanticId);
      if(['TARGET_PERSISTED', 'TERMINAL'].includes(row.state)) throw new DispatchOutboxError('DISPATCH_ALREADY_TARGET_PERSISTED', semanticId);
      row.state = state; row.failure_code = requireString(failure_code, 'failure_code', DispatchOutboxError); row.terminal_at = at; row.lease = null;
      return deepFreeze(structuredClone(row));
    },
    get(semanticId){ const row = rows.get(semanticId); return row ? deepFreeze(structuredClone(row)) : null; },
    snapshot(){ return deepFreeze([...rows.entries()].map(([key, row]) => [key, structuredClone(row)])); },
  };
}

function required(rows, semanticId){
  const row = rows.get(semanticId);
  if(!row) throw new DispatchOutboxError('DISPATCH_ROW_MISSING', semanticId);
  return row;
}
function assertLease(rows, semanticId, workerId, leaseEpoch){
  const row = required(rows, semanticId);
  if(row.state !== 'LEASED' || row.lease.worker_id !== workerId || row.lease.lease_epoch !== leaseEpoch) throw new DispatchOutboxError('DISPATCH_LEASE_FENCE_MISMATCH', semanticId);
  return row;
}
