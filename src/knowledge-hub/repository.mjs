import { deepFreeze, sha256 } from '../knowledge-evolution/util.mjs';
import { KnowledgeHubError } from './errors.mjs';

function eventKey(record) { return `${record.product_id}\0${record.installation_id}\0${record.event.event_id}`; }

export class InMemoryEvidenceRepository {
  #events = new Map();
  #receipts = [];
  #policies = new Map();

  async storeEvent(record) {
    const key = eventKey(record);
    const eventHash = record.event_hash ?? sha256(record.event);
    const existing = this.#events.get(key);
    if (existing) {
      if (existing.event_hash === eventHash) return { outcome: 'ALREADY_SEEN', record: existing };
      return { outcome: 'CONFLICT', record: existing };
    }
    const stored = deepFreeze({ ...structuredClone(record), event_hash: eventHash });
    this.#events.set(key, stored);
    return { outcome: 'ACCEPTED', record: stored };
  }

  async saveReceipt(receiptRecord) { this.#receipts.push(deepFreeze(structuredClone(receiptRecord))); }
  async setPolicy(productId, policy) { this.#policies.set(productId, deepFreeze(structuredClone(policy))); }
  async getPolicy(productId) { return this.#policies.get(productId) ?? null; }
  async listEvents({ productId, installationId } = {}) {
    return [...this.#events.values()].filter(r => (!productId || r.product_id === productId) && (!installationId || r.installation_id === installationId));
  }
  async listReceipts() { return [...this.#receipts]; }
  async pruneExpired(nowIso) {
    let removed = 0;
    const now = Date.parse(nowIso);
    for (const [key, record] of this.#events.entries()) {
      if (record.expires_at && Date.parse(record.expires_at) <= now) { this.#events.delete(key); removed += 1; }
    }
    return removed;
  }
}

export function validateRepository(repository) {
  for (const method of ['storeEvent', 'saveReceipt', 'getPolicy']) {
    if (!repository || typeof repository[method] !== 'function') throw new KnowledgeHubError('HUB_REPOSITORY_INVALID', `Missing repository.${method}`);
  }
  return repository;
}
