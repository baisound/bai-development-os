import { mkdir, open, rm } from 'node:fs/promises';
import path from 'node:path';
import { SecurityError } from './errors.mjs';
import { appendSecurityLedger, readSecurityLedger } from './ledger.mjs';
import { resolveWritableInside } from './path.mjs';
import { nowIso, requireString, sha256, stable } from './util.mjs';
async function withReplayLock(root, fn) {
  const lock = await resolveWritableInside(root, '.bai-os/security/replay-accept.lock');
  await mkdir(path.dirname(lock), { recursive: true });
  let handle;
  try { handle = await open(lock, 'wx', 0o600); await handle.writeFile(String(process.pid)); await handle.sync(); }
  catch (e) { if (e.code === 'EEXIST') throw new SecurityError('SECURITY_REPLAY_BUSY'); throw e; }
  try { return await fn(); } finally { await handle?.close(); await rm(lock, { force: true }).catch(() => {}); }
}
export async function recordReplayNonce(root, { namespace, nonce, expires_at, binding = null } = {}, { clock = () => new Date() } = {}) {
  const ns = requireString(namespace, 'namespace'); const n = requireString(nonce, 'nonce'); const exp = Date.parse(expires_at); const now = clock().getTime(); if (!Number.isFinite(exp) || exp <= now) throw new SecurityError('SECURITY_REPLAY_EXPIRY_INVALID');
  return withReplayLock(root, async () => {
    const rows = await readSecurityLedger(root, 'replay'); const fingerprint = sha256(stable({ namespace: ns, nonce: n, binding }));
    const existing = rows.find((r) => r.event_type === 'NONCE_ACCEPTED' && r.details?.fingerprint === fingerprint && Date.parse(r.details?.expires_at) > now); if (existing) throw new SecurityError('SECURITY_REPLAY_DETECTED');
    return appendSecurityLedger(root, 'replay', { event_type: 'NONCE_ACCEPTED', subject: ns, details: { fingerprint, expires_at: new Date(exp).toISOString(), binding_checksum: binding == null ? null : sha256(stable(binding)), accepted_at: nowIso(clock) } }, { clock });
  });
}
export async function assertNotReplayed(root, input, options) { await recordReplayNonce(root, input, options); return true; }
