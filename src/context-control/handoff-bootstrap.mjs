import { createHash } from 'node:crypto';

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;
const HEAD_PATTERN = /^[a-f0-9]{7,64}$/;
const TRUST_LEVELS = Object.freeze([
  'OWNER_AUTHORITY',
  'CANONICAL_GOVERNANCE',
  'AUTHORIZED_TASK',
  'PROJECT_DOCUMENTATION',
  'SOURCE_CODE_DATA',
  'EXTERNAL_UNTRUSTED',
]);
const AUTHORIZATION_STATES = Object.freeze([
  'AUTHORIZED',
  'NOT_AUTHORIZED',
  'SUSPENDED',
  'REVOKED',
  'AUTHORITY_CONFLICT',
]);
const RELATIONS = Object.freeze([
  'EQUAL',
  'RECORDED_ANCESTOR_OF_CURRENT',
  'CURRENT_ANCESTOR_OF_RECORDED',
  'UNRELATED',
  'UNKNOWN',
]);

export class HandoffBootstrapError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'HandoffBootstrapError';
    this.code = code;
  }
}

const canonicalSort = (value) => {
  if (Array.isArray(value)) return value.map(canonicalSort);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalSort(value[key])]));
  }
  return value;
};
const canonical = (value) => JSON.stringify(canonicalSort(value));
const checksumWithout = (value, field) => {
  const candidate = structuredClone(value);
  delete candidate[field];
  return `sha256:${createHash('sha256').update(canonical(candidate)).digest('hex')}`;
};
const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};
const requiredText = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', `${name} required`);
  }
  return value;
};
const requiredBoolean = (value, name) => {
  if (typeof value !== 'boolean') {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', `${name} must be boolean`);
  }
  return value;
};
const requiredArray = (value, name) => {
  if (!Array.isArray(value)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', `${name} must be array`);
  }
  return value;
};
const requiredSha = (value, name) => {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', `${name} invalid`);
  }
  return value;
};

export function handoffManifestChecksum(manifest) {
  return checksumWithout(manifest, 'manifest_sha256');
}

export function handoffBootstrapResultChecksum(result) {
  return checksumWithout(result, 'content_checksum');
}

const normalizeManifestFile = (file) => {
  const trustLevel = requiredText(file?.trust_level, 'file.trust_level');
  if (!TRUST_LEVELS.includes(trustLevel)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'file trust_level invalid');
  }
  const estimatedTokens = file.estimated_tokens;
  if (!Number.isSafeInteger(estimatedTokens) || estimatedTokens < 0) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'file estimated_tokens invalid');
  }
  return Object.freeze({
    path: requiredText(file.path, 'file.path'),
    sha256: requiredSha(file.sha256, 'file.sha256'),
    critical: requiredBoolean(file.critical, 'file.critical'),
    trust_level: trustLevel,
    instruction_scope: requiredBoolean(file.instruction_scope, 'file.instruction_scope'),
    contains_secret: requiredBoolean(file.contains_secret, 'file.contains_secret'),
    include_in_context: requiredBoolean(file.include_in_context, 'file.include_in_context'),
    estimated_tokens: estimatedTokens,
    changed_since_previous_session: file.changed_since_previous_session == null
      ? null
      : requiredBoolean(file.changed_since_previous_session, 'file.changed_since_previous_session'),
    stale: file.stale == null ? null : requiredBoolean(file.stale, 'file.stale'),
    relevant_to_current_task: requiredBoolean(
      file.relevant_to_current_task,
      'file.relevant_to_current_task',
    ),
  });
};

const validateManifest = (manifest) => {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID');
  }
  if (manifest.manifest_sha256 !== handoffManifestChecksum(manifest)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'manifest checksum mismatch');
  }
  const createdAt = requiredText(manifest.created_at, 'created_at');
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'created_at invalid');
  }
  const projectHead = requiredText(manifest.project_head, 'project_head');
  if (!HEAD_PATTERN.test(projectHead)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'project_head invalid');
  }
  const authoritySources = requiredArray(manifest.authority_sources, 'authority_sources')
    .map((source) => {
      const trustLevel = requiredText(source?.trust_level, 'authority_source.trust_level');
      if (!TRUST_LEVELS.includes(trustLevel)) {
        throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'authority trust invalid');
      }
      return Object.freeze({
        source_id: requiredText(source.source_id, 'authority_source.source_id'),
        trust_level: trustLevel,
        path_or_ref: requiredText(source.path_or_ref, 'authority_source.path_or_ref'),
      });
    });
  if (authoritySources.length === 0) {
    throw new HandoffBootstrapError('AUTONOMY_BOOTSTRAP_MISSING', 'authority source missing');
  }
  const files = requiredArray(manifest.files, 'files').map(normalizeManifestFile);
  if (new Set(files.map((file) => file.path)).size !== files.length) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'file path must be unique');
  }
  return Object.freeze({
    handoff_version: requiredText(manifest.handoff_version, 'handoff_version'),
    created_at: new Date(createdAt).toISOString(),
    created_by: requiredText(manifest.created_by, 'created_by'),
    project_id: requiredText(manifest.project_id, 'project_id'),
    project_repo: requiredText(manifest.project_repo, 'project_repo'),
    project_branch: requiredText(manifest.project_branch, 'project_branch'),
    project_head: projectHead,
    os_version: requiredText(manifest.os_version, 'os_version'),
    architecture_version: requiredText(manifest.architecture_version, 'architecture_version'),
    authority_sources: authoritySources,
    current_task: requiredText(manifest.current_task, 'current_task'),
    completed_tasks: requiredArray(manifest.completed_tasks, 'completed_tasks').map(String),
    parked_tasks: requiredArray(manifest.parked_tasks, 'parked_tasks').map(String),
    human_gates: requiredArray(manifest.human_gates, 'human_gates').map(String),
    known_risks: requiredArray(manifest.known_risks, 'known_risks').map(String),
    files,
    manifest_sha256: manifest.manifest_sha256,
  });
};

const verifyCriticalFiles = (files, observations, { allowChangedCurrent = false } = {}) => {
  if (!Array.isArray(observations)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'file_observations required');
  }
  const byPath = new Map();
  for (const observation of observations) {
    const path = requiredText(observation?.path, 'observation.path');
    if (byPath.has(path)) {
      throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'observation path duplicate');
    }
    byPath.set(path, {
      present: requiredBoolean(observation.present, 'observation.present'),
      sha256: observation.sha256 == null ? null : requiredSha(observation.sha256, 'observation.sha256'),
    });
  }
  const findings = [];
  for (const file of files.filter((entry) => entry.critical)) {
    const observation = byPath.get(file.path);
    if (!observation?.present) {
      throw new HandoffBootstrapError('AUTONOMY_BOOTSTRAP_MISSING', `critical file missing: ${file.path}`);
    }
    if (observation.sha256 !== file.sha256) {
      if (allowChangedCurrent) {
        findings.push({ code: 'CRITICAL_SOURCE_CHANGED_IN_NEWER_CHECKOUT', severity: 'WARNING' });
        continue;
      }
      throw new HandoffBootstrapError(
        'HANDOFF_MANIFEST_INVALID',
        `critical file checksum mismatch: ${file.path}`,
      );
    }
  }
  return findings;
};

const buildLoadingPlan = (files) => {
  const selected = [];
  for (const file of files) {
    if (!file.include_in_context) continue;
    if (file.contains_secret) {
      throw new HandoffBootstrapError('SECRET_CONTEXT_BLOCKED', file.path);
    }
    if (file.instruction_scope && file.trust_level === 'EXTERNAL_UNTRUSTED') {
      throw new HandoffBootstrapError('UNTRUSTED_INSTRUCTION_INJECTION', file.path);
    }
    const reason = file.critical
      ? 'CRITICAL_BOOTSTRAP'
      : file.relevant_to_current_task
        ? 'CURRENT_TASK_RELEVANT'
        : file.changed_since_previous_session === true && file.stale !== true
          ? 'CHANGED_NON_STALE'
          : null;
    if (reason != null) selected.push(Object.freeze({
      path: file.path,
      trust_level: file.trust_level,
      selected_reason: reason,
      estimated_tokens: file.estimated_tokens,
    }));
  }
  return Object.freeze(selected);
};

const resolveSourceTruth = (checkout, recordedHead) => {
  const mode = requiredText(checkout?.repository_mode, 'repository_mode');
  if (!['LOCAL', 'REMOTE_FEATURE_BRANCH', 'HANDOFF_ONLY'].includes(mode)) {
    throw new HandoffBootstrapError('SOURCE_OF_TRUTH_UNKNOWN', 'repository_mode invalid');
  }
  if (mode === 'HANDOFF_ONLY') return {
    source_truth_mode: 'HANDOFF_ONLY_READONLY',
    handoff_status: 'UNVERIFIED_CHECKOUT',
    next_action: 'READ_ONLY_RESTORE_CHECKOUT',
    implementation_blocked: true,
    findings: [{ code: 'SOURCE_OF_TRUTH_UNKNOWN', severity: 'MAJOR' }],
  };
  const currentHead = requiredText(checkout.head, 'checkout.head');
  if (!HEAD_PATTERN.test(currentHead)) {
    throw new HandoffBootstrapError('SOURCE_OF_TRUTH_UNKNOWN', 'checkout head invalid');
  }
  const relation = requiredText(checkout.relation_to_recorded_head, 'relation_to_recorded_head');
  if (!RELATIONS.includes(relation) || relation === 'UNRELATED' || relation === 'UNKNOWN') {
    throw new HandoffBootstrapError('SOURCE_OF_TRUTH_UNKNOWN', relation);
  }
  if (relation === 'EQUAL' && currentHead !== recordedHead) {
    throw new HandoffBootstrapError('SOURCE_OF_TRUTH_UNKNOWN', 'equal relation contradicts heads');
  }
  const dirty = requiredBoolean(checkout.dirty, 'checkout.dirty');
  const ownership = requiredText(checkout.dirty_ownership, 'dirty_ownership');
  if (!['OWNED', 'EXTERNAL', 'UNKNOWN', 'NOT_APPLICABLE'].includes(ownership)) {
    throw new HandoffBootstrapError('DIRTY_WORKTREE_OWNERSHIP_UNKNOWN');
  }
  if (dirty && (ownership === 'UNKNOWN' || ownership === 'NOT_APPLICABLE')) {
    throw new HandoffBootstrapError('DIRTY_WORKTREE_OWNERSHIP_UNKNOWN');
  }
  if (!dirty && ownership !== 'NOT_APPLICABLE') {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID', 'clean checkout ownership invalid');
  }
  const sourceMode = dirty || mode === 'LOCAL' ? 'LOCAL_CHECKOUT' : 'REMOTE_FEATURE_BRANCH';
  if (relation === 'CURRENT_ANCESTOR_OF_RECORDED') return {
    source_truth_mode: 'HANDOFF_ONLY_READONLY',
    handoff_status: 'CHECKOUT_STALE',
    next_action: 'UPDATE_CHECKOUT_WITHOUT_DISCARDING_LOCAL_STATE',
    implementation_blocked: true,
    findings: [{ code: 'CHECKOUT_STALE', severity: 'MAJOR' }],
  };
  const findings = [];
  if (relation === 'RECORDED_ANCESTOR_OF_CURRENT') {
    findings.push({ code: 'HANDOFF_STALE', severity: 'WARNING' });
  }
  if (dirty) findings.push({
    code: 'DIRTY_WORKTREE_PRESERVED',
    severity: ownership === 'EXTERNAL' ? 'MAJOR' : 'INFO',
  });
  return {
    source_truth_mode: sourceMode,
    handoff_status: relation === 'EQUAL' ? 'CURRENT' : 'HANDOFF_STALE',
    next_action: dirty && ownership === 'EXTERNAL'
      ? 'PRESERVE_EXTERNAL_CHANGES_AND_REPLAN'
      : 'LOAD_MINIMUM_CONTEXT',
    implementation_blocked: dirty && ownership === 'EXTERNAL',
    findings,
  };
};

export function bootstrapHandoff(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HandoffBootstrapError('HANDOFF_MANIFEST_INVALID');
  }
  const manifest = validateManifest(input.handoff_manifest);
  const currentProjectId = requiredText(input.current_project_id, 'current_project_id');
  if (manifest.project_id !== currentProjectId) {
    throw new HandoffBootstrapError('HANDOFF_PROJECT_MISMATCH');
  }
  const authorizationState = requiredText(input.authorization_state, 'authorization_state');
  if (!AUTHORIZATION_STATES.includes(authorizationState)) {
    throw new HandoffBootstrapError('AUTHORITY_CONFLICT', 'authorization state invalid');
  }
  const resolution = resolveSourceTruth(input.current_checkout, manifest.project_head);
  const criticalFileFindings = verifyCriticalFiles(manifest.files, input.file_observations, {
    allowChangedCurrent: resolution.handoff_status === 'HANDOFF_STALE',
  });
  const loadingPlan = buildLoadingPlan(manifest.files);
  const trustRank = Object.fromEntries(TRUST_LEVELS.map((level, index) => [level, index]));
  const authoritySources = [...manifest.authority_sources]
    .sort((left, right) => trustRank[left.trust_level] - trustRank[right.trust_level]
      || left.source_id.localeCompare(right.source_id));
  const authorityBlocked = authorizationState !== 'AUTHORIZED';
  const implementationAllowed = !resolution.implementation_blocked && !authorityBlocked;
  const findings = [...resolution.findings, ...criticalFileFindings];
  if (authorizationState === 'AUTHORITY_CONFLICT') {
    findings.push({ code: 'AUTHORITY_CONFLICT', severity: 'CRITICAL' });
  } else if (authorityBlocked) {
    findings.push({ code: 'AUTONOMY_TASK_NOT_AUTHORIZED', severity: 'MAJOR' });
  }
  const result = {
    handoff_bootstrap_schema_version: '1.0.0',
    project_id: manifest.project_id,
    current_task: manifest.current_task,
    recorded_head: manifest.project_head,
    current_head: input.current_checkout?.head ?? null,
    source_truth_mode: resolution.source_truth_mode,
    handoff_status: resolution.handoff_status,
    authorization_state: authorizationState,
    implementation_allowed: implementationAllowed,
    next_action: implementationAllowed ? resolution.next_action : (
      authorizationState === 'AUTHORITY_CONFLICT'
        ? 'RESOLVE_AUTHORITY_CONFLICT'
        : authorityBlocked
          ? 'PARK_UNAUTHORIZED_TASK'
          : resolution.next_action
    ),
    authority_sources: authoritySources,
    loading_plan: loadingPlan,
    estimated_bootstrap_tokens: loadingPlan.reduce(
      (sum, entry) => sum + entry.estimated_tokens,
      0,
    ),
    findings,
    manifest_sha256: manifest.manifest_sha256,
  };
  result.content_checksum = handoffBootstrapResultChecksum(result);
  return deepFreeze(result);
}

export function validateHandoffBootstrapResult(result) {
  if (!result || result.handoff_bootstrap_schema_version !== '1.0.0'
    || typeof result.content_checksum !== 'string'
    || !SHA256_PATTERN.test(result.content_checksum)
    || result.content_checksum !== handoffBootstrapResultChecksum(result)) {
    throw new HandoffBootstrapError('HANDOFF_BOOTSTRAP_RESULT_TAMPERED');
  }
  return Object.freeze({
    result: 'HANDOFF_BOOTSTRAP_RESULT_VALID',
    project_id: result.project_id,
    content_checksum: result.content_checksum,
  });
}

export {
  AUTHORIZATION_STATES as HANDOFF_AUTHORIZATION_STATES,
  RELATIONS as HANDOFF_GIT_RELATIONS,
  TRUST_LEVELS as HANDOFF_TRUST_LEVELS,
};
