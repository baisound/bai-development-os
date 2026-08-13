import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const url = new URL('../../schemas/automation/codex-capability-probe.schema.json', import.meta.url);

test('Codex capability probe schema is a closed Draft 2020-12 contract', async () => {
  const schema = JSON.parse(await readFile(url, 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
  assert.equal(schema.properties.capabilities.items.additionalProperties, false);
});

test('Codex capability schema separates availability, evidence trust and environment', async () => {
  const schema = JSON.parse(await readFile(url, 'utf8'));
  assert.deepEqual(schema.properties.capabilities.items.properties.status.enum, ['AVAILABLE', 'UNAVAILABLE', 'UNKNOWN']);
  assert.ok(schema.properties.capabilities.items.properties.source_trust.enum.includes('UNTRUSTED_DESCRIPTION'));
  assert.ok(schema.properties.environment.enum.includes('UNKNOWN'));
});
