import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = [
  'autonomous-worklane.schema.json',
  'standing-authority-grant.schema.json',
  'dispatch-envelope.schema.json',
  'atomic-unit-terminal.schema.json',
  'product-completion-policy.schema.json',
  'human-gate-v2.schema.json',
  'effect-takeover-assessment.schema.json',
  'coordination-intent-object.schema.json',
  'target-inbox.schema.json',
  'notification-envelope.schema.json',
  'audit-event-envelope.schema.json',
  'lifecycle-coordination-bundle.schema.json',
];

for(const file of files){
  test(`TASK-020 schema contract parses: ${file}`, async () => {
    const schema = JSON.parse(await readFile(new URL(`../../schemas/automation/${file}`, import.meta.url), 'utf8'));
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.match(schema.$id, /^https:\/\/bai\.dev\/schemas\/automation\//);
    assert.equal(schema.type, 'object');
    assert.equal(schema.additionalProperties, false);
  });
}
