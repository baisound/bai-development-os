import { mkdir, open, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { resolveExistingInside, resolveWritableInside, secureAtomicWrite } from '../security/path.mjs';
import { DEFAULT_DISTRIBUTED_LIMITS, DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { verifyDistributedEventEnvelope } from './envelope.mjs';
import { checksumObject, deepFreeze, nowIso, parseTime, safeId, sha256 } from './util.mjs';

const STATE_REL = '.bai-os/distributed/broker-state.json';
const LOCK_REL = '.bai-os/distributed/.broker.lock';
function emptyState() {
  const state = { distributed_broker_state_version: DISTRIBUTED_VERSION, revision: 0, events: [], effects: [], operations: [] };
  state.content_checksum = checksumObject(state); return state;
}
function verifyState(state) {
  if (!state || state.distributed_broker_state_version !== DISTRIBUTED_VERSION || state.content_checksum !== checksumObject(state)) throw new DistributedError('DISTRIBUTED_BROKER_STATE_CORRUPT');
  const eventIds = new Set(); const idem = new Map();
  let previousOp = null;
  for (let i=0;i<state.operations.length;i++){ const row=state.operations[i]; const copy={...row}; delete copy.operation_checksum; if(row.seq!==i+1||row.previous_operation_checksum!==previousOp||row.operation_checksum!==sha256(copy)) throw new DistributedError('DISTRIBUTED_BROKER_OPERATION_CHAIN_CORRUPT'); previousOp=row.operation_checksum; }
  for (const item of state.events) {
    verifyDistributedEventEnvelope(item.envelope);
    if (eventIds.has(item.envelope.event_id)) throw new DistributedError('DISTRIBUTED_BROKER_STATE_CORRUPT');
    eventIds.add(item.envelope.event_id);
    const existing = idem.get(item.envelope.idempotency_key);
    if (existing && existing !== item.envelope.content_checksum) throw new DistributedError('DISTRIBUTED_BROKER_STATE_CORRUPT');
    idem.set(item.envelope.idempotency_key, item.envelope.content_checksum);
  }
  return true;
}
async function acquire(root) {
  const lock = await resolveWritableInside(root, LOCK_REL); await mkdir(path.dirname(lock), { recursive: true });
  try { const h = await open(lock, 'wx', 0o600); await h.writeFile(String(process.pid)); await h.sync(); await h.close(); return lock; }
  catch (error) { if (error.code === 'EEXIST') throw new DistributedError('DISTRIBUTED_BROKER_BUSY'); throw error; }
}
async function withLock(root, fn) { const lock = await acquire(root); try { return await fn(); } finally { await rm(lock, { force: true }).catch(() => {}); } }
export async function readDistributedBrokerState(root) {
  let file; try { file = await resolveExistingInside(root, STATE_REL); } catch (error) { if (error.code === 'SECURITY_PATH_MISSING') return deepFreeze(emptyState()); throw error; }
  let state; try { state = JSON.parse(await readFile(file, 'utf8')); } catch { throw new DistributedError('DISTRIBUTED_BROKER_STATE_CORRUPT'); }
  verifyState(state); return deepFreeze(state);
}
async function writeState(root, state) {
  state.revision += 1; state.content_checksum = checksumObject(state);
  await secureAtomicWrite(root, STATE_REL, Buffer.from(`${JSON.stringify(state, null, 2)}\n`));
  const reread = await readDistributedBrokerState(root);
  if (reread.revision !== state.revision || reread.content_checksum !== state.content_checksum) throw new DistributedError('DISTRIBUTED_BROKER_VERIFY_FAILED');
  return reread;
}
function op(state, type, details, clock) { const row={ seq: state.operations.length + 1, at: nowIso(clock), type, details: structuredClone(details), previous_operation_checksum: state.operations.at(-1)?.operation_checksum ?? null }; row.operation_checksum=sha256(row); state.operations.push(row); }
function findEvent(state, eventId) { return state.events.find((x) => x.envelope.event_id === eventId); }
function due(item, nowMs) { return item.available_at == null || parseTime(item.available_at) <= nowMs; }

export async function enqueueDistributedEvent(root, envelope, { clock = () => new Date(), limits = {} } = {}) {
  verifyDistributedEventEnvelope(envelope, { max_payload_bytes: { ...DEFAULT_DISTRIBUTED_LIMITS, ...limits }.max_payload_bytes });
  return withLock(root, async () => {
    const state = structuredClone(await readDistributedBrokerState(root)); const cfg = { ...DEFAULT_DISTRIBUTED_LIMITS, ...limits };
    if (state.events.filter((x) => x.state !== 'ACKNOWLEDGED').length >= cfg.max_queue_depth) throw new DistributedError('DISTRIBUTED_BACKPRESSURE_QUEUE_FULL');
    const byId = findEvent(state, envelope.event_id); if (byId) {
      if (byId.envelope.content_checksum !== envelope.content_checksum) throw new DistributedError('DISTRIBUTED_EVENT_ID_COLLISION');
      return deepFreeze({ result: 'DUPLICATE_EVENT', item: byId, state_revision: state.revision });
    }
    const byIdem = state.events.find((x) => x.envelope.idempotency_key === envelope.idempotency_key);
    if (byIdem) {
      if (byIdem.envelope.content_checksum !== envelope.content_checksum) throw new DistributedError('DISTRIBUTED_IDEMPOTENCY_COLLISION');
      return deepFreeze({ result: 'DUPLICATE_EVENT', item: byIdem, state_revision: state.revision });
    }
    const item = { envelope: structuredClone(envelope), state: 'PENDING', attempts: 0, replay_count: 0, available_at: envelope.created_at, claim: null, last_error: null, dead_lettered_at: null };
    state.events.push(item); op(state, 'ENQUEUED', { event_id: envelope.event_id, idempotency_key: envelope.idempotency_key }, clock);
    const saved = await writeState(root, state); return deepFreeze({ result: 'ENQUEUED', item: findEvent(saved, envelope.event_id), state_revision: saved.revision });
  });
}

export async function claimDistributedEvent(root, { consumer_id, worker_id = null, fencing_token = null, now = Date.now(), ack_timeout_ms = DEFAULT_DISTRIBUTED_LIMITS.ack_timeout_ms, max_inflight = DEFAULT_DISTRIBUTED_LIMITS.max_inflight, partition_key = null, clock = () => new Date() } = {}) {
  const consumer = safeId(consumer_id, 'consumer_id'); const nowMs = now instanceof Date ? now.getTime() : Number(now);
  return withLock(root, async () => {
    const state = structuredClone(await readDistributedBrokerState(root));
    const inflight = state.events.filter((x) => x.state === 'IN_FLIGHT').length; if (inflight >= max_inflight) throw new DistributedError('DISTRIBUTED_BACKPRESSURE_INFLIGHT_LIMIT');
    const item = state.events.find((x) => x.state === 'PENDING' && due(x, nowMs) && (partition_key == null || x.envelope.partition_key === partition_key));
    if (!item) return deepFreeze({ result: 'NO_EVENT_AVAILABLE', state_revision: state.revision });
    item.state = 'IN_FLIGHT'; item.attempts += 1; item.claim = { consumer_id: consumer, worker_id, fencing_token, claimed_at: new Date(nowMs).toISOString(), ack_deadline_at: new Date(nowMs + ack_timeout_ms).toISOString() };
    op(state, 'CLAIMED', { event_id: item.envelope.event_id, consumer_id: consumer, attempts: item.attempts }, clock);
    const saved = await writeState(root, state); return deepFreeze({ result: 'CLAIMED', item: findEvent(saved, item.envelope.event_id), state_revision: saved.revision });
  });
}

export async function acknowledgeDistributedEvent(root, { event_id, consumer_id, effect_checksum, fencing_token = null, clock = () => new Date() } = {}) {
  const eventId = safeId(event_id, 'event_id'); const consumer = safeId(consumer_id, 'consumer_id'); const effect = safeId(effect_checksum, 'effect_checksum');
  return withLock(root, async () => {
    const state = structuredClone(await readDistributedBrokerState(root)); const item = findEvent(state, eventId); if (!item) throw new DistributedError('DISTRIBUTED_EVENT_NOT_FOUND');
    const effectKey = `${consumer}:${item.envelope.idempotency_key}`; const existing = state.effects.find((x) => x.effect_key === effectKey);
    if (existing) return deepFreeze({ result: 'EFFECT_ALREADY_ACKNOWLEDGED', effect: existing, state_revision: state.revision });
    if (item.state !== 'IN_FLIGHT' || item.claim?.consumer_id !== consumer) throw new DistributedError('DISTRIBUTED_ACK_OWNERSHIP_MISMATCH');
    if (item.claim.fencing_token != null && item.claim.fencing_token !== fencing_token) throw new DistributedError('DISTRIBUTED_FENCING_TOKEN_MISMATCH');
    const ack = { effect_key: effectKey, event_id: eventId, consumer_id: consumer, idempotency_key: item.envelope.idempotency_key, effect_checksum: effect, acknowledged_at: nowIso(clock) };
    state.effects.push(ack); item.state = 'ACKNOWLEDGED'; item.claim = null; op(state, 'ACKNOWLEDGED', ack, clock);
    const saved = await writeState(root, state); return deepFreeze({ result: 'ACKNOWLEDGED', effect: saved.effects.find((x) => x.effect_key === effectKey), state_revision: saved.revision });
  });
}

export async function failDistributedEvent(root, { event_id, consumer_id, error_code = 'ERROR', retry_delay_ms = 0, max_attempts = DEFAULT_DISTRIBUTED_LIMITS.max_attempts, clock = () => new Date() } = {}) {
  const eventId = safeId(event_id, 'event_id'); const consumer = safeId(consumer_id, 'consumer_id');
  return withLock(root, async () => {
    const state = structuredClone(await readDistributedBrokerState(root)); const item = findEvent(state, eventId); if (!item) throw new DistributedError('DISTRIBUTED_EVENT_NOT_FOUND');
    if (item.state !== 'IN_FLIGHT' || item.claim?.consumer_id !== consumer) throw new DistributedError('DISTRIBUTED_FAIL_OWNERSHIP_MISMATCH');
    item.last_error = { code: String(error_code), at: nowIso(clock) }; item.claim = null;
    if (item.attempts >= max_attempts) { item.state = 'DEAD_LETTER'; item.dead_lettered_at = nowIso(clock); op(state, 'DEAD_LETTERED', { event_id: eventId, attempts: item.attempts, error_code }, clock); }
    else { item.state = 'PENDING'; item.available_at = new Date(Date.parse(nowIso(clock)) + Math.max(0, retry_delay_ms)).toISOString(); op(state, 'RETRY_SCHEDULED', { event_id: eventId, attempts: item.attempts, retry_delay_ms }, clock); }
    const saved = await writeState(root, state); return deepFreeze({ result: item.state, item: findEvent(saved, eventId), state_revision: saved.revision });
  });
}

export async function recoverExpiredDistributedClaims(root, { now = Date.now(), max_attempts = DEFAULT_DISTRIBUTED_LIMITS.max_attempts, clock = () => new Date() } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  return withLock(root, async () => {
    const state = structuredClone(await readDistributedBrokerState(root)); const recovered = [];
    for (const item of state.events.filter((x) => x.state === 'IN_FLIGHT' && x.claim && parseTime(x.claim.ack_deadline_at) <= nowMs)) {
      item.last_error = { code: 'ACK_TIMEOUT', at: new Date(nowMs).toISOString() }; item.claim = null;
      if (item.attempts >= max_attempts) { item.state = 'DEAD_LETTER'; item.dead_lettered_at = new Date(nowMs).toISOString(); }
      else { item.state = 'PENDING'; item.available_at = new Date(nowMs).toISOString(); }
      recovered.push({ event_id: item.envelope.event_id, state: item.state });
    }
    if (!recovered.length) return deepFreeze({ result: 'NO_EXPIRED_CLAIMS', recovered: [], state_revision: state.revision });
    op(state, 'EXPIRED_CLAIMS_RECOVERED', { recovered }, clock); const saved = await writeState(root, state);
    return deepFreeze({ result: 'EXPIRED_CLAIMS_RECOVERED', recovered, state_revision: saved.revision });
  });
}

export async function replayDeadLetterEvent(root, { event_id, clock = () => new Date(), max_replays = DEFAULT_DISTRIBUTED_LIMITS.max_replays_per_event } = {}) {
  const eventId = safeId(event_id, 'event_id');
  return withLock(root, async () => {
    const state = structuredClone(await readDistributedBrokerState(root)); const item = findEvent(state, eventId); if (!item) throw new DistributedError('DISTRIBUTED_EVENT_NOT_FOUND');
    if (item.state !== 'DEAD_LETTER') throw new DistributedError('DISTRIBUTED_EVENT_NOT_DEAD_LETTER');
    if (item.replay_count >= max_replays) throw new DistributedError('DISTRIBUTED_REPLAY_LIMIT_EXCEEDED');
    item.replay_count += 1; item.state = 'PENDING'; item.available_at = nowIso(clock); item.dead_lettered_at = null; item.last_error = null; item.claim = null;
    op(state, 'DEAD_LETTER_REPLAYED', { event_id: eventId, replay_count: item.replay_count }, clock); const saved = await writeState(root, state);
    return deepFreeze({ result: 'REPLAYED', item: findEvent(saved, eventId), state_revision: saved.revision });
  });
}

export async function distributedBrokerHealth(root, { now = Date.now() } = {}) {
  const state = await readDistributedBrokerState(root); const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const counts = { PENDING: 0, IN_FLIGHT: 0, ACKNOWLEDGED: 0, DEAD_LETTER: 0 };
  for (const item of state.events) counts[item.state] = (counts[item.state] ?? 0) + 1;
  const expired_claims = state.events.filter((x) => x.state === 'IN_FLIGHT' && x.claim && parseTime(x.claim.ack_deadline_at) <= nowMs).length;
  return deepFreeze({ distributed_broker_health_version: DISTRIBUTED_VERSION, revision: state.revision, counts, expired_claims, effect_count: state.effects.length, operation_count: state.operations.length, result: expired_claims || counts.DEAD_LETTER ? 'DEGRADED' : 'HEALTHY' });
}
