import { lstat, mkdir, open, realpath } from 'node:fs/promises';
import path from 'node:path';
import { SecurityError } from './errors.mjs';

export function normalizeRelativePath(rel) {
  if (typeof rel !== 'string' || !rel.trim() || path.isAbsolute(rel)) throw new SecurityError('SECURITY_PATH_INVALID');
  const parts = rel.replaceAll('\\', '/').split('/');
  if (parts.some((p) => p === '..' || p === '')) throw new SecurityError('SECURITY_PATH_INVALID');
  return parts.join('/');
}
export function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}
export async function resolveTrustedRoot(root) {
  const info = await lstat(root).catch(() => { throw new SecurityError('SECURITY_ROOT_MISSING'); });
  if (!info.isDirectory() || info.isSymbolicLink()) throw new SecurityError('SECURITY_ROOT_UNTRUSTED');
  return realpath(root);
}
export async function resolveExistingInside(root, rel) {
  const rr = await resolveTrustedRoot(root);
  const safe = normalizeRelativePath(rel);
  const lexical = path.resolve(rr, safe);
  if (!isContained(rr, lexical)) throw new SecurityError('SECURITY_PATH_ESCAPE');
  const info = await lstat(lexical).catch((error) => { if (error.code === 'ENOENT') throw new SecurityError('SECURITY_PATH_MISSING'); throw error; });
  if (info.isSymbolicLink()) throw new SecurityError('SECURITY_SYMLINK_REJECTED');
  const actual = await realpath(lexical);
  if (!isContained(rr, actual)) throw new SecurityError('SECURITY_PATH_ESCAPE');
  return actual;
}
export async function resolveWritableInside(root, rel) {
  const rr = await resolveTrustedRoot(root);
  const safe = normalizeRelativePath(rel);
  const candidate = path.resolve(rr, safe);
  if (!isContained(rr, candidate)) throw new SecurityError('SECURITY_PATH_ESCAPE');
  const parent = path.dirname(candidate);
  await mkdir(parent, { recursive: true });
  const actualParent = await realpath(parent);
  if (!isContained(rr, actualParent)) throw new SecurityError('SECURITY_PATH_ESCAPE');
  try {
    const info = await lstat(candidate);
    if (info.isSymbolicLink()) throw new SecurityError('SECURITY_SYMLINK_REJECTED');
    const actual = await realpath(candidate);
    if (!isContained(rr, actual)) throw new SecurityError('SECURITY_PATH_ESCAPE');
  } catch (error) {
    if (error instanceof SecurityError) throw error;
    if (error.code !== 'ENOENT') throw error;
  }
  return candidate;
}
export async function assertNoSymlinkPath(root, rel) {
  const rr = await resolveTrustedRoot(root);
  const safe = normalizeRelativePath(rel);
  let current = rr;
  for (const part of safe.split('/')) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new SecurityError('SECURITY_SYMLINK_REJECTED', safe);
    } catch (error) {
      if (error instanceof SecurityError) throw error;
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
  return true;
}
export async function secureAtomicWrite(root, rel, bytes, { mode = 0o600 } = {}) {
  await assertNoSymlinkPath(root, rel);
  const target = await resolveWritableInside(root, rel);
  const temp = `${target}.tmp-${process.pid}-${Date.now()}`;
  const handle = await open(temp, 'wx', mode);
  try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
  const { rename, rm } = await import('node:fs/promises');
  try {
    // Re-check immediately before commit to reduce the TOCTOU window.
    await assertNoSymlinkPath(root, rel);
    const revalidatedTarget = await resolveWritableInside(root, rel);
    if (revalidatedTarget !== target) throw new SecurityError('SECURITY_PATH_CHANGED_DURING_WRITE');
    await rename(temp, target);
    // Verify the committed path still resolves inside the trusted root.
    await resolveExistingInside(root, rel);
    const dir = await open(path.dirname(target), 'r');
    try { await dir.sync(); } finally { await dir.close(); }
    return target;
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}
