import { mkdir, open, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { SecurityError } from './errors.mjs';
import { resolveExistingInside, resolveWritableInside, secureAtomicWrite } from './path.mjs';
import { deepFreeze, nowIso, sha256, stable } from './util.mjs';
import { signEnvelope, verifySignedEnvelope } from './signing.mjs';

const checksum = (r) => sha256(stable(Object.fromEntries(Object.entries(r).filter(([k]) => !['record_checksum','signature','signature_algorithm','key_id','signed_at','payload_checksum'].includes(k)))));
async function acquire(root, name) { const lock = await resolveWritableInside(root, `.bai-os/security/${name}.lock`); await mkdir(path.dirname(lock), { recursive: true }); try { const h = await open(lock, 'wx', 0o600); await h.writeFile(String(process.pid)); await h.sync(); await h.close(); return lock; } catch (e) { if (e.code === 'EEXIST') throw new SecurityError('SECURITY_LEDGER_BUSY'); throw e; } }
export async function readSecurityLedger(root, name, { public_key = null, expected_key_id = null, require_signature = false } = {}) {
  let file; try { file = await resolveExistingInside(root, `.bai-os/security/${name}.jsonl`); } catch (e) { if (e.code === 'SECURITY_PATH_MISSING') return deepFreeze([]); throw e; }
  const text = await readFile(file, 'utf8'); const rows = []; let prev = null;
  for (const line of text.split('\n').filter(Boolean)) { let row; try { row = JSON.parse(line); } catch { throw new SecurityError('SECURITY_LEDGER_CORRUPT'); }
    if (row.seq !== rows.length + 1 || row.previous_record_checksum !== prev || row.record_checksum !== checksum(row)) throw new SecurityError('SECURITY_LEDGER_CORRUPT');
    if (require_signature && !row.signature) throw new SecurityError('SECURITY_LEDGER_SIGNATURE_REQUIRED');
    if (row.signature) { if (!public_key) throw new SecurityError('SECURITY_LEDGER_SIGNATURE_KEY_REQUIRED'); verifySignedEnvelope(row, { public_key, expected_key_id }); }
    prev = row.record_checksum; rows.push(row);
  }
  return deepFreeze(rows);
}
export async function appendSecurityLedger(root, name, event, { signer = null, clock = () => new Date() } = {}) {
  const lock = await acquire(root, name); try { const rows = await readSecurityLedger(root, name, signer?.public_key ? { public_key: signer.public_key, expected_key_id: signer.key_id } : {}); const file = await resolveWritableInside(root, `.bai-os/security/${name}.jsonl`);
    let row = { seq: rows.length + 1, at: event.at ?? nowIso(clock), event_type: event.event_type, subject: event.subject ?? null, details: structuredClone(event.details ?? {}), previous_record_checksum: rows.at(-1)?.record_checksum ?? null };
    row.record_checksum = checksum(row); if (signer?.private_key) row = signEnvelope(row, { private_key: signer.private_key, key_id: signer.key_id, clock });
    const nextText = `${rows.map((r) => JSON.stringify(r)).join('\n')}${rows.length ? '\n' : ''}${JSON.stringify(row)}\n`;
    await secureAtomicWrite(root, `.bai-os/security/${name}.jsonl`, Buffer.from(nextText));
    const reread = await readSecurityLedger(root, name, signer?.public_key ? { public_key: signer.public_key, expected_key_id: signer.key_id } : {}); if (reread.at(-1)?.record_checksum !== row.record_checksum) throw new SecurityError('SECURITY_LEDGER_VERIFY_FAILED'); return deepFreeze(row);
  } finally { await rm(lock, { force: true }).catch(() => {}); }
}
