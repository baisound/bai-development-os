import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONTEXT_GUARD_CONFIG, getGuardConfigChecksum, getTrustedRootSetChecksum, validateConfig } from './config.mjs';
import { ContextGuardError } from './errors.mjs';
import { writeImmutableEvidence, readVerifiedEvidence } from './evidence-store.mjs';
import { validatePersistedBaseline, validatePersistedOverride } from './override.mjs';
import { evaluateLimits } from './evaluate.mjs';

const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const canonical = (value) => JSON.stringify(sort(value));
const digest = (value, field = 'content_checksum') => {
  const copy = { ...value }; delete copy[field];
  return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`;
};
const selectedChecksum = (inputs) => `sha256:${createHash('sha256').update(
  canonical(inputs.map((input) => input.content_checksum)),
).digest('hex')}`;
const PREFLIGHT_FIELDS = Object.freeze([
  'result_id', 'project_id', 'task_id', 'role', 'session_id', 'decision',
  'selected_input_set_checksum', 'trusted_root_set_checksum', 'guard_config_checksum',
  'estimated_output_tokens', 'estimated_artifact_bytes', 'expected_artifact_sections',
  'measured_values', 'exceeded_limits', 'permit_issuance_allowed',
  'role_activation_allowed', 'safe_stop', 'issued_at', 'result_checksum', 'content_checksum',
]);
const OVERRIDE_PREFLIGHT_FIELDS = Object.freeze([
  ...PREFLIGHT_FIELDS.slice(0, -2),
  'override_record_checksum', 'baseline_preflight_result_checksum',
  'result_checksum', 'content_checksum',
]);
const OUTPUT_ESTIMATE_FIELDS = Object.freeze([
  'estimated_output_tokens', 'estimated_artifact_bytes', 'expected_artifact_sections',
]);
const preflightDigest = (value) => {
  const copy = { ...value };
  delete copy.result_checksum;
  delete copy.content_checksum;
  return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`;
};
const isOutputEstimate = (value) => Number.isSafeInteger(value) && value >= 0;
const preflightEvidenceName = (hasOverrideBinding) => hasOverrideBinding
  ? 'repreflight-result.json' : 'preflight-result.json';

function preflightError(code) {
  throw new ContextGuardError(code);
}

export async function createCanonicalPreflightResult({ session, project_id, task_id, role, session_id, selected_inputs, output_estimates = {}, now = Date.now() }) {
  if (!session || !project_id || !task_id || !role || !session_id || !Array.isArray(selected_inputs)) {
    preflightError('CONTEXT_PREFLIGHT_RESULT_REQUIRED');
  }
  const config = validateConfig(DEFAULT_CONTEXT_GUARD_CONFIG);
  const result = evaluateLimits({ selected: selected_inputs, ...output_estimates }, config);
  const record = {
    result_id: randomUUID(), project_id, task_id, role, session_id, decision: result.decision,
    selected_input_set_checksum: selectedChecksum(selected_inputs),
    trusted_root_set_checksum: await getTrustedRootSetChecksum(),
    guard_config_checksum: getGuardConfigChecksum(config),
    estimated_output_tokens: output_estimates.estimated_output_tokens,
    estimated_artifact_bytes: output_estimates.estimated_artifact_bytes,
    expected_artifact_sections: output_estimates.expected_top_level_sections,
    measured_values: {
      selected_file_count: selected_inputs.length,
      total_input_bytes: selected_inputs.reduce((total, input) => total + input.bytes, 0),
      estimated_input_tokens: selected_inputs.reduce((total, input) => total + input.estimated_tokens, 0),
      estimated_output_tokens: output_estimates.estimated_output_tokens,
      estimated_artifact_bytes: output_estimates.estimated_artifact_bytes,
      expected_artifact_sections: output_estimates.expected_top_level_sections,
    },
    exceeded_limits: result.exceeded_limits,
    permit_issuance_allowed: result.permit_issuance_allowed,
    role_activation_allowed: result.role_activation_allowed,
    safe_stop: result.safe_stop,
    issued_at: new Date(now).toISOString(),
  };
  record.result_checksum = preflightDigest(record);
  return writeImmutableEvidence(session, 'preflight-result.json', record);
}

async function validatePersistedPreflight({ session, preflight_result, preflight_result_checksum, request, selected_inputs, hasOverrideBinding = false }) {
  if (!preflight_result || !preflight_result_checksum) preflightError('CONTEXT_PREFLIGHT_RESULT_REQUIRED');
  let persisted;
  try {
    persisted = await readVerifiedEvidence(path.join(session, preflightEvidenceName(hasOverrideBinding)));
  } catch {
    preflightError('CONTEXT_PREFLIGHT_EVIDENCE_REQUIRED');
  }
  if (persisted.content_checksum !== preflight_result_checksum) preflightError('CONTEXT_PREFLIGHT_CHECKSUM_MISMATCH');
  if (canonical(preflight_result) !== canonical(persisted)) preflightError('CONTEXT_PREFLIGHT_BINDING_MISMATCH');
  const requiredFields = hasOverrideBinding ? OVERRIDE_PREFLIGHT_FIELDS : PREFLIGHT_FIELDS;
  if (Object.keys(persisted).length !== requiredFields.length
    || requiredFields.some((key) => !Object.hasOwn(persisted, key))
    || Object.keys(persisted).some((key) => !requiredFields.includes(key))
    || persisted.result_checksum !== preflightDigest(persisted)) {
    preflightError('CONTEXT_PREFLIGHT_RESULT_INVALID');
  }
  for (const field of OUTPUT_ESTIMATE_FIELDS) {
    if (!Object.hasOwn(persisted, field)) preflightError('CONTEXT_OUTPUT_ESTIMATION_REQUIRED');
    if (!isOutputEstimate(persisted[field])) preflightError('CONTEXT_OUTPUT_ESTIMATION_INVALID');
  }
  if (!persisted.measured_values || typeof persisted.measured_values !== 'object'
    || OUTPUT_ESTIMATE_FIELDS.some((field) => persisted.measured_values[field] !== persisted[field])
    || persisted.project_id !== request.project_id || persisted.task_id !== request.task_id
    || persisted.role !== request.role || persisted.session_id !== request.session_id
    || persisted.selected_input_set_checksum !== selectedChecksum(selected_inputs)
    || persisted.trusted_root_set_checksum !== await getTrustedRootSetChecksum()
    || (!hasOverrideBinding && persisted.guard_config_checksum !== getGuardConfigChecksum(DEFAULT_CONTEXT_GUARD_CONFIG))) {
    preflightError('CONTEXT_PREFLIGHT_BINDING_MISMATCH');
  }
  const evaluated = evaluateLimits({
    selected: selected_inputs,
    estimated_output_tokens: persisted.estimated_output_tokens,
    estimated_artifact_bytes: persisted.estimated_artifact_bytes,
    expected_top_level_sections: persisted.expected_artifact_sections,
  }, hasOverrideBinding ? undefined : DEFAULT_CONTEXT_GUARD_CONFIG);
  if (hasOverrideBinding) {
    // Override-backed re-preflight has its effective configuration validated by
    // verifyOverrideBinding / validateStoredPermitBinding below.
    if (!['PASS', 'PASS_WITH_REDUCTION'].includes(persisted.decision)) {
      preflightError('CONTEXT_PERMIT_DECISION_INELIGIBLE');
    }
  } else if (persisted.decision !== evaluated.decision
    || JSON.stringify(persisted.exceeded_limits) !== JSON.stringify(evaluated.exceeded_limits)
    || persisted.permit_issuance_allowed !== evaluated.permit_issuance_allowed
    || persisted.role_activation_allowed !== evaluated.role_activation_allowed
    || persisted.safe_stop !== evaluated.safe_stop) {
    preflightError('CONTEXT_PREFLIGHT_RESULT_INVALID');
  }
  if (!['PASS', 'PASS_WITH_REDUCTION'].includes(persisted.decision)
    || persisted.permit_issuance_allowed !== true || persisted.role_activation_allowed !== true
    || persisted.safe_stop !== false) {
    preflightError('CONTEXT_PERMIT_DECISION_INELIGIBLE');
  }
  return Object.freeze(persisted);
}
const sync = async (file) => { const h = await open(file, 'r'); try { await h.sync(); } finally { await h.close(); } };
const ledgerPath = (session) => path.join(session, 'role-activation-permit-events.jsonl');

async function verifyOverrideBinding(session, binding, request, selected_inputs, selected_input_set_checksum, decision) {
  if (!binding?.override || !binding?.repreflight) throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  const override = await readVerifiedEvidence(path.join(session, 'override-record.json'));
  const baseline = await readVerifiedEvidence(path.join(session, 'baseline-preflight-result.json'));
  const repreflight = await readVerifiedEvidence(path.join(session, 'repreflight-result.json'));
  validatePersistedOverride(override, { ...request, selected_inputs });
  await validatePersistedBaseline(baseline, request, selected_inputs);
  if (override.content_checksum !== binding.override.content_checksum
    || repreflight.content_checksum !== binding.repreflight.content_checksum
    || repreflight.override_record_checksum !== override.override_checksum
    || repreflight.baseline_preflight_result_checksum !== baseline.content_checksum
    || override.project_id !== request.project_id || override.task_id !== request.task_id
    || override.role !== request.role || override.session_id !== request.session_id
    || baseline.project_id !== request.project_id || baseline.task_id !== request.task_id
    || baseline.role !== request.role || baseline.session_id !== request.session_id
    || baseline.decision !== 'OWNER_OVERRIDE_REQUIRED'
    || baseline.override_eligible_limit !== override.overridden_limit
    || !baseline.override_eligible_limits.includes(override.overridden_limit)
    || !Array.isArray(baseline.exceeded_limits) || baseline.exceeded_limits.length !== 1
    || baseline.exceeded_limits[0] !== override.overridden_limit
    || baseline.selected_input_set_checksum !== selected_input_set_checksum
    || baseline.guard_config_checksum !== getGuardConfigChecksum(DEFAULT_CONTEXT_GUARD_CONFIG)
    || override.original_limit !== DEFAULT_CONTEXT_GUARD_CONFIG[override.overridden_limit]
    || override.trusted_root_set_checksum !== await getTrustedRootSetChecksum()
    || baseline.trusted_root_set_checksum !== await getTrustedRootSetChecksum()
    || repreflight.trusted_root_set_checksum !== await getTrustedRootSetChecksum()
    || override.guard_config_checksum !== repreflight.guard_config_checksum
    || repreflight.guard_config_checksum !== getGuardConfigChecksum({
      ...DEFAULT_CONTEXT_GUARD_CONFIG,
      [override.overridden_limit]: override.approved_limit,
    })
    || repreflight.selected_input_set_checksum !== selected_input_set_checksum
    || repreflight.decision !== decision
    || !['PASS', 'PASS_WITH_REDUCTION'].includes(repreflight.decision)) {
    throw new ContextGuardError('CONTEXT_OWNER_OVERRIDE_INVALID');
  }
  return Object.freeze({
    override_record_checksum: override.override_checksum,
    baseline_preflight_result_checksum: baseline.content_checksum,
    repreflight_result_checksum: repreflight.content_checksum,
    trusted_root_set_checksum: repreflight.trusted_root_set_checksum,
    selected_input_set_checksum,
    guard_config_checksum: repreflight.guard_config_checksum,
    final_guard_decision: repreflight.decision,
    overridden_limit: override.overridden_limit,
    baseline_original_limit: baseline.configured_limits[override.overridden_limit],
    approved_limit: override.approved_limit,
  });
}

async function validateStoredPermitBinding(session, permit, request, selected_inputs, selected_input_set_checksum, decision) {
  const binding = permit.permit_binding;
  const override = await readVerifiedEvidence(path.join(session, 'override-record.json'));
  const baseline = await readVerifiedEvidence(path.join(session, 'baseline-preflight-result.json'));
  const repreflight = await readVerifiedEvidence(path.join(session, 'repreflight-result.json'));
  validatePersistedOverride(override, { ...request, selected_inputs });
  await validatePersistedBaseline(baseline, request, selected_inputs);
  if (binding.override_record_checksum !== override.override_checksum
    || binding.baseline_preflight_result_checksum !== baseline.content_checksum
    || binding.repreflight_result_checksum !== repreflight.content_checksum
    || binding.trusted_root_set_checksum !== await getTrustedRootSetChecksum()
    || binding.selected_input_set_checksum !== selected_input_set_checksum
    || binding.guard_config_checksum !== repreflight.guard_config_checksum
    || binding.final_guard_decision !== decision
    || repreflight.override_record_checksum !== override.override_checksum
    || repreflight.baseline_preflight_result_checksum !== baseline.content_checksum
    || override.project_id !== request.project_id || override.task_id !== request.task_id
    || override.role !== request.role || override.session_id !== request.session_id
    || baseline.project_id !== request.project_id || baseline.task_id !== request.task_id
    || baseline.role !== request.role || baseline.session_id !== request.session_id
    || baseline.decision !== 'OWNER_OVERRIDE_REQUIRED'
    || baseline.override_eligible_limit !== override.overridden_limit
    || !baseline.override_eligible_limits.includes(override.overridden_limit)
    || !Array.isArray(baseline.exceeded_limits) || baseline.exceeded_limits.length !== 1
    || baseline.exceeded_limits[0] !== override.overridden_limit
    || baseline.selected_input_set_checksum !== selected_input_set_checksum
    || baseline.guard_config_checksum !== getGuardConfigChecksum(DEFAULT_CONTEXT_GUARD_CONFIG)
    || override.original_limit !== DEFAULT_CONTEXT_GUARD_CONFIG[override.overridden_limit]
    || repreflight.guard_config_checksum !== getGuardConfigChecksum({
      ...DEFAULT_CONTEXT_GUARD_CONFIG,
      [override.overridden_limit]: override.approved_limit,
    })
    || permit.overridden_limit !== baseline.exceeded_limits[0]
    || permit.overridden_limit !== override.overridden_limit
    || permit.baseline_original_limit !== baseline.configured_limits[permit.overridden_limit]
    || permit.baseline_original_limit !== override.original_limit
    || permit.baseline_original_limit !== DEFAULT_CONTEXT_GUARD_CONFIG[permit.overridden_limit]
    || permit.approved_limit !== override.approved_limit
    || permit.baseline_preflight_result_checksum !== baseline.content_checksum
    || permit.override_record_checksum !== override.override_checksum
    || permit.repreflight_result_checksum !== repreflight.content_checksum
    || permit.trusted_root_set_checksum !== repreflight.trusted_root_set_checksum
    || permit.selected_input_set_checksum !== repreflight.selected_input_set_checksum
    || permit.guard_config_checksum !== repreflight.guard_config_checksum
    || permit.final_guard_decision !== decision
    || !['PASS', 'PASS_WITH_REDUCTION'].includes(decision)) {
    throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  }
}

export async function issueRoleActivationPermit({
  session, project_id, task_id, role, session_id, selected_inputs,
  preflight_result, preflight_result_checksum, override_binding, activation_binding, issuer_identity = 'context-guard-permit-issuer', now = Date.now(),
}) {
  if (!session || !Array.isArray(selected_inputs)) preflightError('CONTEXT_PREFLIGHT_RESULT_REQUIRED');
  if (!Number.isSafeInteger(now) || now < 0) throw new ContextGuardError('CONTEXT_CLOCK_UNCERTAIN');
  if (typeof issuer_identity !== 'string' || !issuer_identity.trim()) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  const request = { project_id, task_id, role, session_id };
  const preflight = await validatePersistedPreflight({
    session, preflight_result, preflight_result_checksum, request, selected_inputs,
    hasOverrideBinding: Boolean(override_binding),
  });
  const settledDecision = preflight.decision;
  const selected_input_set_checksum = preflight.selected_input_set_checksum;
  const trusted_root_set_checksum = preflight.trusted_root_set_checksum;
  const permit_binding = override_binding
    ? await verifyOverrideBinding(session, override_binding, request, selected_inputs, selected_input_set_checksum, settledDecision)
    : undefined;
  const permit = { permit_version: '1.2.0', permit_id: randomUUID(), issuer_identity, project_id, task_id, role, session_id, selected_input_set_checksum,
    input_count: selected_inputs.length, input_bytes: selected_inputs.reduce((n, i) => n + i.bytes, 0),
    decision: settledDecision, guard_decision: settledDecision,
    preflight_result_id: preflight.result_id, preflight_result_checksum: preflight.content_checksum,
    estimated_output_tokens: preflight.estimated_output_tokens,
    estimated_artifact_bytes: preflight.estimated_artifact_bytes,
    expected_artifact_sections: preflight.expected_artifact_sections,
    trusted_root_set_checksum, guard_config_checksum: preflight.guard_config_checksum,
    issued_at: new Date(now).toISOString(), expires_at: new Date(now + 15 * 60_000).toISOString(), single_use: true,
    ...(activation_binding ? { activation_binding: Object.freeze({ ...activation_binding }) } : {}),
    ...(permit_binding ? { permit_binding, ...permit_binding } : {}) };
  await writeImmutableEvidence(session, 'role-activation-permit.json', permit);
  return readVerifiedEvidence(path.join(session, 'role-activation-permit.json'));
}

export async function validateRoleActivationPermit({ session, permit, request, now = Date.now() }) {
  if (!permit) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_MISSING');
  if (!Number.isSafeInteger(now) || now < 0) throw new ContextGuardError('CONTEXT_CLOCK_UNCERTAIN');
  if (!Object.hasOwn(permit, 'permit_version')) throw new ContextGuardError('CONTEXT_LEGACY_PERMIT_REJECTED');
  if (permit.permit_version !== '1.2.0') throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_UNSUPPORTED_VERSION');
  if (permit.content_checksum !== digest(permit)) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  if (typeof permit.issuer_identity !== 'string' || !permit.issuer_identity.trim()) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  let persistedPermit;
  try { persistedPermit = await readVerifiedEvidence(path.join(session, 'role-activation-permit.json')); }
  catch { throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_UNKNOWN'); }
  if (persistedPermit.permit_id !== permit.permit_id) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_UNKNOWN');
  for (const key of ['project_id', 'task_id', 'role', 'session_id']) if (permit[key] !== request[key]) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  if (Date.parse(permit.expires_at) <= now) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_EXPIRED');
  const inputChecksum = `sha256:${createHash('sha256').update(canonical(request.selected_inputs.map((input) => input.content_checksum))).digest('hex')}`;
  if (inputChecksum !== permit.selected_input_set_checksum) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  if (permit.trusted_root_set_checksum !== await getTrustedRootSetChecksum()) {
    throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  }
  if (!['PASS', 'PASS_WITH_REDUCTION'].includes(permit.decision)) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  for (const field of [
    'preflight_result_id', 'preflight_result_checksum', 'guard_decision',
    'estimated_output_tokens', 'estimated_artifact_bytes', 'expected_artifact_sections',
    'guard_config_checksum',
  ]) {
    if (!Object.hasOwn(permit, field)) throw new ContextGuardError('CONTEXT_LEGACY_PERMIT_REJECTED');
  }
  let preflight;
  let persistedPreflight;
  try {
    persistedPreflight = await readVerifiedEvidence(path.join(
      session, preflightEvidenceName(Boolean(permit.permit_binding)),
    ));
  } catch (error) {
    throw new ContextGuardError('CONTEXT_PREFLIGHT_EVIDENCE_REQUIRED');
  }
  preflight = await validatePersistedPreflight({
    session,
    preflight_result: persistedPreflight,
    preflight_result_checksum: permit.preflight_result_checksum,
    request,
    selected_inputs: request.selected_inputs,
    hasOverrideBinding: Boolean(permit.permit_binding),
  });
  if (permit.preflight_result_id !== preflight.result_id
    || permit.guard_decision !== preflight.decision
    || permit.decision !== preflight.decision
    || permit.estimated_output_tokens !== preflight.estimated_output_tokens
    || permit.estimated_artifact_bytes !== preflight.estimated_artifact_bytes
    || permit.expected_artifact_sections !== preflight.expected_artifact_sections
    || permit.selected_input_set_checksum !== preflight.selected_input_set_checksum
    || permit.trusted_root_set_checksum !== preflight.trusted_root_set_checksum
    || permit.guard_config_checksum !== preflight.guard_config_checksum) {
    throw new ContextGuardError('CONTEXT_PREFLIGHT_BINDING_MISMATCH');
  }
  if (permit.permit_binding) {
    const binding = permit.permit_binding;
    if (binding.selected_input_set_checksum !== inputChecksum
      || binding.trusted_root_set_checksum !== await getTrustedRootSetChecksum()
      || binding.final_guard_decision !== permit.decision
      || !binding.override_record_checksum || !binding.baseline_preflight_result_checksum
      || !binding.repreflight_result_checksum || !binding.guard_config_checksum
      || !binding.overridden_limit || !Number.isSafeInteger(binding.baseline_original_limit)
      || !Number.isSafeInteger(binding.approved_limit)
      || !permit.overridden_limit || !Number.isSafeInteger(permit.baseline_original_limit)
      || !Number.isSafeInteger(permit.approved_limit)
      || !permit.final_guard_decision) {
      throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
    }
    await validateStoredPermitBinding(session, permit, request, request.selected_inputs, inputChecksum, permit.decision);
  }
  if (persistedPermit.content_checksum !== permit.content_checksum || canonical(persistedPermit) !== canonical(permit)) {
    throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_INVALID');
  }
  const ledger = await readLedger(session);
  if (ledger.some((event) => event.permit_id === permit.permit_id && event.event_type === 'PERMIT_REVOKED')) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_REVOKED');
  if (ledger.some((event) => event.permit_id === permit.permit_id && event.event_type === 'PERMIT_CONSUMED')) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_ALREADY_CONSUMED');
  return true;
}

async function readLedger(session) {
  let text = '';
  try { text = await readFile(ledgerPath(session), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_LEDGER_READ_FAILED', error.message); }
  let previous = 'sha256:GENESIS';
  const records = [];
  for (const line of text.split('\n').filter(Boolean)) {
    let event; try { event = JSON.parse(line); } catch { throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_EVENT_CHAIN_INVALID'); }
    if (event.previous_event_checksum !== previous || event.event_checksum !== digest(event, 'event_checksum')) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_EVENT_CHAIN_INVALID');
    previous = event.event_checksum; records.push(event);
  }
  return records;
}
async function acquireLease(session, permit) {
  const locks = path.join(session, 'locks');
  await mkdir(locks, { recursive: true, mode: 0o700 });
  const file = path.join(locks, `permit-${permit.permit_id}.lock`);
  try {
    const handle = await open(file, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    await handle.writeFile(canonical({ permit_id: permit.permit_id, lease_id: randomUUID(), issued_at: new Date().toISOString() })); await handle.sync(); await handle.close(); await sync(locks);
    return file;
  } catch (error) {
    if (error.code === 'EEXIST') throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_LOCK_CONFLICT');
    throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_LOCK_UNCERTAIN');
  }
}


async function appendPermitEvent({ session, permit, event_type, actor_identity, reason = null }) {
  const events = await readLedger(session);
  const event = { event_id: randomUUID(), event_type, permit_id: permit.permit_id, project_id: permit.project_id,
    task_id: permit.task_id, role: permit.role, session_id: permit.session_id, transaction_id: randomUUID(), event_at: new Date().toISOString(),
    actor_identity, reason, previous_event_checksum: events.at(-1)?.event_checksum ?? 'sha256:GENESIS' };
  event.event_checksum = digest(event, 'event_checksum');
  const line = `${canonical(event)}\n`;
  let handle;
  try {
    handle = await open(ledgerPath(session), constants.O_CREAT | constants.O_APPEND | constants.O_WRONLY, 0o600);
    const { bytesWritten } = await handle.write(line, null, 'utf8');
    if (bytesWritten !== Buffer.byteLength(line)) throw new ContextGuardError('ROLE_ACTIVATION_STATE_UNKNOWN', 'partial ledger append');
    await handle.sync();
  } catch (error) {
    if (error instanceof ContextGuardError) throw error;
    throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_LEDGER_WRITE_FAILED', error.message);
  } finally { if (handle) await handle.close(); }
  await sync(session);
  const reread = await readLedger(session);
  if (reread.at(-1)?.event_checksum !== event.event_checksum) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_LEDGER_VERIFY_FAILED');
  return Object.freeze(event);
}

export async function revokeRoleActivationPermit({ session, permit, actor_identity = 'owner', reason = 'REVOKED' } = {}) {
  if (!permit) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_MISSING');
  const lease = await acquireLease(session, permit);
  try {
    const events = await readLedger(session);
    if (events.some((event) => event.permit_id === permit.permit_id && event.event_type === 'PERMIT_CONSUMED')) {
      throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_ALREADY_CONSUMED');
    }
    if (events.some((event) => event.permit_id === permit.permit_id && event.event_type === 'PERMIT_REVOKED')) {
      throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_REVOKED');
    }
    return await appendPermitEvent({ session, permit, event_type: 'PERMIT_REVOKED', actor_identity, reason });
  } finally {
    await unlink(lease).catch(() => {});
    await sync(path.dirname(lease)).catch(() => {});
  }
}

export async function inspectRoleActivationPermitLedger({ session, permit_id } = {}) {
  const events = await readLedger(session);
  const matching = permit_id ? events.filter((event) => event.permit_id === permit_id) : events;
  return Object.freeze({ events: Object.freeze(matching), consumed: matching.some((event) => event.event_type === 'PERMIT_CONSUMED'),
    revoked: matching.some((event) => event.event_type === 'PERMIT_REVOKED'), uncertain: false });
}

export async function consumeRoleActivationPermit({ session, permit, request, consumer_identity = 'gateway', durability = { sync }, beforeReread } = {}) {
  await validateRoleActivationPermit({ session, permit, request });
  const lease = await acquireLease(session, permit);
  try {
    await validateRoleActivationPermit({ session, permit, request });
    const events = await readLedger(session);
    const event = { event_id: randomUUID(), event_type: 'PERMIT_CONSUMED', permit_id: permit.permit_id, project_id: permit.project_id,
      task_id: permit.task_id, role: permit.role, session_id: permit.session_id, transaction_id: randomUUID(), event_at: new Date().toISOString(),
      activation_request_checksum: `sha256:${createHash('sha256').update(canonical(request)).digest('hex')}`,
      selected_input_set_checksum: permit.selected_input_set_checksum, consumer_identity,
      previous_event_checksum: events.at(-1)?.event_checksum ?? 'sha256:GENESIS' };
    event.event_checksum = digest(event, 'event_checksum');
    const line = `${canonical(event)}\n`;
    const handle = await open(ledgerPath(session), constants.O_CREAT | constants.O_APPEND | constants.O_WRONLY, 0o600);
    try {
      const { bytesWritten } = await handle.write(line, null, 'utf8');
      if (bytesWritten !== Buffer.byteLength(line)) throw new ContextGuardError('ROLE_ACTIVATION_STATE_UNKNOWN', 'partial ledger append');
      await handle.sync();
    } finally { await handle.close(); }
    await durability.sync(session);
    if (beforeReread) await beforeReread(ledgerPath(session));
    const reread = await readLedger(session);
    if (reread.at(-1)?.event_checksum !== event.event_checksum) throw new ContextGuardError('CONTEXT_ROLE_ACTIVATION_PERMIT_LEDGER_VERIFY_FAILED');
    await unlink(lease); await sync(path.dirname(lease));
    return event;
  } catch (error) {
    if (error instanceof ContextGuardError) throw error;
    throw new ContextGuardError('ROLE_ACTIVATION_STATE_UNKNOWN', error.message);
  }
}
