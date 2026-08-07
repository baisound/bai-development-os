import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { CostGuardError } from './errors.mjs';
const canonical = (value) => JSON.stringify(value);
const digest = (value) => { const copy = { ...value }; delete copy.event_checksum; return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`; };
const ledgerPath = (root) => path.join(root, 'cost-events.jsonl');
const lockPath = (root) => path.join(root, '.cost-ledger.lock');
const numeric = (value) => Number.isSafeInteger(value) && value >= 0;

export async function readCostLedger(root) {
  let text = ''; try { text = await readFile(ledgerPath(root), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw new CostGuardError('COST_LEDGER_READ_FAILED', error.message); }
  let previous = 'sha256:GENESIS'; const events = [];
  for (const line of text.split('\n').filter(Boolean)) {
    let event; try { event = JSON.parse(line); } catch { throw new CostGuardError('COST_LEDGER_CORRUPT'); }
    if (event.previous_event_checksum !== previous || event.event_checksum !== digest(event)) throw new CostGuardError('COST_LEDGER_CORRUPT');
    previous = event.event_checksum; events.push(Object.freeze(event));
  }
  return Object.freeze(events);
}

async function acquire(root) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  try { const h = await open(lockPath(root), constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600); await h.writeFile(String(process.pid)); await h.sync(); await h.close(); }
  catch (error) { if (error.code === 'EEXIST') throw new CostGuardError('COST_LEDGER_LOCK_CONFLICT'); throw new CostGuardError('COST_LEDGER_LOCK_FAILED', error.message); }
}
async function release(root) { await unlink(lockPath(root)).catch(() => {}); }
function validateEventInput(input) {
  for (const field of ['task_id','role','session_id','event_type']) if (typeof input[field] !== 'string' || !input[field]) throw new CostGuardError('COST_EVENT_INVALID');
  for (const field of ['input_tokens','output_tokens','cost_microusd']) if (!numeric(input[field] ?? 0)) throw new CostGuardError('COST_EVENT_INVALID');
}
async function appendWhileLocked(root, existing, input) {
  validateEventInput(input);
  const previous = existing.at(-1)?.event_checksum ?? 'sha256:GENESIS';
  const event = { event_id: randomUUID(), reservation_id: input.reservation_id ?? null, task_id: input.task_id, role: input.role, session_id: input.session_id,
    event_type: input.event_type, model_id: input.model_id ?? null, input_tokens: input.input_tokens ?? 0, output_tokens: input.output_tokens ?? 0,
    cost_microusd: input.cost_microusd ?? 0, reason: input.reason ?? null, event_at: input.event_at ?? new Date().toISOString(), previous_event_checksum: previous };
  event.event_checksum = digest(event); const line = `${canonical(event)}\n`;
  const handle = await open(ledgerPath(root), constants.O_CREAT | constants.O_APPEND | constants.O_WRONLY, 0o600);
  try { const result = await handle.write(line, null, 'utf8'); if (result.bytesWritten !== Buffer.byteLength(line)) throw new Error('partial cost ledger write'); await handle.sync(); }
  finally { await handle.close(); }
  const reread = await readCostLedger(root); if (reread.at(-1)?.event_checksum !== event.event_checksum) throw new CostGuardError('COST_LEDGER_VERIFY_FAILED');
  return Object.freeze(event);
}

// Runs the decision and the single ledger append under the same exclusive lock.
// The callback returns { event_input, result }; no awaitable external work should be done inside it.
export async function transactCostEvent(root, decide) {
  if (typeof decide !== 'function') throw new CostGuardError('COST_TRANSACTION_INVALID');
  await acquire(root);
  try {
    const existing = await readCostLedger(root);
    const decision = await decide(existing);
    if (!decision?.event_input) throw new CostGuardError('COST_TRANSACTION_INVALID');
    const event = await appendWhileLocked(root, existing, decision.event_input);
    return Object.freeze({ event, result: decision.result ?? null });
  } catch (error) {
    if (error instanceof CostGuardError) throw error;
    throw new CostGuardError('COST_LEDGER_WRITE_FAILED', error.message);
  } finally { await release(root); }
}

export async function appendCostEvent(root, input) {
  const transaction = await transactCostEvent(root, async () => ({ event_input: input }));
  return transaction.event;
}

export function summarizeCostLedger(events, { task_id, role, session_id } = {}) {
  const filtered = events.filter((event) => (!task_id || event.task_id === task_id) && (!role || event.role === role) && (!session_id || event.session_id === session_id));
  const actual = filtered.filter((event) => event.event_type === 'ACTUAL_RECORDED');
  const reservations = new Map();
  for (const event of filtered) {
    if (event.event_type === 'RESERVATION_CREATED') reservations.set(event.reservation_id, event);
    if (event.event_type === 'RESERVATION_RELEASED' || event.event_type === 'ACTUAL_RECORDED') reservations.delete(event.reservation_id);
  }
  const sum = (items, field) => items.reduce((total, event) => total + event[field], 0);
  const active = [...reservations.values()];
  return Object.freeze({ actual_input_tokens: sum(actual,'input_tokens'), actual_output_tokens: sum(actual,'output_tokens'), actual_cost_microusd: sum(actual,'cost_microusd'),
    reserved_input_tokens: sum(active,'input_tokens'), reserved_output_tokens: sum(active,'output_tokens'), reserved_cost_microusd: sum(active,'cost_microusd'), active_reservations: active.length });
}
