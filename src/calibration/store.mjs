import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CalibrationError } from './errors.mjs';
import { deepFreeze, sha256, stableStringify } from './util.mjs';

const LEDGER_REL = 'calibration/ledger.jsonl';
const LOCK_REL = 'calibration/.ledger.lock';
const checksumRecord = (record) => sha256(Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'record_checksum')));
function inside(root, rel) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, rel);
  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) throw new CalibrationError('CALIBRATION_PATH_ESCAPE');
  return target;
}
async function acquire(root) {
  await mkdir(inside(root, 'calibration'), { recursive: true });
  try {
    const handle = await open(inside(root, LOCK_REL), 'wx', 0o600);
    await handle.writeFile(String(process.pid)); await handle.sync(); await handle.close();
  } catch (error) {
    if (error.code === 'EEXIST') throw new CalibrationError('CALIBRATION_LEDGER_BUSY');
    throw error;
  }
}
async function release(root) { await rm(inside(root, LOCK_REL), { force: true }).catch(() => {}); }
export async function readCalibrationLedger(root) {
  let text;
  try { text = await readFile(inside(root, LEDGER_REL), 'utf8'); } catch (error) { if (error.code === 'ENOENT') return deepFreeze([]); throw error; }
  const records = []; let previous = null;
  for (const line of text.split('\n').filter(Boolean)) {
    let record; try { record = JSON.parse(line); } catch { throw new CalibrationError('CALIBRATION_LEDGER_CORRUPT'); }
    if (record.seq !== records.length + 1 || record.previous_record_checksum !== previous || record.record_checksum !== checksumRecord(record)) throw new CalibrationError('CALIBRATION_LEDGER_CORRUPT');
    previous = record.record_checksum; records.push(record);
  }
  return deepFreeze(records);
}
export async function appendCalibrationRecord(root, type, payload) {
  await acquire(root);
  try {
    const records = await readCalibrationLedger(root);
    const record = { seq: records.length + 1, type, payload: structuredClone(payload), previous_record_checksum: records.at(-1)?.record_checksum ?? null };
    record.record_checksum = checksumRecord(record);
    const next = [...records, record].map((row) => stableStringify(row)).join('\n') + '\n';
    const target = inside(root, LEDGER_REL); const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tmp, next, { mode: 0o600 }); await rename(tmp, target);
    const reread = await readCalibrationLedger(root);
    if (reread.at(-1)?.record_checksum !== record.record_checksum) throw new CalibrationError('CALIBRATION_LEDGER_VERIFY_FAILED');
    return deepFreeze(record);
  } finally { await release(root); }
}
export async function verifyCalibrationLedger(root) {
  const records = await readCalibrationLedger(root);
  return deepFreeze({ result: 'CALIBRATION_LEDGER_VERIFIED', record_count: records.length, last_checksum: records.at(-1)?.record_checksum ?? null });
}
export async function buildCalibrationSnapshot(root) {
  const records = await readCalibrationLedger(root);
  const active = {};
  for (const record of records) if (record.type === 'POLICY_ACTIVATED') for (const adjustment of record.payload.adjustments ?? []) active[adjustment.policy_key] = adjustment.proposed_value;
  const snapshot = { calibration_snapshot_version: '1.0.0', record_count: records.length, last_record_checksum: records.at(-1)?.record_checksum ?? null, active_advisory_policy: active };
  snapshot.content_checksum = sha256(snapshot);
  return deepFreeze(snapshot);
}
