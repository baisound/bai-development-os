import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import path from 'node:path';
import { ContextGuardError } from './errors.mjs';

const identity = (stat) => ({ dev: stat.dev, ino: stat.ino, mode: stat.mode, size: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, object_type: stat.isFile() ? 'file' : 'other' });
const sameIdentity = (a, b) => ['dev', 'ino', 'mode', 'size', 'mtimeMs', 'ctimeMs'].every((key) => a[key] === b[key]);

export function normalizeRequestedPath(requestedPath) {
  if (!path.isAbsolute(requestedPath)) throw new ContextGuardError('CONTEXT_PATH_NOT_ABSOLUTE');
  if (requestedPath.split(path.sep).includes('..')) throw new ContextGuardError('CONTEXT_PATH_TRAVERSAL_DETECTED');
  return path.normalize(requestedPath);
}

export function validateAllowedRootContainment(root, candidate) {
  const relative = path.relative(root, candidate);
  if (relative === '' || (!path.isAbsolute(relative) && !relative.startsWith(`..${path.sep}`) && relative !== '..')) return root;
  if (candidate.startsWith(root)) throw new ContextGuardError('CONTEXT_PATH_PREFIX_SPOOF_DETECTED');
  throw new ContextGuardError('CONTEXT_PATH_OUTSIDE_ALLOWED_ROOT');
}

async function inspect(file) {
  let metadata;
  try { metadata = await lstat(file); } catch (error) {
    if (error.code === 'ELOOP') throw new ContextGuardError('CONTEXT_SYMLINK_LOOP');
    throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID', error.message);
  }
  if (metadata.isSymbolicLink()) throw new ContextGuardError('CONTEXT_SYMLINK_INPUT_REJECTED');
  if (!metadata.isFile()) throw new ContextGuardError('CONTEXT_FILESYSTEM_OBJECT_UNSUPPORTED');
  return identity(metadata);
}

export async function resolveAndValidateInputPath(requestedPath, allowedRoots) {
  const normalized = normalizeRequestedPath(requestedPath);
  const roots = await Promise.all(allowedRoots.map(async (root) => {
    try {
      if (!path.isAbsolute(root)) throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID');
      const metadata = await lstat(root);
      if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID');
      return await realpath(root);
    } catch (error) {
      if (error instanceof ContextGuardError) throw error;
      throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID');
    }
  }));
  // Reject lexically outside paths before touching the candidate filesystem path.
  // This prevents needless lstat/realpath access outside the configured trust boundary.
  const lexicalRoot = roots.find((candidate) => {
    try { validateAllowedRootContainment(candidate, normalized); return true; } catch { return false; }
  });
  if (!lexicalRoot) throw new ContextGuardError('CONTEXT_PATH_OUTSIDE_ALLOWED_ROOT');

  const pre = await inspect(normalized);
  let resolved;
  try { resolved = await realpath(normalized); } catch (error) {
    if (error.code === 'ENOENT') throw new ContextGuardError('CONTEXT_SYMLINK_BROKEN');
    throw error;
  }
  const root = roots.find((candidate) => {
    try { validateAllowedRootContainment(candidate, resolved); return true; } catch { return false; }
  });
  if (!root) throw new ContextGuardError('CONTEXT_PATH_OUTSIDE_ALLOWED_ROOT');
  return { requested_path: normalized, resolved_path: resolved, allowed_root: root, identity: pre };
}

export async function readStableUtf8(validated) {
  const before = await inspect(validated.requested_path);
  if (!sameIdentity(before, validated.identity)) throw new ContextGuardError('CONTEXT_PATH_CHANGED_BEFORE_READ');
  const handle = await open(validated.requested_path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_CLOEXEC);
  try {
    const descriptorBefore = identity(await handle.stat());
    if (!sameIdentity(descriptorBefore, before)) throw new ContextGuardError('CONTEXT_INPUT_IDENTITY_MISMATCH');
    const content = await handle.readFile();
    const after = identity(await handle.stat());
    if (!sameIdentity(descriptorBefore, after)) throw new ContextGuardError('CONTEXT_PATH_CHANGED_DURING_READ');
    const finalPath = await realpath(validated.requested_path).catch(() => {
      throw new ContextGuardError('CONTEXT_PATH_CHANGED_DURING_READ');
    });
    if (finalPath !== validated.resolved_path) throw new ContextGuardError('CONTEXT_PATH_CHANGED_DURING_READ');
    const finalIdentity = await inspect(validated.requested_path);
    if (!sameIdentity(after, finalIdentity)) throw new ContextGuardError('CONTEXT_PATH_CHANGED_DURING_READ');
    return { content, pre_read_identity: descriptorBefore, post_read_identity: after };
  } finally { await handle.close(); }
}

export const revalidatePathBeforeRead = async (validated) => {
  const current = await inspect(validated.requested_path);
  if (!sameIdentity(current, validated.identity)) throw new ContextGuardError('CONTEXT_PATH_CHANGED_BEFORE_READ');
  return current;
};
export const verifyPathStableAfterRead = (before, after) => {
  if (!sameIdentity(before, after)) throw new ContextGuardError('CONTEXT_PATH_CHANGED_DURING_READ');
  return { stable: true, before, after };
};
