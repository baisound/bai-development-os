import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { FoundationGuardError } from './activation-registry.mjs';

const canonical = (value) => JSON.stringify(value);
const digest = (value) => {
  const copy = { ...value }; delete copy.event_checksum;
  return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`;
};
const auditPath = (session) => path.join(session, 'foundation-guard-audit.jsonl');
const lockPath = (session) => path.join(session, '.foundation-audit.lock');
async function acquireAuditLock(session) {
  await mkdir(session, { recursive: true, mode: 0o700 });
  try { const h = await open(lockPath(session), constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600); await h.writeFile(String(process.pid)); await h.sync(); await h.close(); }
  catch (error) { if (error.code === 'EEXIST') throw new FoundationGuardError('FOUNDATION_AUDIT_LOCK_CONFLICT'); throw new FoundationGuardError('FOUNDATION_AUDIT_WRITE_FAILED', error.message); }
}
async function releaseAuditLock(session) { await unlink(lockPath(session)).catch(() => {}); }

export async function readFoundationAudit(session) {
  let text = '';
  try { text = await readFile(auditPath(session), 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw new FoundationGuardError('FOUNDATION_AUDIT_READ_FAILED', error.message); }
  let previous = 'sha256:GENESIS'; const events = [];
  for (const line of text.split('\n').filter(Boolean)) {
    let event; try { event = JSON.parse(line); } catch { throw new FoundationGuardError('FOUNDATION_AUDIT_CORRUPT'); }
    if (event.previous_event_checksum !== previous || event.event_checksum !== digest(event)) throw new FoundationGuardError('FOUNDATION_AUDIT_CORRUPT');
    previous = event.event_checksum; events.push(event);
  }
  return events;
}

export async function appendFoundationAudit(session, data, { syncDirectory = async () => {} } = {}) {
  await acquireAuditLock(session);
  try {
    const previous = (await readFoundationAudit(session)).at(-1)?.event_checksum ?? 'sha256:GENESIS';
    const event = { event_id: randomUUID(), event_type: data.event_type ?? 'ACTIVATION_VALIDATED', correlation_id: data.correlation_id,
      permit_id: data.permit_id, activation_entry_id: data.activation_entry_id, project_id: data.project_id, task_id: data.task_id,
      role: data.role, requester_identity: data.requester_identity, decision: data.decision, reason_code: data.reason_code,
      registry_revision: data.registry_revision, state_revision: data.state_revision, event_at: new Date().toISOString(), previous_event_checksum: previous };
    event.event_checksum = digest(event);
    const line = `${canonical(event)}\n`;
    try {
      const handle = await open(auditPath(session), constants.O_CREAT | constants.O_APPEND | constants.O_WRONLY, 0o600);
      try { const result = await handle.write(line, null, 'utf8'); if (result.bytesWritten !== Buffer.byteLength(line)) throw new Error('partial audit append'); await handle.sync(); }
      finally { await handle.close(); }
      await syncDirectory(session);
    } catch (error) { throw new FoundationGuardError('FOUNDATION_AUDIT_WRITE_FAILED', error.message); }
    const reread = await readFoundationAudit(session);
    if (reread.at(-1)?.event_checksum !== event.event_checksum) throw new FoundationGuardError('FOUNDATION_AUDIT_VERIFY_FAILED');
    return Object.freeze(event);
  } finally { await releaseAuditLock(session); }
}
