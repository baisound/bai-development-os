import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const load = async (name) => JSON.parse(await readFile(
  new URL(`../../schemas/automation/${name}`, import.meta.url),
  'utf8',
));

test('Phase D schemas are closed Draft 2020-12 contracts', async () => {
  for (const name of ['human-gate.schema.json', 'autonomous-task-node.schema.json']) {
    const schema = await load(name);
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
  }
});

test('human gate schema preserves task-vs-system continuation and exact gate types', async () => {
  const schema = await load('human-gate.schema.json');
  assert.equal(schema.properties.safe_to_continue_other_tasks.type, 'boolean');
  assert.ok(schema.properties.type.enum.includes('PAID_PROVIDER_EXECUTION'));
  assert.ok(schema.properties.type.enum.includes('RELEASE_OR_DEPLOYMENT'));
  assert.ok(schema.required.includes('authorized_by'));
  assert.ok(schema.required.includes('authority_verification_result'));
  assert.ok(schema.required.includes('authorization_evidence_checksum'));
  assert.ok(schema.required.includes('satisfaction_evidence'));
  assert.equal(schema.allOf[0].then.properties.satisfaction_evidence.minItems, 1);
});

test('task node schema separates authorization, design and implementation', async () => {
  const schema = await load('autonomous-task-node.schema.json');
  assert.ok(schema.properties.authorization.enum.includes('DESIGN_ONLY'));
  assert.equal(schema.properties.design_runnable.type, 'boolean');
  assert.equal(schema.properties.implementation_runnable.type, 'boolean');
  assert.equal(schema.properties.context_locality.maximum, 100);
});
