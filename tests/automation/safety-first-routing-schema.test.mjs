import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const schema = JSON.parse(await readFile(
  new URL('../../schemas/automation/autonomy-route-decision.schema.json', import.meta.url),
  'utf8',
));

test('route decision schema is a closed Draft 2020-12 contract', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
});

test('route decision cannot create authority and records context use explicitly', () => {
  assert.equal(schema.properties.authority_created.const, false);
  assert.deepEqual(schema.properties.result.enum, ['AUTONOMY_ROUTE_READY', 'AUTONOMY_ROUTE_BLOCKED']);
  assert.equal(schema.properties.context_optimization_applied.type, 'boolean');
  assert.deepEqual(schema.properties.context_record_checksum.type, ['string', 'null']);
});
