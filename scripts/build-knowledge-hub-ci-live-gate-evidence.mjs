#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { validateLiveRehearsalEvidence } from './validate-knowledge-hub-live-rehearsal-evidence.mjs';

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error(`invalid argument near ${key ?? '<end>'}`);
    out[key.slice(2)] = value;
  }
  return out;
}
const required = ['rehearsal','lock','out','repository','sha','run-id','run-attempt','event'];
const a = args(process.argv.slice(2));
for (const key of required) if (!a[key]) throw new Error(`--${key} is required`);
if (!/^[a-f0-9]{40}$/.test(a.sha)) throw new Error('--sha must be a 40-character lowercase Git SHA');
if (!/^\d+$/.test(a['run-id']) || !/^\d+$/.test(a['run-attempt'])) throw new Error('run id/attempt must be numeric');
if (!['workflow_dispatch','pull_request','push'].includes(a.event)) throw new Error('unsupported GitHub event');

const rehearsal = validateLiveRehearsalEvidence(JSON.parse(fs.readFileSync(a.rehearsal, 'utf8')));
const lockBytes = fs.readFileSync(a.lock);
const lock = JSON.parse(lockBytes.toString('utf8'));
const pgVersion = lock?.packages?.['node_modules/pg']?.version;
if (pgVersion !== '8.13.1') throw new Error(`runtime lock pg version mismatch: ${pgVersion ?? 'missing'}`);

const evidence = {
  schema_version: '1.0',
  result: 'GITHUB_ACTIONS_LIVE_GATE_PASS',
  source: {
    repository: a.repository,
    commit_sha: a.sha,
    run_id: a['run-id'],
    run_attempt: a['run-attempt'],
    event: a.event
  },
  runtime_lock_sha256: crypto.createHash('sha256').update(lockBytes).digest('hex'),
  live_rehearsal: {
    result: rehearsal.result,
    persisted_and_restored_events: rehearsal.persisted_and_restored_events,
    backup_sha256: rehearsal.backup_sha256,
    public_profile_activated: rehearsal.public_profile_activated,
    cleanup_complete: rehearsal.cleanup_complete,
    completed_at: rehearsal.completed_at
  },
  completed_at: new Date().toISOString()
};

const target = path.resolve(a.out);
fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
const temp = `${target}.tmp.${process.pid}`;
fs.writeFileSync(temp, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
fs.renameSync(temp, target);
console.log(JSON.stringify({ status: 'PASS', result: evidence.result, runtime_lock_sha256: evidence.runtime_lock_sha256 }, null, 2));
