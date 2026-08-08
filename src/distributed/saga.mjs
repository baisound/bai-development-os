import { DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, safeId, uniqSorted } from './util.mjs';

export function createDistributedSaga(input = {}, { clock = () => new Date() } = {}) {
  const steps = (input.steps ?? []).map((step) => ({ step_id: safeId(step.step_id, 'step_id'), depends_on: uniqSorted(step.depends_on ?? []), action: String(step.action ?? step.step_id), compensation: step.compensation == null ? null : String(step.compensation), project_id: step.project_id == null ? null : safeId(step.project_id, 'project_id') }));
  if (!steps.length) throw new DistributedError('DISTRIBUTED_SAGA_EMPTY');
  const ids = new Set(steps.map((x) => x.step_id)); if (ids.size !== steps.length) throw new DistributedError('DISTRIBUTED_SAGA_DUPLICATE_STEP');
  for (const step of steps) for (const dep of step.depends_on) if (!ids.has(dep) || dep === step.step_id) throw new DistributedError('DISTRIBUTED_SAGA_DEPENDENCY_INVALID');
  const saga = { distributed_saga_version: DISTRIBUTED_VERSION, saga_id: safeId(input.saga_id ?? newId('DSAGA'), 'saga_id'), created_at: nowIso(clock), correlation_id: safeId(input.correlation_id ?? newId('CORR'), 'correlation_id'), steps };
  saga.content_checksum = checksumObject(saga); return deepFreeze(saga);
}
export function verifyDistributedSaga(saga) {
  if (!saga || saga.distributed_saga_version !== DISTRIBUTED_VERSION || saga.content_checksum !== checksumObject(saga)) throw new DistributedError('DISTRIBUTED_SAGA_TAMPERED'); return true;
}
export async function executeDistributedSaga(saga, { runner, compensator = null, clock = () => new Date() } = {}) {
  verifyDistributedSaga(saga); if (typeof runner !== 'function') throw new DistributedError('DISTRIBUTED_SAGA_RUNNER_REQUIRED');
  const completed = []; const results = []; const pending = new Map(saga.steps.map((x) => [x.step_id, x]));
  try {
    while (pending.size) {
      const ready = [...pending.values()].filter((x) => x.depends_on.every((d) => completed.includes(d)));
      if (!ready.length) throw new DistributedError('DISTRIBUTED_SAGA_CYCLE');
      for (const step of ready) { const output = await runner(deepFreeze(structuredClone(step))); results.push({ step_id: step.step_id, status: 'COMPLETED', output }); completed.push(step.step_id); pending.delete(step.step_id); }
    }
    return deepFreeze({ result: 'SAGA_COMPLETED', saga_id: saga.saga_id, completed_steps: completed, step_results: results, completed_at: nowIso(clock), compensation_results: [] });
  } catch (error) {
    const compensation_results = [];
    for (const stepId of [...completed].reverse()) { const step = saga.steps.find((x) => x.step_id === stepId); if (!step.compensation) continue; if (typeof compensator !== 'function') { compensation_results.push({ step_id: stepId, status: 'COMPENSATION_REQUIRED' }); continue; } try { const output = await compensator(deepFreeze(structuredClone(step))); compensation_results.push({ step_id: stepId, status: 'COMPENSATED', output }); } catch (compError) { compensation_results.push({ step_id: stepId, status: 'COMPENSATION_FAILED', error: compError.message }); } }
    return deepFreeze({ result: compensation_results.some((x) => x.status === 'COMPENSATION_FAILED' || x.status === 'COMPENSATION_REQUIRED') ? 'SAGA_RECOVERY_REQUIRED' : 'SAGA_COMPENSATED', saga_id: saga.saga_id, completed_steps: completed, failed_error: error.message, step_results: results, compensation_results, completed_at: nowIso(clock) });
  }
}
