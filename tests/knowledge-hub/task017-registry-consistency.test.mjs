import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const registry = fs.readFileSync('registry/document-registry.yaml', 'utf8');
const currentState = fs.readFileSync('registry/current-state.md', 'utf8');

const one = (body, pattern, label) => {
  const matches = [...body.matchAll(pattern)];
  assert.equal(matches.length, 1, `${label} must occur exactly once`);
  return matches[0][1];
};

test('document registry summary count equals its actual entry count and current-state count', () => {
  const actual = (registry.match(/^- document_id:/gm) ?? []).length;
  const registryCount = Number(one(registry, /^  documents: (\d+)$/gm, 'registry document count'));
  const currentCount = Number(one(currentState, /^- Document Registry: `(\d+) documents \/ Missing 0 \/ Hash-Size mismatch 0`$/gm, 'current-state document count'));
  assert.equal(registryCount, actual);
  assert.equal(currentCount, actual);
});

test('TASK-017 paused/resumed state cannot contradict between registry tail and current state', () => {
  const registryTask = one(registry, /^  task_017_status: (.+)$/gm, 'registry TASK-017 status');
  const registryOverall = one(registry, /^registry_status: (.+)$/gm, 'registry overall status');
  const currentTask = one(currentState, /^- TASK-017: (.+)$/gm, 'current-state TASK-017 status');
  const paused = (value) => /PAUSED/.test(value);
  assert.equal(paused(registryTask), paused(currentTask), 'TASK-017 pause state differs');
  assert.equal(paused(registryOverall), paused(currentTask), 'overall registry pause state differs');
  assert.match(registryTask, /PRODUCTION_ACTIVATION_BLOCKED/);
  assert.match(currentTask, /Production Activation remains `BLOCKED`/);
});
