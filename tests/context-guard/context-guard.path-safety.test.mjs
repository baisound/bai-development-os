import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rename, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { normalizeRequestedPath, resolveAndValidateInputPath, readStableUtf8, validateAllowedRootContainment } from '../../src/context-guard/path-safety.mjs';

test('PS: validates regular internal input and rejects traversal/symlink', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'input.md'); await writeFile(file, 'safe');
  const valid = await resolveAndValidateInputPath(file, [root]);
  assert.equal((await readStableUtf8(valid)).content.toString(), 'safe');
  assert.throws(() => normalizeRequestedPath('relative.md'), (error) => error.code === 'CONTEXT_PATH_NOT_ABSOLUTE');
  const outside = path.join(root, 'outside'); await mkdir(outside); await symlink('/etc/passwd', path.join(outside, 'link'));
  await assert.rejects(() => resolveAndValidateInputPath(path.join(outside, 'link'), [root]), (error) => error.code === 'CONTEXT_SYMLINK_INPUT_REJECTED');
});

test('PS-TOCTOU: replacement or symlink after validation Safe Stops before read', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'input.md'); const replacement = path.join(root, 'replacement.md');
  await writeFile(file, 'one'); await writeFile(replacement, 'two');
  const validated = await resolveAndValidateInputPath(file, [root]);
  await rename(replacement, file);
  await assert.rejects(() => readStableUtf8(validated), (error) => error.code === 'CONTEXT_PATH_CHANGED_BEFORE_READ');
  const again = await resolveAndValidateInputPath(file, [root]);
  await unlink(file); await symlink('/etc/passwd', file);
  await assert.rejects(() => readStableUtf8(again), (error) => error.code === 'CONTEXT_SYMLINK_INPUT_REJECTED');
});

test('PS: rejects relative, prefix-spoof, and symlink allowed roots', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'input.md'); await writeFile(file, 'safe');
  const link = path.join(tmpdir(), `guard-root-link-${Date.now()}`);
  await symlink(root, link); t.after(() => rm(link, { force: true }));
  await assert.rejects(() => resolveAndValidateInputPath(file, ['relative-root']), (error) => error.code === 'CONTEXT_ALLOWED_ROOT_INVALID');
  await assert.rejects(() => resolveAndValidateInputPath(file, [link]), (error) => error.code === 'CONTEXT_ALLOWED_ROOT_INVALID');
  assert.throws(() => validateAllowedRootContainment(root, `${root}-evil/input.md`), (error) => error.code === 'CONTEXT_PATH_PREFIX_SPOOF_DETECTED');
});
