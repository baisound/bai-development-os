import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
export async function tempRoot(t) { const root = await mkdtemp(path.join(os.tmpdir(), 'bai-distributed-')); t.after(() => rm(root, { recursive: true, force: true })); return root; }
export const fixedClock = (value = '2026-08-08T12:00:00.000Z') => () => new Date(value);
