import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');
const schema = async (name) => JSON.parse(await readFile(path.join(root, 'schemas/lifecycle', name), 'utf8'));

test('TASK-021 schemas are closed and encode fail-closed outcome contracts', async () => {
  const names = ['design-only-closure-readiness.schema.json', 'design-only-closure-audit-receipt.schema.json', 'canonical-status-binding.schema.json', 'design-only-critic-evidence.schema.json', 'legacy-completion-attestation.schema.json', 'lifecycle-event-1.2.schema.json', 'canonical-status-snapshot.schema.json', 'design-only-authority-attestation.schema.json', 'design-only-archive-authority.schema.json', 'design-only-operation-bundle.schema.json'];
  const documents = await Promise.all(names.map(schema));
  for (const document of documents) assert.equal(document.additionalProperties, false, `${document.$id} must be closed`);
  const readiness = documents[0];
  assert.deepEqual(readiness.properties.unresolved_critical, { const: 0 });
  assert.equal(readiness.properties.critic_evidence_checksums.minItems, 3);
  const receipt = documents[1];
  assert.equal(receipt.properties.event_acknowledgement.additionalProperties, false);
  assert.equal(receipt.properties.event_acknowledgement.properties.event_verified.const, true);
  const event = documents[5];
  assert.equal(event.oneOf.length, 4); assert.ok(event.properties.sanitized_request_digest);
  assert.deepEqual(event.oneOf.map((branch) => branch.properties.outcome.const), ['COMMITTED', 'REJECTED', 'VERIFICATION_FAILED', 'RECOVERED']);
  assert.equal(event.$defs.authorizationReference.additionalProperties, false);
  assert.equal(event.$defs.evidence.additionalProperties, false);
  assert.equal(event.$defs.operationAudit.additionalProperties, false);
  assert.equal(event.$defs.skippedPhase.additionalProperties, false);
  assert.equal(documents[8].$defs.ownerAuthorization.additionalProperties, false);
  assert.equal(documents[9].$defs.contextManifest.additionalProperties, false);
  assert.equal(documents[9].$defs.operationCoordinate.additionalProperties, false);
  assert.equal(documents[9].$defs.ownerAuthorization.additionalProperties, false);
  assert.ok(event.oneOf[0].allOf.some((branch) => branch.if?.properties?.operation_type?.const === 'ARCHIVE'));
});
