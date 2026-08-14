import assert from 'node:assert/strict';
import { mkdir, mkdtemp, open, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createHandoffIntakeManifest, DesignGovernanceRepository, sha256 } from '../../src/design-governance/index.mjs';

const roots = [];
test.afterEach(async () => Promise.all(roots.splice(0).map((x) => rm(x, { recursive: true, force: true }))));
async function root() { const x = await mkdtemp(path.join(os.tmpdir(), 'design-recovery-')); roots.push(x); return x; }
function manifest() { return createHandoffIntakeManifest({ intake_id: 'intake-1', project_id: 'project-1', consumer_id: 'consumer-1', supplied_at: '2026-08-14T00:00:00Z', source_artifacts: [{ artifact_id: 'pack-1', source_name: 'handoff.zip', sha256: sha256('pack'), size_bytes: 4, retention_location: null }], claimed_repository: 'baisound/consumer', claimed_ref: 'main@abc', claimed_version: null, provenance_complete: true, sensitivity: 'INTERNAL', missing_sources: [], assumptions: [], canonical_authority: false }); }

test('fault before final manifest never creates authoritative revision', async () => {
  const dir = await root(); const item = manifest(); const failing = new DesignGovernanceRepository({ root: dir, fault: 'BEFORE_FINAL_MANIFEST' });
  await assert.rejects(() => failing.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: item.idempotency_key, artifacts: { intake: item } }), (e) => e.code === 'DESIGN_REPOSITORY_FAULT_INJECTED');
  await assert.rejects(() => failing.readRevision('intake-1', 1), (e) => e.code === 'DESIGN_REPOSITORY_REVISION_NOT_FINALIZED');
  const recovered = new DesignGovernanceRepository({ root: dir });
  assert.equal((await recovered.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: item.idempotency_key, artifacts: { intake: item } })).result, 'DESIGN_REVISION_FINALIZED');
});

test('existing writer lease fails closed without takeover', async () => {
  const dir = await root(); const item = manifest(); const leaseDir = path.join(dir, '.bai-os/design-governance/intakes/intake-1'); await mkdir(leaseDir, { recursive: true }); const handle = await open(path.join(leaseDir, 'writer.lease'), 'wx'); await handle.close();
  const repo = new DesignGovernanceRepository({ root: dir });
  await assert.rejects(() => repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: item.idempotency_key, artifacts: { intake: item } }), (e) => e.code === 'DESIGN_REPOSITORY_LEASE_CONFLICT');
});

test('new analysis uses a new revision with supersession pointer', async () => {
  const dir = await root(); const item = manifest(); const repo = new DesignGovernanceRepository({ root: dir });
  await repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: item.idempotency_key, artifacts: { intake: item } });
  const next = await repo.persistRevision({ intake_id: 'intake-1', revision: 2, supersedes_revision: 1, idempotency_key: item.idempotency_key, artifacts: { intake: item } });
  assert.equal(next.manifest.supersedes_revision, 1);
});
