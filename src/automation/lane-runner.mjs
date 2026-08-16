import { routeAtomicUnitTerminal, verifyAtomicUnitTerminal } from './atomic-unit.mjs';

export class LaneRunnerError extends Error {
  constructor(code, message){ super(message); this.name = 'LaneRunnerError'; this.code = code; }
}

export async function runAutonomousQuantum(input, execute){
  if(input?.lane_state !== 'ACTIVE') throw new LaneRunnerError('LANE_NOT_ACTIVE', String(input?.lane_state));
  if(input?.authority_result !== 'AUTHORIZED') throw new LaneRunnerError('LANE_AUTHORITY_NOT_AUTHORIZED', String(input?.authority_result));
  if(input?.lease_current !== true || input?.fence_current !== true) throw new LaneRunnerError('LANE_FENCE_NOT_CURRENT', input?.lane_id ?? 'unknown');
  if(typeof execute !== 'function') throw new LaneRunnerError('LANE_EXECUTOR_INVALID', input?.lane_id ?? 'unknown');
  const startedAt = Date.parse(input.started_at);
  const deadline = Date.parse(input.progress_deadline);
  if(!Number.isFinite(startedAt) || !Number.isFinite(deadline) || deadline <= startedAt) throw new LaneRunnerError('LANE_PROGRESS_DEADLINE_INVALID', input?.lane_id ?? 'unknown');
  const terminal = await execute(Object.freeze({ lane_id: input.lane_id, atomic_unit_id: input.atomic_unit_id, effect_capability: input.effect_capability ?? 'READ_ONLY' }));
  verifyAtomicUnitTerminal(terminal);
  if(terminal.lane_id !== input.lane_id || terminal.atomic_unit_id !== input.atomic_unit_id) throw new LaneRunnerError('LANE_TERMINAL_SCOPE_MISMATCH', terminal.terminal_id);
  return Object.freeze({ result: 'QUANTUM_TERMINAL_ACCEPTANCE_PENDING', terminal, route: routeAtomicUnitTerminal(terminal) });
}

export function evaluateNoProgress({ now, progress_deadline, progress_event_count, safe_fallback_intent = null }){
  if(Date.parse(now) <= Date.parse(progress_deadline) || progress_event_count > 0) return { result: 'PROGRESS_WINDOW_OPEN' };
  return safe_fallback_intent ? { result: 'STALLED_WITH_SAFE_FALLBACK', action: 'DURABLY_DISPATCH_FALLBACK', intent: safe_fallback_intent } : { result: 'STALLED_ESCALATION_REQUIRED', action: 'PARK_AND_ESCALATE' };
}
