// This module is intentionally internal: activation-gateway.mjs is its sole importer.
export async function executeAuthorizedRole(handoff) {
  if (!handoff?.consumption_event?.event_checksum) throw new Error('Authorized handoff is required');
  return Object.freeze({ status: 'ROLE_ACTIVATION_HANDOFF_READY', permit_id: handoff.permit.permit_id });
}
