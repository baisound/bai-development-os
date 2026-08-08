import { ExtensionError } from './errors.mjs';
import { deepFreeze } from './util.mjs';

const SHA256_RE = /^[a-f0-9]{64}$/;

export function validateProviderContract(manifest, provider, { require_handlers = true } = {}) {
  if (!provider || typeof provider !== 'object') throw new ExtensionError('EXTENSION_PROVIDER_MISSING');
  const checksum = provider.implementation_checksum;
  if (typeof checksum !== 'string' || !SHA256_RE.test(checksum)) throw new ExtensionError('EXTENSION_PROVIDER_PROVENANCE_REQUIRED');
  const expected = manifest?.execution_contract?.implementation_checksum ?? null;
  if (!expected || expected !== checksum) throw new ExtensionError('EXTENSION_PROVIDER_PROVENANCE_MISMATCH');
  if (provider.extension_id && provider.extension_id !== manifest.extension_id) throw new ExtensionError('EXTENSION_PROVIDER_ID_MISMATCH');
  const missing = [];
  if (require_handlers) {
    for (const capability of manifest.capabilities ?? []) {
      for (const operation of capability.operations ?? []) {
        if (typeof provider.capabilities?.[capability.capability_id]?.[operation] !== 'function') missing.push(`${capability.capability_id}:${operation}`);
      }
    }
  }
  if (missing.length) throw new ExtensionError('EXTENSION_PROVIDER_CONTRACT_INCOMPLETE', 'provider handler missing', { missing });
  return deepFreeze({ status: 'VALID', implementation_checksum: checksum, handlers_verified: require_handlers });
}
