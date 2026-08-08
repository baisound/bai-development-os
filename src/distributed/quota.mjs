import { DEFAULT_DISTRIBUTED_LIMITS } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { deepFreeze, requireFinite, safeId } from './util.mjs';

export class DistributedQuotaGuard {
  constructor(limits = {}) {
    this.limits = { ...DEFAULT_DISTRIBUTED_LIMITS, ...limits };
    this.inflight = new Map(); this.costReserved = 0; this.replays = new Map();
  }
  checkQueueDepth(depth) {
    requireFinite(depth, 'queue_depth', { min: 0, integer: true });
    if (depth >= this.limits.max_queue_depth) throw new DistributedError('DISTRIBUTED_BACKPRESSURE_QUEUE_FULL');
    return true;
  }
  reserve({ reservation_id, estimated_cost_microusd = 0 } = {}) {
    const id = safeId(reservation_id, 'reservation_id');
    if (this.inflight.has(id)) return this.inflight.get(id);
    if (this.inflight.size >= this.limits.max_inflight) throw new DistributedError('DISTRIBUTED_BACKPRESSURE_INFLIGHT_LIMIT');
    requireFinite(estimated_cost_microusd, 'estimated_cost_microusd', { min: 0, integer: true });
    if (this.costReserved + estimated_cost_microusd > this.limits.max_cost_microusd) throw new DistributedError('DISTRIBUTED_COST_BUDGET_EXCEEDED');
    const reservation = deepFreeze({ reservation_id: id, estimated_cost_microusd });
    this.inflight.set(id, reservation); this.costReserved += estimated_cost_microusd; return reservation;
  }
  release(reservation_id) {
    const row = this.inflight.get(reservation_id); if (!row) return false;
    this.costReserved -= row.estimated_cost_microusd; this.inflight.delete(reservation_id); return true;
  }
  recordReplay(event_id) {
    const id = safeId(event_id, 'event_id'); const next = (this.replays.get(id) ?? 0) + 1;
    if (next > this.limits.max_replays_per_event) throw new DistributedError('DISTRIBUTED_REPLAY_LIMIT_EXCEEDED');
    this.replays.set(id, next); return next;
  }
  snapshot() { return deepFreeze({ inflight: this.inflight.size, reserved_cost_microusd: this.costReserved, replayed_events: this.replays.size, limits: structuredClone(this.limits) }); }
}
