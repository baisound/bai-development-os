import { ContextGuardError } from './errors.mjs';
import { executeAuthorizedRole } from './role-runtime-executor.mjs';
import { consumeRoleActivationPermit, validateRoleActivationPermit } from './permit.mjs';

export function createGuardedRoleActivationRequest(value) {
  for (const key of ['project_id', 'task_id', 'role', 'session_id', 'selected_inputs']) {
    if (!(key in value) || (key !== 'selected_inputs' && !value[key])) throw new ContextGuardError('CONTEXT_INVENTORY_INCOMPLETE');
  }
  if (!Array.isArray(value.selected_inputs)) throw new ContextGuardError('CONTEXT_INVENTORY_INCOMPLETE');
  return Object.freeze({ ...value });
}

export async function activateRoleWithPermit({ session, permit, request }) {
  const guarded = createGuardedRoleActivationRequest(request);
  try {
    await validateRoleActivationPermit({ session, permit, request: guarded });
  } catch (error) {
    if (error instanceof ContextGuardError) {
      throw new ContextGuardError('CONTEXT_GATEWAY_PREFLIGHT_VERIFICATION_FAILED');
    }
    throw error;
  }
  const consumption_event = await consumeRoleActivationPermit({ session, permit, request: guarded });
  try { return await executeAuthorizedRole({ permit, request: guarded, consumption_event }); }
  catch { throw new ContextGuardError('ROLE_ACTIVATION_STATE_UNKNOWN'); }
}
