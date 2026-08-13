import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const schemaPath = new URL(
  '../../schemas/context-control/handoff-bootstrap-result.schema.json',
  import.meta.url,
);

test('handoff bootstrap schema is a closed Draft 2020-12 contract', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
  assert.equal(schema.properties.handoff_bootstrap_schema_version.const, '1.0.0');
});

test('schema fixes source truth, authorization and instruction trust vocabularies', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  assert.deepEqual(schema.properties.source_truth_mode.enum, [
    'LOCAL_CHECKOUT',
    'REMOTE_FEATURE_BRANCH',
    'HANDOFF_ONLY_READONLY',
  ]);
  assert.ok(schema.properties.authorization_state.enum.includes('AUTHORITY_CONFLICT'));
  assert.equal(schema.$defs.trustLevel.enum[0], 'OWNER_AUTHORITY');
  assert.equal(schema.$defs.trustLevel.enum.at(-1), 'EXTERNAL_UNTRUSTED');
});

test('schema preserves explicit findings and checksummed identities', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  assert.ok(schema.$defs.finding.properties.code.enum.includes('HANDOFF_STALE'));
  assert.ok(schema.$defs.finding.properties.code.enum.includes('CRITICAL_SOURCE_CHANGED_IN_NEWER_CHECKOUT'));
  assert.ok(schema.$defs.finding.properties.code.enum.includes('DIRTY_WORKTREE_PRESERVED'));
  assert.equal(schema.properties.manifest_sha256.pattern, '^sha256:[a-f0-9]{64}$');
  assert.equal(schema.properties.content_checksum.pattern, '^sha256:[a-f0-9]{64}$');
});
