import { createHash } from 'node:crypto';
import { deepFreeze } from './util.mjs';

const PRIORITY = Object.freeze({ P0: 4, P1: 3, P2: 2, P3: 1 });
const AUTHORIZATION = Object.freeze([
  'AUTHORIZED',
  'DESIGN_ONLY',
  'NOT_AUTHORIZED',
  'SUSPENDED',
  'REVOKED',
  'AUTHORITY_CONFLICT',
]);
const TASK_STATES = Object.freeze(['PENDING', 'ACTIVE', 'PARKED', 'BLOCKED', 'COMPLETED']);
const GATE_TYPES = Object.freeze([
  'HUMAN_FINAL_AUTHORITY',
  'NATIVE_EXTERNAL_APPLICATION',
  'PAID_PROVIDER_EXECUTION',
  'DESTRUCTIVE_OPERATION',
  'RELEASE_OR_DEPLOYMENT',
  'SECURITY_EXCEPTION',
  'CREDENTIAL_REQUIRED',
  'DATA_MIGRATION_APPROVAL',
  'UX_HUMAN_ACCEPTANCE',
  'UNRESOLVED_AUTHORITY_CONFLICT',
]);
const GATE_STATUSES = Object.freeze(['WAITING_OWNER', 'SATISFIED', 'CANCELLED', 'EXPIRED']);
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

export class AutonomousQueueError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'AutonomousQueueError';
    this.code = code;
  }
}

const canonicalSort = (value) => Array.isArray(value)
  ? value.map(canonicalSort)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalSort(value[key])]))
    : value;
const checksum = (value, field) => {
  const candidate = structuredClone(value);
  delete candidate[field];
  return `sha256:${createHash('sha256').update(JSON.stringify(canonicalSort(candidate))).digest('hex')}`;
};
const text = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AutonomousQueueError('AUTONOMOUS_TASK_INVALID', `${name} required`);
  }
  return value;
};
const bool = (value, name) => {
  if (typeof value !== 'boolean') {
    throw new AutonomousQueueError('AUTONOMOUS_TASK_INVALID', `${name} must be boolean`);
  }
  return value;
};
const nonNegativeInteger = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new AutonomousQueueError('AUTONOMOUS_TASK_INVALID', `${name} invalid`);
  }
  return value;
};
const array = (value, name) => {
  if (!Array.isArray(value)) throw new AutonomousQueueError('AUTONOMOUS_TASK_INVALID', `${name} invalid`);
  return value;
};

export function humanGateChecksum(gate) {
  return checksum(gate, 'content_checksum');
}

export function createHumanGate(input) {
  const type = text(input?.type, 'type');
  const status = text(input?.status, 'status');
  if (!GATE_TYPES.includes(type) || !GATE_STATUSES.includes(status)) {
    throw new AutonomousQueueError('HUMAN_GATE_INVALID');
  }
  const createdAt = text(input.created_at, 'created_at');
  if (Number.isNaN(Date.parse(createdAt))) throw new AutonomousQueueError('HUMAN_GATE_INVALID');
  const authorizedBy = input.authorized_by == null ? null : text(input.authorized_by, 'authorized_by');
  const authorityVerificationResult = input.authority_verification_result == null
    ? null
    : text(input.authority_verification_result, 'authority_verification_result');
  const authorizationEvidenceChecksum = input.authorization_evidence_checksum == null
    ? null
    : text(input.authorization_evidence_checksum, 'authorization_evidence_checksum');
  const satisfactionEvidence = array(
    input.satisfaction_evidence ?? [],
    'satisfaction_evidence',
  ).map((value) => text(value, 'satisfaction_evidence'));
  if (authorizationEvidenceChecksum != null && !SHA256_PATTERN.test(authorizationEvidenceChecksum)) {
    throw new AutonomousQueueError('HUMAN_GATE_SATISFACTION_UNVERIFIED');
  }
  if (status === 'SATISFIED' && (
    authorizedBy == null
    || authorityVerificationResult !== 'OWNER_AUTHORIZATION_VERIFIED'
    || authorizationEvidenceChecksum == null
    || satisfactionEvidence.length === 0
  )) {
    throw new AutonomousQueueError('HUMAN_GATE_SATISFACTION_UNVERIFIED');
  }
  const gate = {
    human_gate_schema_version: '1.0.0',
    gate_id: text(input.gate_id, 'gate_id'),
    task_id: text(input.task_id, 'task_id'),
    type,
    status,
    reason_code: text(input.reason_code, 'reason_code'),
    required_environment: array(input.required_environment ?? [], 'required_environment')
      .map((value) => text(value, 'environment')),
    safe_to_continue_other_tasks: bool(
      input.safe_to_continue_other_tasks,
      'safe_to_continue_other_tasks',
    ),
    blocking_capabilities: array(input.blocking_capabilities ?? [], 'blocking_capabilities')
      .map((value) => text(value, 'blocking_capability')),
    non_blocking_candidates: array(input.non_blocking_candidates ?? [], 'non_blocking_candidates')
      .map((value) => text(value, 'non_blocking_candidate')),
    evidence_required: array(input.evidence_required ?? [], 'evidence_required')
      .map((value) => text(value, 'evidence_required')),
    authorized_by: authorizedBy,
    authority_verification_result: authorityVerificationResult,
    authorization_evidence_checksum: authorizationEvidenceChecksum,
    satisfaction_evidence: satisfactionEvidence,
    created_by_session: text(input.created_by_session, 'created_by_session'),
    created_at: new Date(createdAt).toISOString(),
  };
  gate.content_checksum = humanGateChecksum(gate);
  return deepFreeze(gate);
}

export function validateHumanGate(gate) {
  if (!gate || gate.human_gate_schema_version !== '1.0.0'
    || typeof gate.content_checksum !== 'string'
    || !SHA256_PATTERN.test(gate.content_checksum)
    || gate.content_checksum !== humanGateChecksum(gate)) {
    throw new AutonomousQueueError('HUMAN_GATE_TAMPERED');
  }
  return deepFreeze({ result: 'HUMAN_GATE_VALID', gate_id: gate.gate_id });
}

const normalizeTask = (task, index) => {
  const priority = text(task?.priority, 'priority');
  const authorization = text(task?.authorization, 'authorization');
  const state = text(task?.state, 'state');
  if (!Object.hasOwn(PRIORITY, priority) || !AUTHORIZATION.includes(authorization)
    || !TASK_STATES.includes(state)) {
    throw new AutonomousQueueError('AUTONOMOUS_TASK_INVALID');
  }
  const ownerPriority = nonNegativeInteger(task.owner_priority, 'owner_priority');
  const contextLocality = nonNegativeInteger(task.context_locality, 'context_locality');
  if (contextLocality > 100) throw new AutonomousQueueError('AUTONOMOUS_TASK_INVALID');
  const gates = array(task.human_gates ?? [], 'human_gates').map((gate) => {
    validateHumanGate(gate);
    if (gate.task_id !== task.task_id) throw new AutonomousQueueError('HUMAN_GATE_TASK_MISMATCH');
    return gate;
  });
  return deepFreeze({
    task_id: text(task.task_id, 'task_id'),
    priority,
    owner_priority: ownerPriority,
    dev_profile: text(task.dev_profile, 'dev_profile'),
    authorization,
    dependencies: array(task.dependencies ?? [], 'dependencies').map((value) => text(value, 'dependency')),
    state,
    human_gates: gates,
    native_gate_required: bool(task.native_gate_required, 'native_gate_required'),
    paid_execution_required: bool(task.paid_execution_required, 'paid_execution_required'),
    destructive_operation_required: bool(
      task.destructive_operation_required,
      'destructive_operation_required',
    ),
    release_or_deploy_required: bool(
      task.release_or_deploy_required,
      'release_or_deploy_required',
    ),
    credential_required: bool(task.credential_required, 'credential_required'),
    design_runnable: bool(task.design_runnable, 'design_runnable'),
    implementation_runnable: bool(task.implementation_runnable, 'implementation_runnable'),
    files_owned: array(task.files_owned ?? [], 'files_owned').map((value) => text(value, 'files_owned')),
    expected_context_cost: nonNegativeInteger(task.expected_context_cost, 'expected_context_cost'),
    expected_runtime_minutes: nonNegativeInteger(
      task.expected_runtime_minutes,
      'expected_runtime_minutes',
    ),
    context_locality: contextLocality,
    roadmap_order: task.roadmap_order == null
      ? index
      : nonNegativeInteger(task.roadmap_order, 'roadmap_order'),
  });
};

const assertDependencyGraph = (tasks) => {
  const byId = new Map(tasks.map((task) => [task.task_id, task]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (task) => {
    if (visited.has(task.task_id)) return;
    if (visiting.has(task.task_id)) throw new AutonomousQueueError('AUTONOMY_TASK_DEPENDENCY_CYCLE');
    visiting.add(task.task_id);
    for (const dependency of task.dependencies) {
      const target = byId.get(dependency);
      if (!target) throw new AutonomousQueueError('AUTONOMY_TASK_DEPENDENCY_MISSING', dependency);
      visit(target);
    }
    visiting.delete(task.task_id);
    visited.add(task.task_id);
  };
  for (const task of tasks) visit(task);
};

const requiredGateTypes = (task) => [
  task.native_gate_required && 'NATIVE_EXTERNAL_APPLICATION',
  task.paid_execution_required && 'PAID_PROVIDER_EXECUTION',
  task.destructive_operation_required && 'DESTRUCTIVE_OPERATION',
  task.release_or_deploy_required && 'RELEASE_OR_DEPLOYMENT',
  task.credential_required && 'CREDENTIAL_REQUIRED',
].filter(Boolean);

const compareCandidates = (left, right) => PRIORITY[right.task.priority] - PRIORITY[left.task.priority]
  || right.task.owner_priority - left.task.owner_priority
  || Number(right.mode === 'IMPLEMENTATION') - Number(left.mode === 'IMPLEMENTATION')
  || right.task.context_locality - left.task.context_locality
  || left.task.expected_context_cost - right.task.expected_context_cost
  || left.task.roadmap_order - right.task.roadmap_order
  || left.task.task_id.localeCompare(right.task.task_id);

export function selectAutonomousTask(tasks, { locked_files = [] } = {}) {
  if (!Array.isArray(tasks)) throw new AutonomousQueueError('AUTONOMOUS_TASK_INVALID');
  const normalized = tasks.map(normalizeTask);
  if (new Set(normalized.map((task) => task.task_id)).size !== normalized.length) {
    throw new AutonomousQueueError('AUTONOMOUS_TASK_ID_DUPLICATE');
  }
  assertDependencyGraph(normalized);
  const completed = new Set(normalized
    .filter((task) => task.state === 'COMPLETED')
    .map((task) => task.task_id));
  const locks = new Set(locked_files.map((value) => text(value, 'locked_file')));
  const runnable = [];
  const parked = [];
  const waiting = [];
  let systemBlocked = false;
  for (const task of normalized) {
    if (task.state === 'COMPLETED') continue;
    if (task.state === 'BLOCKED') {
      parked.push({ task_id: task.task_id, reason: 'TASK_BLOCKED', gate_id: null });
      continue;
    }
    if (task.dependencies.some((dependency) => !completed.has(dependency))) {
      waiting.push({ task_id: task.task_id, reason: 'DEPENDENCY_WAIT' });
      continue;
    }
    const activeGate = task.human_gates.find((gate) => gate.status === 'WAITING_OWNER');
    if (activeGate) {
      parked.push({ task_id: task.task_id, reason: 'HUMAN_GATE_REQUIRED', gate_id: activeGate.gate_id });
      if (!activeGate.safe_to_continue_other_tasks) systemBlocked = true;
      continue;
    }
    const satisfiedTypes = new Set(task.human_gates
      .filter((gate) => gate.status === 'SATISFIED')
      .map((gate) => gate.type));
    const missingGate = requiredGateTypes(task).find((type) => !satisfiedTypes.has(type));
    if (missingGate) {
      parked.push({ task_id: task.task_id, reason: `GATE_UNSATISFIED:${missingGate}`, gate_id: null });
      continue;
    }
    if (task.files_owned.some((path) => locks.has(path))) {
      parked.push({ task_id: task.task_id, reason: 'FILE_OWNERSHIP_CONFLICT', gate_id: null });
      continue;
    }
    if (task.authorization === 'AUTHORIZED' && task.implementation_runnable) {
      runnable.push({ task, mode: 'IMPLEMENTATION' });
      continue;
    }
    if (['AUTHORIZED', 'DESIGN_ONLY'].includes(task.authorization) && task.design_runnable) {
      runnable.push({ task, mode: 'DESIGN_ONLY' });
      continue;
    }
    parked.push({
      task_id: task.task_id,
      reason: task.authorization === 'AUTHORITY_CONFLICT'
        ? 'AUTHORITY_CONFLICT'
        : 'AUTONOMY_TASK_NOT_AUTHORIZED',
      gate_id: null,
    });
  }
  runnable.sort(compareCandidates);
  if (systemBlocked) runnable.length = 0;
  const result = {
    autonomous_queue_schema_version: '1.0.0',
    result: systemBlocked
      ? 'SYSTEM_BLOCKED'
      : runnable.length > 0
        ? 'RUNNABLE_TASK_SELECTED'
        : 'AUTONOMY_NO_RUNNABLE_TASK',
    system_blocked: systemBlocked,
    selected: runnable[0] == null
      ? null
      : { task_id: runnable[0].task.task_id, mode: runnable[0].mode },
    runnable: runnable.map(({ task, mode }) => ({ task_id: task.task_id, mode })),
    parked,
    waiting,
  };
  result.content_checksum = checksum(result, 'content_checksum');
  return deepFreeze(result);
}

export function assertAutonomousWorkMode(selection, requestedMode) {
  if (!selection?.selected) throw new AutonomousQueueError('AUTONOMY_NO_RUNNABLE_TASK');
  if (!['DESIGN_ONLY', 'IMPLEMENTATION'].includes(requestedMode)) {
    throw new AutonomousQueueError('AUTONOMOUS_WORK_MODE_INVALID');
  }
  if (selection.selected.mode === 'DESIGN_ONLY' && requestedMode === 'IMPLEMENTATION') {
    throw new AutonomousQueueError('SPECULATIVE_IMPLEMENTATION');
  }
  return deepFreeze({
    result: 'AUTONOMOUS_WORK_MODE_ALLOWED',
    task_id: selection.selected.task_id,
    mode: requestedMode,
  });
}

export {
  AUTHORIZATION as AUTONOMOUS_AUTHORIZATION_STATES,
  GATE_STATUSES as HUMAN_GATE_STATUSES,
  GATE_TYPES as HUMAN_GATE_TYPES,
};
