#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLiveRehearsalEvidence } from './validate-knowledge-hub-live-rehearsal-evidence.mjs';

export function validateCiLiveGateEvidence(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('evidence object required');
  const keys = Object.keys(value).sort();
  const expected = ['completed_at','live_rehearsal','result','runtime_lock_sha256','schema_version','source'].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) throw new Error('unexpected top-level fields');
  if (value.schema_version !== '1.0') throw new Error('schema_version invalid');
  if (value.result !== 'GITHUB_ACTIONS_LIVE_GATE_PASS') throw new Error('result invalid');
  if (!/^[a-f0-9]{64}$/.test(value.runtime_lock_sha256 ?? '')) throw new Error('runtime_lock_sha256 invalid');
  if (!Number.isFinite(Date.parse(value.completed_at))) throw new Error('completed_at invalid');
  const source = value.source;
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('source invalid');
  const sourceKeys = Object.keys(source).sort();
  const expectedSource = ['commit_sha','event','repository','run_attempt','run_id'].sort();
  if (JSON.stringify(sourceKeys) !== JSON.stringify(expectedSource)) throw new Error('unexpected source fields');
  if (typeof source.repository !== 'string' || !source.repository.includes('/')) throw new Error('repository invalid');
  if (!/^[a-f0-9]{40}$/.test(source.commit_sha ?? '')) throw new Error('commit_sha invalid');
  if (!/^\d+$/.test(source.run_id ?? '') || !/^\d+$/.test(source.run_attempt ?? '')) throw new Error('run id/attempt invalid');
  if (!['workflow_dispatch','pull_request','push'].includes(source.event)) throw new Error('event invalid');
  validateLiveRehearsalEvidence({ schema_version: '1.0', ...value.live_rehearsal });
  return Object.freeze(structuredClone(value));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node scripts/validate-knowledge-hub-ci-live-gate-evidence.mjs <evidence.json>'); process.exit(2); }
  try {
    const value = validateCiLiveGateEvidence(JSON.parse(fs.readFileSync(file, 'utf8')));
    console.log(JSON.stringify({ status: 'PASS', result: value.result, commit_sha: value.source.commit_sha }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', reason: error.message }, null, 2));
    process.exit(1);
  }
}
