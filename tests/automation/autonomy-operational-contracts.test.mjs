import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const sourcePaths = [
  'src/context-control/context-cost-observatory.mjs',
  'src/context-control/handoff-bootstrap.mjs',
  'src/automation/autonomous-queue.mjs',
  'src/automation/session-rotation.mjs',
  'src/automation/codex-adapter.mjs',
  'src/automation/autonomy-hardening.mjs',
  'src/automation/safety-first-routing.mjs',
];

test('Failure Registry exactly covers thrown bounded-autonomy error codes', async () => {
  const registry = JSON.parse(await read('registry/autonomy-failure-registry.json'));
  const registered = registry.domains.flatMap((domain) => domain.codes).sort();
  assert.equal(new Set(registry.domains.map((domain) => domain.domain)).size, registry.domains.length);
  assert.equal(new Set(registered).size, registered.length);
  const signals = registry.domains.flatMap((domain) => domain.signals).sort();
  assert.equal(new Set(signals).size, signals.length);
  assert.equal(signals.some((signal) => registered.includes(signal)), false);
  const thrown = new Set();
  for (const path of sourcePaths) {
    const source = await read(path);
    for (const match of source.matchAll(/new\s+\w+Error\(\s*'([A-Z0-9_]+)'/g)) thrown.add(match[1]);
  }
  assert.deepEqual(registered, [...thrown].sort());
  for (const expected of [
    'CONTEXT_OVERFETCH', 'HUMAN_GATE_REQUIRED', 'AUTOMATION_LEASE_CONFLICT',
    'RECOVERY_GATE_REQUIRED', 'PAID_EXECUTION_NOT_AUTHORIZED',
    'NATIVE_EXECUTION_NOT_AUTHORIZED', 'SESSION_ROTATION_REQUIRED',
  ]) assert.ok(signals.includes(expected), `missing operational signal: ${expected}`);
});

test('Failure Registry schema is closed and requires every root/domain field', async () => {
  const schema = JSON.parse(await read('schemas/automation/autonomy-failure-registry.schema.json'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(new Set(schema.required), new Set(Object.keys(schema.properties)));
  const domain = schema.properties.domains.items;
  assert.equal(domain.additionalProperties, false);
  assert.deepEqual(new Set(domain.required), new Set(Object.keys(domain.properties)));
  assert.equal(domain.properties.codes.uniqueItems, true);
  assert.equal(domain.properties.signals.uniqueItems, true);
});

test('operational deliverables preserve mandatory authority and independence invariants', async () => {
  const documents = {
    operator: await read('specifications/BAI_Development_OS_Autonomy_Operator_Manual_Ver1.0.md'),
    consumer: await read('specifications/BAI_Development_OS_Autonomy_Consumer_Integration_Guide_Ver1.0.md'),
    handoff: await read('specifications/BAI_Development_OS_Autonomy_Handoff_Pack_Specification_Ver1.0.md'),
    context: await read('specifications/BAI_Development_OS_Context_Cost_Specification_Ver1.0.md'),
    adapter: await read('specifications/BAI_Development_OS_Codex_Automation_Adapter_Specification_Ver1.0.md'),
  };
  assert.match(documents.operator, /cannot create Owner Authority/);
  assert.match(documents.operator, /push directly to protected `main`/);
  assert.match(documents.consumer, /not as a Product runtime dependency/);
  assert.match(documents.consumer, /does not authorize locating, reading, changing, executing or pushing/);
  assert.match(documents.handoff, /Current Git checkout and Registry|newer checkout/);
  assert.match(documents.handoff, /previous_conversation_required: false/);
  assert.match(documents.context, /Unknown values remain `null`/);
  assert.match(documents.context, /cannot override hard floors/);
  assert.match(documents.adapter, /dispatch_performed` is always `false`/);
  assert.match(documents.adapter, /canonical: false/);
});
