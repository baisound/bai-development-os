import { mkdir, open, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { SecurityError } from './errors.mjs';
import { resolveExistingInside, resolveWritableInside, secureAtomicWrite } from './path.mjs';
import { deepFreeze, nowIso, requireSafeId, sha256 } from './util.mjs';

const baseRel = '.bai-os/security/journal';
const manifestRel = (id) => `${baseRel}/${id}/manifest.json`;
async function fileChecksum(file) { return sha256(await readFile(file)); }

export async function prepareJournalTransaction(root, { tx_id, operations = [] } = {}, { clock = () => new Date() } = {}) {
  const id = requireSafeId(tx_id, 'tx_id');
  if (!operations.length) throw new SecurityError('SECURITY_JOURNAL_EMPTY');
  const dir = `${baseRel}/${id}`;
  await mkdir(await resolveWritableInside(root, dir), { recursive: true });
  const manifestOps = [];
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (!['CREATE', 'REPLACE'].includes(op.mode ?? 'REPLACE')) throw new SecurityError('SECURITY_JOURNAL_MODE_INVALID');
    await resolveWritableInside(root, op.path);
    const tempRel = `${dir}/op-${String(i + 1).padStart(4, '0')}.tmp`;
    const temp = await resolveWritableInside(root, tempRel);
    const bytes = Buffer.isBuffer(op.data) ? op.data : Buffer.from(String(op.data));
    const h = await open(temp, 'wx', 0o600);
    try { await h.writeFile(bytes); await h.sync(); } finally { await h.close(); }
    manifestOps.push({ path: op.path, temp_path: tempRel, checksum: sha256(bytes), mode: op.mode ?? 'REPLACE' });
  }
  const manifest = { journal_version: '1.0.0', tx_id: id, state: 'PREPARED', prepared_at: nowIso(clock), operations: manifestOps };
  await secureAtomicWrite(root, manifestRel(id), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  return deepFreeze(manifest);
}

export async function readJournalTransaction(root, tx_id) {
  const id = requireSafeId(tx_id, 'tx_id');
  const file = await resolveExistingInside(root, manifestRel(id));
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function commitJournalTransaction(root, tx_id, { clock = () => new Date() } = {}) {
  const id = requireSafeId(tx_id, 'tx_id');
  const manifest = await readJournalTransaction(root, id);
  if (!['PREPARED', 'COMMITTING'].includes(manifest.state)) throw new SecurityError('SECURITY_JOURNAL_STATE_INVALID');
  manifest.state = 'COMMITTING';
  await secureAtomicWrite(root, manifestRel(id), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  for (const op of manifest.operations) {
    const target = await resolveWritableInside(root, op.path);
    let targetExists = false;
    let targetOk = false;
    try { await stat(target); targetExists = true; targetOk = (await fileChecksum(target)) === op.checksum; }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (targetOk) continue;
    if (targetExists && op.mode === 'CREATE') throw new SecurityError('SECURITY_JOURNAL_TARGET_EXISTS', op.path);
    const temp = await resolveExistingInside(root, op.temp_path).catch((e) => {
      if (e.code === 'SECURITY_PATH_MISSING') throw new SecurityError('SECURITY_JOURNAL_TORN', op.path);
      throw e;
    });
    if ((await fileChecksum(temp)) !== op.checksum) throw new SecurityError('SECURITY_JOURNAL_TEMP_CORRUPT', op.path);
    await mkdir(path.dirname(target), { recursive: true });
    await rename(temp, target);
    if ((await fileChecksum(target)) !== op.checksum) throw new SecurityError('SECURITY_JOURNAL_TARGET_VERIFY_FAILED', op.path);
  }
  manifest.state = 'COMMITTED';
  manifest.committed_at = nowIso(clock);
  await secureAtomicWrite(root, manifestRel(id), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  return deepFreeze(manifest);
}

export async function rollbackJournalTransaction(root, tx_id, { clock = () => new Date() } = {}) {
  const id = requireSafeId(tx_id, 'tx_id');
  const manifest = await readJournalTransaction(root, id);
  if (manifest.state === 'COMMITTED') throw new SecurityError('SECURITY_JOURNAL_ALREADY_COMMITTED');
  if (manifest.state === 'COMMITTING') throw new SecurityError('SECURITY_JOURNAL_ROLLBACK_UNSAFE');
  for (const op of manifest.operations) {
    try { const temp = await resolveExistingInside(root, op.temp_path); await rm(temp, { force: true }); }
    catch (e) { if (e.code !== 'SECURITY_PATH_MISSING') throw e; }
  }
  manifest.state = 'ROLLED_BACK';
  manifest.rolled_back_at = nowIso(clock);
  await secureAtomicWrite(root, manifestRel(id), Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  return deepFreeze(manifest);
}

export async function recoverJournalTransaction(root, tx_id, { strategy = null, clock = () => new Date() } = {}) {
  const manifest = await readJournalTransaction(root, tx_id);
  if (manifest.state === 'COMMITTED' || manifest.state === 'ROLLED_BACK') return deepFreeze({ result: 'NO_RECOVERY_REQUIRED', state: manifest.state });
  if (!['COMPLETE', 'ROLLBACK'].includes(strategy)) throw new SecurityError('SECURITY_JOURNAL_RECOVERY_DECISION_REQUIRED');
  if (manifest.state === 'COMMITTING' && strategy === 'ROLLBACK') throw new SecurityError('SECURITY_JOURNAL_ROLLBACK_UNSAFE');
  return strategy === 'COMPLETE' ? commitJournalTransaction(root, tx_id, { clock }) : rollbackJournalTransaction(root, tx_id, { clock });
}

export async function listJournalTransactions(root) {
  let dir;
  try { dir = await resolveExistingInside(root, baseRel); }
  catch (e) { if (e.code === 'SECURITY_PATH_MISSING') return []; throw e; }
  const items = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const x of items.filter((x) => x.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) out.push(await readJournalTransaction(root, x.name));
  return deepFreeze(out);
}
