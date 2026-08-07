import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('CG-ADAPTER: only Gateway imports the internal executor', async () => {
  const gateway = await readFile(new URL('../../src/context-guard/activation-gateway.mjs', import.meta.url), 'utf8');
  const index = await readFile(new URL('../../src/context-guard/index.mjs', import.meta.url), 'utf8');
  assert.match(gateway, /role-runtime-executor/);
  assert.doesNotMatch(index, /role-runtime-executor|issueRoleActivationPermit|consumeRoleActivationPermit/);
  assert.match(index, /activateRoleWithPermit/);
});

test('CG-ADAPTER: production inventory has no bypass symbols', async () => {
  const root = path.resolve(new URL('../..', import.meta.url).pathname);
  const packageJson = await readFile(path.join(root, 'package.json'), 'utf8');
  const sourceDir = path.join(root, 'src', 'context-guard');
  const sources = await Promise.all((await readdir(sourceDir)).map((file) => readFile(path.join(sourceDir, file), 'utf8')));
  const all = sources.join('\n');
  assert.doesNotMatch(packageJson, /role-runtime-executor|CONTEXT_GUARD_DISABLED|DISABLE_CONTEXT_GUARD/);
  assert.doesNotMatch(all, /CONTEXT_GUARD_DISABLED|DISABLE_CONTEXT_GUARD|child_process\.spawn|child_process\.fork/);
  assert.equal((all.match(/from ['"].*role-runtime-executor/g) ?? []).length, 1);
});
