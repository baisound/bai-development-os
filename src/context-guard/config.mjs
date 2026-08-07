import { createHash } from 'node:crypto';
import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { ContextGuardError } from './errors.mjs';

export const DEFAULT_CONTEXT_GUARD_CONFIG = Object.freeze({
  max_files_per_role: 12,
  max_total_input_bytes: 131072,
  max_estimated_input_tokens: 32000,
  max_estimated_output_tokens: 8000,
  max_artifact_sections: 16,
  max_single_artifact_bytes: 65536,
  max_review_depth: 1,
  max_revision_cycles: 1,
});

export function validateConfig(value = DEFAULT_CONTEXT_GUARD_CONFIG) {
  const config = { ...DEFAULT_CONTEXT_GUARD_CONFIG, ...value };
  for (const key of Object.keys(DEFAULT_CONTEXT_GUARD_CONFIG)) {
    const number = config[key];
    if (!Number.isSafeInteger(number) || number < 1) {
      throw new ContextGuardError('CONTEXT_INVENTORY_INCOMPLETE', `Invalid Context Guard limit: ${key}`);
    }
  }
  return Object.freeze(config);
}

export function getConfiguredAllowedReadRootPaths({ env = process.env, cwd = process.cwd() } = {}) {
  const explicit = env.BAI_OS_ALLOWED_READ_ROOTS;
  const candidates = explicit
    ? explicit.split(path.delimiter).map((value) => value.trim()).filter(Boolean)
    : [env.BAI_OS_ROOT, env.BAI_PROJECT_ROOT].filter(Boolean);
  const roots = candidates.length ? candidates : [cwd];
  return Object.freeze([...new Set(roots.map((value) => path.resolve(value)))]);
}

export async function resolveTrustedAllowedReadRoots(configuredPaths = getConfiguredAllowedReadRootPaths()) {
  if (!Array.isArray(configuredPaths) || configuredPaths.length === 0) {
    throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID');
  }
  const roots = [];
  for (const configuredPath of configuredPaths) {
    if (typeof configuredPath !== 'string' || !path.isAbsolute(configuredPath)) {
      throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID');
    }
    let metadata;
    try {
      metadata = await lstat(configuredPath);
    } catch (error) {
      throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID', error.message);
    }
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
      throw new ContextGuardError('CONTEXT_ALLOWED_ROOT_INVALID');
    }
    roots.push(await realpath(configuredPath));
  }
  return Object.freeze([...new Set(roots)].sort());
}

export async function getTrustedRootSetChecksum(configuredPaths) {
  const roots = await resolveTrustedAllowedReadRoots(configuredPaths);
  return `sha256:${createHash('sha256').update(JSON.stringify(roots)).digest('hex')}`;
}

export function getGuardConfigChecksum(config = DEFAULT_CONTEXT_GUARD_CONFIG) {
  const validated = validateConfig(config);
  return `sha256:${createHash('sha256').update(JSON.stringify(
    Object.fromEntries(Object.entries(validated).sort(([left], [right]) => left.localeCompare(right))),
  )).digest('hex')}`;
}
