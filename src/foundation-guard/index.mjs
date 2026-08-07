import { createHash, randomUUID } from 'node:crypto';
import { activateRoleWithPermit } from '../context-guard/activation-gateway.mjs';
import { issueRoleActivationPermit, validateRoleActivationPermit } from '../context-guard/permit.mjs';
import { FoundationGuardError, createActivationEntryRegistry, resolveActivationEntry, verifyRegistryIdentity } from './activation-registry.mjs';
import { appendFoundationAudit } from './audit.mjs';
import { PERMIT_LEDGER_FAULT_MATRIX, TOCTOU_MATRIX, assertFoundationMatricesComplete } from './matrices.mjs';

const checksum = (value) => `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
const required = ['project_id','task_id','role','session_id','activation_entry_id','requester_identity','phase','scope','correlation_id','selected_inputs'];

export function createFoundationActivationRequest(value = {}) {
  for (const key of required) if (!(key in value) || (key !== 'selected_inputs' && (typeof value[key] !== 'string' || !value[key].trim()))) {
    throw new FoundationGuardError('FOUNDATION_REQUEST_INVALID');
  }
  if (!Array.isArray(value.selected_inputs)) throw new FoundationGuardError('FOUNDATION_REQUEST_INVALID');
  return Object.freeze({ ...value, selected_inputs: Object.freeze(value.selected_inputs.map((item) => Object.freeze({ ...item }))) });
}

function validateStateSnapshot(snapshot, request) {
  if (!snapshot || snapshot.task_id !== request.task_id || snapshot.phase !== request.phase || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) {
    throw new FoundationGuardError('FOUNDATION_STATE_BINDING_MISMATCH');
  }
  return Object.freeze({ task_id: snapshot.task_id, phase: snapshot.phase, revision: snapshot.revision, checksum: checksum(snapshot) });
}

function createBinding({ registry, entry, request, state }) {
  return Object.freeze({ binding_version: '1.0.0', activation_entry_id: entry.entry_id, entry_owner: entry.owner,
    requester_identity: request.requester_identity, phase: request.phase, scope: request.scope, correlation_id: request.correlation_id,
    registry_revision: registry.revision, registry_checksum: registry.checksum, state_revision: state.revision, state_checksum: state.checksum });
}

export async function issueFoundationRoleActivationPermit({ session, registry, state_provider, preflight_result, preflight_result_checksum, override_binding, request, now = Date.now() }) {
  const guarded = createFoundationActivationRequest(request);
  const entry = resolveActivationEntry(registry, guarded);
  if (typeof state_provider !== 'function') throw new FoundationGuardError('FOUNDATION_STATE_PROVIDER_REQUIRED');
  const state = validateStateSnapshot(await state_provider(guarded), guarded);
  const activation_binding = createBinding({ registry, entry, request: guarded, state });
  return issueRoleActivationPermit({ session, ...guarded, preflight_result, preflight_result_checksum, override_binding, activation_binding, now });
}

function verifyPermitBinding(permit, request, registry, state) {
  const binding = permit?.activation_binding;
  if (!binding || binding.binding_version !== '1.0.0' || binding.activation_entry_id !== request.activation_entry_id
    || binding.requester_identity !== request.requester_identity || binding.phase !== request.phase || binding.scope !== request.scope
    || binding.correlation_id !== request.correlation_id || binding.registry_revision !== registry.revision || binding.registry_checksum !== registry.checksum
    || binding.state_revision !== state.revision || binding.state_checksum !== state.checksum) {
    throw new FoundationGuardError('FOUNDATION_PERMIT_BINDING_MISMATCH');
  }
}

export async function activateFoundationRole({ session, permit, request, registry, registry_provider = async () => registry, state_provider, before_use, audit_options }) {
  assertFoundationMatricesComplete();
  const guarded = createFoundationActivationRequest(request);
  resolveActivationEntry(registry, guarded);
  if (typeof state_provider !== 'function') throw new FoundationGuardError('FOUNDATION_STATE_PROVIDER_REQUIRED');
  const stateBefore = validateStateSnapshot(await state_provider(guarded), guarded);
  verifyPermitBinding(permit, guarded, registry, stateBefore);
  await validateRoleActivationPermit({ session, permit, request: guarded });
  if (before_use) await before_use();
  const registryAfter = await registry_provider();
  verifyRegistryIdentity(registry, registryAfter);
  resolveActivationEntry(registryAfter, guarded);
  const stateAfter = validateStateSnapshot(await state_provider(guarded), guarded);
  if (stateAfter.revision !== stateBefore.revision || stateAfter.checksum !== stateBefore.checksum) throw new FoundationGuardError('FOUNDATION_STATE_CHANGED_BEFORE_USE');
  verifyPermitBinding(permit, guarded, registryAfter, stateAfter);
  const audit = await appendFoundationAudit(session, { event_type: 'ACTIVATION_VALIDATED', correlation_id: guarded.correlation_id,
    permit_id: permit.permit_id, activation_entry_id: guarded.activation_entry_id, project_id: guarded.project_id, task_id: guarded.task_id,
    role: guarded.role, requester_identity: guarded.requester_identity, decision: 'ALLOW_PENDING_CONSUMPTION', reason_code: 'FOUNDATION_GUARD_VALIDATED',
    registry_revision: registryAfter.revision, state_revision: stateAfter.revision }, audit_options);
  const handoff = await activateRoleWithPermit({ session, permit, request: guarded });
  return Object.freeze({ ...handoff, correlation_id: guarded.correlation_id, activation_entry_id: guarded.activation_entry_id, foundation_audit_event_checksum: audit.event_checksum });
}

export { FoundationGuardError, createActivationEntryRegistry, resolveActivationEntry, verifyRegistryIdentity, PERMIT_LEDGER_FAULT_MATRIX, TOCTOU_MATRIX, assertFoundationMatricesComplete };
