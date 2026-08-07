import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { collectInputInventory, deduplicateInputs, selectInputs } from '../../src/context-guard/inventory.mjs';
import { evaluateLimits } from '../../src/context-guard/evaluate.mjs';

const OS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function withAllowedRoots(roots, fn) {
  const previous = process.env.BAI_OS_ALLOWED_READ_ROOTS;
  process.env.BAI_OS_ALLOWED_READ_ROOTS = roots.join(path.delimiter);
  try { return await fn(); }
  finally {
    if (previous === undefined) delete process.env.BAI_OS_ALLOWED_READ_ROOTS;
    else process.env.BAI_OS_ALLOWED_READ_ROOTS = previous;
  }
}

test('CG-INTEGRATION: inventory uses trusted roots, deduplicates, and produces a decision', async () => {
  await withAllowedRoots([OS_ROOT], async () => {
    const source = path.join(OS_ROOT, 'package.json');
    const inventory = deduplicateInputs(await collectInputInventory([
      { path: source, purpose: 'spec', authority_class: 'MANDATORY_CANONICAL' },
      { path: source, purpose: 'spec', authority_class: 'MANDATORY_CANONICAL' },
    ]));
    const selected = selectInputs(inventory);
    assert.equal(selected.selected.length, 1);
    assert.equal(evaluateLimits({
      selected: selected.selected, ...selected,
      estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 0,
    }).decision, 'PASS');
  });
});

test('CG-INTEGRATION: trusted roots reject outside, relative, and prefix-spoof paths', async () => {
  await withAllowedRoots([OS_ROOT], async () => {
    for (const candidate of ['/tmp/attacker.md', '/etc/passwd', 'relative.md', `${OS_ROOT}-evil/file.md`]) {
      await assert.rejects(
        () => collectInputInventory([{ path: candidate, authority_class: 'MANDATORY_CANONICAL' }]),
        (error) => ['CONTEXT_PATH_NOT_ABSOLUTE', 'CONTEXT_PATH_OUTSIDE_ALLOWED_ROOT'].includes(error.code),
      );
    }
  });
});

test('CG-INTEGRATION: OS and consumer roots can both be trusted without hardcoded project names', async (t) => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'bai-consumer-'));
  t.after(() => rm(projectRoot, { recursive: true, force: true }));
  await mkdir(path.join(projectRoot, 'src'), { recursive: true });
  await writeFile(path.join(projectRoot, 'PROJECT.md'), '# fixture project\n');

  await withAllowedRoots([OS_ROOT, projectRoot], async () => {
    const inventory = await collectInputInventory([
      { path: path.join(OS_ROOT, 'roles/README-Builder.md'), authority_class: 'MANDATORY_CANONICAL' },
      { path: path.join(projectRoot, 'PROJECT.md'), authority_class: 'MANDATORY_CURRENT_TASK' },
    ]);
    assert.equal(inventory.length, 2);
    assert.deepEqual(new Set(inventory.map((entry) => entry.allowed_root)), new Set([OS_ROOT, projectRoot]));
  });
});
