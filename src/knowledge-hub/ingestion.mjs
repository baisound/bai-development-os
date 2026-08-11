import { DEFAULT_CLIENT_POLICY } from '../knowledge-evolution/constants.mjs';
import { mapConsumerEventToKnowledgeEvidence, validateCanonicalConsumerEvidenceEvent, validateConsumerEvidenceBatchEnvelope, validateDeliveryReceipt } from '../knowledge-evolution/contracts.mjs';
import { nowIso, sha256 } from '../knowledge-evolution/util.mjs';
import { assertProductBinding, requireScope } from './auth.mjs';
import { KnowledgeHubError } from './errors.mjs';
import { validateRepository } from './repository.mjs';

function expiry(receivedAt, retentionDays) {
  if (retentionDays === null || retentionDays === undefined) return null;
  const ms = Date.parse(receivedAt) + retentionDays * 86400_000;
  return new Date(ms).toISOString();
}
function reason(error) { return error?.code && /^[A-Z0-9_:-]+$/.test(error.code) ? error.code : 'HUB_EVENT_REJECTED'; }

export function createCommonIngestionCore({ repository, rateLimiter = null, clock = () => new Date(), retentionDays = 30 } = {}) {
  const repo = validateRepository(repository);
  let receiptCounter = 0;
  return Object.freeze({
    async submitBatch(rawBatch, { authContext, transport = 'https' } = {}) {
      const auth = requireScope(authContext, 'evidence:write');
      const envelope = validateConsumerEvidenceBatchEnvelope(rawBatch);
      assertProductBinding(auth, envelope.product.product_id);
      rateLimiter?.consume(auth.subject_id);
      const receivedAt = nowIso(clock);
      const accepted = [], alreadySeen = [], rejected = [];
      for (const rawEvent of envelope.events) {
        try {
          const event = validateCanonicalConsumerEvidenceEvent(rawEvent, { catalog: true });
          const knowledgeEvidence = mapConsumerEventToKnowledgeEvidence(event, { product: envelope.product, trustLevel: auth.trust_level });
          const stored = await repo.storeEvent({
            product_id: envelope.product.product_id,
            product_version: envelope.product.product_version,
            installation_id: envelope.installation.installation_id,
            subject_id: auth.subject_id,
            trust_level: auth.trust_level,
            transport,
            event,
            event_hash: sha256(event),
            knowledge_evidence: knowledgeEvidence,
            received_at: receivedAt,
            expires_at: expiry(receivedAt, retentionDays)
          });
          if (stored.outcome === 'ACCEPTED') accepted.push(event.event_id);
          else if (stored.outcome === 'ALREADY_SEEN') alreadySeen.push(event.event_id);
          else rejected.push({ event_id: event.event_id, reason_code: 'HUB_EVENT_ID_CONFLICT' });
        } catch (error) {
          rejected.push({ event_id: rawEvent.event_id, reason_code: reason(error) });
        }
      }
      receiptCounter += 1;
      const receipt = validateDeliveryReceipt({
        receipt_version: '1.0',
        receipt_id: `hub-${String(receiptCounter).padStart(8, '0')}`,
        batch_id: envelope.batch_id,
        accepted,
        already_seen: alreadySeen,
        rejected,
        server_time: receivedAt
      });
      await repo.saveReceipt({ receipt, subject_id: auth.subject_id, product_id: auth.product_id, transport });
      return receipt;
    },
    async backfillBatch(rawBatch, context = {}) { return this.submitBatch(rawBatch, { ...context, transport: 'object-storage-backfill' }); },
    async getClientPolicy({ authContext } = {}) {
      const auth = requireScope(authContext, 'policy:read');
      return (await repo.getPolicy(auth.product_id)) ?? DEFAULT_CLIENT_POLICY;
    },
    async checkReady() {
      if (typeof repo.checkReady !== 'function') return { ready: false, backend: 'unknown', reason: 'repository-readiness-unsupported' };
      try {
        const result = await repo.checkReady();
        return { ready: result?.ready === true, backend: result?.backend ?? 'unknown' };
      } catch {
        return { ready: false, backend: 'unknown', reason: 'repository-check-failed' };
      }
    },
    async pruneExpired() {
      if (typeof repo.pruneExpired !== 'function') throw new KnowledgeHubError('HUB_RETENTION_UNSUPPORTED', 'Repository does not support pruning', { status: 501 });
      return repo.pruneExpired(nowIso(clock));
    }
  });
}
