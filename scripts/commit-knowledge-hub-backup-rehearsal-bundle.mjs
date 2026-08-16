#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBackupRestoreEvidence, validateBackupSourceManifest } from './validate-knowledge-hub-remaining-deployment-gates.mjs';
import { isCanonicalVerifiedRehearsalTargetAuthorization, verifyCanonicalRehearsalTargetAuthorization } from './verify-knowledge-hub-rehearsal-target-authorization.mjs';
import { appendRecoveryJournal, inspectRecoveryJournal } from './write-knowledge-hub-rehearsal-recovery-journal.mjs';

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const CANONICAL_REHEARSAL_ROOT = '/var/lib/bai-development-os/knowledge-hub/rehearsals';
const CANONICAL_AUTHORIZATION_CONSUMPTION_ROOT = '/var/lib/bai-development-os/knowledge-hub/authority-consumption';
const canonicalPostEffectCompletions = new WeakSet();
const validUtc = (value) => {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, fraction = '0'] = match;
  const timestamp = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, +fraction.padEnd(3, '0'));
  const date = new Date(timestamp);
  return Number.isFinite(timestamp) && date.getUTCFullYear() === +year && date.getUTCMonth() === +month - 1 && date.getUTCDate() === +day && date.getUTCHours() === +hour && date.getUTCMinutes() === +minute && date.getUTCSeconds() === +second && date.getUTCMilliseconds() === +fraction.padEnd(3, '0');
};
const exactKeys = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('\n') !== [...keys].sort().join('\n')) throw new Error(`${label} fields invalid`);
};
const readOrdinaryFile = (file) => {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(fd); const bytes = fs.readFileSync(fd); const after = fs.fstatSync(fd);
    if (!before.isFile() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('bundle constituent is not a stable ordinary file');
    return bytes;
  } finally { fs.closeSync(fd); }
};
const readJson = (file) => JSON.parse(readOrdinaryFile(file).toString('utf8'));
const syncFile = (file) => { const fd = fs.openSync(file, 'r+'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } };
const syncDir = (dir) => {
  const fd = fs.openSync(dir, 'r');
  try { fs.fsyncSync(fd); }
  catch (error) { if (process.platform !== 'win32' || !['EPERM', 'EINVAL'].includes(error.code)) throw error; }
  finally { fs.closeSync(fd); }
};
const validateRunDir = (runDir) => {
  const stat = fs.lstatSync(runDir);
  if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(runDir) !== path.resolve(runDir)) throw new Error('run directory containment invalid');
};
const requireRootProtectedPath = (target, label) => {
  if (process.platform !== 'linux') return;
  let current = path.resolve(target);
  for (;;) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || stat.uid !== 0 || (stat.mode & 0o022) !== 0) throw new Error(`${label} path is not root-protected`);
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
};
const directoryIdentitySha256 = (directory) => {
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('canonical authorization consumption ledger is not an ordinary directory');
  return sha256(Buffer.from(`${stat.dev}:${stat.ino}:${stat.uid}:${stat.gid}:${(stat.mode & 0o7777).toString(8)}\n`, 'utf8'));
};
const requirePrivilegedExecutor = () => {
  if (process.platform === 'linux' && (typeof process.getuid !== 'function' || process.getuid() !== 0)) throw new Error('bundle commit requires the privileged rehearsal executor');
};
const requireExecutionJournal = (runDir, evidence, allowedPhases) => {
  const journal = inspectRecoveryJournal(path.join(runDir, 'recovery-journal.jsonl'));
  const terminal = journal.terminal;
  if (!allowedPhases.includes(terminal.phase) || terminal.run_id !== evidence.provenance.run_id || terminal.restore_database !== evidence.restore.database || terminal.target_cluster_identifier_sha256 !== evidence.target.cluster_system_identifier_sha256 || terminal.database_created || !terminal.database_dropped || !terminal.temporary_plaintext_deleted) throw new Error('canonical execution recovery journal is not at the required safe phase');
  return journal;
};
const validateConsumption = (bytes) => {
  const value = JSON.parse(Buffer.from(bytes).toString('utf8'));
  exactKeys(value, ['schema_version', 'result', 'run_id', 'authority_receipt_sha256', 'execution_nonce_sha256'], 'authorization consumption receipt');
  if (value.schema_version !== '1.0' || value.result !== 'REHEARSAL_AUTHORIZATION_CONSUMED' || !/^[A-Za-z0-9._-]{1,64}$/.test(value.run_id) || !/^[a-f0-9]{64}$/.test(value.authority_receipt_sha256) || !/^[a-f0-9]{64}$/.test(value.execution_nonce_sha256)) throw new Error('authorization consumption receipt invalid');
  return value;
};

export function validateCanonicalConsumptionLedgerBinding({ canonicalConsumptionBytes, embeddedConsumptionBytes, verifiedAuthority, canonicalDirectoryIdentitySha256 }) {
  if (!isCanonicalVerifiedRehearsalTargetAuthorization(verifiedAuthority)) throw new Error('canonical verified authority is required for consumption ledger binding');
  const canonicalConsumption = validateConsumption(canonicalConsumptionBytes);
  const embeddedConsumption = validateConsumption(embeddedConsumptionBytes);
  if (!Buffer.from(canonicalConsumptionBytes).equals(Buffer.from(embeddedConsumptionBytes))) throw new Error('embedded authorization consumption differs from canonical ledger bytes');
  if (canonicalDirectoryIdentitySha256 !== verifiedAuthority.receipt.consumption_ledger_directory_sha256) throw new Error('canonical authorization consumption ledger identity mismatch');
  for (const value of [canonicalConsumption, embeddedConsumption]) {
    if (value.run_id !== verifiedAuthority.receipt.run_id || value.authority_receipt_sha256 !== verifiedAuthority.receipt_sha256 || value.execution_nonce_sha256 !== verifiedAuthority.receipt.execution_nonce_sha256) throw new Error('canonical authorization consumption coordinate mismatch');
  }
  return Object.freeze({ consumption_sha256: sha256(canonicalConsumptionBytes), execution_nonce_sha256: canonicalConsumption.execution_nonce_sha256 });
}

export function validatePostEffectCompletion({ completionBytes, evidenceBytes, journalEntries, verifiedAuthority }) {
  if (!isCanonicalVerifiedRehearsalTargetAuthorization(verifiedAuthority)) throw new Error('canonical verified authority is required for post-effect completion');
  const value = JSON.parse(Buffer.from(completionBytes).toString('utf8'));
  exactKeys(value, ['schema_version', 'result', 'run_id', 'authority_receipt_sha256', 'execution_nonce_sha256', 'evidence_sha256', 'recovery_journal_safe_entry_sha256', 'database_absent', 'temporary_plaintext_absent', 'completed_at'], 'post-effect completion');
  if (value.schema_version !== '1.0' || value.result !== 'REHEARSAL_POST_EFFECT_COMPLETED' || value.database_absent !== true || value.temporary_plaintext_absent !== true || !validUtc(value.completed_at)) throw new Error('post-effect completion boundary invalid');
  if (value.run_id !== verifiedAuthority.receipt.run_id || value.authority_receipt_sha256 !== verifiedAuthority.receipt_sha256 || value.execution_nonce_sha256 !== verifiedAuthority.receipt.execution_nonce_sha256 || value.evidence_sha256 !== sha256(evidenceBytes)) throw new Error('post-effect completion authority or Evidence binding mismatch');
  if (Date.parse(value.completed_at) >= Date.parse(verifiedAuthority.receipt.expires_at)) throw new Error('post-effect completion crossed the authority deadline');
  const safeEntry = journalEntries.find((entry) => entry.entry_sha256 === value.recovery_journal_safe_entry_sha256);
  if (!safeEntry || safeEntry.phase !== 'PLAINTEXT_DELETED' || safeEntry.database_created || !safeEntry.database_dropped || !safeEntry.temporary_plaintext_deleted) throw new Error('post-effect completion does not bind the safe recovery journal entry');
  return Object.freeze({ value: Object.freeze({ ...value }), completion_sha256: sha256(completionBytes) });
}

function mintCanonicalPostEffectCompletion(runDir, verifiedAuthority, evidence, allowedJournalPhases) {
  if (!isCanonicalVerifiedRehearsalTargetAuthorization(verifiedAuthority)) throw new Error('canonical verified authority is required');
  requirePrivilegedExecutor();
  const expectedRunDir = path.join(CANONICAL_REHEARSAL_ROOT, verifiedAuthority.receipt.run_id);
  if (process.platform === 'linux' && path.resolve(runDir) !== expectedRunDir) throw new Error('run directory is not the authorization-bound canonical rehearsal directory');
  validateRunDir(runDir); requireRootProtectedPath(runDir, 'rehearsal run directory');
  if (process.platform !== 'linux') throw new Error('canonical post-effect completion requires the Linux rehearsal executor');
  requireRootProtectedPath(CANONICAL_AUTHORIZATION_CONSUMPTION_ROOT, 'authorization consumption ledger');
  const ledgerDirectoryIdentity = directoryIdentitySha256(CANONICAL_AUTHORIZATION_CONSUMPTION_ROOT);
  const canonicalConsumptionFile = path.join(CANONICAL_AUTHORIZATION_CONSUMPTION_ROOT, `${verifiedAuthority.receipt.execution_nonce_sha256}.json`);
  requireRootProtectedPath(canonicalConsumptionFile, 'authorization consumption receipt');
  const canonicalConsumptionBytes = readOrdinaryFile(canonicalConsumptionFile);
  const embeddedConsumptionBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'authorization-consumption.json'));
  const ledger = validateCanonicalConsumptionLedgerBinding({ canonicalConsumptionBytes, embeddedConsumptionBytes, verifiedAuthority, canonicalDirectoryIdentitySha256: ledgerDirectoryIdentity });
  const journal = requireExecutionJournal(runDir, evidence, allowedJournalPhases);
  const canonicalCompletionFile = path.join(CANONICAL_AUTHORIZATION_CONSUMPTION_ROOT, `${verifiedAuthority.receipt.execution_nonce_sha256}.post-effect.json`);
  requireRootProtectedPath(canonicalCompletionFile, 'post-effect completion receipt');
  const canonicalCompletionBytes = readOrdinaryFile(canonicalCompletionFile);
  const embeddedCompletionBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'post-effect-completion.json'));
  if (!canonicalCompletionBytes.equals(embeddedCompletionBytes)) throw new Error('embedded post-effect completion differs from canonical ledger bytes');
  const evidenceFile = fs.existsSync(path.join(runDir, 'evidence.json')) ? path.join(runDir, 'evidence.json') : path.join(runDir, 'evidence.json.incomplete');
  const evidenceBytes = readOrdinaryFile(evidenceFile);
  const journalEntries = readOrdinaryFile(path.join(runDir, 'recovery-journal.jsonl')).toString('utf8').trimEnd().split('\n').map((line) => JSON.parse(line));
  const postEffect = validatePostEffectCompletion({ completionBytes: canonicalCompletionBytes, evidenceBytes, journalEntries, verifiedAuthority });
  const completion = Object.freeze({ run_id: evidence.provenance.run_id, consumption_sha256: ledger.consumption_sha256, post_effect_completion_sha256: postEffect.completion_sha256, journal_terminal_sha256: journal.terminal.entry_sha256 });
  canonicalPostEffectCompletions.add(completion);
  return completion;
}

const requireCanonicalPostEffectCompletion = (completion) => {
  if (!completion || !canonicalPostEffectCompletions.has(completion)) throw new Error('canonical post-effect completion is required');
};

export function validateBackupSourceArtifactSet({ cipherBytes, sidecarBytes, commitBytes, sourceManifestBytes }) {
  const source = validateBackupSourceManifest(JSON.parse(Buffer.from(sourceManifestBytes).toString('utf8')));
  const sidecarMatch = Buffer.from(sidecarBytes).toString('utf8').match(/^([a-f0-9]{64})  ([A-Za-z0-9._-]+\.dump\.age)\n$/);
  const sourceCommit = JSON.parse(Buffer.from(commitBytes).toString('utf8'));
  exactKeys(sourceCommit, ['schema_version', 'result', 'backup_plaintext_sha256', 'backup_ciphertext_sha256', 'source_manifest_sha256', 'committed_at'], 'source commit marker');
  if (!sidecarMatch || sidecarMatch[1] !== source.backup_ciphertext_sha256 || sha256(cipherBytes) !== source.backup_ciphertext_sha256 || cipherBytes.length !== source.backup_ciphertext_bytes) throw new Error('source sidecar or ciphertext invalid');
  if (sourceCommit.schema_version !== '1.0' || sourceCommit.result !== 'KNOWLEDGE_HUB_BACKUP_SOURCE_COMMITTED' || sourceCommit.backup_plaintext_sha256 !== source.backup_plaintext_sha256 || sourceCommit.backup_ciphertext_sha256 !== source.backup_ciphertext_sha256 || sourceCommit.source_manifest_sha256 !== sha256(sourceManifestBytes) || !validUtc(sourceCommit.committed_at)) throw new Error('source commit invalid');
  if (Date.parse(sourceCommit.committed_at) < Date.parse(source.created_at)) throw new Error('source commit precedes the source manifest');
  return Object.freeze({ source, sourceCommit, sidecar_filename: sidecarMatch[2] });
}

export function validateBundleConstituentTimeOrder({
  sourceCreatedAt,
  sourceCommittedAt,
  evidenceStartedAt,
  evidenceCompletedAt,
  markerCommittedAt,
  journalRecordedAt,
  durableCompletedAt
}) {
  const times = [sourceCreatedAt, sourceCommittedAt, evidenceStartedAt, evidenceCompletedAt, markerCommittedAt, journalRecordedAt, durableCompletedAt].map(Date.parse);
  if (times.some((time) => !Number.isFinite(time)) || times.some((time, index) => index > 0 && time < times[index - 1])) throw new Error('bundle constituent time order invalid');
  return true;
}

function validateBundleMarkerAndConstituents(runDir) {
  validateRunDir(runDir);
  const markerFile = path.join(runDir, 'COMMITTED.json');
  if (!fs.existsSync(markerFile)) throw new Error('committed bundle marker missing');
  const marker = readJson(markerFile);
  const keys = ['schema_version', 'result', 'run_id', 'evidence_sha256', 'ciphertext_sha256', 'ciphertext_bytes', 'authorization_receipt_sha256', 'authorization_consumption_sha256', 'post_effect_completion_sha256', 'execution_nonce_sha256', 'authority_id', 'authority_epoch', 'revocation_registry_sha256', 'source_manifest_sha256', 'source_sidecar_sha256', 'source_commit_sha256', 'committed_at'];
  exactKeys(marker, keys, 'committed bundle marker');
  if (marker.schema_version !== '1.0' || marker.result !== 'LOCAL_BACKUP_REHEARSAL_BUNDLE_COMMITTED' || !Number.isSafeInteger(marker.authority_epoch) || marker.authority_epoch < 1 || !validUtc(marker.committed_at)) throw new Error('committed bundle marker invalid');
  const evidenceBytes = readOrdinaryFile(path.join(runDir, 'evidence.json'));
  const cipherBytes = readOrdinaryFile(path.join(runDir, 'encrypted-backup.age'));
  const consumptionBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'authorization-consumption.json'));
  const postEffectCompletionBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'post-effect-completion.json'));
  const authorizationBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'target-authorization.json'));
  const sourceManifestBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'backup.dump.manifest.json'));
  const consumption = validateConsumption(consumptionBytes);
  const evidence = validateBackupRestoreEvidence(JSON.parse(evidenceBytes.toString('utf8')));
  if (sha256(evidenceBytes) !== marker.evidence_sha256 || sha256(cipherBytes) !== marker.ciphertext_sha256 || cipherBytes.length !== marker.ciphertext_bytes) throw new Error('committed bundle hash mismatch');
  if (sha256(authorizationBytes) !== marker.authorization_receipt_sha256 || sha256(consumptionBytes) !== marker.authorization_consumption_sha256 || consumption.run_id !== marker.run_id || consumption.authority_receipt_sha256 !== marker.authorization_receipt_sha256 || consumption.execution_nonce_sha256 !== marker.execution_nonce_sha256) throw new Error('committed bundle authorization consumption mismatch');
  if (sha256(postEffectCompletionBytes) !== marker.post_effect_completion_sha256) throw new Error('committed bundle post-effect completion mismatch');
  if (sha256(sourceManifestBytes) !== marker.source_manifest_sha256) throw new Error('committed bundle embedded source manifest mismatch');
  if (evidence.backup.ciphertext_sha256 !== marker.ciphertext_sha256 || evidence.backup.ciphertext_bytes !== marker.ciphertext_bytes || evidence.target.authorization_receipt_sha256 !== marker.authorization_receipt_sha256 || evidence.provenance.run_id !== marker.run_id || evidence.provenance.source_manifest_sha256 !== marker.source_manifest_sha256) throw new Error('committed bundle Evidence mismatch');
  return Object.freeze({ marker, evidence, authorizationBytes, sourceManifestBytes, postEffectCompletionBytes });
}

export function classifyBackupRehearsalBundleCommitState(runDir) {
  validateRunDir(runDir);
  const present = (name) => fs.existsSync(path.join(runDir, name));
  const state = Object.freeze({
    evidence_incomplete: present('evidence.json.incomplete'),
    ciphertext_incomplete: present('encrypted-backup.age.incomplete'),
    marker_incomplete: present('COMMITTED.json.incomplete'),
    durable_incomplete: present('COMMIT-DURABLE.json.incomplete'),
    evidence: present('evidence.json'),
    ciphertext: present('encrypted-backup.age'),
    marker: present('COMMITTED.json'),
    durable: present('COMMIT-DURABLE.json')
  });
  const values = Object.values(state);
  if (values.every((value) => !value)) return Object.freeze({ result: 'EMPTY', state });
  if (state.evidence_incomplete && state.ciphertext_incomplete && !state.marker_incomplete && !state.durable_incomplete && !state.evidence && !state.ciphertext && !state.marker && !state.durable) return Object.freeze({ result: 'STAGED_EXACT', state });
  if (!state.evidence_incomplete && !state.ciphertext_incomplete && !state.marker_incomplete && state.evidence && state.ciphertext && state.marker && !state.durable) return Object.freeze({ result: state.durable_incomplete ? 'MARKER_COMMITTED_DURABLE_PENDING' : 'MARKER_COMMITTED', state });
  if (!state.evidence_incomplete && !state.ciphertext_incomplete && !state.marker_incomplete && !state.durable_incomplete && state.evidence && state.ciphertext && state.marker && state.durable) return Object.freeze({ result: 'DURABLE_COMMITTED', state });
  return Object.freeze({ result: 'PARTIAL_PUBLICATION_QUARANTINE_REQUIRED', state });
}

export function validateCommittedBackupRehearsalBundleShape(runDir) {
  const result = validateBundleMarkerAndConstituents(runDir);
  const durableFile = path.join(runDir, 'COMMIT-DURABLE.json');
  if (!fs.existsSync(durableFile)) throw new Error('durable completion receipt missing');
  const durable = readJson(durableFile);
  exactKeys(durable, ['schema_version', 'result', 'run_id', 'committed_marker_sha256', 'recovery_journal_terminal_sha256', 'completed_at'], 'durable completion receipt');
  if (durable.schema_version !== '1.0' || durable.result !== 'LOCAL_BACKUP_REHEARSAL_BUNDLE_DURABLE' || durable.run_id !== result.marker.run_id || !validUtc(durable.completed_at) || durable.committed_marker_sha256 !== sha256(readOrdinaryFile(path.join(runDir, 'COMMITTED.json'))) || !/^[a-f0-9]{64}$/.test(durable.recovery_journal_terminal_sha256)) throw new Error('durable completion receipt invalid');
  return Object.freeze({ ...result, durable });
}

export function validateBundleCanonicalCrossFields(runDir, result, verifiedAuthority) {
  const { marker, evidence, authorizationBytes, sourceManifestBytes, durable } = result;
  const source = validateBackupSourceManifest(JSON.parse(sourceManifestBytes.toString('utf8')));
  const journal = requireExecutionJournal(runDir, evidence, ['BUNDLE_COMMITTED']);
  if (sha256(authorizationBytes) !== verifiedAuthority.receipt_sha256) throw new Error('embedded authorization differs from canonical authority');
  if (durable.recovery_journal_terminal_sha256 !== journal.terminal.entry_sha256) throw new Error('durable receipt does not bind the terminal recovery journal');
  if (marker.authorization_receipt_sha256 !== verifiedAuthority.receipt_sha256 || marker.execution_nonce_sha256 !== verifiedAuthority.receipt.execution_nonce_sha256 || marker.authority_id !== verifiedAuthority.receipt.authority_id || marker.authority_epoch !== verifiedAuthority.receipt.authority_epoch || marker.revocation_registry_sha256 !== verifiedAuthority.revocation_sha256) throw new Error('bundle authority chain mismatch');
  if (marker.source_manifest_sha256 !== sha256(sourceManifestBytes) || evidence.backup.plaintext_sha256 !== source.backup_plaintext_sha256 || evidence.backup.plaintext_bytes !== source.backup_plaintext_bytes || verifiedAuthority.receipt.backup_plaintext_sha256 !== source.backup_plaintext_sha256 || verifiedAuthority.receipt.backup_manifest_sha256 !== marker.source_manifest_sha256) throw new Error('bundle source manifest mismatch');
  if (source.encryption.recipient_fingerprint_sha256 !== verifiedAuthority.receipt.age_recipient_fingerprint_sha256 || source.encryption.recipient_fingerprint_sha256 !== evidence.encryption.recipient_fingerprint_sha256) throw new Error('bundle recipient binding mismatch');
  if (evidence.target.cluster_system_identifier_sha256 !== verifiedAuthority.receipt.target_cluster_identifier_sha256 || evidence.target.cluster_system_identifier_sha256 === source.source_cluster_identifier_sha256 || JSON.stringify(evidence.restore.table_counts) !== JSON.stringify(source.table_counts) || evidence.restore.migration_set_sha256 !== source.migration_set_sha256) throw new Error('bundle restored constituent mismatch');
  if (evidence.provenance.run_id !== verifiedAuthority.receipt.run_id || evidence.restore.database !== verifiedAuthority.receipt.restore_database || evidence.provenance.code_revision !== verifiedAuthority.receipt.runner_code_revision) throw new Error('bundle execution binding mismatch');
  const sourceSidecarBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'backup.dump.sha256'));
  const sourceCommitBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'SOURCE-COMMITTED.json'));
  if (sha256(sourceSidecarBytes) !== evidence.provenance.source_sidecar_sha256 || sha256(sourceCommitBytes) !== evidence.provenance.source_commit_sha256 || marker.source_sidecar_sha256 !== evidence.provenance.source_sidecar_sha256 || marker.source_commit_sha256 !== evidence.provenance.source_commit_sha256) throw new Error('bundle source input snapshot mismatch');
  const sidecarMatch = sourceSidecarBytes.toString('utf8').match(/^([a-f0-9]{64})  ([A-Za-z0-9._-]+\.dump\.age)\n$/);
  if (!sidecarMatch || sidecarMatch[1] !== source.backup_ciphertext_sha256 || marker.ciphertext_sha256 !== source.backup_ciphertext_sha256 || marker.ciphertext_bytes !== source.backup_ciphertext_bytes) throw new Error('bundle source sidecar or ciphertext invalid');
  const { sourceCommit } = validateBackupSourceArtifactSet({ cipherBytes: readOrdinaryFile(path.join(runDir, 'encrypted-backup.age')), sidecarBytes: sourceSidecarBytes, commitBytes: sourceCommitBytes, sourceManifestBytes });
  validateBundleConstituentTimeOrder({
    sourceCreatedAt: source.created_at,
    sourceCommittedAt: sourceCommit.committed_at,
    evidenceStartedAt: evidence.provenance.started_at,
    evidenceCompletedAt: evidence.completed_at,
    markerCommittedAt: marker.committed_at,
    journalRecordedAt: journal.terminal.recorded_at,
    durableCompletedAt: durable.completed_at
  });
  return Object.freeze({ source, journal });
}

export function validateCommittedBackupRehearsalBundle(runDir, verifiedAuthority, suppliedSourceManifestBytes) {
  const result = validateCommittedBackupRehearsalBundleShape(runDir);
  if (!isCanonicalVerifiedRehearsalTargetAuthorization(verifiedAuthority)) throw new Error('canonical verified authority is required');
  requirePrivilegedExecutor();
  if (suppliedSourceManifestBytes && !Buffer.from(suppliedSourceManifestBytes).equals(result.sourceManifestBytes)) throw new Error('supplied source manifest differs from embedded snapshot');
  const completion = mintCanonicalPostEffectCompletion(runDir, verifiedAuthority, result.evidence, ['BUNDLE_COMMITTED']);
  requireCanonicalPostEffectCompletion(completion);
  validateBundleCanonicalCrossFields(runDir, result, verifiedAuthority);
  return result;
}

export function finalizeBackupRehearsalBundle(runDir, verifiedAuthority, sourceManifestBytes, completedAt = new Date().toISOString()) {
  validateRunDir(runDir);
  if (!isCanonicalVerifiedRehearsalTargetAuthorization(verifiedAuthority)) throw new Error('canonical verified authority is required');
  requirePrivilegedExecutor();
  const durableTmp = path.join(runDir, 'COMMIT-DURABLE.json.incomplete'); const durableFinal = path.join(runDir, 'COMMIT-DURABLE.json');
  if (fs.existsSync(durableFinal)) return validateCommittedBackupRehearsalBundle(runDir, verifiedAuthority, sourceManifestBytes);
  const base = validateBundleMarkerAndConstituents(runDir);
  const completion = mintCanonicalPostEffectCompletion(runDir, verifiedAuthority, base.evidence, ['PLAINTEXT_DELETED', 'BUNDLE_COMMITTED']);
  requireCanonicalPostEffectCompletion(completion);
  if (!Buffer.from(sourceManifestBytes).equals(base.sourceManifestBytes)) throw new Error('supplied source manifest differs from embedded snapshot');
  let journal = inspectRecoveryJournal(path.join(runDir, 'recovery-journal.jsonl')); let terminal = journal.terminal;
  if (terminal.phase === 'PLAINTEXT_DELETED') terminal = appendRecoveryJournal(path.join(runDir, 'recovery-journal.jsonl'), {
    run_id: terminal.run_id, restore_database: terminal.restore_database, postgres_socket_identity_sha256: terminal.postgres_socket_identity_sha256,
    target_cluster_identifier_sha256: terminal.target_cluster_identifier_sha256, phase: 'BUNDLE_COMMITTED', temporary_plaintext_path: terminal.temporary_plaintext_path,
    database_created: false, database_dropped: true, temporary_plaintext_deleted: true
  }, completedAt);
  else if (terminal.phase !== 'BUNDLE_COMMITTED') throw new Error('bundle journal cannot enter the terminal commit phase');
  const existingDurable = fs.existsSync(durableTmp) ? readJson(durableTmp) : null;
  const durable = { schema_version: '1.0', result: 'LOCAL_BACKUP_REHEARSAL_BUNDLE_DURABLE', run_id: base.marker.run_id, committed_marker_sha256: sha256(readOrdinaryFile(path.join(runDir, 'COMMITTED.json'))), recovery_journal_terminal_sha256: terminal.entry_sha256, completed_at: existingDurable?.completed_at ?? completedAt };
  if (existingDurable && JSON.stringify(existingDurable) !== JSON.stringify(durable)) throw new Error('incomplete durable receipt differs from the reconstructable terminal receipt');
  validateBundleCanonicalCrossFields(runDir, { ...base, durable }, verifiedAuthority);
  if (!existingDurable) { fs.writeFileSync(durableTmp, `${JSON.stringify(durable, null, 2)}\n`, { flag: 'wx', mode: 0o600 }); syncFile(durableTmp); }
  fs.renameSync(durableTmp, durableFinal); syncFile(durableFinal); syncDir(runDir);
  return validateCommittedBackupRehearsalBundle(runDir, verifiedAuthority, sourceManifestBytes);
}

export function commitBackupRehearsalBundle(runDir, verifiedAuthority, sourceManifestBytes, committedAt = new Date().toISOString()) {
  validateRunDir(runDir);
  if (!isCanonicalVerifiedRehearsalTargetAuthorization(verifiedAuthority)) throw new Error('canonical verified authority is required');
  requirePrivilegedExecutor();
  const source = validateBackupSourceManifest(JSON.parse(Buffer.from(sourceManifestBytes).toString('utf8')));
  const embeddedManifestBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'backup.dump.manifest.json'));
  const embeddedAuthorizationBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'target-authorization.json'));
  if (!embeddedManifestBytes.equals(Buffer.from(sourceManifestBytes)) || sha256(embeddedAuthorizationBytes) !== verifiedAuthority.receipt_sha256) throw new Error('staged embedded authority or source snapshot mismatch');
  const evidenceTmp = path.join(runDir, 'evidence.json.incomplete');
  const cipherTmp = path.join(runDir, 'encrypted-backup.age.incomplete');
  const evidenceFinal = path.join(runDir, 'evidence.json');
  const cipherFinal = path.join(runDir, 'encrypted-backup.age');
  const markerTmp = path.join(runDir, 'COMMITTED.json.incomplete');
  const markerFinal = path.join(runDir, 'COMMITTED.json');
  const durableTmp = path.join(runDir, 'COMMIT-DURABLE.json.incomplete');
  const durableFinal = path.join(runDir, 'COMMIT-DURABLE.json');
  const publicationState = classifyBackupRehearsalBundleCommitState(runDir).result;
  if (['MARKER_COMMITTED', 'MARKER_COMMITTED_DURABLE_PENDING', 'DURABLE_COMMITTED'].includes(publicationState)) return finalizeBackupRehearsalBundle(runDir, verifiedAuthority, sourceManifestBytes, committedAt);
  if (publicationState !== 'STAGED_EXACT') throw new Error(`bundle publication state is not resumable: ${publicationState}`);
  for (const file of [evidenceTmp, cipherTmp]) readOrdinaryFile(file);
  for (const file of [evidenceFinal, cipherFinal, markerTmp, markerFinal, durableTmp, durableFinal]) if (fs.existsSync(file)) throw new Error('bundle destination already exists');
  const evidenceBytes = readOrdinaryFile(evidenceTmp);
  const cipherBytes = readOrdinaryFile(cipherTmp);
  const evidence = validateBackupRestoreEvidence(JSON.parse(evidenceBytes.toString('utf8')));
  requireExecutionJournal(runDir, evidence, ['PLAINTEXT_DELETED']);
  const completion = mintCanonicalPostEffectCompletion(runDir, verifiedAuthority, evidence, ['PLAINTEXT_DELETED']);
  requireCanonicalPostEffectCompletion(completion);
  const consumptionBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'authorization-consumption.json'));
  const consumption = validateConsumption(consumptionBytes);
  const sourceManifestSha = sha256(sourceManifestBytes);
  if (sha256(cipherBytes) !== evidence.backup.ciphertext_sha256 || cipherBytes.length !== evidence.backup.ciphertext_bytes || evidence.target.authorization_receipt_sha256 !== verifiedAuthority.receipt_sha256 || evidence.provenance.source_manifest_sha256 !== sourceManifestSha || consumption.run_id !== evidence.provenance.run_id || consumption.authority_receipt_sha256 !== verifiedAuthority.receipt_sha256 || consumption.execution_nonce_sha256 !== verifiedAuthority.receipt.execution_nonce_sha256) throw new Error('staged bundle mismatch');
  if (source.backup_plaintext_sha256 !== evidence.backup.plaintext_sha256 || verifiedAuthority.receipt.backup_plaintext_sha256 !== source.backup_plaintext_sha256 || verifiedAuthority.receipt.backup_manifest_sha256 !== sourceManifestSha || verifiedAuthority.receipt.target_cluster_identifier_sha256 !== evidence.target.cluster_system_identifier_sha256) throw new Error('staged authority or source mismatch');
  if (evidence.provenance.run_id !== verifiedAuthority.receipt.run_id || evidence.restore.database !== verifiedAuthority.receipt.restore_database || evidence.encryption.recipient_fingerprint_sha256 !== verifiedAuthority.receipt.age_recipient_fingerprint_sha256 || evidence.provenance.code_revision !== verifiedAuthority.receipt.runner_code_revision) throw new Error('staged execution binding mismatch');
  if (evidence.backup.plaintext_bytes !== source.backup_plaintext_bytes || JSON.stringify(evidence.restore.table_counts) !== JSON.stringify(source.table_counts) || evidence.restore.migration_set_sha256 !== source.migration_set_sha256 || evidence.target.cluster_system_identifier_sha256 === source.source_cluster_identifier_sha256) throw new Error('staged restored constituent mismatch');
  const sourceSidecarBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'backup.dump.sha256'));
  const sourceCommitBytes = readOrdinaryFile(path.join(runDir, 'inputs', 'SOURCE-COMMITTED.json'));
  validateBackupSourceArtifactSet({ cipherBytes, sidecarBytes: sourceSidecarBytes, commitBytes: sourceCommitBytes, sourceManifestBytes });
  if (sha256(sourceSidecarBytes) !== evidence.provenance.source_sidecar_sha256 || sha256(sourceCommitBytes) !== evidence.provenance.source_commit_sha256) throw new Error('staged source constituent mismatch');
  fs.renameSync(cipherTmp, cipherFinal); syncFile(cipherFinal);
  fs.renameSync(evidenceTmp, evidenceFinal); syncFile(evidenceFinal); syncDir(runDir);
  const marker = {
    schema_version: '1.0', result: 'LOCAL_BACKUP_REHEARSAL_BUNDLE_COMMITTED', run_id: evidence.provenance.run_id,
    evidence_sha256: sha256(evidenceBytes), ciphertext_sha256: sha256(cipherBytes), ciphertext_bytes: cipherBytes.length,
    authorization_receipt_sha256: verifiedAuthority.receipt_sha256, authority_id: verifiedAuthority.receipt.authority_id,
    authorization_consumption_sha256: sha256(consumptionBytes), post_effect_completion_sha256: completion.post_effect_completion_sha256, execution_nonce_sha256: verifiedAuthority.receipt.execution_nonce_sha256,
    authority_epoch: verifiedAuthority.receipt.authority_epoch, revocation_registry_sha256: verifiedAuthority.revocation_sha256,
    source_manifest_sha256: sourceManifestSha, source_sidecar_sha256: evidence.provenance.source_sidecar_sha256, source_commit_sha256: evidence.provenance.source_commit_sha256, committed_at: committedAt
  };
  fs.writeFileSync(markerTmp, `${JSON.stringify(marker, null, 2)}\n`, { flag: 'wx', mode: 0o600 }); syncFile(markerTmp);
  fs.renameSync(markerTmp, markerFinal); syncFile(markerFinal); syncDir(runDir);
  validateBundleMarkerAndConstituents(runDir);
  return finalizeBackupRehearsalBundle(runDir, verifiedAuthority, sourceManifestBytes, committedAt);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, authorityMode, runDir, authorizationReceiptFile, sourceManifestFile] = process.argv.slice(2);
  try {
    if (authorityMode !== 'canonical' || !runDir || !authorizationReceiptFile || !sourceManifestFile) throw new Error('usage: commit|validate canonical <runDir> <authorization.json> <source-manifest.json>');
    const verified = verifyCanonicalRehearsalTargetAuthorization({ receiptBytes: readOrdinaryFile(authorizationReceiptFile) });
    const sourceManifestBytes = readOrdinaryFile(sourceManifestFile);
    const result = mode === 'commit' ? commitBackupRehearsalBundle(runDir, verified, sourceManifestBytes) : mode === 'validate' ? validateCommittedBackupRehearsalBundle(runDir, verified, sourceManifestBytes) : (() => { throw new Error('mode must be commit or validate'); })();
    console.log(JSON.stringify({ status: 'PASS', result: result.marker.result, run_id: result.marker.run_id, evidence_sha256: result.marker.evidence_sha256 }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', reason: error.message }, null, 2));
    process.exit(1);
  }
}
