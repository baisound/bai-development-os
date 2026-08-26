import { createHash, randomUUID } from 'node:crypto';
import { validateContextManifest } from '../../context-control/index.mjs';
import { verifyAuthorizationEnvelope } from '../../security/authorization.mjs';
import { signEnvelope, verifySignedEnvelope } from '../../security/signing.mjs';

export const DESIGN_ONLY_OPERATIONS = Object.freeze({
  CLASSIFY: 'TASK_CLASSIFICATION',
  COMPLETE: 'DESIGN_ONLY_CLOSURE',
  LEGACY_ATTEST: 'LEGACY_COMPLETION_ATTEST',
});

export const DESIGN_ONLY_SKIPPED_PHASES = Object.freeze([
  'IMPLEMENTATION_AUTHORIZATION', 'IMPLEMENTATION', 'TESTING',
  'IMPLEMENTATION_REVIEW', 'FINAL_JUDGMENT', 'POLICY_REVIEW',
]);

export const DESIGN_ONLY_BASE_SOURCES = Object.freeze({
  TASK_CLASSIFICATION: Object.freeze(['allowed-files', 'canonical-status', 'final-plan', 'task-definition']),
  DESIGN_ONLY_CLOSURE: Object.freeze([
    'allowed-files', 'canonical-status', 'classification-commit-receipt',
    'critic-round-1', 'critic-round-2', 'critic-round-3', 'final-plan',
    'judge-decision', 'task-definition',
  ]),
  LEGACY_COMPLETION_ATTEST: Object.freeze(['allowed-files', 'canonical-status', 'completion-evidence', 'task-definition', 'transition-log']),
});

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const canonical = (value) => JSON.stringify(sort(value));
const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const without = (value, field = 'content_checksum') => {
  const copy = structuredClone(value); delete copy[field]; return copy;
};
export const designOnlyChecksum = (value, field = 'content_checksum') => `sha256:${createHash('sha256').update(canonical(without(value, field))).digest('hex')}`;
const same = (left, right) => canonical(left) === canonical(right);
const exactKeys = (value, required, optional = []) => Boolean(value) && typeof value === 'object' && !Array.isArray(value) && required.every((field) => field in value) && Object.keys(value).every((field) => required.includes(field) || optional.includes(field));
const assertSha = (value, code, name) => { if (!SHA256.test(value ?? '')) throw new DesignOnlyClosureError(code, `${name} invalid`); };
const time = (value, code) => {
  const parsed = typeof value === 'string' && RFC3339.test(value) ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(parsed)) throw new DesignOnlyClosureError(code);
  return parsed;
};
const keyChecksum = (key) => {
  try { return `sha256:${createHash('sha256').update(key.export({ type: 'spki', format: 'der' })).digest('hex')}`; }
  catch { throw new DesignOnlyClosureError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED'); }
};
const signatureChecksum = (signature) => `sha256:${createHash('sha256').update(String(signature ?? '')).digest('hex')}`;

export class DesignOnlyClosureError extends Error {
  constructor(code, message = code) { super(message); this.name = 'DesignOnlyClosureError'; this.code = code; }
}

export function finalizeDesignOnlyArtifact(value) {
  const artifact = structuredClone(value); artifact.content_checksum = designOnlyChecksum(artifact); return Object.freeze(artifact);
}

function verifyArtifact(value, schemaField, schemaValue, code) {
  if (!value || value[schemaField] !== schemaValue || value.content_checksum !== designOnlyChecksum(value)) throw new DesignOnlyClosureError(code);
  return value;
}

export function createDesignOnlyClassificationStatement(input) {
  if (input?.classification !== 'DESIGN_ONLY' || input.implementation_required !== false || input.implementation_authorized !== false) throw new DesignOnlyClosureError('DESIGN_ONLY_CLASSIFICATION_INVALID');
  assertSha(input.base_context_checksum, 'DESIGN_ONLY_CLASSIFICATION_INVALID', 'base_context_checksum');
  return finalizeDesignOnlyArtifact({
    statement_schema_version: '1.0.0', task_id: input.task_id,
    classification: 'DESIGN_ONLY', implementation_required: false,
    implementation_authorized: false, base_context_checksum: input.base_context_checksum,
    task_definition_checksum: input.task_definition_checksum,
    allowed_files_checksum: input.allowed_files_checksum,
  });
}

const DIMENSIONS = Object.freeze(['technical', 'quality', 'policy', 'status', 'risk', 'follow_up', 'knowledge', 'resources', 'cost', 'owner']);
const OPTIONAL_DIMENSIONS = new Set(['policy', 'knowledge', 'cost']);
export function createDesignOnlyClosureReadiness(input) {
  if (!input || !Number.isSafeInteger(input.record_revision) || input.record_revision < 1 || input.task_classification !== 'DESIGN_ONLY') throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
  assertSha(input.canonical_checksum, 'DESIGN_ONLY_CLOSURE_INVALID', 'canonical_checksum');
  assertSha(input.base_context_checksum, 'DESIGN_ONLY_CLOSURE_INVALID', 'base_context_checksum');
  if (!Number.isSafeInteger(input.unresolved_critical) || !Number.isSafeInteger(input.unresolved_high) || input.unresolved_critical !== 0 || input.unresolved_high !== 0) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
  if (!input.dimensions || Object.keys(input.dimensions).sort().join('|') !== [...DIMENSIONS].sort().join('|')) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
  const dimensions = {};
  for (const name of DIMENSIONS) {
    const row = input.dimensions[name];
    if (!row || !Array.isArray(row.evidence_checksums) || row.evidence_checksums.length === 0 || row.evidence_checksums.some((value) => !SHA256.test(value))) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
    if (row.result === 'NOT_APPLICABLE') {
      if (!OPTIONAL_DIMENSIONS.has(name) || typeof row.reason !== 'string' || !row.reason.trim()) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
    } else if (!['PASS', 'ACCEPTED'].includes(row.result)) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
    dimensions[name] = { result: row.result, reason: row.reason ?? null, evidence_checksums: [...row.evidence_checksums] };
  }
  const deliverables = input.implementation_deliverables;
  const names = ['implementation_authorization', 'implementation', 'testing', 'implementation_review', 'final_judgment', 'policy_implementation'];
  if (!deliverables || names.some((name) => deliverables[name] !== 'NOT_APPLICABLE')) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
  if (!Array.isArray(input.critic_evidence_checksums) || input.critic_evidence_checksums.length !== 3 || new Set(input.critic_evidence_checksums).size !== 3 || input.critic_evidence_checksums.some((value) => !SHA256.test(value))) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
  return finalizeDesignOnlyArtifact({
    readiness_schema_version: '1.0.0', project_id: input.project_id, task_id: input.task_id,
    record_revision: input.record_revision, canonical_checksum: input.canonical_checksum,
    task_classification: 'DESIGN_ONLY', base_context_checksum: input.base_context_checksum,
    dimensions, unresolved_critical: 0, unresolved_high: 0,
    critic_evidence_checksums: [...input.critic_evidence_checksums].sort(),
    implementation_deliverables: Object.fromEntries(names.map((name) => [name, 'NOT_APPLICABLE'])),
  });
}

export function createDesignOnlyCriticEvidence(input) {
  if (![1, 2, 3].includes(input?.round) || typeof input.critic_id !== 'string' || !input.critic_id || !Array.isArray(input.findings)) throw new DesignOnlyClosureError('CRITIC_EVIDENCE_INVALID');
  const findings = input.findings.map((finding) => {
    if (!finding || !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(finding.severity) || !['OPEN', 'RESOLVED'].includes(finding.status) || typeof finding.finding_id !== 'string' || !finding.finding_id) throw new DesignOnlyClosureError('CRITIC_EVIDENCE_INVALID');
    return { finding_id: finding.finding_id, severity: finding.severity, status: finding.status };
  });
  const unresolved_critical = findings.filter((row) => row.severity === 'CRITICAL' && row.status === 'OPEN').length;
  const unresolved_high = findings.filter((row) => row.severity === 'HIGH' && row.status === 'OPEN').length;
  return finalizeDesignOnlyArtifact({ critic_evidence_schema_version: '1.0.0', round: input.round, critic_id: input.critic_id, findings, unresolved_critical, unresolved_high, result: unresolved_critical === 0 && unresolved_high === 0 ? 'PASS' : 'FAIL' });
}

export function validateDesignOnlyCriticEvidence(value) {
  verifyArtifact(value, 'critic_evidence_schema_version', '1.0.0', 'CRITIC_EVIDENCE_INVALID');
  const rebuilt = createDesignOnlyCriticEvidence(value);
  if (!same(value, rebuilt)) throw new DesignOnlyClosureError('CRITIC_EVIDENCE_INVALID');
  return rebuilt;
}

export function createDesignOnlyJudgeEvidence(input) {
  if (input?.decision !== 'PASS_DESIGN_READY_FOR_CLOSURE' || input.unresolved_critical !== 0 || input.unresolved_high !== 0 || typeof input.judge_id !== 'string' || !input.judge_id) throw new DesignOnlyClosureError('JUDGE_EVIDENCE_INVALID');
  return finalizeDesignOnlyArtifact({ judge_evidence_schema_version: '1.0.0', judge_id: input.judge_id, decision: input.decision, unresolved_critical: 0, unresolved_high: 0 });
}

export function createLegacyCompletionStatement(input) {
  if (!input || !Number.isSafeInteger(input.record_revision) || input.record_revision < 1 || !Number.isSafeInteger(input.log_prefix_length) || input.log_prefix_length < 0 || !Number.isSafeInteger(input.migration_epoch) || input.migration_epoch < 1 || !Array.isArray(input.completion_evidence_checksums) || input.completion_evidence_checksums.length === 0 || input.completion_evidence_checksums.some((value) => !SHA256.test(value))) throw new DesignOnlyClosureError('LEGACY_COMPLETION_ATTEST_INVALID');
  for (const field of ['canonical_checksum', 'log_prefix_head_checksum', 'base_context_checksum']) assertSha(input[field], 'LEGACY_COMPLETION_ATTEST_INVALID', field);
  time(input.attested_at, 'LEGACY_COMPLETION_ATTEST_INVALID');
  return finalizeDesignOnlyArtifact({ legacy_completion_statement_version: '1.0.0', project_id: input.project_id, task_id: input.task_id, record_revision: input.record_revision, canonical_checksum: input.canonical_checksum, log_prefix_length: input.log_prefix_length, log_prefix_head_checksum: input.log_prefix_head_checksum, completion_evidence_checksums: [...input.completion_evidence_checksums].sort(), migration_epoch: input.migration_epoch, attested_at: input.attested_at, base_context_checksum: input.base_context_checksum });
}

export function validateDesignOnlyJudgeEvidence(value) {
  verifyArtifact(value, 'judge_evidence_schema_version', '1.0.0', 'JUDGE_EVIDENCE_INVALID');
  const rebuilt = createDesignOnlyJudgeEvidence(value);
  if (!same(value, rebuilt)) throw new DesignOnlyClosureError('JUDGE_EVIDENCE_INVALID');
  return rebuilt;
}

export function createDesignOnlyOperationCoordinate(input) {
  if (!Object.values(DESIGN_ONLY_OPERATIONS).includes(input?.operation)) throw new DesignOnlyClosureError('DESIGN_ONLY_OPERATION_INVALID');
  for (const field of ['source_canonical_checksum', 'base_context_checksum', 'decision_checksum']) assertSha(input[field], 'DESIGN_ONLY_OPERATION_INVALID', field);
  return finalizeDesignOnlyArtifact({
    coordinate_schema_version: '1.0.0', preparation_id: input.preparation_id,
    project_id: input.project_id, task_id: input.task_id, operation: input.operation,
    phase: input.phase, capabilities: [...input.capabilities].sort(),
    source_revision: input.source_revision, source_canonical_checksum: input.source_canonical_checksum,
    base_context_checksum: input.base_context_checksum, decision_checksum: input.decision_checksum,
    target: structuredClone(input.target),
  });
}

export function createDesignOnlyOperationBundle(input) {
  return finalizeDesignOnlyArtifact({
    bundle_schema_version: '1.0.0', operation: input.operation,
    base_context: structuredClone(input.base_context), decision_artifact: structuredClone(input.decision_artifact),
    operation_coordinate: structuredClone(input.operation_coordinate),
    owner_authorization: structuredClone(input.owner_authorization),
    authority_attestation: structuredClone(input.authority_attestation),
  });
}

const requiredSources = (operation) => DESIGN_ONLY_BASE_SOURCES[operation];
const manifestSourceIds = (manifest) => [...(manifest?.required_sources ?? [])].map((source) => source.source_id).sort();

export function validateDesignOnlyOperationBundle(bundle, { operation, current, preparation, security, clock = () => new Date(), historical = false } = {}) {
  verifyArtifact(bundle, 'bundle_schema_version', '1.0.0', 'DESIGN_ONLY_OPERATION_BUNDLE_INVALID');
  if (!exactKeys(bundle, ['bundle_schema_version', 'operation', 'base_context', 'decision_artifact', 'operation_coordinate', 'owner_authorization', 'authority_attestation', 'content_checksum'])) throw new DesignOnlyClosureError('DESIGN_ONLY_OPERATION_BUNDLE_INVALID');
  if (bundle.operation !== operation || !requiredSources(operation)) throw new DesignOnlyClosureError('DESIGN_ONLY_OPERATION_BUNDLE_INVALID');
  const manifest = bundle.base_context;
  const manifestFields = ['manifest_schema_version', 'manifest_id', 'task_id', 'status_revision', 'role', 'phase', 'required_sources', 'optional_sources', 'excluded_sources', 'source_priority', 'summary_reference', 'token_estimate', 'duplicate_sources', 'stale_optional_sources', 'created_at', 'content_checksum'];
  const sourceFields = ['source_id', 'path', 'trust_level', 'sensitivity', 'content_checksum', 'token_estimate', 'updated_at', 'revalidate_after', 'priority', 'instruction_authority'];
  if (!exactKeys(manifest, manifestFields) || !Array.isArray(manifest.required_sources) || manifest.required_sources.some((source) => !exactKeys(source, sourceFields)) || !Array.isArray(manifest.optional_sources) || manifest.optional_sources.length !== 0 || !Array.isArray(manifest.excluded_sources) || manifest.excluded_sources.length !== 0 || !Array.isArray(manifest.duplicate_sources) || manifest.duplicate_sources.length !== 0 || !Array.isArray(manifest.stale_optional_sources) || manifest.stale_optional_sources.length !== 0) throw new DesignOnlyClosureError('CONTEXT_MANIFEST_INVALID');
  try { validateContextManifest(manifest, { status_revision: current.record_revision, clock }); }
  catch { throw new DesignOnlyClosureError('CONTEXT_MANIFEST_INVALID'); }
  const expectedPhase = operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST ? 'CLOSURE' : 'FINAL_PLAN';
  if (manifest.task_id !== current.task_id || manifest.phase !== expectedPhase || !same(manifestSourceIds(manifest), requiredSources(operation))) throw new DesignOnlyClosureError('CONTEXT_MANIFEST_INVALID');
  const rawDecision = operation === DESIGN_ONLY_OPERATIONS.CLASSIFY
    ? verifyArtifact(bundle.decision_artifact, 'statement_schema_version', '1.0.0', 'DESIGN_ONLY_CLASSIFICATION_INVALID')
    : operation === DESIGN_ONLY_OPERATIONS.COMPLETE
      ? verifyArtifact(bundle.decision_artifact, 'readiness_schema_version', '1.0.0', 'DESIGN_ONLY_CLOSURE_INVALID')
      : verifyArtifact(bundle.decision_artifact, 'legacy_completion_statement_version', '1.0.0', 'LEGACY_COMPLETION_ATTEST_INVALID');
  const decision = operation === DESIGN_ONLY_OPERATIONS.CLASSIFY
    ? createDesignOnlyClassificationStatement(rawDecision)
    : operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? createDesignOnlyClosureReadiness(rawDecision) : createLegacyCompletionStatement(rawDecision);
  if (!same(rawDecision, decision)) throw new DesignOnlyClosureError(operation === DESIGN_ONLY_OPERATIONS.CLASSIFY ? 'DESIGN_ONLY_CLASSIFICATION_INVALID' : operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? 'DESIGN_ONLY_CLOSURE_INVALID' : 'LEGACY_COMPLETION_ATTEST_INVALID');
  if (decision.task_id !== current.task_id || decision.base_context_checksum !== manifest.content_checksum) throw new DesignOnlyClosureError('DESIGN_ONLY_OPERATION_BUNDLE_INVALID');
  if (operation === DESIGN_ONLY_OPERATIONS.COMPLETE && (decision.project_id !== current.project_id || decision.record_revision !== current.record_revision || decision.canonical_checksum !== current.content_checksum)) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
  if (operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST && (current.record_schema_version !== '1.1.0' || current.task_status !== 'COMPLETED' || decision.project_id !== current.project_id || decision.task_id !== current.task_id || decision.record_revision !== current.record_revision || decision.canonical_checksum !== current.content_checksum || decision.log_prefix_length !== preparation.log_prefix_length || decision.log_prefix_head_checksum !== preparation.log_prefix_head_checksum)) throw new DesignOnlyClosureError('LEGACY_COMPLETION_ATTEST_INVALID');
  if (operation === DESIGN_ONLY_OPERATIONS.COMPLETE) {
    const criticChecksums = manifest.required_sources.filter((source) => source.source_id.startsWith('critic-round-')).map((source) => source.content_checksum).sort();
    const allowedChecksums = new Set(manifest.required_sources.map((source) => source.content_checksum));
    if (!same(criticChecksums, decision.critic_evidence_checksums) || Object.values(decision.dimensions).some((row) => row.evidence_checksums.some((value) => !allowedChecksums.has(value)))) throw new DesignOnlyClosureError('DESIGN_ONLY_CLOSURE_INVALID');
  }
  const coordinate = verifyArtifact(bundle.operation_coordinate, 'coordinate_schema_version', '1.0.0', 'DESIGN_ONLY_OPERATION_INVALID');
  if (!exactKeys(coordinate, ['coordinate_schema_version', 'preparation_id', 'project_id', 'task_id', 'operation', 'phase', 'capabilities', 'source_revision', 'source_canonical_checksum', 'base_context_checksum', 'decision_checksum', 'target', 'content_checksum'])) throw new DesignOnlyClosureError('DESIGN_ONLY_OPERATION_INVALID');
  const capabilities = operation === DESIGN_ONLY_OPERATIONS.CLASSIFY ? ['CANONICAL_STATE_COMMIT', 'CLASSIFY_DESIGN_ONLY'] : operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? ['CANONICAL_STATE_COMMIT', 'COMPLETE_TASK'] : ['ATTEST_LEGACY_COMPLETION', 'CANONICAL_QUEUE_BINDING'];
  const target = operation === DESIGN_ONLY_OPERATIONS.CLASSIFY
    ? { record_schema_version: '1.2.0', task_classification: 'DESIGN_ONLY', task_status: current.task_status, current_phase: current.current_phase, gate_status: current.gate_status, authorization_status: current.authorization_status, archive_status: current.archive_status }
    : operation === DESIGN_ONLY_OPERATIONS.COMPLETE
      ? { record_schema_version: '1.2.0', task_classification: 'DESIGN_ONLY', task_status: 'COMPLETED', current_phase: 'CLOSURE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'REVIEW_PENDING' }
      : { record_schema_version: '1.1.0', task_status: current.task_status, current_phase: current.current_phase, gate_status: current.gate_status, authorization_status: current.authorization_status, archive_status: current.archive_status, log_prefix_length: preparation.log_prefix_length, log_prefix_head_checksum: preparation.log_prefix_head_checksum };
  const expectedCoordinate = createDesignOnlyOperationCoordinate({
    preparation_id: preparation.preparation_id, project_id: current.project_id, task_id: current.task_id,
    operation, phase: operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST ? 'CLOSURE' : 'FINAL_PLAN', capabilities, source_revision: current.record_revision,
    source_canonical_checksum: current.content_checksum, base_context_checksum: manifest.content_checksum,
    decision_checksum: decision.content_checksum, target,
  });
  if (!same(coordinate, expectedCoordinate)) throw new DesignOnlyClosureError('DESIGN_ONLY_OPERATION_INVALID');
  const attestation = bundle.authority_attestation;
  const ownerFields = ['authorization_envelope_version', 'approval_id', 'authorized', 'task_id', 'project_id', 'phase', 'role', 'operation', 'operation_coordinate_checksum', 'authority_epoch', 'revocation_proof_checksum', 'authority_path', 'authority_checksum', 'effective_at', 'expires_at', 'key_id', 'signature_algorithm', 'signed_at', 'signature', 'payload_checksum'];
  const attestationFields = ['attestation_schema_version', 'result', 'issuer', 'subject', 'operation_coordinate_checksum', 'owner_payload_checksum', 'owner_signature_checksum', 'owner_key_id', 'owner_key_checksum', 'authority_epoch', 'revocation_proof_checksum', 'authority_ledger_coordinate', 'history_proof', 'revoked', 'effective_at', 'expires_at', 'verified_at', 'key_id', 'signature_algorithm', 'signed_at', 'signature', 'payload_checksum'];
  if (!exactKeys(bundle.owner_authorization, ownerFields) || !exactKeys(attestation, attestationFields)) throw new DesignOnlyClosureError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  const authorityState = historical
    ? typeof security?.get_historical_authority_state === 'function' ? security.get_historical_authority_state({ authority_epoch: attestation?.authority_epoch, authority_ledger_coordinate: attestation?.authority_ledger_coordinate, history_proof: attestation?.history_proof }) : null
    : typeof security?.get_authority_state === 'function' ? security.get_authority_state() : security;
  if (!authorityState || (historical && authorityState.history_proof_verified !== true) || !authorityState.owner_public_key || !authorityState.verifier_public_key || !Number.isSafeInteger(authorityState.current_authority_epoch) || !SHA256.test(authorityState.revocation_proof_checksum ?? '')) throw new DesignOnlyClosureError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  const now = clock().getTime();
  if (!Number.isFinite(now)) throw new DesignOnlyClosureError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  const ownerEffective = time(bundle.owner_authorization.effective_at, 'DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  const ownerExpires = time(bundle.owner_authorization.expires_at, 'DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  try {
    verifyAuthorizationEnvelope(bundle.owner_authorization, {
      public_key: authorityState.owner_public_key, expected_key_id: authorityState.owner_key_id ?? null,
      required_binding: { task_id: current.task_id, project_id: current.project_id, phase: expectedPhase, role: 'Owner', operation, operation_coordinate_checksum: coordinate.content_checksum, authority_epoch: authorityState.current_authority_epoch, revocation_proof_checksum: authorityState.revocation_proof_checksum },
      now,
    });
    verifySignedEnvelope(bundle.authority_attestation, { public_key: authorityState.verifier_public_key, expected_key_id: authorityState.verifier_key_id ?? null });
  } catch { throw new DesignOnlyClosureError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED'); }
  const attestationEffective = time(attestation.effective_at, 'DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  const attestationExpires = time(attestation.expires_at, 'DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  const verifiedAt = time(attestation.verified_at, 'DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  const ledger = attestation.authority_ledger_coordinate;
  if (attestation.attestation_schema_version !== '1.0.0' || attestation.result !== 'ALLOW' || attestation.issuer !== authorityState.verifier_key_id || attestation.subject !== current.task_id || attestation.operation_coordinate_checksum !== coordinate.content_checksum || attestation.owner_payload_checksum !== bundle.owner_authorization.payload_checksum || attestation.owner_signature_checksum !== signatureChecksum(bundle.owner_authorization.signature) || attestation.owner_key_id !== bundle.owner_authorization.key_id || attestation.owner_key_id !== authorityState.owner_key_id || attestation.owner_key_checksum !== keyChecksum(authorityState.owner_public_key) || attestation.authority_epoch !== authorityState.current_authority_epoch || attestation.revocation_proof_checksum !== authorityState.revocation_proof_checksum || attestation.revoked !== false || ownerEffective > verifiedAt || attestationEffective > verifiedAt || verifiedAt > now || now >= ownerExpires || now >= attestationExpires || !ledger || ledger.source_id !== 'authority-ledger' || !Number.isSafeInteger(ledger.revision) || ledger.revision < 1 || ledger.content_checksum !== attestation.revocation_proof_checksum || time(ledger.observed_at, 'DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED') > verifiedAt || !same(attestation.history_proof, authorityState.history_proof)) throw new DesignOnlyClosureError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  if (!same(ledger, authorityState.authority_ledger_coordinate)) throw new DesignOnlyClosureError('DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');
  return Object.freeze({ manifest, decision, coordinate, owner_authorization: bundle.owner_authorization, authority_attestation: attestation });
}

export function createDesignOnlyOperationAudit({ operation, current, next, request, validated, at }) {
  const skipped = operation === DESIGN_ONLY_OPERATIONS.COMPLETE
    ? DESIGN_ONLY_SKIPPED_PHASES.map((phase) => ({ phase, entered: false, gate_result: 'NOT_APPLICABLE', authorization: 'NOT_REQUIRED' })) : [];
  return finalizeDesignOnlyArtifact({
    audit_schema_version: '1.0.0', operation, transition_id: request.request_id,
    task_id: current.task_id, source_revision: current.record_revision, resulting_revision: next.record_revision,
    source_record_schema_version: current.record_schema_version, resulting_record_schema_version: next.record_schema_version,
    source_classification: current.task_classification ?? 'UNKNOWN', resulting_classification: next.task_classification ?? 'UNKNOWN',
    from: request.from, to: request.to, skipped_phases: skipped,
    context_manifest_checksum: validated.manifest.content_checksum,
    decision_checksum: validated.decision.content_checksum,
    operation_coordinate_checksum: validated.coordinate.content_checksum,
    owner_authorization_payload_checksum: validated.owner_authorization.payload_checksum,
    authority_attestation_payload_checksum: validated.authority_attestation.payload_checksum,
    resulting_canonical_checksum: next.content_checksum, created_at: at,
  });
}

export function verifyDesignOnlyOperationAudit(audit, { event } = {}) {
  const fields = ['audit_schema_version', 'operation', 'transition_id', 'task_id', 'source_revision', 'resulting_revision', 'source_record_schema_version', 'resulting_record_schema_version', 'source_classification', 'resulting_classification', 'from', 'to', 'skipped_phases', 'context_manifest_checksum', 'decision_checksum', 'operation_coordinate_checksum', 'owner_authorization_payload_checksum', 'authority_attestation_payload_checksum', 'resulting_canonical_checksum', 'created_at', 'content_checksum'];
  if (!exactKeys(audit, fields) || audit.audit_schema_version !== '1.0.0' || audit.content_checksum !== designOnlyChecksum(audit)) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  const expectedSkipped = audit.operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? DESIGN_ONLY_SKIPPED_PHASES.map((phase) => ({ phase, entered: false, gate_result: 'NOT_APPLICABLE', authorization: 'NOT_REQUIRED' })) : [];
  if (![DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE, DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST].includes(audit.operation) || !Array.isArray(audit.skipped_phases) || audit.skipped_phases.some((row) => !exactKeys(row, ['phase', 'entered', 'gate_result', 'authorization'])) || !same(audit.skipped_phases, expectedSkipped) || ['context_manifest_checksum', 'decision_checksum', 'operation_coordinate_checksum', 'owner_authorization_payload_checksum', 'authority_attestation_payload_checksum', 'resulting_canonical_checksum'].some((field) => !SHA256.test(audit[field] ?? ''))) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  time(audit.created_at, 'AUDIT_RECEIPT_INVALID');
  if (event) {
    const bundle = event.operation_bundle;
    const eventMismatch = audit.operation !== event.operation_type || audit.transition_id !== event.transition_id || audit.task_id !== event.task_id || audit.source_revision !== event.expected_revision || audit.resulting_revision !== event.resulting_revision || audit.source_record_schema_version !== event.source_record_schema_version || audit.resulting_record_schema_version !== event.resulting_record_schema_version || audit.source_classification !== event.source_classification || audit.resulting_classification !== event.resulting_classification || !same(audit.from, event.from) || !same(audit.to, event.to) || audit.resulting_canonical_checksum !== event.resulting_canonical_checksum || audit.created_at !== event.created_at;
    const bundleMismatch = !bundle
      || audit.context_manifest_checksum !== bundle.base_context?.content_checksum
      || audit.decision_checksum !== bundle.decision_artifact?.content_checksum
      || audit.operation_coordinate_checksum !== bundle.operation_coordinate?.content_checksum
      || audit.owner_authorization_payload_checksum !== bundle.owner_authorization?.payload_checksum
      || audit.authority_attestation_payload_checksum !== bundle.authority_attestation?.payload_checksum;
    if (eventMismatch || bundleMismatch) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  }
  return true;
}

export function createDesignOnlyCommitReceipt({ event, record, acknowledgement, operationAudit, at }) {
  return finalizeDesignOnlyArtifact({
    receipt_schema_version: '1.0.0', transition_id: event.transition_id, task_id: event.task_id,
    operation: event.operation_type, resulting_revision: record.record_revision,
    canonical_checksum: record.content_checksum, event_checksum: event.entry_checksum,
    operation_audit_checksum: operationAudit.content_checksum,
    event_acknowledgement: structuredClone(acknowledgement), committed_at: at,
  });
}

export function verifyDesignOnlyCommitReceipt(receipt, { event, record } = {}) {
  verifyArtifact(receipt, 'receipt_schema_version', '1.0.0', 'AUDIT_RECEIPT_INVALID');
  const receiptFields = ['canonical_checksum', 'committed_at', 'content_checksum', 'event_acknowledgement', 'event_checksum', 'operation', 'operation_audit_checksum', 'receipt_schema_version', 'resulting_revision', 'task_id', 'transition_id'];
  if (!receipt || Object.keys(receipt).sort().join('|') !== receiptFields.sort().join('|')) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  if (!event || event.outcome !== 'COMMITTED' || event.entry_checksum !== designOnlyChecksum(event, 'entry_checksum') || receipt.transition_id !== event.transition_id || receipt.task_id !== event.task_id || receipt.operation !== event.operation_type || receipt.resulting_revision !== event.resulting_revision || receipt.canonical_checksum !== event.resulting_canonical_checksum || receipt.event_checksum !== event.entry_checksum || receipt.operation_audit_checksum !== event.operation_audit?.content_checksum) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  verifyDesignOnlyOperationAudit(event.operation_audit, { event });
  if (record && (record.task_id !== event.task_id || record.record_revision < event.resulting_revision)) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  const ack = receipt.event_acknowledgement;
  const ackFields = ['entry_checksum', 'event_appended', 'event_verified', 'log_directory_synced', 'log_file_synced', 'resulting_revision', 'transition_id'];
  if (!ack || Object.keys(ack).sort().join('|') !== ackFields.sort().join('|') || ack.transition_id !== event.transition_id || ack.entry_checksum !== event.entry_checksum || ack.resulting_revision !== event.resulting_revision || ['event_appended', 'log_file_synced', 'log_directory_synced', 'event_verified'].some((field) => ack[field] !== true)) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  time(receipt.committed_at, 'AUDIT_RECEIPT_INVALID');
  if (receipt.committed_at !== event.created_at || receipt.committed_at !== event.verified_at || receipt.committed_at !== event.operation_audit?.created_at) throw new DesignOnlyClosureError('AUDIT_RECEIPT_INVALID');
  return true;
}

export function createCanonicalTaskBinding(input, { private_key, key_id, clock = () => new Date() } = {}) {
  if (!private_key || typeof key_id !== 'string' || !key_id) throw new DesignOnlyClosureError('CANONICAL_READ_NOT_VERIFIED');
  const unsigned = { binding_schema_version: '1.1.0', ...structuredClone(input) };
  unsigned.content_checksum = designOnlyChecksum(unsigned);
  return signEnvelope(unsigned, { private_key, key_id, clock });
}

const canonicalBindingChecksum = (binding) => {
  const unsigned = structuredClone(binding);
  for (const field of ['signature', 'signature_algorithm', 'key_id', 'signed_at', 'payload_checksum', 'content_checksum']) delete unsigned[field];
  return `sha256:${createHash('sha256').update(canonical(unsigned)).digest('hex')}`;
};

export function verifyCanonicalTaskBinding(binding, { public_key, expected_key_id = null, clock = () => new Date() } = {}) {
  if (!public_key) throw new DesignOnlyClosureError('CANONICAL_READ_NOT_VERIFIED');
  try { verifySignedEnvelope(binding, { public_key, expected_key_id }); }
  catch { throw new DesignOnlyClosureError('CANONICAL_READ_NOT_VERIFIED'); }
  if (!binding || binding.binding_schema_version !== '1.1.0' || binding.source !== 'LIFECYCLE_STORE_VERIFIED_READ' || binding.canonical_authority !== false || binding.content_checksum !== canonicalBindingChecksum(binding) || !Number.isSafeInteger(binding.record_revision) || binding.record_revision < 1 || !CANONICAL_UUID.test(binding.observation_id ?? '')) throw new DesignOnlyClosureError('CANONICAL_READ_NOT_VERIFIED');
  const observedAt = time(binding.observed_at, 'CANONICAL_READ_NOT_VERIFIED'); const expiresAt = time(binding.expires_at, 'CANONICAL_READ_NOT_VERIFIED');
  const now = clock().getTime();
  if (observedAt > now || expiresAt <= now || expiresAt <= observedAt) throw new DesignOnlyClosureError('CANONICAL_READ_NOT_VERIFIED');
  assertSha(binding.canonical_checksum, 'CANONICAL_READ_NOT_VERIFIED', 'canonical_checksum');
  if (binding.event_checksum != null) assertSha(binding.event_checksum, 'CANONICAL_READ_NOT_VERIFIED', 'event_checksum');
  if (binding.receipt_checksum != null) assertSha(binding.receipt_checksum, 'CANONICAL_READ_NOT_VERIFIED', 'receipt_checksum');
  if (binding.task_status === 'COMPLETED' && binding.task_classification !== 'IMPLEMENTATION' && binding.receipt_checksum == null) throw new DesignOnlyClosureError('CANONICAL_READ_NOT_VERIFIED');
  return true;
}

export function createCanonicalStatusSnapshotManifest(bindings, { private_key, key_id, binding_trust, ttl_ms = 60_000, clock = () => new Date() } = {}) {
  if (!Array.isArray(bindings) || bindings.length === 0 || !Number.isSafeInteger(ttl_ms) || ttl_ms < 1 || ttl_ms > 300_000) throw new DesignOnlyClosureError('CANONICAL_SNAPSHOT_INVALID');
  for (const binding of bindings) verifyCanonicalTaskBinding(binding, { ...binding_trust, clock });
  const members = bindings.map((binding) => ({ project_id: binding.project_id, task_id: binding.task_id, record_revision: binding.record_revision, canonical_checksum: binding.canonical_checksum, binding_payload_checksum: binding.payload_checksum })).sort((a, b) => `${a.project_id}:${a.task_id}`.localeCompare(`${b.project_id}:${b.task_id}`));
  if (new Set(members.map((row) => `${row.project_id}:${row.task_id}`)).size !== members.length) throw new DesignOnlyClosureError('CANONICAL_SNAPSHOT_INVALID');
  const now = clock();
  return signEnvelope({ canonical_snapshot_schema_version: '1.0.0', snapshot_id: randomUUID(), captured_at: now.toISOString(), expires_at: new Date(now.getTime() + ttl_ms).toISOString(), members }, { private_key, key_id, clock });
}

export function verifyCanonicalStatusSnapshotManifest(manifest, bindings, { public_key, expected_key_id = null, binding_trust, clock = () => new Date() } = {}) {
  try { verifySignedEnvelope(manifest, { public_key, expected_key_id }); } catch { throw new DesignOnlyClosureError('CANONICAL_SNAPSHOT_INVALID'); }
  if (manifest?.canonical_snapshot_schema_version !== '1.0.0' || !CANONICAL_UUID.test(manifest.snapshot_id ?? '') || !Array.isArray(manifest.members) || !Array.isArray(bindings)) throw new DesignOnlyClosureError('CANONICAL_SNAPSHOT_INVALID');
  const captured = time(manifest.captured_at, 'CANONICAL_SNAPSHOT_INVALID'); const expires = time(manifest.expires_at, 'CANONICAL_SNAPSHOT_INVALID'); const now = clock().getTime();
  if (captured > now || expires <= now || expires <= captured) throw new DesignOnlyClosureError('CANONICAL_SNAPSHOT_INVALID');
  for (const binding of bindings) verifyCanonicalTaskBinding(binding, { ...binding_trust, clock });
  const actual = bindings.map((binding) => ({ project_id: binding.project_id, task_id: binding.task_id, record_revision: binding.record_revision, canonical_checksum: binding.canonical_checksum, binding_payload_checksum: binding.payload_checksum })).sort((a, b) => `${a.project_id}:${a.task_id}`.localeCompare(`${b.project_id}:${b.task_id}`));
  if (!same(actual, manifest.members)) throw new DesignOnlyClosureError('CANONICAL_SNAPSHOT_INVALID');
  return true;
}
