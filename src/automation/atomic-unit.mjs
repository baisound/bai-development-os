import { checksumObject, deepFreeze, requireString } from './util.mjs';

export class AtomicUnitError extends Error {
  constructor(code, message){ super(message); this.name = 'AtomicUnitError'; this.code = code; }
}

export const ATOMIC_TERMINAL_TYPES = Object.freeze(['NEXT_UNIT_READY', 'HUMAN_GATE', 'PRODUCT_COMPLETED', 'FAILED_KNOWN', 'UNKNOWN']);

export function createAtomicUnitTerminal(input){
  const terminal = {
    schema: 'BAI_ATOMIC_UNIT_TERMINAL_V1',
    terminal_id: requireString(input?.terminal_id, 'terminal_id', AtomicUnitError),
    lane_id: requireString(input?.lane_id, 'lane_id', AtomicUnitError),
    atomic_unit_id: requireString(input?.atomic_unit_id, 'atomic_unit_id', AtomicUnitError),
    type: input?.type,
    evidence_coordinate: requireString(input?.evidence_coordinate, 'evidence_coordinate', AtomicUnitError),
    next_unit_intent: input?.next_unit_intent ?? null,
    human_gate_coordinate: input?.human_gate_coordinate ?? null,
    completion_coordinate: input?.completion_coordinate ?? null,
    failure_code: input?.failure_code ?? null,
    created_at: requireString(input?.created_at, 'created_at', AtomicUnitError),
  };
  if(!ATOMIC_TERMINAL_TYPES.includes(terminal.type)) throw new AtomicUnitError('ATOMIC_TERMINAL_TYPE_INVALID', String(terminal.type));
  const routes = [terminal.next_unit_intent, terminal.human_gate_coordinate, terminal.completion_coordinate].filter(Boolean);
  const expected = terminal.type === 'NEXT_UNIT_READY' || terminal.type === 'HUMAN_GATE' || terminal.type === 'PRODUCT_COMPLETED' ? 1 : 0;
  if(routes.length !== expected) throw new AtomicUnitError('ATOMIC_TERMINAL_ROUTE_CARDINALITY', `${terminal.type}:${routes.length}`);
  if(terminal.type === 'NEXT_UNIT_READY' && !terminal.next_unit_intent) throw new AtomicUnitError('ATOMIC_NEXT_INTENT_MISSING', terminal.terminal_id);
  if(terminal.type === 'HUMAN_GATE' && !terminal.human_gate_coordinate) throw new AtomicUnitError('ATOMIC_HUMAN_GATE_MISSING', terminal.terminal_id);
  if(terminal.type === 'PRODUCT_COMPLETED' && !terminal.completion_coordinate) throw new AtomicUnitError('ATOMIC_COMPLETION_MISSING', terminal.terminal_id);
  if(['FAILED_KNOWN', 'UNKNOWN'].includes(terminal.type) && !terminal.failure_code) throw new AtomicUnitError('ATOMIC_FAILURE_CODE_MISSING', terminal.terminal_id);
  terminal.content_checksum = checksumObject(terminal);
  return deepFreeze(terminal);
}

export function verifyAtomicUnitTerminal(terminal){
  if(!terminal || checksumObject(terminal) !== terminal.content_checksum) throw new AtomicUnitError('ATOMIC_TERMINAL_TAMPERED', terminal?.terminal_id ?? 'unknown');
  return { result: 'ATOMIC_TERMINAL_VALID', terminal_id: terminal.terminal_id };
}

export function routeAtomicUnitTerminal(terminal){
  verifyAtomicUnitTerminal(terminal);
  if(terminal.type === 'NEXT_UNIT_READY') return { action: 'DURABLY_DISPATCH_NEXT', coordinate: terminal.next_unit_intent };
  if(terminal.type === 'HUMAN_GATE') return { action: 'PARK_AND_SELECT_FALLBACK', coordinate: terminal.human_gate_coordinate };
  if(terminal.type === 'PRODUCT_COMPLETED') return { action: 'CLOSE_LANE', coordinate: terminal.completion_coordinate };
  return { action: 'STOP_AND_ESCALATE', reason_code: terminal.failure_code };
}
