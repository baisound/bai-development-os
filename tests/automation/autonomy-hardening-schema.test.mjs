import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const load = async (name) => JSON.parse(await readFile(new URL(`../../schemas/automation/${name}`, import.meta.url), 'utf8'));

test('Phase H hardening schemas are closed Draft 2020-12 contracts', async () => {
  for (const name of ['autonomy-session-lease.schema.json', 'autonomy-recovery-assessment.schema.json']) {
    const schema = await load(name);
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
  }
});

test('recovery assessment forbids automatic mutation and lease has exact binding fields', async () => {
  const recovery = await load('autonomy-recovery-assessment.schema.json');
  const lease = await load('autonomy-session-lease.schema.json');
  assert.equal(recovery.properties.automatic_mutation_allowed.const, false);
  for (const key of ['project_id', 'session_id', 'branch', 'task_id', 'heartbeat_at']) assert.ok(lease.required.includes(key));
});
