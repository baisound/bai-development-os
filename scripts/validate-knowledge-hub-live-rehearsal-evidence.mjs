#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateLiveRehearsalEvidence(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('evidence object required');
  if (value.schema_version !== '1.0') throw new Error('schema_version invalid');
  if (value.result !== 'LIVE_REHEARSAL_PASS') throw new Error('result invalid');
  if (!Number.isInteger(value.persisted_and_restored_events) || value.persisted_and_restored_events < 4) throw new Error('restored event count invalid');
  if (typeof value.backup_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.backup_sha256)) throw new Error('backup_sha256 invalid');
  if (value.public_profile_activated !== false) throw new Error('public profile must remain false');
  if (value.cleanup_complete !== true) throw new Error('cleanup evidence missing');
  if (!Number.isFinite(Date.parse(value.completed_at))) throw new Error('completed_at invalid');
  return Object.freeze({ ...value });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node scripts/validate-knowledge-hub-live-rehearsal-evidence.mjs <evidence.json>'); process.exit(2); }
  try {
    const value = validateLiveRehearsalEvidence(JSON.parse(fs.readFileSync(file, 'utf8')));
    console.log(JSON.stringify({ status: 'PASS', result: value.result, persisted_and_restored_events: value.persisted_and_restored_events }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', reason: error.message }, null, 2)); process.exit(1);
  }
}
