import { createHash } from 'node:crypto';
import { mkdir, open, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ContextGuardError } from './errors.mjs';

const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const canonical = (value) => JSON.stringify(sort(value));
const checksum = (value) => {
  const copy = { ...value }; delete copy.content_checksum;
  return `sha256:${createHash('sha256').update(canonical(copy)).digest('hex')}`;
};
const syncDirectory = async (directory) => { const handle = await open(directory, 'r'); try { await handle.sync(); } finally { await handle.close(); } };

export function runtimeRoot(projectRoot = process.cwd()) { return path.join(projectRoot, '.context-guard-runtime'); }
export async function createEvidenceSession({ projectRoot = process.cwd(), taskId, sessionId }) {
  if (!taskId || !sessionId || /[\\/]/.test(taskId + sessionId)) throw new ContextGuardError('CONTEXT_INVENTORY_INCOMPLETE');
  const root = runtimeRoot(projectRoot);
  const session = path.join(root, 'tasks', taskId, 'sessions', sessionId);
  try { await mkdir(session, { recursive: false, mode: 0o700 }); } catch (error) {
    if (error.code === 'ENOENT') { await mkdir(path.dirname(session), { recursive: true, mode: 0o700 }); return createEvidenceSession({ projectRoot, taskId, sessionId }); }
    if (error.code === 'EEXIST') throw new ContextGuardError('CONTEXT_EVIDENCE_SESSION_EXISTS');
    throw error;
  }
  await syncDirectory(path.dirname(session));
  return session;
}
export async function writeImmutableEvidence(session, name, value, { durability = { syncDirectory }, beforeVerify } = {}) {
  if (!/^[a-z0-9-]+\.json$/i.test(name)) throw new ContextGuardError('CONTEXT_INVENTORY_INCOMPLETE');
  const finalPath = path.join(session, name);
  const record = { ...value }; record.content_checksum = checksum(record);
  const bytes = canonical(record);
  let handle;
  try {
    // Linux rename replaces a destination. Creating the final path exclusively
    // avoids that unsafe primitive entirely; a failed write is never success.
    handle = await open(finalPath, 'wx', 0o600);
    const { bytesWritten } = await handle.write(bytes, 0, 'utf8');
    if (bytesWritten !== Buffer.byteLength(bytes)) throw new ContextGuardError('CONTEXT_EVIDENCE_CORRUPT', 'partial evidence write');
    await handle.sync(); await handle.close(); handle = null;
    await durability.syncDirectory(session);
    if (beforeVerify) await beforeVerify(finalPath);
    const verified = await readVerifiedEvidence(finalPath);
    if (verified.content_checksum !== record.content_checksum) throw new ContextGuardError('CONTEXT_EVIDENCE_CORRUPT');
    return verified;
  } catch (error) {
    if (handle) await handle.close();
    if (error.code === 'EEXIST') throw new ContextGuardError('CONTEXT_EVIDENCE_SESSION_EXISTS');
    throw error;
  }
}
export async function readVerifiedEvidence(file) {
  let value;
  try { value = JSON.parse(await readFile(file, 'utf8')); } catch { throw new ContextGuardError('CONTEXT_EVIDENCE_CORRUPT'); }
  if (value.content_checksum !== checksum(value)) throw new ContextGuardError('CONTEXT_EVIDENCE_CORRUPT');
  return value;
}
