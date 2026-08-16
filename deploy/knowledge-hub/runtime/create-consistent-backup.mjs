#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkRuntimeLockCandidate } from '../../../scripts/check-knowledge-hub-runtime-lock-candidate.mjs';
import { validateKnowledgeHubRestoreList } from '../../../scripts/validate-knowledge-hub-pg-restore-list.mjs';
import { validateKnowledgeHubSchemaSql } from '../../../scripts/validate-knowledge-hub-schema-sql.mjs';
import { validateBackupSourceAuthorizationConsumption, validateBackupSourceManifest } from '../../../scripts/validate-knowledge-hub-remaining-deployment-gates.mjs';

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
export const SOURCE_FINALIZATION_RESERVE_MS = 5_000;
const MAX_PROBE_TIMEOUT_MS = 30_000;
const MAX_CHILD_TIMEOUT_MS = 24 * 60 * 60 * 1_000;
const CLEANUP_TIMEOUT_MS = 5_000;

function remainingTimeout(deadlineMs, label, clock, maximumMs) {
  const remaining = Number.isFinite(deadlineMs) ? deadlineMs - clock() : maximumMs;
  const timeout = Math.min(remaining, maximumMs);
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error(`${label} authority effect deadline elapsed`);
  return Math.max(1, Math.floor(timeout));
}

export function assertSourceAuthorityWindow(authorityDeadlineMs, boundary, { clock = Date.now, reserveMs = 0 } = {}) {
  if (Number.isFinite(authorityDeadlineMs) && clock() >= authorityDeadlineMs - reserveMs) throw new Error(`backup source authority expired before ${boundary}`);
  return true;
}

function runBoundedProbe(operation, label, deadlineMs, clock = Date.now, maximumMs = MAX_PROBE_TIMEOUT_MS) {
  const timeoutMs = remainingTimeout(deadlineMs, label, clock, maximumMs);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} deadline backstop elapsed`)), timeoutMs);
    Promise.resolve().then(operation).then(
      (value) => { clearTimeout(timer); clock() < deadlineMs || !Number.isFinite(deadlineMs) ? resolve(value) : reject(new Error(`${label} crossed authority effect deadline`)); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}
const fsyncFile = (file) => { const fd = fs.openSync(file, 'r+'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } };
const fsyncDir = (dir) => { const fd = fs.openSync(dir, 'r'); try { fs.fsyncSync(fd); } catch (error) { if (process.platform !== 'win32' || !['EPERM', 'EINVAL'].includes(error.code)) throw error; } finally { fs.closeSync(fd); } };
const writeNew = (file, bytes) => { fs.writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 }); fsyncFile(file); };
const renameNew = (from, to) => { if (fs.existsSync(to)) throw new Error(`destination exists: ${to}`); fs.renameSync(from, to); fsyncFile(to); };
const readStableOrdinaryFile = (file, label) => {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(fd); const bytes = fs.readFileSync(fd); const after = fs.fstatSync(fd);
    if (!before.isFile() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error(`${label} is not a stable ordinary file`);
    return bytes;
  } finally { fs.closeSync(fd); }
};

const assertPrivateDirectory = (directory, label) => {
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(directory) !== path.resolve(directory)) throw new Error(`${label} must be a canonical ordinary directory`);
  if (process.platform === 'win32') return;
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) throw new Error(`${label} owner differs from execution user`);
  if ((stat.mode & 0o077) !== 0) throw new Error(`${label} must not grant group/other permissions`);
  let ancestor = path.dirname(directory);
  while (ancestor !== path.dirname(ancestor)) {
    const ancestorStat = fs.lstatSync(ancestor);
    if (ancestorStat.isSymbolicLink()) throw new Error(`${label} ancestor contains a symlink`);
    const writable = (ancestorStat.mode & 0o022) !== 0;
    const stickyRoot = ancestorStat.uid === 0 && (ancestorStat.mode & 0o1000) !== 0;
    if (writable && !stickyRoot) throw new Error(`${label} ancestor is unprotected`);
    ancestor = path.dirname(ancestor);
  }
};

const assertRootProtectedPath = (target, label) => {
  if (process.platform !== 'linux') return;
  let current = path.resolve(target);
  for (;;) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || stat.uid !== 0 || (stat.mode & 0o022) !== 0) throw new Error(`${label} is not root-protected`);
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
};

const canonicalOrdinaryFile = (file, label) => {
  if (!file || !path.isAbsolute(file)) throw new Error(`${label} must be an absolute path`);
  const resolved = path.resolve(file); const real = fs.realpathSync(file); const stat = fs.lstatSync(file);
  if (resolved !== real || !stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a canonical ordinary file`);
  assertRootProtectedPath(real, label);
  return real;
};

const dependencyTreeSha256 = (root) => {
  const rows = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const file = path.join(dir, entry.name); const relative = path.relative(root, file).split(path.sep).join('/');
      if (entry.isSymbolicLink()) throw new Error(`runtime dependency tree contains symlink: ${relative}`);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) { assertRootProtectedPath(file, 'runtime dependency'); const bytes = fs.readFileSync(file); rows.push(`${relative}\0${bytes.length}\0${sha256(bytes)}`); }
      else throw new Error(`runtime dependency tree contains unsupported entry: ${relative}`);
    }
  };
  visit(root);
  if (rows.length === 0) throw new Error('runtime dependency tree is empty');
  return sha256(Buffer.from(`${rows.join('\n')}\n`, 'utf8'));
};

const PRODUCER_SOURCE_GRAPH = Object.freeze([
  'deploy/knowledge-hub/runtime/create-consistent-backup.mjs',
  'deploy/knowledge-hub/runtime/package.json',
  'deploy/knowledge-hub/runtime/package-lock.json',
  'scripts/check-knowledge-hub-runtime-lock-candidate.mjs',
  'scripts/knowledge-hub-phase0-schema-inventory.mjs',
  'scripts/validate-knowledge-hub-pg-restore-list.mjs',
  'scripts/validate-knowledge-hub-schema-sql.mjs',
  'scripts/validate-knowledge-hub-remaining-deployment-gates.mjs',
  'scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs'
]);

export function collectProducerRuntimeGraphAttestation() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const rows = PRODUCER_SOURCE_GRAPH.map((relative) => {
    const file = path.join(repoRoot, relative); assertRootProtectedPath(file, `producer source graph ${relative}`);
    const bytes = readStableOrdinaryFile(file, `producer source graph ${relative}`);
    return `${relative}\0${bytes.length}\0${sha256(bytes)}`;
  });
  const dependencyRoot = path.join(repoRoot, 'deploy/knowledge-hub/runtime/node_modules');
  if (!fs.lstatSync(dependencyRoot).isDirectory()) throw new Error('runtime dependencies are not materialized');
  assertRootProtectedPath(dependencyRoot, 'runtime dependency tree');
  return Object.freeze({ producer_source_sha256: sha256(Buffer.from(`${rows.join('\n')}\n`, 'utf8')), runtime_dependency_tree_sha256: dependencyTreeSha256(dependencyRoot) });
}

function probeVersion(binary, label, env, deadlineMs, clock) {
  const timeout = remainingTimeout(deadlineMs, `${label} version probe`, clock, MAX_PROBE_TIMEOUT_MS);
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8', windowsHide: true, env, timeout, killSignal: 'SIGKILL' });
  if (version.status !== 0 || !version.stdout?.trim()) throw new Error(`${label} version probe failed`);
  return version.stdout.trim();
}

function collectProducerAttestation({ env, pgDumpBin, pgRestoreBin, ageBin, deadlineMs, clock }) {
  const codeRevision = env.BAI_CODE_REVISION;
  if (!/^[a-f0-9]{40}$/.test(codeRevision ?? '')) throw new Error('BAI_CODE_REVISION must be an exact lowercase Git SHA');
  const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
  const lockFile = path.join(runtimeDir, 'package-lock.json'); const lockBytes = fs.readFileSync(lockFile);
  assertRootProtectedPath(fileURLToPath(import.meta.url), 'backup producer source');
  assertRootProtectedPath(lockFile, 'runtime lock');
  const lockResult = checkRuntimeLockCandidate(JSON.parse(lockBytes));
  if (lockResult.status !== 'PASS') throw new Error(`runtime package lock rejected: ${lockResult.failures.join('; ')}`);
  const runtimeGraph = collectProducerRuntimeGraphAttestation();
  if (env.BAI_PRODUCER_SOURCE_GRAPH_SHA256 !== runtimeGraph.producer_source_sha256 || env.BAI_RUNTIME_DEPENDENCY_TREE_SHA256 !== runtimeGraph.runtime_dependency_tree_sha256) throw new Error('runtime source graph or dependency tree differs from the signed toolchain manifest');
  const nodeBinary = canonicalOrdinaryFile(process.execPath, 'Node binary');
  const dumpBinary = canonicalOrdinaryFile(pgDumpBin, 'pg_dump binary');
  const restoreBinary = canonicalOrdinaryFile(pgRestoreBin, 'pg_restore binary');
  const encryptionBinary = canonicalOrdinaryFile(ageBin, 'age binary');
  const dumpVersion = probeVersion(dumpBinary, 'pg_dump', env, deadlineMs, clock); const restoreVersion = probeVersion(restoreBinary, 'pg_restore', env, deadlineMs, clock); const ageVersion = probeVersion(encryptionBinary, 'age', env, deadlineMs, clock);
  return Object.freeze({
    code_revision: codeRevision,
    producer_source_sha256: runtimeGraph.producer_source_sha256,
    runtime_lock_sha256: sha256(lockBytes),
    runtime_dependency_tree_sha256: runtimeGraph.runtime_dependency_tree_sha256,
    node_binary_sha256: sha256(fs.readFileSync(nodeBinary)),
    node_version_sha256: sha256(Buffer.from(process.version, 'utf8')),
    pg_dump_binary_sha256: sha256(fs.readFileSync(dumpBinary)),
    pg_dump_version_sha256: sha256(Buffer.from(dumpVersion, 'utf8')),
    pg_restore_binary_sha256: sha256(fs.readFileSync(restoreBinary)),
    pg_restore_version_sha256: sha256(Buffer.from(restoreVersion, 'utf8')),
    age_binary_sha256: sha256(fs.readFileSync(encryptionBinary)),
    age_version_sha256: sha256(Buffer.from(ageVersion, 'utf8'))
  });
}

function inspectArchive(dumpFile, env, pgRestoreBin, deadlineMs, clock = Date.now) {
  const toc = spawnSync(pgRestoreBin, ['--list', dumpFile], { encoding: 'buffer', windowsHide: true, env, maxBuffer: 16 * 1024 * 1024, timeout: remainingTimeout(deadlineMs, 'pg_restore list probe', clock, MAX_PROBE_TIMEOUT_MS), killSignal: 'SIGKILL' });
  if (toc.status !== 0) throw new Error(`pg_restore list failed: ${Buffer.from(toc.stderr ?? '').toString('utf8').trim()}`);
  const inventory = validateKnowledgeHubRestoreList(toc.stdout.toString('utf8'));
  const schema = spawnSync(pgRestoreBin, ['--schema-only', '--no-owner', '--no-acl', dumpFile], { encoding: 'buffer', windowsHide: true, env, maxBuffer: 16 * 1024 * 1024, timeout: remainingTimeout(deadlineMs, 'pg_restore schema probe', clock, MAX_PROBE_TIMEOUT_MS), killSignal: 'SIGKILL' });
  if (schema.status !== 0) throw new Error(`pg_restore schema inspection failed: ${Buffer.from(schema.stderr ?? '').toString('utf8').trim()}`);
  const semantics = validateKnowledgeHubSchemaSql(schema.stdout.toString('utf8'));
  return Object.freeze({ archive_toc_sha256: sha256(toc.stdout), schema_sql_sha256: sha256(schema.stdout), schema_semantics_sha256: semantics.schema_semantics_sha256, archive_inventory_entries: inventory.entries });
}

export function runBoundedChild(command, args, env, label, deadlineMs, clock = Date.now) {
  return new Promise((resolve, reject) => {
    let remaining;
    try { remaining = remainingTimeout(deadlineMs, label, clock, MAX_CHILD_TIMEOUT_MS); }
    catch (error) { reject(error); return; }
    const child = spawn(command, args, { env, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    let stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); }, remaining);
    child.stderr.setEncoding('utf8'); child.stderr.on('data', (chunk) => { stderr += chunk; if (stderr.length > 8192) stderr = stderr.slice(-8192); });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code, signal) => { clearTimeout(timer); code === 0 && (clock() < deadlineMs || !Number.isFinite(deadlineMs)) ? resolve() : reject(new Error(`${label} failed or crossed authority deadline code=${code} signal=${signal ?? 'none'}: ${stderr.trim()}`)); });
  });
}

function runPgDump(args, env, command, deadlineMs, clock) { return runBoundedChild(command, args, env, 'pg_dump', deadlineMs, clock); }

function runAgeEncrypt(input, output, recipient, env, command, deadlineMs, clock) { return runBoundedChild(command, ['--recipient', recipient, '--output', output, input], env, 'age encryption', deadlineMs, clock); }

export async function createConsistentKnowledgeHubBackup({ backupDir, env = process.env, now = new Date(), clock = Date.now, failpoint = () => {}, clientFactory, runDump = runPgDump, archiveInspector = inspectArchive, encryptBackup = runAgeEncrypt, producerAttestation, pgDumpBin = env.BAI_PG_DUMP_BIN, pgRestoreBin = env.BAI_PG_RESTORE_BIN, ageBin = env.BAI_AGE_BIN, plaintextDir = env.BAI_BACKUP_PLAINTEXT_TMPFS_ROOT }) {
  const required = ['PGHOST', 'PGDATABASE', 'PGUSER', 'BAI_SOURCE_AUTHORITY_RECEIPT_SHA256', 'BAI_SOURCE_AUTHORITY_CONSUMPTION_SHA256', 'BAI_AUTHORIZED_SOURCE_CLUSTER_SHA256'];
  if (!producerAttestation) required.push('BAI_AUTHORITY_EXPIRES_AT', 'BAI_SOURCE_AUTHORITY_RECEIPT_FILE', 'BAI_SOURCE_AUTHORITY_CONSUMPTION_FILE', 'BAI_AUTHORITY_TRUST_ROOT_FILE', 'BAI_AUTHORITY_REVOCATIONS_FILE', 'BAI_AUTHORITY_HEAD_FILE', 'BAI_PRODUCER_SOURCE_GRAPH_SHA256', 'BAI_RUNTIME_DEPENDENCY_TREE_SHA256');
  for (const name of required) if (!env[name]) throw new Error(`${name} required`);
  const authorityDeadlineMs = env.BAI_AUTHORITY_EXPIRES_AT ? Date.parse(env.BAI_AUTHORITY_EXPIRES_AT) : Number.POSITIVE_INFINITY;
  if (env.BAI_AUTHORITY_EXPIRES_AT && !Number.isFinite(authorityDeadlineMs)) throw new Error('backup source authority expiry invalid');
  const effectDeadlineMs = Number.isFinite(authorityDeadlineMs) ? authorityDeadlineMs - SOURCE_FINALIZATION_RESERVE_MS : authorityDeadlineMs;
  const assertAuthorityFresh = (boundary) => assertSourceAuthorityWindow(authorityDeadlineMs, boundary, { clock });
  const assertEffectWindow = (boundary) => assertSourceAuthorityWindow(authorityDeadlineMs, boundary, { clock, reserveMs: SOURCE_FINALIZATION_RESERVE_MS });
  assertEffectWindow('run reservation');
  assertPrivateDirectory(backupDir, 'BACKUP_DIR');
  assertPrivateDirectory(plaintextDir, 'plaintext staging root');
  if (!(clientFactory && encryptBackup !== runAgeEncrypt) && process.platform === 'linux' && fs.statfsSync(plaintextDir).type !== 0x01021994) throw new Error('plaintext staging root must be tmpfs');
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const runDir = fs.mkdtempSync(path.join(backupDir, `knowledge-hub-${stamp}-`));
  fs.chmodSync(runDir, 0o700);
  fsyncDir(backupDir);
  const runDirIdentity = fs.lstatSync(runDir);
  if (!producerAttestation) {
    const artifacts = [
      ['BAI_SOURCE_AUTHORITY_RECEIPT_FILE', 'SOURCE-AUTHORIZATION.json', env.BAI_SOURCE_AUTHORITY_RECEIPT_SHA256],
      ['BAI_SOURCE_AUTHORITY_CONSUMPTION_FILE', 'SOURCE-AUTHORIZATION-CONSUMPTION.json', env.BAI_SOURCE_AUTHORITY_CONSUMPTION_SHA256],
      ['BAI_AUTHORITY_TRUST_ROOT_FILE', 'SOURCE-AUTHORITY-TRUST-ROOT.json'],
      ['BAI_AUTHORITY_REVOCATIONS_FILE', 'SOURCE-AUTHORITY-REVOCATIONS.json'],
      ['BAI_AUTHORITY_HEAD_FILE', 'SOURCE-AUTHORITY-HEAD.json']
    ];
    for (const [envName, name, expectedSha] of artifacts) {
      const bytes = readStableOrdinaryFile(env[envName], name);
      if (expectedSha && sha256(bytes) !== expectedSha) throw new Error(`${name} differs from verified authority artifact hash`);
      writeNew(path.join(runDir, name), bytes);
    }
    const consumption = validateBackupSourceAuthorizationConsumption(JSON.parse(fs.readFileSync(path.join(runDir, 'SOURCE-AUTHORIZATION-CONSUMPTION.json'), 'utf8')));
    if (consumption.authority_receipt_sha256 !== env.BAI_SOURCE_AUTHORITY_RECEIPT_SHA256 || consumption.effect_deadline_at !== env.BAI_AUTHORITY_EXPIRES_AT) throw new Error('source authorization consumption binding mismatch');
    fsyncDir(runDir);
  }
  const plaintextRunDir = fs.mkdtempSync(path.join(plaintextDir, 'bai-hub-source-'));
  fs.chmodSync(plaintextRunDir, 0o700);
  const dumpTmp = path.join(plaintextRunDir, 'knowledge-hub.dump');
  if (fs.existsSync(dumpTmp)) throw new Error('plaintext staging destination exists');
  const plaintextRecoveryFile = path.join(runDir, 'PLAINTEXT-RECOVERY.json');
  const plaintextClosedFile = path.join(runDir, 'PLAINTEXT-RECOVERY-CLOSED.json');
  const plaintextQuarantineFile = path.join(runDir, 'PLAINTEXT-RECOVERY-QUARANTINED.json');
  writeNew(plaintextRecoveryFile, `${JSON.stringify({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_PLAINTEXT_STAGING_RESERVED', run_id: path.basename(runDir), plaintext_staging_path: dumpTmp, plaintext_staging_path_sha256: sha256(Buffer.from(dumpTmp, 'utf8')), created_at: now.toISOString() })}\n`);
  fsyncDir(runDir);
  const backupTmp = path.join(runDir, 'knowledge-hub.dump.age.incomplete');
  const backupFile = path.join(runDir, 'knowledge-hub.dump.age');
  const sidecarTmp = `${backupFile}.sha256.incomplete`;
  const sidecarFile = `${backupFile}.sha256`;
  const manifestTmp = `${backupFile}.manifest.json.incomplete`;
  const manifestFile = `${backupFile}.manifest.json`;
  const markerTmp = path.join(runDir, 'COMMITTED.json.incomplete');
  const markerFile = path.join(runDir, 'COMMITTED.json');
  const attestation = producerAttestation ?? collectProducerAttestation({ env, pgDumpBin, pgRestoreBin, ageBin, deadlineMs: effectDeadlineMs, clock });
  const Factory = clientFactory ?? (await import('pg')).default.Client;
  const client = new Factory({ host: env.PGHOST, port: Number(env.PGPORT ?? 5432), database: env.PGDATABASE, user: env.PGUSER, password: env.PGPASSWORD });
  let transactionOpen = false;
  try {
    assertEffectWindow('database connection');
    await runBoundedProbe(() => client.connect(), 'database connection', effectDeadlineMs, clock);
    await runBoundedProbe(() => client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY'), 'read-only transaction begin', effectDeadlineMs, clock); transactionOpen = true;
    const snapshotResult = await runBoundedProbe(() => client.query('SELECT pg_export_snapshot() AS snapshot_id'), 'snapshot export probe', effectDeadlineMs, clock);
    const snapshotId = snapshotResult.rows[0]?.snapshot_id;
    if (!/^[A-Za-z0-9:-]{1,128}$/.test(snapshotId)) throw new Error('exported snapshot identifier invalid');
    const stateResult = await runBoundedProbe(() => client.query(`SELECT
      (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier,
      (SELECT count(*)::text FROM evidence_events) AS evidence_events,
      (SELECT count(*)::text FROM delivery_receipts) AS delivery_receipts,
      (SELECT count(*)::text FROM client_policies) AS client_policies,
      (SELECT count(*)::text FROM api_credentials) AS api_credentials,
      (SELECT count(*)::text FROM schema_migrations) AS schema_migrations,
      (SELECT coalesce(string_agg(migration_name || ':' || checksum, ',' ORDER BY migration_name), '') FROM schema_migrations) AS migration_set`), 'source state probe', effectDeadlineMs, clock);
    const state = stateResult.rows[0];
    const sourceClusterSha256 = sha256(Buffer.from(state.system_identifier, 'utf8'));
    if (sourceClusterSha256 !== env.BAI_AUTHORIZED_SOURCE_CLUSTER_SHA256) throw new Error('source cluster differs from signed backup authority');
    const counts = Object.fromEntries(['evidence_events', 'delivery_receipts', 'client_policies', 'api_credentials', 'schema_migrations'].map((name) => {
      const count = Number(state[name]); if (!Number.isSafeInteger(count) || count < 0) throw new Error(`${name} count invalid`); return [name, count];
    }));
    assertEffectWindow('pg_dump start');
    await runDump([
      `--host=${env.PGHOST}`, `--port=${env.PGPORT ?? 5432}`, `--username=${env.PGUSER}`, `--dbname=${env.PGDATABASE}`,
      '--format=custom', '--no-owner', '--no-acl', `--snapshot=${snapshotId}`, `--file=${dumpTmp}`
    ], { ...env, PGPASSWORD: env.PGPASSWORD ?? '' }, pgDumpBin, effectDeadlineMs, clock);
    assertEffectWindow('pg_dump completion');
    if (!fs.lstatSync(dumpTmp).isFile() || fs.lstatSync(dumpTmp).isSymbolicLink()) throw new Error('pg_dump output invalid');
    const dumpBytes = fs.readFileSync(dumpTmp);
    const dumpSha = sha256(dumpBytes);
    const archive = archiveInspector(dumpTmp, env, pgRestoreBin, effectDeadlineMs, clock);
    if (!/^[a-f0-9]{64}$/.test(archive.archive_toc_sha256) || !/^[a-f0-9]{64}$/.test(archive.schema_sql_sha256) || !/^[a-f0-9]{64}$/.test(archive.schema_semantics_sha256) || archive.archive_inventory_entries !== 30) throw new Error('archive inspection digest, semantics or exact inventory invalid');
    const recipient = env.AGE_RECIPIENT;
    if (typeof recipient !== 'string' || recipient.length < 8 || recipient.length > 1024) throw new Error('AGE_RECIPIENT required');
    assertEffectWindow('encryption start');
    await encryptBackup(dumpTmp, backupTmp, recipient, env, ageBin, effectDeadlineMs, clock);
    assertEffectWindow('encryption completion');
    const backupStat = fs.lstatSync(backupTmp);
    if (!backupStat.isFile() || backupStat.isSymbolicLink() || backupStat.size < 1) throw new Error('encrypted backup output invalid');
    const backupBytes = fs.readFileSync(backupTmp); const backupSha = sha256(backupBytes);
    if (backupSha === dumpSha) throw new Error('encrypted backup equals plaintext');
    fs.rmSync(dumpTmp); fsyncDir(plaintextRunDir);
    fs.rmdirSync(plaintextRunDir); fsyncDir(plaintextDir);
    const manifest = validateBackupSourceManifest({
      schema_version: '1.0', result: 'KNOWLEDGE_HUB_BACKUP_SOURCE_MANIFEST', source_authorization: { receipt_sha256: env.BAI_SOURCE_AUTHORITY_RECEIPT_SHA256, consumption_receipt_sha256: env.BAI_SOURCE_AUTHORITY_CONSUMPTION_SHA256 }, backup_plaintext_sha256: dumpSha, backup_plaintext_bytes: dumpBytes.length, backup_ciphertext_sha256: backupSha, backup_ciphertext_bytes: backupBytes.length, encryption: { format: 'age-v1', recipient_fingerprint_sha256: sha256(Buffer.from(recipient, 'utf8')), plaintext_persisted: false }, archive_toc_sha256: archive.archive_toc_sha256, schema_sql_sha256: archive.schema_sql_sha256, schema_semantics_sha256: archive.schema_semantics_sha256,
      source_cluster_identifier_sha256: sourceClusterSha256,
      source_exported_snapshot_sha256: sha256(Buffer.from(snapshotId, 'utf8')),
      table_counts: counts, migration_set_sha256: sha256(Buffer.from(state.migration_set, 'utf8')), producer: attestation, created_at: now.toISOString().replace(/\.\d{3}Z$/, 'Z')
    });
    // Close the exported snapshot before publishing any final-looking file. A
    // rollback failure therefore leaves only the quarantined .incomplete dump.
    await runBoundedProbe(() => client.query('ROLLBACK'), 'read-only transaction rollback', effectDeadlineMs, clock); transactionOpen = false;
    assertAuthorityFresh('final artifact publication');
    writeNew(sidecarTmp, `${backupSha}  ${path.basename(backupFile)}\n`);
    writeNew(manifestTmp, `${JSON.stringify(manifest)}\n`);
    fsyncFile(backupTmp);
    renameNew(backupTmp, backupFile); renameNew(sidecarTmp, sidecarFile); renameNew(manifestTmp, manifestFile); fsyncDir(runDir);
    const manifestBytes = fs.readFileSync(manifestFile);
    failpoint('after-source-final-artifacts-fsync');
    assertAuthorityFresh('source commit staging');
    const committedAt = env.BAI_AUTHORITY_EXPIRES_AT ? new Date(clock()).toISOString().replace(/\.\d{3}Z$/, 'Z') : manifest.created_at;
    writeNew(markerTmp, `${JSON.stringify({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_BACKUP_SOURCE_COMMITTED', backup_plaintext_sha256: dumpSha, backup_ciphertext_sha256: backupSha, source_manifest_sha256: sha256(manifestBytes), committed_at: committedAt })}\n`);
    failpoint('after-source-marker-temp-fsync');
    assertAuthorityFresh('source commit publication');
    try {
      renameNew(markerTmp, markerFile); fsyncDir(runDir);
      const finalRunDirIdentity = fs.lstatSync(runDir);
      if (process.platform === 'linux' && (runDirIdentity.dev !== finalRunDirIdentity.dev || runDirIdentity.ino !== finalRunDirIdentity.ino || finalRunDirIdentity.uid !== runDirIdentity.uid || (finalRunDirIdentity.mode & 0o077) !== 0)) throw new Error('BACKUP_DIR run directory identity changed');
      fsyncDir(backupDir);
      failpoint('after-source-marker-publication-fsync');
      assertAuthorityFresh('source commit durable completion');
    } catch (error) {
      if (fs.existsSync(markerFile)) {
        const quarantineFile = path.join(runDir, 'COMMITTED.expired-or-incomplete-quarantine.json');
        if (fs.existsSync(quarantineFile)) throw new Error(`source commit publication failed and quarantine destination exists: ${error.message}`);
        fs.renameSync(markerFile, quarantineFile); fsyncFile(quarantineFile); fsyncDir(runDir); fsyncDir(backupDir);
      }
      throw error;
    }
    return Object.freeze({ runDir, backupFile, manifestFile, markerFile, snapshotId });
  } finally {
    if (transactionOpen) { try { await runBoundedProbe(() => client.query('ROLLBACK'), 'cleanup rollback', clock() + CLEANUP_TIMEOUT_MS, clock, CLEANUP_TIMEOUT_MS); } catch {} }
    await runBoundedProbe(() => client.end(), 'database client cleanup', clock() + CLEANUP_TIMEOUT_MS, clock, CLEANUP_TIMEOUT_MS).catch(() => {});
    if (fs.existsSync(dumpTmp)) { try { fs.rmSync(dumpTmp); fsyncDir(plaintextRunDir); } catch {} }
    if (fs.existsSync(plaintextRunDir)) { try { fs.rmdirSync(plaintextRunDir); fsyncDir(plaintextDir); } catch {} }
    const plaintextAbsent = !fs.existsSync(dumpTmp) && !fs.existsSync(plaintextRunDir);
    if (!fs.existsSync(plaintextClosedFile) && !fs.existsSync(plaintextQuarantineFile)) {
      const terminalFile = plaintextAbsent ? plaintextClosedFile : plaintextQuarantineFile;
      const terminalResult = plaintextAbsent ? 'KNOWLEDGE_HUB_PLAINTEXT_STAGING_CLEANED' : 'KNOWLEDGE_HUB_PLAINTEXT_STAGING_QUARANTINED';
      try {
        writeNew(terminalFile, `${JSON.stringify({ schema_version: '1.0', result: terminalResult, run_id: path.basename(runDir), reservation_sha256: sha256(fs.readFileSync(plaintextRecoveryFile)), plaintext_staging_path: dumpTmp, plaintext_absent: plaintextAbsent, completed_at: new Date().toISOString() })}\n`);
        if (plaintextAbsent) fs.rmSync(plaintextRecoveryFile);
        fsyncDir(runDir);
      } catch (error) {
        if (plaintextAbsent) throw error;
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === 'attest') {
      console.log(JSON.stringify(collectProducerRuntimeGraphAttestation()));
      process.exit(0);
    }
    const result = await createConsistentKnowledgeHubBackup({ backupDir: process.argv[2] });
    console.log(result.backupFile);
  } catch (error) {
    console.error(`KNOWLEDGE_HUB_BACKUP_FAIL: ${error.message}`);
    process.exit(1);
  }
}
