import { ExtensionError } from './errors.mjs';
import { assertSafeId, checksumObject, deepFreeze, req, uniq } from './util.mjs';
const SOURCE_TYPES = Object.freeze(['OPENAPI','MCP']);
export function createContractAssistedAdapterPlan({ source_type, source_ref, extension_id, domains = [], requested_capabilities = [], notes = [] } = {}) {
  const type = String(source_type ?? '').toUpperCase();
  if (!SOURCE_TYPES.includes(type)) throw new ExtensionError('EXTENSION_ADAPTER_SOURCE_INVALID');
  const plan = {
    adapter_plan_version: '1.0.0',
    plan_status: 'NON_EXECUTABLE_BUILD_TIME_PLAN',
    authority_effect: 'NONE',
    source_type: type,
    source_ref: req(source_ref, 'source_ref'),
    extension_id: assertSafeId(extension_id, 'extension_id'),
    domains: uniq(domains),
    requested_capabilities: uniq(requested_capabilities),
    generated_artifacts: ['MANIFEST_DRAFT','CAPABILITY_MAPPING_DRAFT','CONFORMANCE_CHECKLIST'],
    prohibited_automatic_actions: ['ENABLE_EXTENSION','GRANT_PERMISSION','GRANT_AUTHORIZATION','PUBLISH','EXECUTE_PROVIDER'],
    notes: [...notes].map(String)
  };
  plan.content_checksum = checksumObject(plan);
  return deepFreeze(plan);
}
