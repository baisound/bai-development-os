import { createHash } from 'node:crypto';
import {
  BLOCKING_CLAIM_RESULTS, CANDIDATE_ROUTES, CLAIM_RESULTS, COMPLETENESS_RESULTS,
  COVERAGE_STATES, DESIGN_GOVERNANCE_SCHEMA_VERSION, DESIGN_SECTION_COUNT,
  INTAKE_STATES, INTAKE_TRANSITIONS, OWNERSHIP_CLASSES, SEVERITIES,
  SENSITIVITY_CLASSES,
} from './constants.mjs';
import { DesignGovernanceError } from './errors.mjs';

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export const stableStringify = (value) => JSON.stringify(canonicalize(value));
export const sha256 = (value) => `sha256:${createHash('sha256').update(Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : stableStringify(value))).digest('hex')}`;
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}

function string(value, name, { max = 1024, pattern = null } = {}) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || (pattern && !pattern.test(value))) {
    throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', `${name} is invalid`, { field: name });
  }
  return value.trim();
}
function list(value, name, { max = 1000 } = {}) {
  if (!Array.isArray(value) || value.length > max) throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', `${name} must be a bounded array`, { field: name });
  return value;
}
function enumValue(value, values, name) {
  if (!values.includes(value)) throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', `${name} is invalid`, { field: name });
  return value;
}
function safeId(value, name) { return string(value, name, { max: 128, pattern: SAFE_ID }); }
function checksum(value, name) { return string(value, name, { max: 71, pattern: SHA256 }); }
function unique(values, name) {
  if (new Set(values).size !== values.length) throw new DesignGovernanceError('DESIGN_GOVERNANCE_DUPLICATE', `${name} contains duplicates`);
  return values;
}
function factValue(value, name) {
  if (value === null || ['string', 'boolean'].includes(typeof value) || (typeof value === 'number' && Number.isFinite(value))) return value;
  throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', `${name} must be a scalar canonical fact`);
}
function finalize(record, checksumField = 'content_checksum') {
  const copy = structuredClone(record);
  delete copy[checksumField];
  const output = { ...copy, [checksumField]: sha256(copy) };
  return deepFreeze(output);
}
export function verifyRecordChecksum(record, checksumField = 'content_checksum') {
  if (!record || !SHA256.test(record[checksumField] ?? '')) throw new DesignGovernanceError('DESIGN_GOVERNANCE_CHECKSUM_MISSING');
  const copy = structuredClone(record); const expected = copy[checksumField]; delete copy[checksumField];
  if (sha256(copy) !== expected) throw new DesignGovernanceError('DESIGN_GOVERNANCE_CHECKSUM_MISMATCH');
  return true;
}

export function createHandoffIntakeManifest(input = {}) {
  const artifacts = unique(list(input.source_artifacts, 'source_artifacts', { max: 256 }).map((item) => ({
    artifact_id: safeId(item.artifact_id, 'artifact_id'),
    source_name: string(item.source_name, 'source_name', { max: 512 }),
    sha256: checksum(item.sha256, 'sha256'),
    size_bytes: Number.isSafeInteger(item.size_bytes) && item.size_bytes >= 0 ? item.size_bytes : (() => { throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', 'size_bytes is invalid'); })(),
    retention_location: item.retention_location == null ? null : string(item.retention_location, 'retention_location', { max: 2048 }),
  })).sort((a, b) => a.artifact_id.localeCompare(b.artifact_id)), 'source artifact IDs');
  const artifactIds = artifacts.map((x) => x.artifact_id);
  unique(artifactIds, 'source artifact IDs');
  if (input.canonical_authority !== false) throw new DesignGovernanceError('HANDOFF_AUTHORITY_FORBIDDEN', 'handoff must explicitly declare canonical_authority=false');
  const fingerprintBody = {
    project_id: safeId(input.project_id, 'project_id'), consumer_id: safeId(input.consumer_id, 'consumer_id'),
    claimed_ref: string(input.claimed_ref, 'claimed_ref', { max: 512 }),
    design_contract_major: 1, artifact_hashes: artifacts.map((x) => x.sha256),
  };
  const record = {
    schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION,
    record_type: 'handoff-intake-manifest',
    intake_id: safeId(input.intake_id, 'intake_id'),
    project_id: fingerprintBody.project_id,
    consumer_id: fingerprintBody.consumer_id,
    supplied_at: (() => { const value = new Date(string(input.supplied_at, 'supplied_at')); if (Number.isNaN(value.getTime())) throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', 'supplied_at is invalid'); return value.toISOString(); })(),
    source_artifacts: artifacts,
    claimed_repository: string(input.claimed_repository, 'claimed_repository', { max: 2048 }),
    claimed_ref: fingerprintBody.claimed_ref,
    claimed_version: input.claimed_version == null ? null : string(input.claimed_version, 'claimed_version', { max: 128 }),
    provenance_complete: Boolean(input.provenance_complete),
    sensitivity: enumValue(input.sensitivity ?? 'INTERNAL', SENSITIVITY_CLASSES, 'sensitivity'),
    missing_sources: [...new Set(list(input.missing_sources ?? [], 'missing_sources').map((x) => string(x, 'missing_source', { max: 1024 })))].sort(),
    assumptions: [...new Set(list(input.assumptions ?? [], 'assumptions').map((x) => string(x, 'assumption', { max: 1024 })))].sort(),
    canonical_authority: false,
    source_fingerprint: sha256(fingerprintBody),
    idempotency_key: sha256(fingerprintBody),
  };
  return finalize(record);
}

export function assertIntakeTransition(from, to) {
  enumValue(from, INTAKE_STATES, 'from'); enumValue(to, INTAKE_STATES, 'to');
  if (!(INTAKE_TRANSITIONS[from] ?? []).includes(to)) throw new DesignGovernanceError('INTAKE_STATE_TRANSITION_INVALID', `${from} -> ${to}`);
  return true;
}
export function transitionIntake(stateRecord, to, evidenceRefs = [], { authorization = null } = {}) {
  assertIntakeTransition(stateRecord.state, to);
  let authorizationBinding = null;
  if (to === 'AUTHORIZED') {
    if (authorization?.owner_authorized !== true) throw new DesignGovernanceError('INTAKE_AUTHORIZATION_BINDING_REQUIRED');
    authorizationBinding = { owner_authorized: true, task_id: safeId(authorization.task_id, 'authorization.task_id'), design_checksum: checksum(authorization.design_checksum, 'authorization.design_checksum'), allowed_files_checksum: checksum(authorization.allowed_files_checksum, 'authorization.allowed_files_checksum'), authorization_ref: checksum(authorization.authorization_ref, 'authorization.authorization_ref') };
  }
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'intake-state', intake_id: safeId(stateRecord.intake_id, 'intake_id'), state: to, previous_state: stateRecord.state, evidence_refs: list(evidenceRefs, 'evidence_refs').map((x) => checksum(x, 'evidence_ref')), authorization_binding: authorizationBinding });
}

export function curateHandoffSources(manifest, decisions = []) {
  verifyRecordChecksum(manifest);
  const known = new Set(manifest.source_artifacts.map((x) => x.artifact_id));
  const rows = list(decisions, 'decisions', { max: 256 }).map((row) => {
    if (!known.has(row.artifact_id)) throw new DesignGovernanceError('SOURCE_CURATION_UNKNOWN_ARTIFACT', row.artifact_id);
    return {
      artifact_id: safeId(row.artifact_id, 'artifact_id'), ownership: enumValue(row.ownership, OWNERSHIP_CLASSES, 'ownership'),
      relevance: enumValue(row.relevance, ['RELEVANT', 'SUPPORTING', 'OUT_OF_SCOPE', 'UNKNOWN'], 'relevance'),
      freshness: enumValue(row.freshness, ['CURRENT', 'HISTORICAL', 'STALE', 'UNKNOWN'], 'freshness'),
      superseded_by: row.superseded_by == null ? null : safeId(row.superseded_by, 'superseded_by'),
      retention: enumValue(row.retention, ['REFERENCE_ONLY', 'DERIVED_ONLY', 'RETAIN', 'REJECT'], 'retention'),
      redaction: enumValue(row.redaction, ['NONE', 'REQUIRED', 'COMPLETED', 'REJECTED'], 'redaction'),
    };
  }).sort((a, b) => a.artifact_id.localeCompare(b.artifact_id));
  unique(rows.map((x) => x.artifact_id), 'curation artifact IDs');
  if (rows.length !== known.size) throw new DesignGovernanceError('SOURCE_CURATION_INCOMPLETE');
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'source-curation-record', intake_id: manifest.intake_id, decisions: rows, canonical_authority: false });
}

export function revalidateHandoffClaims({ intake_id, observation, canonical_facts = {}, claims = [] } = {}) {
  const observed = {
    os_root: string(observation?.os_root, 'os_root', { max: 2048 }), branch: string(observation?.branch, 'branch', { max: 512 }),
    head_sha: checksum(observation?.head_sha, 'head_sha'), dirty: Boolean(observation?.dirty), status_revision: checksum(observation?.status_revision, 'status_revision'),
  };
  if (!canonical_facts || typeof canonical_facts !== 'object' || Array.isArray(canonical_facts)) throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', 'canonical_facts is invalid');
  const factRows = Object.entries(canonical_facts).map(([fact_key, value]) => { const checked = factValue(value, `canonical_facts.${fact_key}`); return { fact_key: string(fact_key, 'fact_key', { max: 512 }), value: checked, value_checksum: sha256(checked) }; }).sort((a, b) => a.fact_key.localeCompare(b.fact_key));
  const facts = Object.fromEntries(factRows.map((x) => [x.fact_key, x.value]));
  const results = list(claims, 'claims').map((claim) => {
    const severity = enumValue(claim.severity ?? 'MEDIUM', SEVERITIES, 'severity');
    const current = facts[claim.fact_key];
    const claimedValue = factValue(claim.claimed_value ?? null, `claims.${claim.claim_id}.claimed_value`);
    let result = claim.result;
    if (!result) result = current === undefined ? 'MISSING_EVIDENCE' : current === claimedValue ? 'CONFIRMED_CURRENT' : 'CONFLICTS_WITH_CURRENT_CANONICAL';
    enumValue(result, CLAIM_RESULTS, 'claim result');
    return { claim_id: safeId(claim.claim_id, 'claim_id'), fact_key: string(claim.fact_key, 'fact_key', { max: 512 }), severity, claimed_value: claimedValue, observed_value: current ?? null, result, evidence_refs: list(claim.evidence_refs ?? [], 'evidence_refs').map((x) => checksum(x, 'evidence_ref')) };
  }).sort((a, b) => a.claim_id.localeCompare(b.claim_id));
  unique(results.map((x) => x.claim_id), 'claim IDs');
  const blocking = results.filter((x) => ['HIGH', 'CRITICAL'].includes(x.severity) && BLOCKING_CLAIM_RESULTS.includes(x.result));
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'handoff-revalidation-report', intake_id: safeId(intake_id, 'intake_id'), observation: observed, canonical_facts: factRows, claim_results: results, gate_result: blocking.length ? 'FAIL' : 'PASS', canonical_authority: false });
}

export function mapExistingImplementation({ intake_id, requirements = [], repository_index = [] } = {}) {
  const index = list(repository_index, 'repository_index').map((x) => ({ kind: enumValue(x.kind, ['TASK', 'SUBSYSTEM', 'MODULE', 'SCHEMA', 'STORE', 'TEST', 'UI', 'ADAPTER'], 'kind'), id: string(x.id, 'id', { max: 1024 }), requirement_ids: list(x.requirement_ids ?? [], 'requirement_ids').map((id) => safeId(id, 'requirement_id')) }));
  return deepFreeze(list(requirements, 'requirements').map((requirement) => {
    const requirementId = safeId(requirement.requirement_id, 'requirement_id');
    const mappings = index.filter((x) => x.requirement_ids.includes(requirementId)).map(({ kind, id }) => ({ kind, id })).sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
    const state = mappings.length === 0 ? 'MISSING' : (requirement.expected_mappings && mappings.length < requirement.expected_mappings ? 'PARTIAL' : 'IMPLEMENTED');
    enumValue(state, COVERAGE_STATES, 'coverage state');
    return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'implementation-coverage-record', intake_id: safeId(intake_id, 'intake_id'), requirement_id: requirementId, mappings, coverage_state: state, change_surface: list(requirement.change_surface ?? [], 'change_surface').map((x) => string(x, 'change_surface item', { max: 1024 })), canonical_authority: false });
  }));
}

export function discoverDesignGaps({ intake_id, challenges = [] } = {}) {
  return deepFreeze(list(challenges, 'challenges').filter((x) => x.disposition !== 'CLOSED').map((gap) => finalize({
    schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'design-gap-register', intake_id: safeId(intake_id, 'intake_id'),
    gap_id: safeId(gap.gap_id, 'gap_id'), category: string(gap.category, 'category', { max: 128 }), severity: enumValue(gap.severity, SEVERITIES, 'severity'),
    confidence: Number.isFinite(gap.confidence) && gap.confidence >= 0 && gap.confidence <= 1 ? gap.confidence : (() => { throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', 'confidence is invalid'); })(),
    evidence_refs: list(gap.evidence_refs ?? [], 'evidence_refs').map((x) => checksum(x, 'evidence_ref')), disposition: enumValue(gap.disposition ?? 'OPEN', ['OPEN', 'OWNER_REQUIRED', 'DEFERRED', 'REJECTED'], 'disposition'),
    required_authority: string(gap.required_authority ?? 'NONE', 'required_authority', { max: 512 }), canonical_authority: false,
  })));
}

export function analyzeRoadmapImpact(input = {}) {
  if (input.allocate_task === true || input.mutate_canonical === true) throw new DesignGovernanceError('ROADMAP_AUTHORITY_FORBIDDEN');
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'roadmap-impact-record', intake_id: safeId(input.intake_id, 'intake_id'), decision: enumValue(input.decision, ['INSERT', 'MERGE_EXISTING_TASK', 'DEFER', 'REJECT', 'NO_CHANGE'], 'decision'), dependencies: list(input.dependencies ?? [], 'dependencies').map((x) => safeId(x, 'dependency')), insertion_point: input.insertion_point == null ? null : string(input.insertion_point, 'insertion_point', { max: 512 }), safe_checkpoint: checksum(input.safe_checkpoint, 'safe_checkpoint'), blocked_tasks: list(input.blocked_tasks ?? [], 'blocked_tasks').map((x) => safeId(x, 'blocked_task')), unaffected_tasks: list(input.unaffected_tasks ?? [], 'unaffected_tasks').map((x) => safeId(x, 'unaffected_task')), migration: enumValue(input.migration ?? 'NONE', ['NONE', 'COMPATIBLE', 'BREAKING_REQUIRES_PLAN'], 'migration'), owner_gates: list(input.owner_gates ?? [], 'owner_gates').map((x) => string(x, 'owner_gate', { max: 512 })), proposed_source_count_effect: Number.isSafeInteger(input.proposed_source_count_effect) ? input.proposed_source_count_effect : 0, task_allocation_authority: false, canonical_mutation_authority: false });
}

export function evaluateDesignCompleteness({ intake_id, sections = [], critic_refs = [], judge_refs = [], stale = false } = {}) {
  const normalized = list(sections, 'sections', { max: DESIGN_SECTION_COUNT }).map((section) => ({ section_id: safeId(section.section_id, 'section_id'), status: enumValue(section.status, ['COMPLETE', 'NOT_APPLICABLE', 'MISSING'], 'section status'), justification: section.status === 'NOT_APPLICABLE' ? string(section.justification, 'justification', { max: 2048 }) : (section.justification ?? null) }));
  unique(normalized.map((x) => x.section_id), 'design section IDs');
  let gateResult = stale ? 'STALE' : normalized.length !== DESIGN_SECTION_COUNT || normalized.some((x) => x.status === 'MISSING') ? 'FAIL' : !critic_refs.length || !judge_refs.length ? 'OWNER_DECISION_REQUIRED' : 'PASS';
  enumValue(gateResult, COMPLETENESS_RESULTS, 'gate result');
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'design-completeness-report', intake_id: safeId(intake_id, 'intake_id'), sections: normalized, critic_refs: list(critic_refs, 'critic_refs').map((x) => checksum(x, 'critic_ref')), judge_refs: list(judge_refs, 'judge_refs').map((x) => checksum(x, 'judge_ref')), gate_result: gateResult, canonical_authority: false });
}

export function routeImprovementCandidate(input = {}) {
  if (input.recommendation === 'KNOWLEDGE' && (input.reproducibility !== 'REPRODUCED' || input.recurrence < 2 || input.critic_disposition !== 'PASS')) throw new DesignGovernanceError('KNOWLEDGE_RECOMMENDATION_EVIDENCE_INSUFFICIENT');
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'improvement-candidate-routing-record', intake_id: safeId(input.intake_id, 'intake_id'), candidate_id: safeId(input.candidate_id, 'candidate_id'), observation: string(input.observation, 'observation', { max: 4096 }), reproducibility: enumValue(input.reproducibility, ['REPRODUCED', 'NOT_REPRODUCED', 'UNKNOWN'], 'reproducibility'), recurrence: Number.isSafeInteger(input.recurrence) && input.recurrence >= 0 ? input.recurrence : (() => { throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', 'recurrence is invalid'); })(), scope: enumValue(input.scope, ['LOCAL', 'PROJECT', 'CROSS_PROJECT'], 'scope'), severity: enumValue(input.severity, SEVERITIES, 'severity'), critic_disposition: enumValue(input.critic_disposition, ['PASS', 'REJECT', 'MORE_EVIDENCE_REQUIRED'], 'critic_disposition'), recommendation: enumValue(input.recommendation, CANDIDATE_ROUTES, 'recommendation'), knowledge_promotion_authority: false, task_allocation_authority: false });
}

export function createRegressionSurfaceRecord(input = {}) {
  const strings = (value, name) => list(value ?? [], name).map((x) => string(x, `${name} item`, { max: 1024 }));
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'regression-surface-record', intake_id: safeId(input.intake_id, 'intake_id'), visible_functions: strings(input.visible_functions, 'visible_functions'), commands: strings(input.commands, 'commands'), state_transitions: strings(input.state_transitions, 'state_transitions'), schemas: strings(input.schemas, 'schemas'), ui_adapter_behavior: strings(input.ui_adapter_behavior, 'ui_adapter_behavior'), tests: strings(input.tests, 'tests'), native_evidence_refs: list(input.native_evidence_refs ?? [], 'native_evidence_refs').map((x) => checksum(x, 'native_evidence_ref')), protected_invariants: strings(input.protected_invariants, 'protected_invariants'), canonical_authority: false });
}

export function createInteractionAcceptanceRecord(input = {}) {
  const resultValues = ['PASS', 'FAIL', 'NOT_APPLICABLE', 'PARKED'];
  const evidenceClass = enumValue(input.evidence_class, ['REAL_NATIVE', 'HOSTED_ONLY', 'MOCK', 'STATIC', 'UNKNOWN'], 'evidence_class');
  const checks = Object.fromEntries(['actual_event_semantics', 'layout_dpi', 'accessibility', 'long_data', 'recovery'].map((name) => [name, enumValue(input[name], resultValues, name)]));
  const evidenceRefs = list(input.evidence_refs ?? [], 'evidence_refs').map((x) => checksum(x, 'evidence_ref'));
  if (input.acceptance_result === 'PASS' && (evidenceClass !== 'REAL_NATIVE' || !evidenceRefs.length || Object.values(checks).some((x) => !['PASS', 'NOT_APPLICABLE'].includes(x)))) throw new DesignGovernanceError('NATIVE_ACCEPTANCE_EVIDENCE_INSUFFICIENT');
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'interaction-acceptance-record', intake_id: safeId(input.intake_id, 'intake_id'), environment_identity: string(input.environment_identity, 'environment_identity', { max: 1024 }), evidence_class: evidenceClass, ...checks, evidence_refs: evidenceRefs, acceptance_result: enumValue(input.acceptance_result, ['PASS', 'FAIL', 'PARKED'], 'acceptance_result'), canonical_authority: false });
}

export function createDesignIntakeCheckpoint(input = {}) {
  return finalize({ schema_version: DESIGN_GOVERNANCE_SCHEMA_VERSION, record_type: 'design-intake-checkpoint', intake_id: safeId(input.intake_id, 'intake_id'), revision: Number.isSafeInteger(input.revision) && input.revision > 0 ? input.revision : (() => { throw new DesignGovernanceError('DESIGN_GOVERNANCE_INPUT_INVALID', 'revision is invalid'); })(), project_id: safeId(input.project_id, 'project_id'), task_id: safeId(input.task_id, 'task_id'), capability_id: safeId(input.capability_id, 'capability_id'), head_sha: checksum(input.head_sha, 'head_sha'), status_revision: checksum(input.status_revision, 'status_revision'), source_fingerprint: checksum(input.source_fingerprint, 'source_fingerprint'), saved_state: enumValue(input.saved_state, INTAKE_STATES, 'saved_state'), canonical_authority: false });
}
export function resumeDesignIntake(checkpoint, current = {}) {
  verifyRecordChecksum(checkpoint);
  const changed = checkpoint.intake_id !== current.intake_id || checkpoint.revision !== current.revision || checkpoint.project_id !== current.project_id || checkpoint.task_id !== current.task_id || checkpoint.capability_id !== current.capability_id || checkpoint.head_sha !== current.head_sha || checkpoint.status_revision !== current.status_revision || checkpoint.source_fingerprint !== current.source_fingerprint;
  return deepFreeze({ result: changed ? 'DESIGN_INTAKE_STALE' : 'DESIGN_INTAKE_RESUME_ALLOWED', intake_id: checkpoint.intake_id, revision: checkpoint.revision, previous_state: checkpoint.saved_state, automatic_mutation_allowed: false, revalidation_required: changed });
}
