#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appendCanonicalRecoveredJournal, inspectRecoveryJournal } from './write-knowledge-hub-rehearsal-recovery-journal.mjs';
import { verifyCanonicalRehearsalRecoveryAuthorization } from './verify-knowledge-hub-rehearsal-target-authorization.mjs';

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const MAX_RECOVERY_PROBE_MS = 30_000;
const RECOVERY_FINALIZATION_RESERVE_MS = 5_000;

export function recoveryProbeTimeoutMs(expiresAt, now = Date.now()) {
  const deadline = Date.parse(expiresAt ?? '');
  const remaining = deadline - now - RECOVERY_FINALIZATION_RESERVE_MS;
  if (!Number.isFinite(deadline) || remaining <= 0) throw new Error('recovery authority effect deadline elapsed');
  return Math.min(MAX_RECOVERY_PROBE_MS, remaining);
}
const protectedFile = (file, label) => {
  const resolved = path.resolve(file); const real = fs.realpathSync(file); const stat = fs.lstatSync(file);
  if (resolved !== real || !stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a canonical ordinary file`);
  if (process.platform === 'linux') { let current = real; for (;;) { const item = fs.lstatSync(current); if (item.isSymbolicLink() || item.uid !== 0 || (item.mode & 0o022) !== 0) throw new Error(`${label} path is not root-protected`); const parent = path.dirname(current); if (parent === current) break; current = parent; } }
  return real;
};
const readProtectedFile = (file, label) => {
  const real = protectedFile(file, label);
  const fd = fs.openSync(real, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(fd); const bytes = fs.readFileSync(fd); const after = fs.fstatSync(fd);
    if (!before.isFile() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error(`${label} changed during protected read`);
    return bytes;
  } finally { fs.closeSync(fd); }
};
const socketIdentity = (directory, port) => {
  const socket = path.join(directory, `.s.PGSQL.${port}`); const dir = fs.lstatSync(directory); const endpoint = fs.lstatSync(socket);
  if (!dir.isDirectory() || dir.isSymbolicLink() || !endpoint.isSocket() || endpoint.isSymbolicLink()) throw new Error('PostgreSQL recovery socket invalid');
  const row = (label, stat) => `${label}:${stat.dev}:${stat.ino}:${stat.uid}:${stat.gid}:${(stat.mode & 0o7777).toString(8)}`;
  return sha256(Buffer.from(`${row('dir', dir)}\n${row('socket', endpoint)}\n`, 'utf8'));
};

export function runCanonicalRehearsalRecovery({ journalFile, authorizationFile, psqlBinary, pgHost, pgPort = '5432', pgAdminUser, maintenanceDatabase, pgPassFile, now = () => Date.now(), spawn = spawnSync }) {
  if (process.platform === 'linux' && process.getuid?.() !== 0) throw new Error('recovery requires the privileged recovery executor');
  const authorizationBytes = readProtectedFile(authorizationFile, 'recovery authorization');
  const verified = verifyCanonicalRehearsalRecoveryAuthorization({ receiptBytes: authorizationBytes, now: now() });
  const receipt = verified.receipt; const journal = inspectRecoveryJournal(protectedFile(journalFile, 'recovery journal'));
  if (!journal.requires_recovery || ['BUNDLE_COMMITTED', 'RECOVERED', 'QUARANTINED'].includes(journal.terminal.phase)) throw new Error('recovery journal is not recoverable');
  const binary = protectedFile(psqlBinary, 'psql binary'); if (sha256(readProtectedFile(binary, 'psql binary')) !== receipt.psql_binary_sha256) throw new Error('recovery psql binary differs from authority');
  const currentSocketSha = socketIdentity(pgHost, pgPort); if (currentSocketSha !== receipt.postgres_socket_identity_sha256) throw new Error('recovery PostgreSQL socket differs from authority');
  if (journal.terminal.temporary_plaintext_path && fs.existsSync(journal.terminal.temporary_plaintext_path)) throw new Error('temporary plaintext still exists');
  const timeout = recoveryProbeTimeoutMs(receipt.expires_at, now());
  const env = { PATH: '/usr/sbin:/usr/bin:/sbin:/bin', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8', PGPASSFILE: protectedFile(pgPassFile, 'recovery pgpass'), PGCONNECT_TIMEOUT: '5', PGOPTIONS: '-c statement_timeout=5000 -c lock_timeout=5000' };
  const query = `SELECT (SELECT system_identifier::text FROM pg_control_system()) || '|' || (SELECT count(*)::text FROM pg_database WHERE datname='${receipt.restore_database}')`;
  const probe = spawn(binary, [`--host=${pgHost}`, `--port=${pgPort}`, `--username=${pgAdminUser}`, `--dbname=${maintenanceDatabase}`, '--tuples-only', '--no-align', `--command=${query}`], { encoding: 'utf8', env, windowsHide: true, timeout, killSignal: 'SIGKILL' });
  if (probe.status !== 0) throw new Error('recovery PostgreSQL live probe failed');
  const [systemIdentifier, databaseCount] = probe.stdout.trim().split('|');
  if (sha256(Buffer.from(systemIdentifier ?? '', 'utf8')) !== receipt.target_cluster_identifier_sha256 || databaseCount !== '0') throw new Error('recovery target database or cluster is not safely absent');
  const finalNow = now(); recoveryProbeTimeoutMs(receipt.expires_at, finalNow);
  const currentAuthorizationBytes = readProtectedFile(authorizationFile, 'recovery authorization');
  if (!authorizationBytes.equals(currentAuthorizationBytes)) throw new Error('recovery authorization changed during live probe');
  const finalVerified = verifyCanonicalRehearsalRecoveryAuthorization({ receiptBytes: currentAuthorizationBytes, now: finalNow });
  const finalPsqlSha = sha256(readProtectedFile(binary, 'psql binary'));
  const finalSocketSha = socketIdentity(pgHost, pgPort);
  if (finalVerified.receipt_sha256 !== verified.receipt_sha256 || finalPsqlSha !== receipt.psql_binary_sha256 || finalSocketSha !== receipt.postgres_socket_identity_sha256) throw new Error('recovery authority, psql or socket changed before seal');
  if (journal.terminal.temporary_plaintext_path && fs.existsSync(journal.terminal.temporary_plaintext_path)) throw new Error('temporary plaintext reappeared before seal');
  const entry = appendCanonicalRecoveredJournal(journalFile, finalVerified, { database_absent: true, temporary_plaintext_absent: true, target_cluster_identifier_sha256: receipt.target_cluster_identifier_sha256, postgres_socket_identity_sha256: finalSocketSha, psql_binary_sha256: finalPsqlSha }, new Date(finalNow).toISOString());
  return Object.freeze({ status: 'PASS', phase: entry.phase, entry_sha256: entry.entry_sha256 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [journalFile, authorizationFile] = process.argv.slice(2);
    if (!journalFile || !authorizationFile) throw new Error('usage: recover <journal> <recovery-authorization> with root-owned PG environment');
    const result = runCanonicalRehearsalRecovery({ journalFile, authorizationFile, psqlBinary: process.env.BAI_RECOVERY_PSQL_BIN, pgHost: process.env.PGHOST, pgPort: process.env.PGPORT ?? '5432', pgAdminUser: process.env.PGADMINUSER, maintenanceDatabase: process.env.PGDATABASE, pgPassFile: process.env.PGPASSFILE });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(JSON.stringify({ status: 'FAIL', reason: error.message }, null, 2)); process.exit(1); }
}
