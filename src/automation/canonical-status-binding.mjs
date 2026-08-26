import { createCanonicalStatusSnapshotManifest, designOnlyChecksum, verifyCanonicalStatusSnapshotManifest, verifyCanonicalTaskBinding } from '../lifecycle/phase1/design-only-closure.mjs';

export class CanonicalStatusBindingError extends Error {
  constructor(code, message = code) { super(message); this.name = 'CanonicalStatusBindingError'; this.code = code; }
}

export async function bindCanonicalStatusToQueueTask(task, store, { canonical_status_trust } = {}) {
  if (!store || typeof store.readVerifiedCanonical !== 'function') throw new CanonicalStatusBindingError('CANONICAL_READ_NOT_VERIFIED');
  let verified; try { verified = await store.readVerifiedCanonical(); } catch { throw new CanonicalStatusBindingError('CANONICAL_READ_NOT_VERIFIED'); }
  const { record, binding } = verified;
  try { verifyCanonicalTaskBinding(binding, canonical_status_trust); } catch { throw new CanonicalStatusBindingError('CANONICAL_READ_NOT_VERIFIED'); }
  if (typeof task?.project_id !== 'string' || task.project_id !== record.project_id || binding.project_id !== record.project_id || task.task_id !== record.task_id || binding.task_id !== record.task_id) throw new CanonicalStatusBindingError('QUEUE_COMPLETION_CANONICAL_MISMATCH');
  if (task.state === 'COMPLETED' && record.task_status !== 'COMPLETED') throw new CanonicalStatusBindingError('QUEUE_COMPLETION_CANONICAL_MISMATCH');
  const result = { ...structuredClone(task), state: record.task_status === 'COMPLETED' ? 'COMPLETED' : task.state, canonical_binding: binding, canonical_authority: false };
  result.binding_checksum = designOnlyChecksum(result, 'binding_checksum');
  return Object.freeze(result);
}

export async function createCanonicalQueueSnapshot(entries, { canonical_status_trust, snapshot_private_key, snapshot_key_id, clock = () => new Date(), ttl_ms = 60_000 } = {}) {
  if (!Array.isArray(entries) || entries.length === 0) throw new CanonicalStatusBindingError('CANONICAL_SNAPSHOT_INVALID');
  const tasks = [];
  for (const entry of entries) tasks.push(await bindCanonicalStatusToQueueTask(entry.task, entry.store, { canonical_status_trust }));
  let manifest;
  try { manifest = createCanonicalStatusSnapshotManifest(tasks.map((task) => task.canonical_binding), { private_key: snapshot_private_key, key_id: snapshot_key_id, binding_trust: canonical_status_trust, clock, ttl_ms }); }
  catch { throw new CanonicalStatusBindingError('CANONICAL_SNAPSHOT_INVALID'); }
  return Object.freeze({ tasks: Object.freeze(tasks), manifest: Object.freeze(manifest) });
}

export function assertCanonicalSnapshot(tasks, manifest, { snapshot_trust, canonical_status_trust, usage_ledger = null, consume = false } = {}) {
  const bindings = tasks.filter((task) => task.state === 'COMPLETED' || task.task_status === 'COMPLETED').map((task) => task.canonical_binding);
  if (bindings.length === 0) return true;
  try { verifyCanonicalStatusSnapshotManifest(manifest, bindings, { ...snapshot_trust, binding_trust: canonical_status_trust }); }
  catch { throw new CanonicalStatusBindingError('QUEUE_COMPLETION_CANONICAL_MISMATCH'); }
  if (usage_ledger != null) {
    if (!(usage_ledger instanceof Set) || usage_ledger.has(manifest.snapshot_id)) throw new CanonicalStatusBindingError('QUEUE_COMPLETION_CANONICAL_MISMATCH');
    if (consume) usage_ledger.add(manifest.snapshot_id);
  }
  return true;
}

export function assertCanonicalCompletion(task, canonicalStatusTrust, expectedProjectId = null) {
  if (task?.state !== 'COMPLETED') return true;
  try { verifyCanonicalTaskBinding(task.canonical_binding, canonicalStatusTrust); } catch { throw new CanonicalStatusBindingError('QUEUE_COMPLETION_CANONICAL_MISMATCH'); }
  if (typeof task.project_id !== 'string' || typeof expectedProjectId !== 'string' || task.project_id !== expectedProjectId || task.canonical_binding.project_id !== expectedProjectId || task.canonical_binding.task_id !== task.task_id || task.canonical_binding.task_status !== 'COMPLETED') throw new CanonicalStatusBindingError('QUEUE_COMPLETION_CANONICAL_MISMATCH');
  return true;
}
