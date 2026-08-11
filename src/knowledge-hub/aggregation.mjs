import { sha256 } from '../knowledge-evolution/util.mjs';

export function aggregateEvidenceRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const e = record.event;
    const key = `${record.product_id}\0${record.product_version}\0${e.feature ?? e.operation}\0${e.type}\0${e.result ?? 'observed'}`;
    const g = groups.get(key) ?? { product_id: record.product_id, product_version: record.product_version, feature: e.feature ?? e.operation, event_type: e.type, result: e.result ?? 'observed', observations: 0, duration_total_ms: 0, retry_total: 0, evidence_ids: [] };
    g.observations += 1;
    g.duration_total_ms += e.duration_ms ?? 0;
    g.retry_total += e.retry_count ?? 0;
    if (record.knowledge_evidence?.evidence_id) g.evidence_ids.push(record.knowledge_evidence.evidence_id);
    groups.set(key, g);
  }
  return [...groups.values()].map(g => Object.freeze({ ...g, evidence_ids: Object.freeze([...new Set(g.evidence_ids)].sort()) })).sort((a, b) => `${a.feature}:${a.result}`.localeCompare(`${b.feature}:${b.result}`));
}

export function createCandidateHandoff(aggregate, { minimumObservations = 2 } = {}) {
  if (!aggregate || aggregate.observations < minimumObservations || aggregate.evidence_ids.length < 1) return null;
  const digest = sha256(aggregate).slice(0, 24).toUpperCase();
  return Object.freeze({
    schema_version: '1.0',
    candidate_id: `KC-RUNTIME-${digest}`,
    source_evidence_ids: [...aggregate.evidence_ids],
    status: 'CANDIDATE',
    scope: 'project',
    risk: 'MEDIUM',
    title: `${aggregate.feature} runtime observation pattern`,
    statement: `${aggregate.feature} produced result=${aggregate.result} in ${aggregate.observations} observed events for Product ${aggregate.product_id} ${aggregate.product_version}.`,
    rationale: 'Runtime frequency is evidence only; this handoff requires Critic review and does not authorize promotion.',
    supersedes: null,
    required_review: 'CRITIC'
  });
}
