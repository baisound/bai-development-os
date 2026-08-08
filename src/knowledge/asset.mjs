import {
  KNOWLEDGE_TYPES, ASSET_STATUSES, MATURITY_STAGES, ENFORCEMENT_LEVELS,
  SOURCE_TRUST_LEVELS, SENSITIVITY_LEVELS, RELATION_TYPES, PATTERN_KINDS, DECISION_STATUSES
} from './constants.mjs';
import { KnowledgeError } from './errors.mjs';
import { checksumObject, deepFreeze, nowIso, parseTime, requireArray, requireEnum, requireNumber, requireString, safeId } from './util.mjs';
import { validateScope } from './taxonomy.mjs';

function stringArray(value, name) { return requireArray(value ?? [], name).map((v,i)=>requireString(v,`${name}[${i}]`)); }
function validateRelations(relations = []) {
  return requireArray(relations, 'relations').map((r, i) => ({
    type: requireEnum(r.type, RELATION_TYPES, `relations[${i}].type`),
    target_asset_id: safeId(r.target_asset_id, `relations[${i}].target_asset_id`),
    reason: r.reason ? requireString(r.reason, `relations[${i}].reason`) : undefined
  }));
}
function validateApplicability(app = {}) {
  if (!app || typeof app !== 'object' || Array.isArray(app)) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID','applicability invalid');
  const out = {};
  for (const key of ['roles','phases','environment_tags','project_tags']) if (app[key] !== undefined) out[key] = stringArray(app[key], `applicability.${key}`);
  if (app.tool_versions !== undefined) {
    if (!app.tool_versions || typeof app.tool_versions !== 'object' || Array.isArray(app.tool_versions)) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID','tool_versions invalid');
    out.tool_versions = Object.fromEntries(Object.entries(app.tool_versions).map(([k,v])=>[requireString(k,'tool name'),requireString(v,`tool_versions.${k}`)]));
  }
  return out;
}
export function validateFailureKnowledge(failure) {
  if (!failure || typeof failure !== 'object') throw new KnowledgeError('KNOWLEDGE_FAILURE_SCHEMA_INVALID');
  const out = {
    fingerprint: requireString(failure.fingerprint,'failure.fingerprint'),
    failure_mode: requireString(failure.failure_mode,'failure.failure_mode'),
    environment_scope: stringArray(failure.environment_scope ?? [],'failure.environment_scope'),
    safe_action: requireString(failure.safe_action,'failure.safe_action'),
    prohibited_inference: stringArray(failure.prohibited_inference ?? [],'failure.prohibited_inference'),
    evidence_refs: stringArray(failure.evidence_refs ?? [],'failure.evidence_refs'),
    recurrence_key: failure.recurrence_key ? requireString(failure.recurrence_key,'failure.recurrence_key') : undefined
  };
  if (out.evidence_refs.length === 0) throw new KnowledgeError('KNOWLEDGE_FAILURE_EVIDENCE_REQUIRED');
  return deepFreeze(out);
}
export function validatePatternRecord(pattern) {
  if (!pattern || typeof pattern !== 'object') throw new KnowledgeError('KNOWLEDGE_PATTERN_SCHEMA_INVALID');
  return deepFreeze({
    kind: requireEnum(pattern.kind, PATTERN_KINDS, 'pattern.kind'),
    problem: requireString(pattern.problem,'pattern.problem'),
    context: requireString(pattern.context,'pattern.context'),
    solution: requireString(pattern.solution,'pattern.solution'),
    consequences: stringArray(pattern.consequences ?? [],'pattern.consequences'),
    indicators: stringArray(pattern.indicators ?? [],'pattern.indicators')
  });
}
export function validateDecisionRecord(decision) {
  if (!decision || typeof decision !== 'object') throw new KnowledgeError('KNOWLEDGE_DECISION_SCHEMA_INVALID');
  return deepFreeze({
    decision_id: safeId(decision.decision_id,'decision.decision_id'),
    status: requireEnum(decision.status ?? 'ACCEPTED', DECISION_STATUSES, 'decision.status'),
    context: requireString(decision.context,'decision.context'),
    decision: requireString(decision.decision,'decision.decision'),
    consequences: stringArray(decision.consequences ?? [],'decision.consequences'),
    alternatives: stringArray(decision.alternatives ?? [],'decision.alternatives'),
    supersedes: decision.supersedes ? safeId(decision.supersedes,'decision.supersedes') : undefined
  });
}
export function validateKnowledgeAsset(input, { verifyChecksum = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID');
  const a = structuredClone(input);
  safeId(a.asset_id,'asset_id');
  if (!Number.isSafeInteger(a.revision) || a.revision < 1) throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID','revision invalid');
  requireString(a.title,'title');
  requireEnum(a.knowledge_type, KNOWLEDGE_TYPES,'knowledge_type');
  requireEnum(a.status, ASSET_STATUSES,'status');
  requireEnum(a.maturity,'maturity' in a ? MATURITY_STAGES : [],'maturity');
  requireEnum(a.enforcement, ENFORCEMENT_LEVELS,'enforcement');
  a.scope = validateScope(a.scope);
  requireEnum(a.source_trust,SOURCE_TRUST_LEVELS,'source_trust');
  requireEnum(a.sensitivity,SENSITIVITY_LEVELS,'sensitivity');
  requireNumber(a.confidence,'confidence',0,1);
  a.tags = stringArray(a.tags ?? [],'tags');
  a.taxonomy_node_ids = stringArray(a.taxonomy_node_ids ?? [],'taxonomy_node_ids');
  a.relations = validateRelations(a.relations ?? []);
  a.applicability = validateApplicability(a.applicability ?? {});
  if (!a.provenance || typeof a.provenance !== 'object') throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID','provenance required');
  a.provenance = {
    source_ids: stringArray(a.provenance.source_ids ?? [],'provenance.source_ids'),
    evidence_refs: stringArray(a.provenance.evidence_refs ?? [],'provenance.evidence_refs'),
    created_by: requireString(a.provenance.created_by,'provenance.created_by')
  };
  if (a.provenance.source_ids.length === 0 && a.provenance.evidence_refs.length === 0) throw new KnowledgeError('KNOWLEDGE_PROVENANCE_REQUIRED');
  if (!a.content || typeof a.content !== 'object') throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID','content required');
  a.content = {
    summary: requireString(a.content.summary,'content.summary'),
    guidance: stringArray(a.content.guidance ?? [],'content.guidance'),
    required_actions: stringArray(a.content.required_actions ?? [],'content.required_actions'),
    prohibited_actions: stringArray(a.content.prohibited_actions ?? [],'content.prohibited_actions'),
    verification_steps: stringArray(a.content.verification_steps ?? [],'content.verification_steps')
  };
  if (!a.freshness || typeof a.freshness !== 'object') throw new KnowledgeError('KNOWLEDGE_SCHEMA_INVALID','freshness required');
  parseTime(a.freshness.review_after,'freshness.review_after');
  if (a.freshness.expires_at) parseTime(a.freshness.expires_at,'freshness.expires_at');
  if (a.freshness.expires_at && Date.parse(a.freshness.expires_at) < Date.parse(a.freshness.review_after)) throw new KnowledgeError('KNOWLEDGE_FRESHNESS_INVALID','expires_at before review_after');
  parseTime(a.created_at,'created_at'); parseTime(a.updated_at,'updated_at');
  if (a.knowledge_type === 'FAILURE_CASE') a.failure = validateFailureKnowledge(a.failure);
  if (a.pattern !== undefined) a.pattern = validatePatternRecord(a.pattern);
  if (a.knowledge_type === 'ADR') a.decision = validateDecisionRecord(a.decision);
  const expected = checksumObject(a);
  if (verifyChecksum && a.checksum !== expected) throw new KnowledgeError('KNOWLEDGE_CHECKSUM_MISMATCH', a.asset_id, { expected, actual:a.checksum });
  a.checksum = expected;
  return deepFreeze(a);
}
export function createKnowledgeAsset(input, { clock } = {}) {
  const ts = nowIso(clock);
  return validateKnowledgeAsset({
    status:'CANDIDATE', maturity:'EXPERIENCE', enforcement:'REFERENCE', source_trust:'USER_OBSERVED', sensitivity:'INTERNAL', confidence:0.5,
    tags:[], taxonomy_node_ids:[], relations:[], applicability:{},
    ...input, revision:1, created_at: input.created_at ?? ts, updated_at: ts
  });
}
export function reviseKnowledgeAsset(previous, patch, { clock } = {}) {
  const current = validateKnowledgeAsset(previous,{verifyChecksum:true});
  if (patch.asset_id && patch.asset_id !== current.asset_id) throw new KnowledgeError('KNOWLEDGE_ID_IMMUTABLE');
  if (patch.revision && patch.revision !== current.revision + 1) throw new KnowledgeError('KNOWLEDGE_REVISION_SEQUENCE');
  return validateKnowledgeAsset({ ...structuredClone(current), ...structuredClone(patch), asset_id:current.asset_id, revision:current.revision+1, created_at:current.created_at, updated_at:nowIso(clock), checksum:undefined });
}
export function estimateAssetTokens(asset) {
  const a = validateKnowledgeAsset(asset);
  const useful = {title:a.title,content:a.content,pattern:a.pattern,failure:a.failure,decision:a.decision};
  return Math.max(1, Math.ceil(JSON.stringify(useful).length / 4));
}
