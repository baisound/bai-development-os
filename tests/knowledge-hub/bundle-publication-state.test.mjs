import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { classifyBackupRehearsalBundleCommitState } from '../../scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs';

const touch = (dir, name) => fs.writeFileSync(path.join(dir, name), 'x', { flag: 'wx' });

test('bundle publication state admits only exact staged and marker-committed restart points', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-publication-state-'));
  try {
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'EMPTY');
    touch(dir, 'evidence.json.incomplete'); touch(dir, 'encrypted-backup.age.incomplete');
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'STAGED_EXACT');
    fs.renameSync(path.join(dir, 'encrypted-backup.age.incomplete'), path.join(dir, 'encrypted-backup.age'));
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'PARTIAL_PUBLICATION_QUARANTINE_REQUIRED');
    fs.renameSync(path.join(dir, 'evidence.json.incomplete'), path.join(dir, 'evidence.json'));
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'PARTIAL_PUBLICATION_QUARANTINE_REQUIRED');
    touch(dir, 'COMMITTED.json');
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'MARKER_COMMITTED');
    touch(dir, 'COMMIT-DURABLE.json.incomplete');
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'MARKER_COMMITTED_DURABLE_PENDING');
    fs.renameSync(path.join(dir, 'COMMIT-DURABLE.json.incomplete'), path.join(dir, 'COMMIT-DURABLE.json'));
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'DURABLE_COMMITTED');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('marker temporary state is never classified as resumable success', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-publication-state-'));
  try {
    touch(dir, 'evidence.json'); touch(dir, 'encrypted-backup.age'); touch(dir, 'COMMITTED.json.incomplete');
    assert.equal(classifyBackupRehearsalBundleCommitState(dir).result, 'PARTIAL_PUBLICATION_QUARANTINE_REQUIRED');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
