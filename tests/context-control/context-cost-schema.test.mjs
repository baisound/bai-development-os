import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const schemaPath = new URL(
  '../../schemas/context-control/context-cost-record.schema.json',
  import.meta.url,
);

test('context cost schema is valid JSON Schema 2020-12 with a closed root contract', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.type, 'object');
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.context_cost_schema_version.const, '1.0.0');
  assert.deepEqual(
    new Set(schema.required),
    new Set(Object.keys(schema.properties)),
  );
});

test('schema requires nullable observed and billed usage without zero defaults', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const usage = schema.$defs.usage;
  assert.equal(usage.additionalProperties, false);
  for (const field of [
    'observed_input_tokens',
    'observed_cached_input_tokens',
    'observed_output_tokens',
    'billed_tokens',
  ]) {
    assert.ok(usage.required.includes(field));
    assert.equal(usage.properties[field].$ref, '#/$defs/nullableTokens');
    assert.equal(usage.properties[field].default, undefined);
  }
  assert.deepEqual(schema.$defs.nullableTokens.type, ['integer', 'null']);
});

test('schema source contract contains provenance and use signals', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const required = new Set(schema.$defs.source.required);
  for (const field of [
    'source_id',
    'source_type',
    'path_or_ref',
    'sha256',
    'estimated_tokens',
    'observed_tokens',
    'selected_reason',
    'mandatory',
    'cacheable',
    'changed_since_previous_session',
    'used_in_decision',
    'used_in_patch',
    'duplicate_of',
    'stale',
    'trust_level',
  ]) assert.ok(required.has(field), `${field} must be required`);
});

test('schema exposes bounded quality, confidence and overfetch severity vocabularies', async () => {
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  assert.deepEqual(schema.$defs.qualityGate.properties.status.enum, ['PASS', 'FAIL', 'UNKNOWN']);
  assert.deepEqual(
    schema.$defs.finding.properties.severity.enum,
    ['INFO', 'WARNING', 'MAJOR', 'CRITICAL'],
  );
  assert.ok(schema.properties.confidence.enum.includes('EXACT_PROVIDER_REPORTED'));
  assert.ok(schema.properties.confidence.enum.includes('UNAVAILABLE'));
  assert.deepEqual(schema.$defs.efficiency.properties.score.type, ['number', 'null']);
});
