import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import * as Root from '../../src/index.mjs';
import { ConsumerDesignGovernanceService, sha256 } from '../../src/design-governance/index.mjs';

const roots = [];
test.afterEach(async () => Promise.all(roots.splice(0).map((x) => rm(x, { recursive: true, force: true }))));

test('root export exposes DesignGovernanceOS without changing existing exports', () => {
  assert.equal(typeof Root.DesignGovernanceOS.ConsumerDesignGovernanceService, 'function');
  assert.equal(typeof Root.KnowledgeOS, 'object');
  assert.equal(typeof Root.AutomationOS, 'object');
});

test('bounded intake-to-finalized-revision workflow is read-only outside its store', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'design-integration-')); roots.push(dir); const service = new ConsumerDesignGovernanceService({ root: dir, clock: () => new Date('2026-08-14T02:00:00Z') });
  const intake = service.createHandoffIntake({ intake_id: 'intake-1', project_id: 'project-1', consumer_id: 'consumer-1', supplied_at: '2026-08-14T00:00:00Z', source_artifacts: [{ artifact_id: 'pack-1', source_name: 'handoff.zip', sha256: sha256('pack'), size_bytes: 4, retention_location: 'C:/handoff.zip' }], claimed_repository: 'baisound/consumer', claimed_ref: 'main@abc', claimed_version: '1.0.0', provenance_complete: true, sensitivity: 'INTERNAL', missing_sources: [], assumptions: [], canonical_authority: false });
  const curation = service.curateHandoffSources(intake, [{ artifact_id: 'pack-1', ownership: 'CONSUMER', relevance: 'RELEVANT', freshness: 'CURRENT', superseded_by: null, retention: 'REFERENCE_ONLY', redaction: 'NONE' }]);
  const report = service.revalidateHandoffClaims({ intake_id: intake.intake_id, observation: { os_root: dir, branch: 'main', head_sha: sha256('head'), dirty: false, status_revision: sha256('status') }, canonical_facts: { architecture: '2.30' }, claims: [{ claim_id: 'claim-1', fact_key: 'architecture', claimed_value: '2.30', severity: 'CRITICAL' }] });
  assert.equal(report.gate_result, 'PASS');
  const saved = await service.persistRevision({ intake_id: intake.intake_id, revision: 1, idempotency_key: intake.idempotency_key, artifacts: { intake, curation, revalidation: report } });
  assert.equal(saved.result, 'DESIGN_REVISION_FINALIZED');
  assert.equal((await service.verifyRevision('intake-1', 1)).artifact_count, 3);
  const fs = await import('node:fs/promises'); const entries = await fs.readdir(dir); assert.deepEqual(entries, ['.bai-os']);
});
