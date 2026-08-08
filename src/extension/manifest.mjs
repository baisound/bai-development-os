import { parseSemver } from '../release/semver.mjs';
import { EXTENSION_VERSION, TRUST_LEVELS, EXECUTION_MODES, SIDE_EFFECTS, HOOK_TYPES } from './constants.mjs';
import { ExtensionError } from './errors.mjs';
import { assertSafeId, checksumObject, deepFreeze, req, uniq } from './util.mjs';
function capability(raw={}){
  const capability_id=req(raw.capability_id,'capability_id');
  const side_effect=(raw.side_effect??'NONE').toUpperCase(); if(!SIDE_EFFECTS.includes(side_effect)) throw new ExtensionError('EXTENSION_SIDE_EFFECT_INVALID');
  const operations=uniq(raw.operations??[]); if(!operations.length) throw new ExtensionError('EXTENSION_CAPABILITY_INVALID','operations');
  const max_payload_bytes=raw.max_payload_bytes??1048576, max_runtime_ms=raw.max_runtime_ms??30000;
  if(!Number.isSafeInteger(max_payload_bytes)||max_payload_bytes<1||!Number.isSafeInteger(max_runtime_ms)||max_runtime_ms<1) throw new ExtensionError('EXTENSION_BUDGET_INVALID');
  return {capability_id,operations,side_effect,requires_authorization:raw.requires_authorization??['IRREVERSIBLE_LOCAL','EXTERNAL'].includes(side_effect),permissions:uniq(raw.permissions),sandbox_required:raw.sandbox_required??side_effect==='EXTERNAL',max_payload_bytes,max_runtime_ms,idempotency_required:raw.idempotency_required??side_effect==='EXTERNAL',metadata:structuredClone(raw.metadata??{})};
}
function dependency(raw){if(typeof raw==='string')return {extension_id:assertSafeId(raw,'dependency.extension_id'),min_version:null,max_version:null,require_enabled:false};const extension_id=assertSafeId(raw?.extension_id,'dependency.extension_id');if(raw.min_version)parseSemver(raw.min_version);if(raw.max_version)parseSemver(raw.max_version);return {extension_id,min_version:raw.min_version??null,max_version:raw.max_version??null,require_enabled:Boolean(raw.require_enabled)};}
export function createExtensionManifest(input={}){
  const trust_level=(input.trust_level??'PROJECT_LOCAL').toUpperCase(); if(!TRUST_LEVELS.includes(trust_level)) throw new ExtensionError('EXTENSION_TRUST_INVALID');
  const execution_mode=(input.execution_mode??'DECLARATIVE').toUpperCase(); if(!EXECUTION_MODES.includes(execution_mode)) throw new ExtensionError('EXTENSION_EXECUTION_MODE_INVALID');
  parseSemver(req(input.extension_version??'1.0.0','extension_version'));
  const permissions=uniq(input.permissions);const capabilities=(input.capabilities??[]).map(capability); if(new Set(capabilities.map(x=>x.capability_id)).size!==capabilities.length) throw new ExtensionError('EXTENSION_CAPABILITY_DUPLICATE');
  for(const c of capabilities){const outside=c.permissions.filter(p=>!permissions.includes(p));if(outside.length)throw new ExtensionError('EXTENSION_CAPABILITY_PERMISSION_UNDECLARED',c.capability_id,{permissions:outside});}
  const hook_types=uniq((input.hook_types??[]).map(x=>String(x).toUpperCase())); if(hook_types.some(x=>!HOOK_TYPES.includes(x))) throw new ExtensionError('EXTENSION_HOOK_INVALID');
  const deps=(input.compatibility?.dependencies??input.compatibility?.required_extensions??[]).map(dependency);if(new Set(deps.map(x=>x.extension_id)).size!==deps.length)throw new ExtensionError('EXTENSION_DEPENDENCY_DUPLICATE');
  const implementation_checksum=input.execution_contract?.implementation_checksum??null;
  if(execution_mode!=='DECLARATIVE'&&(!implementation_checksum||!/^[a-f0-9]{64}$/.test(implementation_checksum))) throw new ExtensionError('EXTENSION_IMPLEMENTATION_CHECKSUM_REQUIRED');
  if(implementation_checksum&&!/^[a-f0-9]{64}$/.test(implementation_checksum)) throw new ExtensionError('EXTENSION_IMPLEMENTATION_CHECKSUM_INVALID');
  const manifest={extension_manifest_version:EXTENSION_VERSION,extension_id:assertSafeId(input.extension_id,'extension_id'),display_name:input.display_name??input.extension_id,extension_version:input.extension_version??'1.0.0',domains:uniq(input.domains??[]),trust_level,execution_mode,execution_contract:{implementation_checksum},capabilities,hook_types,permissions,resource_budget:{max_memory_mb:input.resource_budget?.max_memory_mb??256,max_concurrency:input.resource_budget?.max_concurrency??1,max_runtime_ms:input.resource_budget?.max_runtime_ms??30000},compatibility:{os_min:input.compatibility?.os_min??'0.0.0',os_max:input.compatibility?.os_max??null,platforms:uniq(input.compatibility?.platforms??[]),architectures:uniq(input.compatibility?.architectures??[]),dependencies:deps.sort((a,b)=>a.extension_id.localeCompare(b.extension_id))},packs:uniq(input.packs??[]),metadata:structuredClone(input.metadata??{})};
  parseSemver(manifest.compatibility.os_min); if(manifest.compatibility.os_max) parseSemver(manifest.compatibility.os_max);
  if(!Number.isSafeInteger(manifest.resource_budget.max_memory_mb)||manifest.resource_budget.max_memory_mb<1||!Number.isSafeInteger(manifest.resource_budget.max_concurrency)||manifest.resource_budget.max_concurrency<1||!Number.isSafeInteger(manifest.resource_budget.max_runtime_ms)||manifest.resource_budget.max_runtime_ms<1) throw new ExtensionError('EXTENSION_BUDGET_INVALID');
  manifest.content_checksum=checksumObject(manifest); return deepFreeze(manifest);
}
export function verifyExtensionManifest(m){if(!m||m.extension_manifest_version!==EXTENSION_VERSION||m.content_checksum!==checksumObject(m)) throw new ExtensionError('EXTENSION_MANIFEST_TAMPERED'); parseSemver(m.extension_version); return true;}
