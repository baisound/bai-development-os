#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REQUIRED_RECOVERY_ENV_KEYS = Object.freeze([
  'RECOVERY_JOURNAL_FILE', 'RECOVERY_AUTHORIZATION_FILE', 'BAI_RECOVERY_PSQL_BIN',
  'PGHOST', 'PGPORT', 'PGADMINUSER', 'PGDATABASE', 'PGPASSFILE'
]);

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;
const exactKeys = (value, expected, label) => {
  if (Object.keys(value).sort().join('\n') !== [...expected].sort().join('\n')) throw new Error(`${label} must contain exactly the required keys`);
};

export function parseRecoveryEnvironment(text, { allowPlaceholders = false } = {}) {
  const values = {};
  for (const [index, raw] of String(text).split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^([A-Z][A-Z0-9_]*)=([A-Za-z0-9_./:+-]+)$/.exec(line);
    if (!match) throw new Error(`recovery environment line ${index + 1} is not a literal KEY=value assignment`);
    if (Object.hasOwn(values, match[1])) throw new Error(`duplicate recovery environment key: ${match[1]}`);
    if (!allowPlaceholders && /CHANGE-ME/.test(match[2])) throw new Error(`recovery environment key ${match[1]} still contains a placeholder`);
    values[match[1]] = match[2];
  }
  exactKeys(values, REQUIRED_RECOVERY_ENV_KEYS, 'recovery environment');
  return Object.freeze(values);
}

export function assertUnixProtection(stat, label, { exactMode } = {}) {
  if (stat.uid !== 0) throw new Error(`${label} must be root-owned`);
  const mode = stat.mode & 0o777;
  if (exactMode !== undefined ? mode !== exactMode : (mode & 0o022) !== 0) throw new Error(`${label} permissions are unsafe`);
}

function readStableOrdinary(file) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(fd); const bytes = fs.readFileSync(fd); const after = fs.fstatSync(fd);
    if (!before.isFile() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('recovery environment is not a stable ordinary file');
    return { bytes, stat: after };
  } finally { fs.closeSync(fd); }
}

function assertCanonicalProtectedPath(target, label, type, exactMode) {
  if (!path.isAbsolute(target) || fs.realpathSync(target) !== path.resolve(target)) throw new Error(`${label} must be an absolute canonical path`);
  let current = target;
  for (;;) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error(`${label} path contains a symlink`);
    if (current === target && ((type === 'file' && !stat.isFile()) || (type === 'directory' && !stat.isDirectory()))) throw new Error(`${label} has the wrong file type`);
    assertUnixProtection(stat, current === target ? label : `${label} ancestor`, current === target ? { exactMode } : {});
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
}

function assertCanonicalPathType(target, label, type) {
  if (!path.isAbsolute(target) || fs.realpathSync(target) !== path.resolve(target)) throw new Error(`${label} must be an absolute canonical path`);
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || (type === 'directory' && !stat.isDirectory()) || (type === 'file' && !stat.isFile())) throw new Error(`${label} has the wrong file type`);
}

const defaultMountProbe = (target) => {
  const result = spawnSync('/usr/bin/findmnt', ['--noheadings', '--target', target], { encoding: 'utf8', env: { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' } });
  return result.status === 0 && Boolean(result.stdout.trim());
};
const defaultSocketProbe = (socket) => { const stat = fs.lstatSync(socket); return stat.isSocket() && !stat.isSymbolicLink(); };

export function validateRecoveryEnvironment({
  environmentFile, environment = process.env, platform = process.platform,
  getuid = () => process.getuid?.(), mountProbe = defaultMountProbe, socketProbe = defaultSocketProbe,
  requireLoadedEnvironment = false
}) {
  if (!path.isAbsolute(environmentFile)) throw new Error('recovery environment file must be absolute');
  const { bytes, stat: environmentStat } = readStableOrdinary(environmentFile);
  const parsed = parseRecoveryEnvironment(bytes.toString('utf8'));
  if (requireLoadedEnvironment) {
    for (const key of REQUIRED_RECOVERY_ENV_KEYS) if (environment[key] !== parsed[key]) throw new Error(`loaded recovery environment differs for ${key}`);
  }
  if (!/^\d{1,5}$/.test(parsed.PGPORT) || Number(parsed.PGPORT) < 1 || Number(parsed.PGPORT) > 65535) throw new Error('PGPORT invalid');
  if (!IDENTIFIER.test(parsed.PGADMINUSER) || !IDENTIFIER.test(parsed.PGDATABASE)) throw new Error('PostgreSQL identifier invalid');
  for (const key of ['RECOVERY_JOURNAL_FILE', 'RECOVERY_AUTHORIZATION_FILE', 'BAI_RECOVERY_PSQL_BIN', 'PGHOST', 'PGPASSFILE']) if (!path.isAbsolute(parsed[key])) throw new Error(`${key} must be absolute`);
  const rehearsalRoot = '/var/lib/bai-development-os/knowledge-hub/rehearsals';
  if (platform === 'linux' && (path.relative(rehearsalRoot, parsed.RECOVERY_JOURNAL_FILE).startsWith('..') || path.relative(rehearsalRoot, parsed.RECOVERY_JOURNAL_FILE) === '')) throw new Error('recovery journal must stay under the canonical rehearsal root');
  if (platform === 'linux') {
    if (getuid() !== 0) throw new Error('recovery preflight requires root');
    assertUnixProtection(environmentStat, 'recovery environment file', { exactMode: 0o600 });
    assertCanonicalProtectedPath(environmentFile, 'recovery environment file', 'file', 0o600);
    assertCanonicalProtectedPath(parsed.RECOVERY_JOURNAL_FILE, 'recovery journal', 'file', 0o600);
    assertCanonicalProtectedPath(parsed.RECOVERY_AUTHORIZATION_FILE, 'recovery authorization', 'file', 0o600);
    assertCanonicalProtectedPath(parsed.PGPASSFILE, 'recovery pgpass', 'file', 0o600);
    assertCanonicalProtectedPath(parsed.BAI_RECOVERY_PSQL_BIN, 'recovery psql', 'file');
    // PostgreSQL commonly owns a group-writable socket directory. Its exact
    // inode/owner/mode and endpoint are authenticated by the recovery receipt.
    assertCanonicalPathType(parsed.PGHOST, 'recovery PostgreSQL socket directory', 'directory');
    const socket = path.join(parsed.PGHOST, `.s.PGSQL.${parsed.PGPORT}`);
    if (!socketProbe(socket)) throw new Error('recovery PostgreSQL socket is unavailable');
    for (const target of [environmentFile, parsed.RECOVERY_JOURNAL_FILE, parsed.RECOVERY_AUTHORIZATION_FILE, parsed.PGPASSFILE, parsed.PGHOST]) if (!mountProbe(target)) throw new Error(`findmnt could not resolve recovery target: ${target}`);
  }
  return Object.freeze({ status: 'PASS', keys: REQUIRED_RECOVERY_ENV_KEYS.length, run_id_path: path.dirname(parsed.RECOVERY_JOURNAL_FILE) });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--lint-template') {
      const values = parseRecoveryEnvironment(fs.readFileSync(process.argv[3], 'utf8'), { allowPlaceholders: true });
      console.log(JSON.stringify({ status: 'PASS', mode: 'TEMPLATE_LINT', keys: Object.keys(values).length }));
    } else {
      const requireLoadedEnvironment = process.argv[2] === '--require-loaded';
      const file = process.argv[requireLoadedEnvironment ? 3 : 2];
      if (!file) throw new Error('usage: validate-rehearsal-recovery-environment.mjs [--require-loaded] <environment-file> | --lint-template <template>');
      console.log(JSON.stringify(validateRecoveryEnvironment({ environmentFile: file, requireLoadedEnvironment })));
    }
  } catch (error) { console.error(JSON.stringify({ status: 'FAIL', reason: error.message })); process.exit(1); }
}
