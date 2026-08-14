import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createHandoffIntakeManifest, DesignGovernanceRepository, sha256 } from '../../src/design-governance/index.mjs';

const roots = [];
test.afterEach(async () => Promise.all(roots.splice(0).map((x) => rm(x, { recursive: true, force: true }))));
async function root() { const x = await mkdtemp(path.join(os.tmpdir(), 'design-governance-')); roots.push(x); return x; }
function record() { return createHandoffIntakeManifest({ intake_id: 'intake-1', project_id: 'project-1', consumer_id: 'consumer-1', supplied_at: '2026-08-14T00:00:00Z', source_artifacts: [{ artifact_id: 'pack-1', source_name: 'handoff.zip', sha256: sha256('pack'), size_bytes: 4, retention_location: null }], claimed_repository: 'baisound/consumer', claimed_ref: 'main@abc', claimed_version: null, provenance_complete: true, sensitivity: 'INTERNAL', missing_sources: [], assumptions: [], canonical_authority: false }); }

test('repository finalizes and verifies a confined immutable revision', async () => {
  const dir = await root(); const repo = new DesignGovernanceRepository({ root: dir, clock: () => new Date('2026-08-14T01:00:00Z') }); const manifest = record();
  const saved = await repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: manifest } });
  assert.equal(saved.result, 'DESIGN_REVISION_FINALIZED');
  assert.equal((await repo.verifyRevision('intake-1', 1)).artifact_count, 1);
  const final = JSON.parse(await readFile(path.join(dir, '.bai-os/design-governance/intakes/intake-1/revisions/1/final-manifest.json'), 'utf8'));
  assert.equal(final.canonical_authority, false);
});

test('same idempotency key and content returns finalized revision', async () => {
  const dir = await root(); const repo = new DesignGovernanceRepository({ root: dir }); const manifest = record(); const input = { intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: manifest } };
  await repo.persistRevision(input);
  assert.equal((await repo.persistRevision(input)).result, 'DESIGN_REVISION_ALREADY_FINALIZED');
});

test('finalized revision is immutable and detects idempotency conflict', async () => {
  const dir = await root(); const repo = new DesignGovernanceRepository({ root: dir }); const manifest = record();
  await repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: manifest } });
  const other = createHandoffIntakeManifest({ ...structuredClone({ intake_id: 'intake-1', project_id: 'project-1', consumer_id: 'consumer-1', supplied_at: '2026-08-14T00:00:00Z', source_artifacts: [{ artifact_id: 'pack-1', source_name: 'handoff.zip', sha256: sha256('other'), size_bytes: 5, retention_location: null }], claimed_repository: 'baisound/consumer', claimed_ref: 'main@abc', claimed_version: null, provenance_complete: true, sensitivity: 'INTERNAL', missing_sources: [], assumptions: [], canonical_authority: false }) });
  await assert.rejects(() => repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: other } }), (e) => e.code === 'INTAKE_IDEMPOTENCY_CONFLICT');
  await assert.rejects(() => repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: other.idempotency_key, artifacts: { intake: other } }), (e) => e.code === 'DESIGN_REPOSITORY_REVISION_IMMUTABLE');
});

test('repository detects artifact tamper', async () => {
  const dir = await root(); const repo = new DesignGovernanceRepository({ root: dir }); const manifest = record(); await repo.persistRevision({ intake_id: 'intake-1', revision: 1, idempotency_key: manifest.idempotency_key, artifacts: { intake: manifest } });
  const { writeFile } = await import('node:fs/promises'); const file = path.join(dir, '.bai-os/design-governance/intakes/intake-1/revisions/1/intake.json'); await writeFile(file, '{}\n');
  await assert.rejects(() => repo.readRevision('intake-1', 1), (e) => ['DESIGN_REPOSITORY_ARTIFACT_CHECKSUM_MISMATCH', 'DESIGN_GOVERNANCE_CHECKSUM_MISSING'].includes(e.code));
});
