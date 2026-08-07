import { randomUUID } from 'node:crypto';
import { CostGuardError } from './errors.mjs';
import { appendCostEvent, readCostLedger, summarizeCostLedger, transactCostEvent } from './ledger.mjs';
import { estimateModelCostMicrousd, microusdToUsd } from './pricing.mjs';

const DIMS = ['task','role','session'];
const validLimit = (value) => value == null || (Number.isSafeInteger(value) && value >= 0);
const validId = (value) => typeof value === 'string' && value.trim().length > 0;
function requireBindings({ task_id, role, session_id }) {
  if (![task_id, role, session_id].every(validId)) throw new CostGuardError('COST_BINDING_INVALID');
}
export function validateCostBudgets(value = {}) {
  const budgets = {};
  for (const dim of DIMS) {
    const source = value[dim] ?? {};
    budgets[dim] = Object.freeze({ max_input_tokens: source.max_input_tokens ?? null, max_output_tokens: source.max_output_tokens ?? null, max_cost_microusd: source.max_cost_microusd ?? null });
    for (const field of Object.values(budgets[dim])) if (!validLimit(field)) throw new CostGuardError('COST_BUDGET_INVALID');
  }
  const soft_limit_ratio = value.soft_limit_ratio ?? 0.8;
  if (typeof soft_limit_ratio !== 'number' || soft_limit_ratio <= 0 || soft_limit_ratio >= 1) throw new CostGuardError('COST_BUDGET_INVALID');
  return Object.freeze({ ...budgets, soft_limit_ratio });
}

function decisionFor(summary, budget, projected, ratio) {
  const pairs = [['input_tokens', summary.actual_input_tokens + summary.reserved_input_tokens + projected.input_tokens, budget.max_input_tokens],
    ['output_tokens', summary.actual_output_tokens + summary.reserved_output_tokens + projected.output_tokens, budget.max_output_tokens],
    ['cost_microusd', summary.actual_cost_microusd + summary.reserved_cost_microusd + projected.cost_microusd, budget.max_cost_microusd]];
  const hard = pairs.filter(([, value, limit]) => limit != null && value > limit).map(([field]) => field);
  const soft = pairs.filter(([, value, limit]) => limit != null && value <= limit && value >= Math.floor(limit * ratio)).map(([field]) => field);
  return { hard, soft };
}
function validateUsage({ input_tokens, output_tokens, cost_microusd }) {
  for (const value of [input_tokens, output_tokens, cost_microusd]) if (!Number.isSafeInteger(value) || value < 0) throw new CostGuardError('COST_USAGE_INVALID');
}
function evaluateAgainstEvents({ events, budgets: supplied, task_id, role, session_id, input_tokens = 0, output_tokens = 0, cost_microusd = 0 }) {
  requireBindings({ task_id, role, session_id });
  const budgets = validateCostBudgets(supplied); validateUsage({ input_tokens, output_tokens, cost_microusd });
  const projected = { input_tokens, output_tokens, cost_microusd };
  const summaries = { task: summarizeCostLedger(events,{task_id}), role: summarizeCostLedger(events,{task_id,role}), session: summarizeCostLedger(events,{task_id,role,session_id}) };
  const exceeded = []; const warnings = [];
  for (const dim of DIMS) { const result = decisionFor(summaries[dim], budgets[dim], projected, budgets.soft_limit_ratio); exceeded.push(...result.hard.map((f)=>`${dim}.${f}`)); warnings.push(...result.soft.map((f)=>`${dim}.${f}`)); }
  return Object.freeze({ decision: exceeded.length ? 'HARD_STOP' : warnings.length ? 'SOFT_LIMIT' : 'PASS', exceeded_limits: Object.freeze(exceeded), warnings: Object.freeze(warnings), summaries: Object.freeze(summaries), projected: Object.freeze(projected) });
}

export async function evaluateCostReservation({ root, budgets, task_id, role, session_id, input_tokens = 0, output_tokens = 0, cost_microusd = 0 }) {
  const events = await readCostLedger(root);
  return evaluateAgainstEvents({ events,budgets,task_id,role,session_id,input_tokens,output_tokens,cost_microusd });
}

export async function reserveCost({ root, budgets, task_id, role, session_id, model_id = null, input_tokens = 0, output_tokens = 0, cost_microusd = 0 }) {
  const reservation_id = randomUUID();
  const tx = await transactCostEvent(root, async (events) => {
    const evaluation = evaluateAgainstEvents({ events,budgets,task_id,role,session_id,input_tokens,output_tokens,cost_microusd });
    if (evaluation.decision === 'HARD_STOP') throw new CostGuardError('COST_HARD_STOP', evaluation.exceeded_limits.join(','));
    return { event_input:{event_type:'RESERVATION_CREATED',reservation_id,task_id,role,session_id,model_id,input_tokens,output_tokens,cost_microusd}, result:{reservation_id,decision:evaluation.decision,warnings:evaluation.warnings} };
  });
  return Object.freeze({ ...tx.result, event: tx.event });
}
function activeReservation(events, reservation_id) {
  const created = events.findLast((event) => event.reservation_id === reservation_id && event.event_type === 'RESERVATION_CREATED');
  const settled = events.some((event) => event.reservation_id === reservation_id && ['ACTUAL_RECORDED','RESERVATION_RELEASED'].includes(event.event_type));
  if (!created || settled) throw new CostGuardError('COST_RESERVATION_INVALID');
  return created;
}
function verifyReservationBinding(active, { task_id, role, session_id }) {
  requireBindings({ task_id, role, session_id });
  if (active.task_id !== task_id || active.role !== role || active.session_id !== session_id) throw new CostGuardError('COST_RESERVATION_BINDING_MISMATCH');
}
export async function recordActualCost({ root, reservation_id, task_id, role, session_id, model_id = null, input_tokens = 0, output_tokens = 0, cost_microusd = 0 }) {
  if (!reservation_id) throw new CostGuardError('COST_RESERVATION_REQUIRED'); validateUsage({ input_tokens, output_tokens, cost_microusd });
  const tx = await transactCostEvent(root, async (events) => { const active=activeReservation(events,reservation_id); verifyReservationBinding(active,{task_id,role,session_id});
    return { event_input:{event_type:'ACTUAL_RECORDED',reservation_id,task_id,role,session_id,model_id,input_tokens,output_tokens,cost_microusd} }; });
  return tx.event;
}
export async function releaseCostReservation({ root, reservation_id, task_id, role, session_id, reason = 'NOT_USED' }) {
  if (!reservation_id) throw new CostGuardError('COST_RESERVATION_REQUIRED');
  const tx = await transactCostEvent(root, async (events) => { const active=activeReservation(events,reservation_id); verifyReservationBinding(active,{task_id,role,session_id});
    return { event_input:{event_type:'RESERVATION_RELEASED',reservation_id,task_id,role,session_id,reason} }; });
  return tx.event;
}
export { CostGuardError, appendCostEvent, readCostLedger, summarizeCostLedger, transactCostEvent, estimateModelCostMicrousd, microusdToUsd };
