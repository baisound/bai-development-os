import { createDistributedEventEnvelope } from './envelope.mjs';
import { enqueueDistributedEvent, claimDistributedEvent, acknowledgeDistributedEvent, failDistributedEvent, recoverExpiredDistributedClaims, replayDeadLetterEvent, distributedBrokerHealth } from './store.mjs';
import { createWorkerAdvertisement, evaluateWorkerEligibility } from './worker.mjs';
import { createRemoteRunRequest, scheduleRemoteRun, createRemoteRunResult, evaluateRemoteResultFreshness } from './remote.mjs';
import { DistributedQuotaGuard } from './quota.mjs';
import { DistributedError } from './errors.mjs';
import { deepFreeze } from './util.mjs';

export class DistributedService {
  constructor({ root = null, enabled = false, limits = {}, clock = () => new Date() } = {}) { this.root = root; this.enabled = enabled; this.clock = clock; this.workers = new Map(); this.quota = new DistributedQuotaGuard(limits); }
  requireEnabled() { if (!this.enabled) throw new DistributedError('DISTRIBUTED_MODE_NOT_ENABLED'); if (!this.root) throw new DistributedError('DISTRIBUTED_ROOT_REQUIRED'); }
  registerWorker(input) { const worker = createWorkerAdvertisement(input, { clock: this.clock }); this.workers.set(worker.worker_id, worker); return worker; }
  worker(worker_id) { return this.workers.get(worker_id) ?? null; }
  eligibleWorkers(requirements = {}) { return deepFreeze([...this.workers.values()].map((worker) => ({ worker, eligibility: evaluateWorkerEligibility(worker, requirements) })).filter((x) => x.eligibility.result === 'ELIGIBLE').map((x) => x.worker)); }
  async publish(input) { this.requireEnabled(); const envelope = input?.distributed_event_version ? input : createDistributedEventEnvelope(input, { clock: this.clock, max_payload_bytes: this.quota.limits.max_payload_bytes }); const health = await distributedBrokerHealth(this.root); this.quota.checkQueueDepth(health.counts.PENDING + health.counts.IN_FLIGHT + health.counts.DEAD_LETTER); return enqueueDistributedEvent(this.root, envelope, { clock: this.clock, limits: this.quota.limits }); }
  async claim(options) { this.requireEnabled(); return claimDistributedEvent(this.root, { ...options, clock: this.clock, ack_timeout_ms: options?.ack_timeout_ms ?? this.quota.limits.ack_timeout_ms, max_inflight: this.quota.limits.max_inflight }); }
  async acknowledge(options) { this.requireEnabled(); return acknowledgeDistributedEvent(this.root, { ...options, clock: this.clock }); }
  async fail(options) { this.requireEnabled(); return failDistributedEvent(this.root, { ...options, clock: this.clock, max_attempts: options?.max_attempts ?? this.quota.limits.max_attempts }); }
  async recover(options = {}) { this.requireEnabled(); return recoverExpiredDistributedClaims(this.root, { ...options, clock: this.clock, max_attempts: options.max_attempts ?? this.quota.limits.max_attempts }); }
  async replay(options) { this.requireEnabled(); this.quota.recordReplay(options.event_id); return replayDeadLetterEvent(this.root, { ...options, clock: this.clock, max_replays: this.quota.limits.max_replays_per_event }); }
  async health(options = {}) { this.requireEnabled(); return distributedBrokerHealth(this.root, options); }
  schedule(input, worker_id, lease = null, options = {}) { const worker = this.worker(worker_id); if (!worker) throw new DistributedError('DISTRIBUTED_WORKER_NOT_FOUND'); const request = input?.distributed_run_request_version ? input : createRemoteRunRequest(input, { clock: this.clock }); return deepFreeze({ request, schedule: scheduleRemoteRun(request, worker, lease, options) }); }
  result(input, request, worker_id, current = {}) { const worker = this.worker(worker_id); if (!worker) throw new DistributedError('DISTRIBUTED_WORKER_NOT_FOUND'); const result = createRemoteRunResult(input, request, worker, { clock: this.clock }); return deepFreeze({ result, freshness: evaluateRemoteResultFreshness(result, request, worker, current) }); }
}
