import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const consumer = path.resolve(root, '../projects/javascript-roulette');
const failures = [];
const exists = async (target) => access(target).then(() => true, () => false);

for (const forbidden of [
  'src/context-guard',
  'src/lifecycle',
  'tests/context-guard',
  'tests/lifecycle',
  'docs/ai-team/context-guard',
  'docs/ai-team/lifecycle',
  'docs/ai-team/registry',
  'docs/ai-team/roles',
  'docs/ai-team/tasks/TASK-004',
]) {
  if (await exists(path.join(consumer, forbidden))) failures.push(`consumer contains OS-owned path: ${forbidden}`);
}

for (const projectTask of ['TASK-001', 'TASK-002', 'TASK-003']) {
  if (await exists(path.join(root, 'tasks', projectTask))) failures.push(`OS contains project-local task: ${projectTask}`);
}

const runtimeFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(target);
    else runtimeFiles.push(target);
  }
}
await walk(path.join(root, 'src'));
for (const file of runtimeFiles) {
  const text = await readFile(file, 'utf8');
  if (text.includes('/home/baisound/projects/ai-team') || text.includes('/home/baisound/projects/javascript-roulette')) {
    failures.push(`OS runtime hardcodes former product host: ${path.relative(root, file)}`);
  }
}

const adapterPath = path.join(consumer, '.bai-os/project.json');
if (!(await exists(adapterPath))) failures.push('consumer adapter missing: .bai-os/project.json');
else {
  const adapter = JSON.parse(await readFile(adapterPath, 'utf8'));
  if (adapter.bai_development_os_root !== '/home/baisound/bai-development-os') failures.push('consumer adapter points to wrong OS root');
}

if (failures.length) {
  console.error(`BOUNDARY_CHECK_FAIL (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('BOUNDARY_CHECK_PASS');
}
