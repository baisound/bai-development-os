import { checksumObject, deepFreeze, requireArray, requireString } from './util.mjs';

const PROVIDERS = new Set(['CODEX_AUTOMATION', 'CODEX_MANUAL']);
const ENVIRONMENTS = new Set(['LOCAL_DESKTOP', 'CLOUD', 'UNKNOWN']);
const STATUSES = new Set(['AVAILABLE', 'UNAVAILABLE', 'UNKNOWN']);
const SOURCE_TRUST = new Set(['OBSERVED_LOCAL', 'VERIFIED_PROVIDER', 'UNTRUSTED_DESCRIPTION']);
const CAPABILITY_ID = /^[a-z][a-z0-9]*(\.[a-z0-9-]+)+$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

export class CodexAdapterError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'CodexAdapterError';
    this.code = code;
  }
}

const text = (value, name) => requireString(value, name, CodexAdapterError, 'CODEX_ADAPTER_INPUT_INVALID');
const strings = (value, name) => requireArray(value, name, CodexAdapterError, 'CODEX_ADAPTER_INPUT_INVALID')
  .map((item) => text(item, name));

export function createCodexCapabilityProbe(input = {}) {
  const provider = text(input.provider, 'provider');
  const environment = text(input.environment, 'environment');
  if (!PROVIDERS.has(provider) || !ENVIRONMENTS.has(environment)) {
    throw new CodexAdapterError('CODEX_CAPABILITY_PROBE_INVALID');
  }
  const observedAt = text(input.observed_at, 'observed_at');
  if (Number.isNaN(Date.parse(observedAt))) throw new CodexAdapterError('CODEX_CAPABILITY_PROBE_INVALID');
  const seen = new Set();
  const capabilities = requireArray(input.capabilities, 'capabilities', CodexAdapterError, 'CODEX_CAPABILITY_PROBE_INVALID')
    .map((raw) => {
      const capabilityId = text(raw?.capability_id, 'capability_id');
      const status = text(raw?.status, 'status');
      const sourceTrust = text(raw?.source_trust, 'source_trust');
      const evidenceRefs = strings(raw?.evidence_refs ?? [], 'evidence_ref');
      if (!CAPABILITY_ID.test(capabilityId) || !STATUSES.has(status) || !SOURCE_TRUST.has(sourceTrust) || seen.has(capabilityId)) {
        throw new CodexAdapterError('CODEX_CAPABILITY_PROBE_INVALID');
      }
      seen.add(capabilityId);
      if (status === 'AVAILABLE' && (evidenceRefs.length === 0 || sourceTrust === 'UNTRUSTED_DESCRIPTION')) {
        throw new CodexAdapterError('CODEX_CAPABILITY_EVIDENCE_REQUIRED');
      }
      return { capability_id: capabilityId, status, evidence_refs: evidenceRefs, source_trust: sourceTrust };
    })
    .sort((left, right) => left.capability_id.localeCompare(right.capability_id));
  const probe = {
    probe_schema_version: '1.0.0',
    provider,
    environment,
    observed_at: new Date(observedAt).toISOString(),
    capabilities,
  };
  probe.content_checksum = checksumObject(probe);
  return deepFreeze(probe);
}

export function verifyCodexCapabilityProbe(probe) {
  let rebuilt;
  try {
    rebuilt = createCodexCapabilityProbe(probe);
  } catch {
    throw new CodexAdapterError('CODEX_CAPABILITY_PROBE_TAMPERED');
  }
  if (!probe || probe.probe_schema_version !== '1.0.0' || !SHA256.test(probe.content_checksum ?? '')
    || checksumObject(probe) !== probe.content_checksum || rebuilt.content_checksum !== probe.content_checksum) {
    throw new CodexAdapterError('CODEX_CAPABILITY_PROBE_TAMPERED');
  }
  return deepFreeze({ result: 'CODEX_CAPABILITY_PROBE_VALID', content_checksum: probe.content_checksum });
}

export function verifyCodexCapabilityGateDecision(gateDecision) {
  if (!gateDecision || gateDecision.capability_gate_decision_version !== '1.0.0'
    || gateDecision.result !== 'CAPABILITY_GATE_PASS'
    || gateDecision.authority_verified !== true || gateDecision.safety_floor_passed !== true
    || !SHA256.test(gateDecision.authority_evidence_checksum ?? '')
    || !SHA256.test(gateDecision.content_checksum ?? '')
    || checksumObject(gateDecision) !== gateDecision.content_checksum) {
    throw new CodexAdapterError('CODEX_CAPABILITY_GATE_REQUIRED');
  }
  const allowed = strings(gateDecision.allowed_capabilities, 'allowed_capability');
  const denied = strings(gateDecision.denied_capabilities ?? [], 'denied_capability');
  if (new Set(allowed).size !== allowed.length || new Set(denied).size !== denied.length
    || allowed.some((item) => denied.includes(item))) {
    throw new CodexAdapterError('CODEX_CAPABILITY_GATE_REQUIRED');
  }
  text(gateDecision.decision_id, 'decision_id');
  return deepFreeze({ result: 'CODEX_CAPABILITY_GATE_VALID', content_checksum: gateDecision.content_checksum });
}

export function discoverCodexCapabilities(probe, gateDecision) {
  verifyCodexCapabilityProbe(probe);
  verifyCodexCapabilityGateDecision(gateDecision);
  const decisionId = text(gateDecision.decision_id, 'decision_id');
  const allowed = new Set(strings(gateDecision.allowed_capabilities, 'allowed_capability'));
  const denied = new Set(strings(gateDecision.denied_capabilities ?? [], 'denied_capability'));
  const visible = probe.capabilities
    .filter((item) => item.status === 'AVAILABLE' && allowed.has(item.capability_id) && !denied.has(item.capability_id))
    .map((item) => item.capability_id);
  return deepFreeze({
    result: 'CODEX_CAPABILITY_DISCOVERY_FILTERED',
    decision_id: decisionId,
    capabilities: visible,
  });
}

export function planCodexQuantum({ probe, gate_decision: gateDecision, request } = {}) {
  const discovery = discoverCodexCapabilities(probe, gateDecision);
  const capabilityId = text(request?.capability_id, 'capability_id');
  if (!discovery.capabilities.includes(capabilityId)) throw new CodexAdapterError('CODEX_CAPABILITY_NOT_DISPATCHABLE');
  if (request.previous_conversation_required === true) throw new CodexAdapterError('CODEX_CONVERSATION_DEPENDENCY_FORBIDDEN');
  const head = text(request.head, 'head');
  if (!/^[a-f0-9]{7,64}$/.test(head)) throw new CodexAdapterError('CODEX_ADAPTER_INPUT_INVALID');
  const checkpointChecksum = text(request.checkpoint_checksum, 'checkpoint_checksum');
  if (!SHA256.test(checkpointChecksum)) throw new CodexAdapterError('CODEX_ADAPTER_INPUT_INVALID');
  const plan = {
    codex_run_plan_version: '1.0.0',
    provider: probe.provider,
    environment: probe.environment,
    project_id: text(request.project_id, 'project_id'),
    task_id: text(request.task_id, 'task_id'),
    branch: text(request.branch, 'branch'),
    head,
    checkpoint_id: text(request.checkpoint_id, 'checkpoint_id'),
    checkpoint_checksum: checkpointChecksum,
    gate_decision_id: discovery.decision_id,
    gate_decision_checksum: gateDecision.content_checksum,
    capability_probe_checksum: probe.content_checksum,
    capability_id: capabilityId,
    root_prompt_ref: text(request.root_prompt_ref, 'root_prompt_ref'),
    previous_conversation_required: false,
    dispatch_performed: false,
  };
  plan.content_checksum = checksumObject(plan);
  return deepFreeze(plan);
}

export function normalizeCodexRunResult(input = {}) {
  const status = text(input.status, 'status');
  if (!['PASS', 'FAIL', 'PARKED', 'UNKNOWN'].includes(status)) throw new CodexAdapterError('CODEX_RESULT_INVALID');
  const testStatus = input.test_status ?? 'UNKNOWN';
  if (!['PASS', 'FAIL', 'UNKNOWN'].includes(testStatus)) throw new CodexAdapterError('CODEX_RESULT_INVALID');
  const evidenceRefs = strings(input.evidence_refs ?? [], 'evidence_ref');
  if ((status === 'PASS' || testStatus === 'PASS') && evidenceRefs.length === 0) {
    throw new CodexAdapterError('CODEX_RESULT_EVIDENCE_REQUIRED');
  }
  const result = {
    codex_run_result_version: '1.0.0',
    run_id: text(input.run_id, 'run_id'),
    plan_checksum: text(input.plan_checksum, 'plan_checksum'),
    status,
    test_status: testStatus,
    evidence_refs: evidenceRefs,
    review_queue_ref: input.review_queue_ref == null ? null : text(input.review_queue_ref, 'review_queue_ref'),
    canonical: false,
    native_evidence: false,
    requires_judge: true,
  };
  if (!SHA256.test(result.plan_checksum)) throw new CodexAdapterError('CODEX_RESULT_INVALID');
  result.content_checksum = checksumObject(result);
  return deepFreeze(result);
}

export const CODEX_ADAPTER_PROVIDERS = deepFreeze([...PROVIDERS]);
