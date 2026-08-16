#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBackupSourceAuthorization, validateBackupSourceAuthorizationConsumption, validateBackupSourceManifest, validateRehearsalRecoveryAuthorization, validateRehearsalTargetAuthorization } from './validate-knowledge-hub-remaining-deployment-gates.mjs';

const SHA256 = /^[a-f0-9]{64}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const canonicalVerifiedAuthorities = new WeakSet();
const canonicalVerifiedSourceAuthorities = new WeakSet();
const canonicalVerifiedRecoveryAuthorities = new WeakSet();
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
export const CANONICAL_AUTHORITY_PATHS = Object.freeze({
  trustRoot: '/etc/bai-development-os/knowledge-hub/rehearsal-authority-trust-root.json',
  revocations: '/etc/bai-development-os/knowledge-hub/rehearsal-authority-revocations.json',
  head: '/etc/bai-development-os/knowledge-hub/rehearsal-authority-head.json',
  auditCheckpoints: '/etc/bai-development-os/knowledge-hub/rehearsal-authority-audit-checkpoints.json'
});
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const parse = (bytes, label) => { try { return JSON.parse(Buffer.from(bytes).toString('utf8')); } catch { throw new Error(`${label} must be UTF-8 JSON`); } };
const validUtc = (value) => {
  const match = RFC3339.exec(value); if (!match) return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  const [, year, month, day, hour, minute, second, fraction = '0'] = parts;
  const timestamp = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, +fraction.padEnd(3, '0'));
  const date = new Date(timestamp);
  return Number.isFinite(timestamp) && date.getUTCFullYear() === +year && date.getUTCMonth() === +month - 1 && date.getUTCDate() === +day && date.getUTCHours() === +hour && date.getUTCMinutes() === +minute && date.getUTCSeconds() === +second && date.getUTCMilliseconds() === +fraction.padEnd(3, '0');
};
const exactKeys = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join('\n') !== [...keys].sort().join('\n')) throw new Error(`${label} fields invalid`);
};

export function signedAuthorizationPayload(receipt) {
  const { signed_payload_sha256: _hash, signature_base64: _signature, ...payload } = receipt;
  return Buffer.from(canonical(payload), 'utf8');
}

export function isCanonicalVerifiedRehearsalTargetAuthorization(value) {
  return Boolean(value && typeof value === 'object' && canonicalVerifiedAuthorities.has(value));
}

export function isCanonicalVerifiedBackupSourceAuthorization(value) {
  return Boolean(value && typeof value === 'object' && canonicalVerifiedSourceAuthorities.has(value));
}

export function isCanonicalVerifiedRehearsalRecoveryAuthorization(value) {
  return Boolean(value && typeof value === 'object' && canonicalVerifiedRecoveryAuthorities.has(value));
}

export function verifySignatureAgainstSuppliedAuthoritySet({ receiptBytes, trustRootBytes, revocationBytes, authorityHeadBytes, now = Date.now(), validateReceipt = validateRehearsalTargetAuthorization }) {
  const receipt = validateReceipt(parse(receiptBytes, 'authorization receipt'), { now });
  const trust = parse(trustRootBytes, 'trust root');
  exactKeys(trust, ['schema_version', 'result', 'issuer_id', 'algorithm', 'public_key_pem'], 'trust root');
  if (trust.schema_version !== '1.0' || trust.result !== 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_TRUST_ROOT' || trust.algorithm !== 'ED25519') throw new Error('trust root invalid');
  const revocations = parse(revocationBytes, 'revocation registry');
  exactKeys(revocations, ['schema_version', 'result', 'issuer_id', 'authority_epoch', 'revoked_authority_ids', 'updated_at'], 'revocation registry');
  const head = parse(authorityHeadBytes, 'authority head');
  exactKeys(head, ['schema_version', 'result', 'issuer_id', 'authority_epoch', 'trust_root_sha256', 'revocation_registry_sha256', 'updated_at'], 'authority head');
  const headUpdated = Date.parse(head.updated_at);
  if (head.schema_version !== '1.0' || head.result !== 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_CURRENT_HEAD' || !validUtc(head.updated_at) || !Number.isFinite(headUpdated) || headUpdated > now || now - headUpdated > 86_400_000) throw new Error('authority head is not current');
  if (head.trust_root_sha256 !== sha256(trustRootBytes) || head.revocation_registry_sha256 !== sha256(revocationBytes)) throw new Error('authority head constituent mismatch');
  const revocationUpdated = Date.parse(revocations.updated_at);
  if (revocations.schema_version !== '1.0' || revocations.result !== 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_REVOCATIONS' || !validUtc(revocations.updated_at) || !Number.isFinite(revocationUpdated)) throw new Error('revocation registry invalid');
  if (revocationUpdated > now || now - revocationUpdated > 86_400_000) throw new Error('revocation registry is not fresh');
  if (receipt.issuer_id !== trust.issuer_id || receipt.issuer_id !== revocations.issuer_id || receipt.issuer_id !== head.issuer_id) throw new Error('unknown authority issuer');
  if (receipt.authority_epoch !== revocations.authority_epoch || receipt.authority_epoch !== head.authority_epoch) throw new Error('authority epoch mismatch');
  if (!Array.isArray(revocations.revoked_authority_ids) || revocations.revoked_authority_ids.some((id) => !/^[A-Za-z0-9._:-]{1,128}$/.test(id)) || new Set(revocations.revoked_authority_ids).size !== revocations.revoked_authority_ids.length) throw new Error('revocation registry entries invalid');
  if (revocations.revoked_authority_ids.includes(receipt.authority_id)) throw new Error('authority receipt revoked');
  const revocationSha = sha256(revocationBytes);
  if (!SHA256.test(receipt.revocation_coordinate_sha256) || receipt.revocation_coordinate_sha256 !== revocationSha) throw new Error('revocation coordinate mismatch');
  const payload = signedAuthorizationPayload(receipt);
  if (sha256(payload) !== receipt.signed_payload_sha256) throw new Error('signed payload hash mismatch');
  const key = crypto.createPublicKey(trust.public_key_pem);
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('authority key type invalid');
  const signature = Buffer.from(receipt.signature_base64, 'base64');
  if (signature.length !== 64 || signature.toString('base64') !== receipt.signature_base64) throw new Error('signature encoding invalid');
  if (!crypto.verify(null, payload, key, signature)) throw new Error('authorization signature invalid');
  return Object.freeze({ receipt, receipt_sha256: sha256(receiptBytes), revocation_sha256: revocationSha });
}

function verifyOwnerAuditCheckpoint({ checkpointBytes, receipt, trustRootBytes, revocationBytes, authorityHeadBytes, effectAt }) {
  const registry = parse(checkpointBytes, 'Owner authority audit checkpoints');
  exactKeys(registry, ['schema_version', 'result', 'owner_anchor_id', 'checkpoints', 'updated_at'], 'Owner authority audit checkpoints');
  if (registry.schema_version !== '1.0' || registry.result !== 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_AUDIT_CHECKPOINTS' || !/^[A-Za-z0-9._:-]{1,128}$/.test(registry.owner_anchor_id) || !validUtc(registry.updated_at)) throw new Error('Owner authority audit checkpoint registry invalid');
  if (!Array.isArray(registry.checkpoints) || registry.checkpoints.length < 1) throw new Error('Owner authority audit checkpoints missing');
  const effectTime = typeof effectAt === 'string' ? Date.parse(effectAt) : Number(effectAt);
  const coordinates = new Set();
  let matched;
  for (const checkpoint of registry.checkpoints) {
    exactKeys(checkpoint, ['issuer_id', 'authority_epoch', 'trust_root_sha256', 'revocation_registry_sha256', 'authority_head_sha256', 'effect_window_started_at', 'effect_window_ended_at'], 'Owner authority audit checkpoint');
    if (!/^[A-Za-z0-9._:-]{1,128}$/.test(checkpoint.issuer_id) || !Number.isSafeInteger(checkpoint.authority_epoch) || checkpoint.authority_epoch < 1) throw new Error('Owner authority audit checkpoint identity invalid');
    for (const field of ['trust_root_sha256', 'revocation_registry_sha256', 'authority_head_sha256']) if (!SHA256.test(checkpoint[field])) throw new Error('Owner authority audit checkpoint digest invalid');
    if (!validUtc(checkpoint.effect_window_started_at) || !validUtc(checkpoint.effect_window_ended_at)) throw new Error('Owner authority audit checkpoint window invalid');
    const started = Date.parse(checkpoint.effect_window_started_at); const ended = Date.parse(checkpoint.effect_window_ended_at);
    if (ended <= started) throw new Error('Owner authority audit checkpoint window invalid');
    const coordinate = `${checkpoint.issuer_id}:${checkpoint.authority_epoch}:${checkpoint.trust_root_sha256}:${checkpoint.revocation_registry_sha256}:${checkpoint.authority_head_sha256}`;
    if (coordinates.has(coordinate)) throw new Error('duplicate Owner authority audit checkpoint');
    coordinates.add(coordinate);
    if (checkpoint.issuer_id === receipt.issuer_id && checkpoint.authority_epoch === receipt.authority_epoch && checkpoint.trust_root_sha256 === sha256(trustRootBytes) && checkpoint.revocation_registry_sha256 === sha256(revocationBytes) && checkpoint.authority_head_sha256 === sha256(authorityHeadBytes) && effectTime >= started && effectTime < ended) {
      if (matched) throw new Error('ambiguous Owner authority audit checkpoint');
      matched = checkpoint;
    }
  }
  if (!matched) throw new Error('historical authority set is not transitively bound by the Owner audit checkpoint');
  return Object.freeze({ registry_sha256: sha256(checkpointBytes), owner_anchor_id: registry.owner_anchor_id, checkpoint: Object.freeze({ ...matched }) });
}

export function verifyHistoricalAuthorizationForAudit({ receiptBytes, trustRootBytes, revocationBytes, authorityHeadBytes, ownerCheckpointBytes, ownerCheckpointProvenance = 'SUPPLIED_UNANCHORED', effectAt, validateReceipt = validateRehearsalTargetAuthorization }) {
  const auditTime = typeof effectAt === 'string' ? Date.parse(effectAt) : Number(effectAt);
  if (!Number.isFinite(auditTime)) throw new Error('historical audit effect time invalid');
  if (!ownerCheckpointBytes) throw new Error('Owner authority audit checkpoint required');
  const verified = verifySignatureAgainstSuppliedAuthoritySet({ receiptBytes, trustRootBytes, revocationBytes, authorityHeadBytes, now: auditTime, validateReceipt });
  const ownerCheckpoint = verifyOwnerAuditCheckpoint({ checkpointBytes: ownerCheckpointBytes, receipt: verified.receipt, trustRootBytes, revocationBytes, authorityHeadBytes, effectAt: auditTime });
  return Object.freeze({
    audit_only: true,
    execution_authority: false,
    effect_at: new Date(auditTime).toISOString(),
    receipt: verified.receipt,
    receipt_sha256: verified.receipt_sha256,
    revocation_sha256: verified.revocation_sha256,
    owner_checkpoint_registry_sha256: ownerCheckpoint.registry_sha256,
    owner_anchor_id: ownerCheckpoint.owner_anchor_id,
    owner_checkpoint_provenance: ownerCheckpointProvenance
  });
}

const readAuditFile = (file) => {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(fd); const bytes = fs.readFileSync(fd); const after = fs.fstatSync(fd);
    if (!before.isFile() || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('historical audit constituent is not a stable ordinary file');
    return bytes;
  } finally { fs.closeSync(fd); }
};

export function auditHistoricalBackupSourceAuthorityArtifactSet(runDir, { ownerCheckpointBytes } = {}) {
  const inputs = path.join(runDir, 'inputs');
  const receiptBytes = readAuditFile(path.join(inputs, 'source-authorization.json'));
  const consumptionBytes = readAuditFile(path.join(inputs, 'source-authorization-consumption.json'));
  const trustRootBytes = readAuditFile(path.join(inputs, 'source-authority-trust-root.json'));
  const revocationBytes = readAuditFile(path.join(inputs, 'source-authority-revocations.json'));
  const authorityHeadBytes = readAuditFile(path.join(inputs, 'source-authority-head.json'));
  const manifestBytes = readAuditFile(path.join(inputs, 'backup.dump.manifest.json'));
  const sourceCommitBytes = readAuditFile(path.join(inputs, 'SOURCE-COMMITTED.json'));
  const consumption = validateBackupSourceAuthorizationConsumption(parse(consumptionBytes, 'source authorization consumption'));
  const manifest = validateBackupSourceManifest(parse(manifestBytes, 'source manifest'));
  const sourceCommit = parse(sourceCommitBytes, 'source commit');
  const checkpointBytes = ownerCheckpointBytes ?? readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.auditCheckpoints);
  const checkpointProvenance = ownerCheckpointBytes ? 'SUPPLIED_UNANCHORED' : 'CANONICAL_ROOT_PROTECTED';
  const verified = verifyHistoricalAuthorizationForAudit({ receiptBytes, trustRootBytes, revocationBytes, authorityHeadBytes, ownerCheckpointBytes: checkpointBytes, ownerCheckpointProvenance: checkpointProvenance, effectAt: consumption.consumed_at, validateReceipt: validateBackupSourceAuthorization });
  if (consumption.authority_receipt_sha256 !== verified.receipt_sha256 || consumption.execution_nonce_sha256 !== verified.receipt.execution_nonce_sha256 || consumption.effect_deadline_at !== verified.receipt.expires_at) throw new Error('historical source consumption binding mismatch');
  if (manifest.source_authorization.receipt_sha256 !== sha256(receiptBytes) || manifest.source_authorization.consumption_receipt_sha256 !== sha256(consumptionBytes)) throw new Error('historical source manifest authority artifact mismatch');
  if (sourceCommit.source_manifest_sha256 !== sha256(manifestBytes) || sourceCommit.backup_plaintext_sha256 !== manifest.backup_plaintext_sha256 || sourceCommit.backup_ciphertext_sha256 !== manifest.backup_ciphertext_sha256) throw new Error('historical source commit binding mismatch');
  const issued = Date.parse(verified.receipt.issued_at); const consumed = Date.parse(consumption.consumed_at); const deadline = Date.parse(consumption.effect_deadline_at); const created = Date.parse(manifest.created_at); const committed = Date.parse(sourceCommit.committed_at);
  if (![issued, consumed, deadline, created, committed].every(Number.isFinite) || consumed < issued || created < consumed || committed < created || committed >= deadline) throw new Error('historical source effect exceeded its signed deadline');
  return Object.freeze({ audit_only: true, execution_authority: false, receipt_sha256: verified.receipt_sha256, consumption_sha256: sha256(consumptionBytes), source_manifest_sha256: sha256(manifestBytes), effect_deadline_at: consumption.effect_deadline_at, owner_checkpoint_registry_sha256: verified.owner_checkpoint_registry_sha256, owner_checkpoint_provenance: verified.owner_checkpoint_provenance });
}

export function auditHistoricalRehearsalTargetAuthorityArtifactSet(runDir, { ownerCheckpointBytes } = {}) {
  const inputs = path.join(runDir, 'inputs');
  const receiptBytes = readAuditFile(path.join(inputs, 'target-authorization.json'));
  const trustRootBytes = readAuditFile(path.join(inputs, 'target-authority-trust-root.json'));
  const revocationBytes = readAuditFile(path.join(inputs, 'target-authority-revocations.json'));
  const authorityHeadBytes = readAuditFile(path.join(inputs, 'target-authority-head.json'));
  const evidence = parse(readAuditFile(path.join(runDir, 'evidence.json')), 'rehearsal evidence');
  const checkpointBytes = ownerCheckpointBytes ?? readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.auditCheckpoints);
  const checkpointProvenance = ownerCheckpointBytes ? 'SUPPLIED_UNANCHORED' : 'CANONICAL_ROOT_PROTECTED';
  const verified = verifyHistoricalAuthorizationForAudit({ receiptBytes, trustRootBytes, revocationBytes, authorityHeadBytes, ownerCheckpointBytes: checkpointBytes, ownerCheckpointProvenance: checkpointProvenance, effectAt: evidence.completed_at, validateReceipt: validateRehearsalTargetAuthorization });
  if (evidence.target?.authorization_receipt_sha256 !== verified.receipt_sha256 || evidence.provenance?.run_id !== verified.receipt.run_id || evidence.restore?.database !== verified.receipt.restore_database || evidence.provenance?.code_revision !== verified.receipt.runner_code_revision) throw new Error('historical target Evidence authority binding mismatch');
  if (Date.parse(evidence.completed_at) >= Date.parse(verified.receipt.expires_at)) throw new Error('historical target effect exceeded its signed deadline');
  return Object.freeze({ audit_only: true, execution_authority: false, receipt_sha256: verified.receipt_sha256, evidence_completed_at: evidence.completed_at, owner_checkpoint_registry_sha256: verified.owner_checkpoint_registry_sha256, owner_checkpoint_provenance: verified.owner_checkpoint_provenance });
}

function readProtectedCanonical(file) {
  let current = path.dirname(file);
  for (;;) {
    const stat = fs.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== 0 || (stat.mode & 0o022) !== 0) throw new Error('canonical authority ancestor protection invalid');
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
  const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
  const fd = fs.openSync(file, flags);
  try {
    const stat = fs.fstatSync(fd);
    const pathStat = fs.lstatSync(file);
    if (!stat.isFile() || pathStat.isSymbolicLink() || stat.uid !== 0 || (stat.mode & 0o022) !== 0 || stat.dev !== pathStat.dev || stat.ino !== pathStat.ino) throw new Error('canonical authority file protection invalid');
    return fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
}

function readProtectedExecutorInput(file) {
  let current = path.dirname(path.resolve(file));
  for (;;) {
    const stat = fs.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== 0 || (stat.mode & 0o022) !== 0) throw new Error('authorization receipt ancestor protection invalid');
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
  const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
  const fd = fs.openSync(file, flags);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.uid !== 0 || (stat.mode & 0o022) !== 0) throw new Error('authorization receipt file protection invalid');
    return fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
}

export function verifyCanonicalRehearsalTargetAuthorization({ receiptBytes, now = Date.now() }) {
  if (process.platform === 'linux' && (typeof process.getuid !== 'function' || process.getuid() !== 0)) throw new Error('canonical authority verification requires the privileged rehearsal executor');
  const verified = verifySignatureAgainstSuppliedAuthoritySet({
    receiptBytes,
    trustRootBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.trustRoot),
    revocationBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.revocations),
    authorityHeadBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.head),
    now
  });
  const canonicalVerified = { receipt: verified.receipt, receipt_sha256: verified.receipt_sha256, revocation_sha256: verified.revocation_sha256 };
  canonicalVerifiedAuthorities.add(canonicalVerified);
  return Object.freeze(canonicalVerified);
}

export function verifyCanonicalBackupSourceAuthorization({ receiptBytes, now = Date.now() }) {
  if (process.platform === 'linux' && (typeof process.getuid !== 'function' || process.getuid() !== 0)) throw new Error('canonical source authority verification requires the privileged backup executor');
  const verified = verifySignatureAgainstSuppliedAuthoritySet({
    receiptBytes,
    trustRootBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.trustRoot),
    revocationBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.revocations),
    authorityHeadBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.head),
    now,
    validateReceipt: validateBackupSourceAuthorization
  });
  const canonicalVerified = { receipt: verified.receipt, receipt_sha256: verified.receipt_sha256, revocation_sha256: verified.revocation_sha256 };
  canonicalVerifiedSourceAuthorities.add(canonicalVerified);
  return Object.freeze(canonicalVerified);
}

export function verifyCanonicalRehearsalRecoveryAuthorization({ receiptBytes, now = Date.now() }) {
  if (process.platform === 'linux' && (typeof process.getuid !== 'function' || process.getuid() !== 0)) throw new Error('canonical recovery authority verification requires the privileged recovery executor');
  const verified = verifySignatureAgainstSuppliedAuthoritySet({
    receiptBytes,
    trustRootBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.trustRoot),
    revocationBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.revocations),
    authorityHeadBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.head),
    now,
    validateReceipt: validateRehearsalRecoveryAuthorization
  });
  const canonicalVerified = { receipt: verified.receipt, receipt_sha256: verified.receipt_sha256, revocation_sha256: verified.revocation_sha256 };
  canonicalVerifiedRecoveryAuthorities.add(canonicalVerified);
  return Object.freeze(canonicalVerified);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, receiptFile, trustRootFile, revocationFile, authorityHeadFile, effectAt] = process.argv.slice(2);
  try {
    if (mode === 'historical-source-bundle') {
      if (!receiptFile) throw new Error('usage: verifier historical-source-bundle <run-directory>');
      console.log(JSON.stringify({ status: 'AUDIT_PASS', ...auditHistoricalBackupSourceAuthorityArtifactSet(receiptFile) }, null, 2));
      process.exit(0);
    }
    if (mode === 'historical-target-bundle') {
      if (!receiptFile) throw new Error('usage: verifier historical-target-bundle <run-directory>');
      console.log(JSON.stringify({ status: 'AUDIT_PASS', ...auditHistoricalRehearsalTargetAuthorityArtifactSet(receiptFile) }, null, 2));
      process.exit(0);
    }
    if (mode?.startsWith('historical-')) {
      if (!receiptFile || !trustRootFile || !revocationFile || !authorityHeadFile || !effectAt) throw new Error('usage: verifier historical-target|historical-source|historical-recovery <receipt> <trust-root> <revocations> <head> <effect-at>');
      const validateReceipt = mode === 'historical-source' ? validateBackupSourceAuthorization : mode === 'historical-recovery' ? validateRehearsalRecoveryAuthorization : mode === 'historical-target' ? validateRehearsalTargetAuthorization : (() => { throw new Error('historical audit mode invalid'); })();
      const audited = verifyHistoricalAuthorizationForAudit({ receiptBytes: readAuditFile(receiptFile), trustRootBytes: readAuditFile(trustRootFile), revocationBytes: readAuditFile(revocationFile), authorityHeadBytes: readAuditFile(authorityHeadFile), ownerCheckpointBytes: readProtectedCanonical(CANONICAL_AUTHORITY_PATHS.auditCheckpoints), ownerCheckpointProvenance: 'CANONICAL_ROOT_PROTECTED', effectAt, validateReceipt });
      console.log(JSON.stringify({ status: 'AUDIT_PASS', audit_only: true, execution_authority: false, owner_checkpoint_provenance: audited.owner_checkpoint_provenance, authority_id: audited.receipt.authority_id, authority_epoch: audited.receipt.authority_epoch, receipt_sha256: audited.receipt_sha256 }, null, 2));
      process.exit(0);
    }
    if (!['canonical', 'canonical-source', 'canonical-recovery'].includes(mode) || !receiptFile) throw new Error('usage: verifier canonical|canonical-source|canonical-recovery <receipt.json>');
    const receiptBytes = readProtectedExecutorInput(receiptFile);
    const verified = mode === 'canonical-source' ? verifyCanonicalBackupSourceAuthorization({ receiptBytes }) : mode === 'canonical-recovery' ? verifyCanonicalRehearsalRecoveryAuthorization({ receiptBytes }) : verifyCanonicalRehearsalTargetAuthorization({ receiptBytes });
    console.log(JSON.stringify({ status: 'PASS', authority_id: verified.receipt.authority_id, authority_epoch: verified.receipt.authority_epoch, receipt_sha256: verified.receipt_sha256, receipt: verified.receipt }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', reason: error.message }, null, 2));
    process.exit(1);
  }
}
