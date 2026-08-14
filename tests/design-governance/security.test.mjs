import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createHandoffIntakeManifest, DesignGovernanceRepository, sha256 } from '../../src/design-governance/index.mjs';

const roots = [];
test.afterEach(async () => Promise.all(roots.splice(0).map((x) => rm(x, { recursive: true, force: true }))));
async function root() { const x = await mkdtemp(path.join(os.tmpdir(), 'design-security-')); roots.push(x); return x; }
function intake(id = 'intake-1') { return createHandoffIntakeManifest({ intake_id: id, project_id: 'project-1', consumer_id: 'consumer-1', supplied_at: '2026-08-14T00:00:00Z', source_artifacts: [{ artifact_id: 'pack-1', source_name: 'handoff.zip', sha256: sha256('pack'), size_bytes: 4, retention_location: null }], claimed_repository: 'baisound/consumer', claimed_ref: 'main@abc', claimed_version: null, provenance_complete: false, sensitivity: 'RESTRICTED', missing_sources: ['signed provenance'], assumptions: [], canonical_authority: false }); }

test('repository rejects path traversal through intake identity', async () => {
  const repo = new DesignGovernanceRepository({ root: await root() }); const manifest = intake();
  await assert.rejects(() => repo.persistRevision({ intake_id: '../escape', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: manifest } }), (e) => e.code === 'DESIGN_REPOSITORY_ID_INVALID');
});

test('repository rejects raw attachment artifact names', async () => {
  const repo = new DesignGovernanceRepository({ root: await root() }); const manifest = intake();
  await assert.rejects(() => repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { 'raw-attachment': manifest } }), (e) => e.code === 'DESIGN_REPOSITORY_ARTIFACT_NAME_INVALID');
});

test('symlinked governance root is rejected', async (t) => {
  if (process.platform === 'win32') return t.skip('symlink privilege is environment-dependent on Windows');
  const dir = await root(); const outside = await root();
  await symlink(outside, path.join(dir, '.bai-os'));
  const repo = new DesignGovernanceRepository({ root: dir }); const manifest = intake();
  await assert.rejects(() => repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: manifest } }), (e) => e.code === 'DESIGN_REPOSITORY_PATH_ESCAPE');
});

test('manifest stores source reference and checksum, not raw bytes', () => {
  const manifest = intake();
  assert.equal('bytes' in manifest.source_artifacts[0], false);
  assert.equal(manifest.canonical_authority, false);
  assert.equal(manifest.sensitivity, 'RESTRICTED');
});

test('repository applies DLP before persistence', async () => {
  const repo = new DesignGovernanceRepository({ root: await root() }); const manifest = structuredClone(intake());
  manifest.assumptions = ['Bearer abcdefghijklmnopqrstuvwxyz'];
  const { content_checksum: _old, ...body } = manifest;
  manifest.content_checksum = sha256(body);
  await assert.rejects(() => repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: manifest } }), (e) => e.code === 'DESIGN_REPOSITORY_DLP_BLOCKED');
});
