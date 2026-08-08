import { readFile } from 'node:fs/promises';
import { secureAtomicWrite, resolveExistingInside } from '../security/path.mjs';
import { ExtensionError } from './errors.mjs';
import { verifyExtensionManifest } from './manifest.mjs';
import { EXTENSION_VERSION, LIFECYCLE_STATES } from './constants.mjs';
import { checksumObject, deepFreeze } from './util.mjs';

export function verifyExtensionRegistrySnapshot(snapshot) {
  if (!snapshot || snapshot.extension_registry_version !== EXTENSION_VERSION) throw new ExtensionError('EXTENSION_REGISTRY_VERSION_INVALID');
  if (snapshot.content_checksum !== checksumObject(snapshot)) throw new ExtensionError('EXTENSION_REGISTRY_TAMPERED');
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 || !Array.isArray(snapshot.entries)) throw new ExtensionError('EXTENSION_REGISTRY_INVALID');
  const ids = new Set();
  for (const entry of snapshot.entries) {
    if (!entry?.extension_id || ids.has(entry.extension_id)) throw new ExtensionError('EXTENSION_REGISTRY_DUPLICATE');
    ids.add(entry.extension_id);
    if (!LIFECYCLE_STATES.includes(entry.state)) throw new ExtensionError('EXTENSION_STATE_CORRUPT');
    verifyExtensionManifest(entry.manifest);
    if (entry.manifest.extension_id !== entry.extension_id) throw new ExtensionError('EXTENSION_ID_MISMATCH');
  }
  return true;
}

export async function saveExtensionRegistrySnapshot(root, snapshot, { relative_path = '.bai-os/extension/registry.json' } = {}) {
  verifyExtensionRegistrySnapshot(snapshot);
  await secureAtomicWrite(root, relative_path, Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`));
  return relative_path;
}

export async function loadExtensionRegistrySnapshot(root, { relative_path = '.bai-os/extension/registry.json' } = {}) {
  const file = await resolveExistingInside(root, relative_path);
  const snapshot = JSON.parse(await readFile(file, 'utf8'));
  verifyExtensionRegistrySnapshot(snapshot);
  return deepFreeze(snapshot);
}
