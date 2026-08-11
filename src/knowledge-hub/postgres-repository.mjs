import { sha256 } from '../knowledge-evolution/util.mjs';
import { KnowledgeHubError } from './errors.mjs';

function ensureQuery(query) { if (typeof query !== 'function') throw new KnowledgeHubError('HUB_POSTGRES_QUERY_REQUIRED'); return query; }

export function createPostgresEvidenceRepository({ query }) {
  const run = ensureQuery(query);
  return Object.freeze({
    async storeEvent(record) {
      const eventHash = record.event_hash ?? sha256(record.event);
      const params = [record.product_id, record.installation_id, record.event.event_id, eventHash, JSON.stringify(record.event), JSON.stringify(record.knowledge_evidence), record.subject_id, record.trust_level, record.transport, record.received_at, record.expires_at];
      const inserted = await run(`INSERT INTO evidence_events
(product_id, installation_id, event_id, event_hash, event_json, knowledge_evidence_json, subject_id, trust_level, transport, received_at, expires_at)
VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10::timestamptz,$11::timestamptz)
ON CONFLICT (product_id, installation_id, event_id) DO NOTHING
RETURNING event_hash`, params);
      if (inserted?.rows?.length) return { outcome: 'ACCEPTED', record: { ...record, event_hash: eventHash } };
      const existing = await run('SELECT event_hash FROM evidence_events WHERE product_id=$1 AND installation_id=$2 AND event_id=$3', params.slice(0, 3));
      const existingHash = existing?.rows?.[0]?.event_hash;
      if (!existingHash) throw new KnowledgeHubError('HUB_POSTGRES_IDEMPOTENCY_LOOKUP_FAILED', 'Conflicting row could not be read', { status: 500 });
      return { outcome: existingHash === eventHash ? 'ALREADY_SEEN' : 'CONFLICT', record: { event_hash: existingHash } };
    },
    async saveReceipt(record) {
      await run(`INSERT INTO delivery_receipts
(receipt_id, batch_id, subject_id, product_id, transport, receipt_json, created_at)
VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::timestamptz)`, [record.receipt.receipt_id, record.receipt.batch_id, record.subject_id, record.product_id, record.transport, JSON.stringify(record.receipt), record.receipt.server_time]);
    },
    async getPolicy(productId) {
      const result = await run('SELECT policy_json FROM client_policies WHERE product_id=$1', [productId]);
      return result?.rows?.[0]?.policy_json ?? null;
    },
    async setPolicy(productId, policy) {
      await run(`INSERT INTO client_policies(product_id, policy_json, updated_at)
VALUES($1,$2::jsonb,now()) ON CONFLICT(product_id) DO UPDATE SET policy_json=EXCLUDED.policy_json, updated_at=now()`, [productId, JSON.stringify(policy)]);
    },
    async pruneExpired(nowIso) {
      const result = await run('DELETE FROM evidence_events WHERE expires_at IS NOT NULL AND expires_at <= $1::timestamptz', [nowIso]);
      return result?.rowCount ?? 0;
    }
  });
}
