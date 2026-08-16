#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_SOURCE_ENV_KEYS = Object.freeze([
  'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSFILE', 'BACKUP_DIR',
  'BAI_CODE_REVISION', 'BAI_NODE_BIN', 'BAI_PG_DUMP_BIN', 'BAI_PG_RESTORE_BIN',
  'BAI_AGE_BIN', 'BAI_BACKUP_PLAINTEXT_TMPFS_ROOT', 'AGE_RECIPIENT',
  'BACKUP_SOURCE_AUTHORIZATION_FILE', 'SOURCE_AUTHORIZATION_CONSUMPTION_DIR'
]);

export const REQUIRED_RESTORE_ENV_KEYS = Object.freeze([
  'BAI_BACKUP_RESTORE_ACK', 'BACKUP_FILE', 'BACKUP_SHA256_FILE', 'BACKUP_MANIFEST_FILE',
  'BACKUP_SOURCE_COMMIT_FILE', 'AGE_RECIPIENT', 'AGE_IDENTITY_FILE',
  'REHEARSAL_TARGET_AUTHORIZATION_FILE', 'AUTHORIZATION_CONSUMPTION_DIR',
  'PLAINTEXT_TMPFS_ROOT', 'BACKUP_RESTORE_ROOT', 'BACKUP_RESTORE_RUN_DIR', 'RUN_ID',
  'CODE_REVISION', 'RESTORE_TARGET_DATABASE', 'PGHOST', 'PGADMINUSER', 'PGRESTOREUSER',
  'PGRESTOREEXECUTOR', 'PGDATABASE', 'PGPORT', 'PGPASSFILE', 'PGRESTOREPASSFILE'
]);

const UNSAFE_ENV_KEYS = Object.freeze(['BASH_ENV', 'ENV', 'NODE_OPTIONS', 'NODE_PATH', 'LD_PRELOAD', 'LD_LIBRARY_PATH', 'PGOPTIONS', 'PGSERVICE', 'PGSERVICEFILE', 'PGPASSWORD']);
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;
const RUN_ID = /^[A-Za-z0-9._-]{1,64}$/;
const LITERAL = /^([A-Z][A-Z0-9_]*)=([A-Za-z0-9_./:+@=-]+)$/;

const expectedKeys = (mode) => {
  if (mode === 'source') return REQUIRED_SOURCE_ENV_KEYS;
  if (mode === 'restore') return REQUIRED_RESTORE_ENV_KEYS;
  throw new Error('environment mode must be source or restore');
};

export function parseExecutionEnvironment(mode, text, { allowPlaceholders = false } = {}) {
  const values = {};
  for (const [index, raw] of String(text).split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = LITERAL.exec(line);
    if (!match) throw new Error(`${mode} environment line ${index + 1} is not a literal KEY=value assignment`);
    if (Object.hasOwn(values, match[1])) throw new Error(`duplicate ${mode} environment key: ${match[1]}`);
    if (!allowPlaceholders && /CHANGE-ME/.test(match[2])) throw new Error(`${mode} environment key ${match[1]} still contains a placeholder`);
    values[match[1]] = match[2];
  }
  if (Object.keys(values).sort().join('\n') !== [...expectedKeys(mode)].sort().join('\n')) throw new Error(`${mode} environment must contain exactly the required keys`);
  return Object.freeze(values);
}

function readStableEnvironment(file) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(fd); const bytes = fs.readFileSync(fd); const after = fs.fstatSync(fd);
    if (!before.isFile() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('execution environment is not a stable ordinary file');
    return { bytes, stat: after };
  } finally { fs.closeSync(fd); }
}

function assertProtectedEnvironmentPath(file, environmentStat) {
  if (environmentStat.uid !== 0 || (environmentStat.mode & 0o777) !== 0o600) throw new Error('execution environment file must be root-owned mode 0600');
  let current = path.resolve(file);
  for (;;) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || stat.uid !== 0 || (current !== file && (stat.mode & 0o022) !== 0)) throw new Error('execution environment path is not root-protected');
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
}

function validateCommon(values) {
  if (!/^\d{1,5}$/.test(values.PGPORT) || Number(values.PGPORT) < 1 || Number(values.PGPORT) > 65535) throw new Error('PGPORT invalid');
  if (!path.posix.isAbsolute(values.PGHOST)) throw new Error('PGHOST must be an absolute Unix socket path');
  if (!IDENTIFIER.test(values.PGDATABASE)) throw new Error('PGDATABASE invalid');
  if (!/^[A-Za-z0-9-]{8,1024}$/.test(values.AGE_RECIPIENT)) throw new Error('AGE_RECIPIENT invalid');
}

function requireAbsolute(values, keys) {
  for (const key of keys) if (!path.posix.isAbsolute(values[key])) throw new Error(`${key} must be absolute`);
}

function validateMode(mode, values) {
  validateCommon(values);
  if (mode === 'source') {
    if (!IDENTIFIER.test(values.PGUSER) || !/^[a-f0-9]{40}$/.test(values.BAI_CODE_REVISION)) throw new Error('source PostgreSQL user or code revision invalid');
    if (values.BAI_NODE_BIN !== '/usr/bin/node') throw new Error('source Node verifier must be /usr/bin/node');
    requireAbsolute(values, ['PGPASSFILE', 'BACKUP_DIR', 'BAI_NODE_BIN', 'BAI_PG_DUMP_BIN', 'BAI_PG_RESTORE_BIN', 'BAI_AGE_BIN', 'BAI_BACKUP_PLAINTEXT_TMPFS_ROOT', 'BACKUP_SOURCE_AUTHORIZATION_FILE', 'SOURCE_AUTHORIZATION_CONSUMPTION_DIR']);
    return;
  }
  if (values.BAI_BACKUP_RESTORE_ACK !== 'BACKUP_RESTORE_REHEARSAL_ONLY' || !RUN_ID.test(values.RUN_ID) || !/^[a-f0-9]{40}$/.test(values.CODE_REVISION)) throw new Error('restore acknowledgement, run ID or revision invalid');
  if (!IDENTIFIER.test(values.PGADMINUSER) || !IDENTIFIER.test(values.PGRESTOREUSER) || !IDENTIFIER.test(values.PGRESTOREEXECUTOR) || values.PGRESTOREEXECUTOR === values.PGRESTOREUSER || !/^[A-Za-z0-9_]+_restore_rehearsal$/.test(values.RESTORE_TARGET_DATABASE) || values.RESTORE_TARGET_DATABASE.length > 63) throw new Error('restore PostgreSQL identity invalid');
  requireAbsolute(values, ['BACKUP_FILE', 'BACKUP_SHA256_FILE', 'BACKUP_MANIFEST_FILE', 'BACKUP_SOURCE_COMMIT_FILE', 'AGE_IDENTITY_FILE', 'REHEARSAL_TARGET_AUTHORIZATION_FILE', 'AUTHORIZATION_CONSUMPTION_DIR', 'PLAINTEXT_TMPFS_ROOT', 'BACKUP_RESTORE_ROOT', 'BACKUP_RESTORE_RUN_DIR', 'PGPASSFILE', 'PGRESTOREPASSFILE']);
  if (values.BACKUP_RESTORE_ROOT !== '/var/lib/bai-development-os/knowledge-hub/rehearsals' || values.AUTHORIZATION_CONSUMPTION_DIR !== '/var/lib/bai-development-os/knowledge-hub/authority-consumption') throw new Error('restore run and authority ledger roots must be canonical');
  if (values.BACKUP_SHA256_FILE !== `${values.BACKUP_FILE}.sha256` || values.BACKUP_MANIFEST_FILE !== `${values.BACKUP_FILE}.manifest.json` || values.BACKUP_SOURCE_COMMIT_FILE !== path.posix.join(path.posix.dirname(values.BACKUP_FILE), 'COMMITTED.json')) throw new Error('restore source bundle paths are inconsistent');
  if (values.BACKUP_RESTORE_RUN_DIR !== path.posix.join(values.BACKUP_RESTORE_ROOT, values.RUN_ID)) throw new Error('restore run directory must be the exact root/RUN_ID child');
}

export function validateExecutionEnvironment({ mode, environmentFile, environment = process.env, platform = process.platform, requireLoadedEnvironment = false }) {
  if (!path.isAbsolute(environmentFile)) throw new Error('execution environment file must be absolute');
  const { bytes, stat } = readStableEnvironment(environmentFile);
  const values = parseExecutionEnvironment(mode, bytes.toString('utf8'));
  validateMode(mode, values);
  if (requireLoadedEnvironment) {
    for (const key of expectedKeys(mode)) if (environment[key] !== values[key]) throw new Error(`loaded ${mode} environment differs for ${key}`);
    for (const key of UNSAFE_ENV_KEYS) if (environment[key] !== undefined) throw new Error(`unsafe loaded environment key present: ${key}`);
  }
  if (platform === 'linux') assertProtectedEnvironmentPath(environmentFile, stat);
  return Object.freeze({ status: 'PASS', mode: mode.toUpperCase(), keys: expectedKeys(mode).length });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, option, argument] = process.argv.slice(2);
    if (option === '--lint-template') {
      const values = parseExecutionEnvironment(mode, fs.readFileSync(argument, 'utf8'), { allowPlaceholders: true });
      console.log(JSON.stringify({ status: 'PASS', mode: `${mode.toUpperCase()}_TEMPLATE_LINT`, keys: Object.keys(values).length }));
    } else {
      const requireLoadedEnvironment = option === '--require-loaded';
      const file = requireLoadedEnvironment ? argument : option;
      if (!file) throw new Error('usage: validate-rehearsal-execution-environment.mjs source|restore [--require-loaded] <environment-file> | source|restore --lint-template <template>');
      console.log(JSON.stringify(validateExecutionEnvironment({ mode, environmentFile: file, requireLoadedEnvironment })));
    }
  } catch (error) { console.error(JSON.stringify({ status: 'FAIL', reason: error.message })); process.exit(1); }
}
