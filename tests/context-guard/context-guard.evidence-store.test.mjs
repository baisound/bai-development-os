import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createEvidenceSession, readVerifiedEvidence, writeImmutableEvidence } from '../../src/context-guard/evidence-store.mjs';

test('CG-EVID: evidence session is exclusive and records are immutable', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'one' });
  await writeImmutableEvidence(session, 'preflight-result.json', { decision: 'PASS' });
  assert.equal((await readVerifiedEvidence(path.join(session, 'preflight-result.json'))).decision, 'PASS');
  await assert.rejects(() => createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'one' }), (error) => error.code === 'CONTEXT_EVIDENCE_SESSION_EXISTS');
});

test('CG-EVID: existing destination and concurrent writers cannot replace evidence', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'two' });
  const outcomes = await Promise.allSettled([
    writeImmutableEvidence(session, 'preflight-result.json', { writer: 1 }),
    writeImmutableEvidence(session, 'preflight-result.json', { writer: 2 }),
  ]);
  assert.equal(outcomes.filter((outcome) => outcome.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter((outcome) => outcome.status === 'rejected').length, 1);
  const original = await readFile(path.join(session, 'preflight-result.json'), 'utf8');
  await assert.rejects(() => writeImmutableEvidence(session, 'preflight-result.json', { writer: 3 }));
  assert.equal(await readFile(path.join(session, 'preflight-result.json'), 'utf8'), original);
  await assert.rejects(() => writeImmutableEvidence(session, '../escape.json', {}));
});
