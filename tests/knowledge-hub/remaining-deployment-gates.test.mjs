import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import Ajv2020 from '../../deploy/knowledge-hub/runtime/node_modules/ajv/dist/2020.js';
import addFormats from '../../deploy/knowledge-hub/runtime/node_modules/ajv-formats/dist/index.js';
import {
  validateBackupRestoreEvidence, validateBackupSourceAuthorization, validateBackupSourceManifest, validateCertificateDecision,
  validatePilotDecision, validateProductionTlsEvidence, validateRehearsalRecoveryAuthorization, validateRehearsalTargetAuthorization
} from '../../scripts/validate-knowledge-hub-remaining-deployment-gates.mjs';
import { buildCertificateDecision, buildPilotDecision } from '../../scripts/build-knowledge-hub-decision-readiness.mjs';
import { signedAuthorizationPayload, verifySignatureAgainstSuppliedAuthoritySet } from '../../scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs';
import { commitBackupRehearsalBundle, validateBackupSourceArtifactSet, validateBundleCanonicalCrossFields, validateBundleConstituentTimeOrder, validateCommittedBackupRehearsalBundle, validateCommittedBackupRehearsalBundleShape } from '../../scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs';
import { validateKnowledgeHubRestoreList } from '../../scripts/validate-knowledge-hub-pg-restore-list.mjs';
import { validateKnowledgeHubSchemaSql } from '../../scripts/validate-knowledge-hub-schema-sql.mjs';
import { createConsistentKnowledgeHubBackup } from '../../deploy/knowledge-hub/runtime/create-consistent-backup.mjs';
import { appendRecoveryJournal, inspectRecoveryJournal } from '../../scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs';

const sha = (character) => character.repeat(64);
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value)}\n`);
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const tableCounts = () => ({ evidence_events: 4, delivery_receipts: 3, client_policies: 1, api_credentials: 2, schema_migrations: 2 });
const backup = () => ({
  schema_version: '1.0', result: 'LOCAL_ENCRYPTED_BACKUP_RESTORE_REHEARSAL_PASS',
  target: { environment: 'NON_PRODUCTION_REHEARSAL', authorization_receipt_sha256: sha('f'), cluster_system_identifier_sha256: sha('1'), host_binding_sha256: sha('2') },
  backup: { plaintext_sha256: sha('a'), plaintext_bytes: 4096, ciphertext_sha256: sha('b'), ciphertext_bytes: 4200 },
  encryption: { format: 'age-v1', recipient_fingerprint_sha256: sha('c'), identity_material_in_evidence: false },
  restore: { database: 'knowledge_hub_restore_rehearsal', table_counts: tableCounts(), migration_set_sha256: sha('7'), plaintext_hash_verified: true, database_dropped: true, temporary_plaintext_deleted: true },
  provenance: { run_id: 'run-1', source_sidecar_sha256: sha('3'), source_manifest_sha256: sha('8'), source_commit_sha256: sha('9'), code_revision: '4'.repeat(40), age_version_sha256: sha('5'), postgres_tools_version_sha256: sha('6'), started_at: '2026-08-16T00:00:00Z', duration_seconds: 10 },
  effects: { offsite_uploaded: false, production_database_mutated: false, production_certificate_issued: false, product_credential_issued: false },
  completed_at: '2026-08-16T00:00:10Z'
});
const producerAttestation = () => ({ code_revision: '4'.repeat(40), producer_source_sha256: sha('1'), runtime_lock_sha256: sha('2'), runtime_dependency_tree_sha256: sha('3'), node_binary_sha256: sha('4'), node_version_sha256: sha('5'), pg_dump_binary_sha256: sha('6'), pg_dump_version_sha256: sha('7'), pg_restore_binary_sha256: sha('8'), pg_restore_version_sha256: sha('9'), age_binary_sha256: sha('a'), age_version_sha256: sha('b') });
const sourceAuthorization = () => ({ schema_version: '1.0', result: 'NON_PRODUCTION_BACKUP_SOURCE_AUTHORIZED', authority_id: 'OWNER-T17-SOURCE-1', issuer_id: 'owner-root-1', authority_epoch: 7, revocation_coordinate_sha256: sha('1'), environment: 'NON_PRODUCTION_BACKUP_SOURCE', source_database: 'knowledge_hub', source_cluster_identifier_sha256: sha('2'), postgres_socket_identity_sha256: sha('3'), age_recipient_fingerprint_sha256: sha('4'), backup_output_root_sha256: sha('5'), plaintext_tmpfs_root_sha256: sha('6'), runner_code_revision: '4'.repeat(40), toolchain_manifest_sha256: sha('7'), network_namespace_inode_sha256: sha('8'), boot_id_sha256: sha('9'), network_policy_sha256: sha('a'), execution_nonce_sha256: sha('b'), consumption_ledger_directory_sha256: sha('c'), network_egress_blocked: true, offsite_upload_authorized: false, owner_authorized: true, issued_at: '2026-08-16T00:00:00Z', expires_at: '2026-08-17T00:00:00Z', signed_payload_sha256: sha('d'), signature_base64: Buffer.alloc(64).toString('base64') });
const recoveryAuthorization = () => ({ schema_version: '1.0', result: 'NON_PRODUCTION_REHEARSAL_RECOVERY_AUTHORIZED', authority_id: 'OWNER-T17-RECOVERY-1', issuer_id: 'owner-root-1', authority_epoch: 7, revocation_coordinate_sha256: sha('1'), environment: 'NON_PRODUCTION_REHEARSAL_RECOVERY', run_id: 'run-1', restore_database: 'knowledge_hub_restore_rehearsal', target_cluster_identifier_sha256: sha('2'), postgres_socket_identity_sha256: sha('3'), temporary_plaintext_path_sha256: sha('4'), recovery_journal_sha256: sha('5'), psql_binary_sha256: sha('6'), action: 'VERIFY_ABSENT_AND_SEAL', owner_authorized: true, issued_at: '2026-08-16T00:00:00Z', expires_at: '2026-08-17T00:00:00Z', signed_payload_sha256: sha('7'), signature_base64: Buffer.alloc(64).toString('base64') });
const sourceManifest = () => ({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_BACKUP_SOURCE_MANIFEST', source_authorization: { receipt_sha256: sha('f'), consumption_receipt_sha256: sha('0') }, backup_plaintext_sha256: sha('a'), backup_plaintext_bytes: 4096, backup_ciphertext_sha256: sha('d'), backup_ciphertext_bytes: 4200, encryption: { format: 'age-v1', recipient_fingerprint_sha256: sha('2'), plaintext_persisted: false }, archive_toc_sha256: sha('b'), schema_sql_sha256: sha('c'), schema_semantics_sha256: sha('e'), source_cluster_identifier_sha256: sha('1'), source_exported_snapshot_sha256: sha('2'), table_counts: tableCounts(), migration_set_sha256: sha('7'), producer: producerAttestation(), created_at: '2026-08-16T00:00:00Z' });
const certificate = () => ({
  schema_version: '1.0', result: 'PRODUCTION_CERTIFICATE_DECISION_READY', staging_evidence_sha256: sha('d'), target_host: 'hub.example.test', certificate_provider: 'LETS_ENCRYPT',
  prerequisite_artifacts: { runbook_sha256: sha('1'), rollback_plan_sha256: sha('2'), budget_record_sha256: sha('3') },
  prerequisites: { staging_rehearsal_pass: true, staging_deactivated: true, private_services_not_public: true, rollback_documented: true, budget_bound: true },
  decision: 'PENDING_OWNER_DECISION', effects: { production_acme_issued: false, firewall_mutated: false, public_profile_activated: false }, completed_at: '2026-08-16T00:01:00Z'
});
const productionTls = () => ({
  schema_version: '1.0', result: 'PRODUCTION_TLS_ACTIVATION_PASS', authority_receipt_sha256: sha('9'), target_host: 'hub.example.test', provider: 'LETS_ENCRYPT',
  certificate: { sha256: sha('a'), dns_san_verified: true, chain_verified: true, not_before: '2026-08-16T00:00:00Z', not_after: '2026-11-14T00:00:00Z' },
  exposure: { tcp_80: true, tcp_443: true, udp_443: false, api_8787_public: false, postgres_5432_public: false, caddy_admin_2019_public: false },
  renewal: { automation_configured: true, dry_run_pass: true }, completed_at: '2026-08-16T00:02:00Z'
});
const pilot = () => ({
  schema_version: '1.0', result: 'LIMITED_PRODUCT_PILOT_DECISION_READY', production_tls_evidence_sha256: sha('e'), product_id: 'bai-video-production', scopes: ['evidence:read', 'evidence:write'],
  limits: { max_installations: 5, max_events: 1000, max_days: 14 },
  prerequisite_artifacts: { privacy_review_sha256: sha('1'), deletion_plan_sha256: sha('2'), credential_revocation_plan_sha256: sha('3'), product_rollback_sha256: sha('4') },
  prerequisites: { privacy_review_pass: true, deletion_plan_bound: true, credential_revocation_plan_bound: true, product_rollback_bound: true },
  decision: 'PENDING_OWNER_DECISION', effects: { credential_issued: false, ingestion_performed: false, real_user_evidence_collected: false }, completed_at: '2026-08-16T00:03:00Z'
});
const prerequisite = (artifactType, subject) => jsonBytes({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_GATE_PREREQUISITE_EVIDENCE', artifact_type: artifactType, subject, revision: 'r1', status: 'PASS', superseded: false, completed_at: '2026-08-16T00:00:30Z' });

function signedTarget({ revoked = false, epoch = 7, backupSha = sha('b'), manifestSha = sha('c'), targetSha = sha('a') } = {}) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const revocations = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_REVOCATIONS', issuer_id: 'owner-root-1', authority_epoch: epoch, revoked_authority_ids: revoked ? ['OWNER-T17-REHEARSAL-1'] : [], updated_at: '2026-08-16T00:00:00Z' };
  const revocationBytes = jsonBytes(revocations);
  const receipt = {
    schema_version: '1.0', result: 'NON_PRODUCTION_REHEARSAL_TARGET_AUTHORIZED', authority_id: 'OWNER-T17-REHEARSAL-1', issuer_id: 'owner-root-1', authority_epoch: epoch, revocation_coordinate_sha256: digest(revocationBytes),
    environment: 'NON_PRODUCTION_REHEARSAL', run_id: 'run-1', restore_database: 'knowledge_hub_restore_rehearsal', age_recipient_fingerprint_sha256: sha('2'), runner_code_revision: '4'.repeat(40), execution_nonce_sha256: sha('3'), consumption_ledger_directory_sha256: sha('4'), target_cluster_identifier_sha256: targetSha, network_namespace_inode_sha256: sha('d'), boot_id_sha256: sha('e'), network_policy_sha256: sha('f'), postgres_socket_identity_sha256: sha('0'), toolchain_manifest_sha256: sha('1'), backup_plaintext_sha256: backupSha, backup_manifest_sha256: manifestSha, restore_role: 'bai_restore_rehearsal', restore_executor_role: 'bai_restore_executor', restore_executor_pgpass_file_sha256: sha('6'), restore_executor_membership_graph_sha256: sha('7'), restore_executor_application_name: 'bai-kh-restore-run-1', restore_executor_lease_coordinate_sha256: sha('8'),
    allowed_database_suffix: '_restore_rehearsal', disposable_cluster: true, network_egress_blocked: true, production_target: false, owner_authorized: true,
    issued_at: '2026-08-16T00:00:00Z', expires_at: '2026-08-17T00:00:00Z', signed_payload_sha256: '', signature_base64: ''
  };
  const payload = signedAuthorizationPayload(receipt); receipt.signed_payload_sha256 = digest(payload); receipt.signature_base64 = crypto.sign(null, payload, privateKey).toString('base64');
  const trust = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_TRUST_ROOT', issuer_id: 'owner-root-1', algorithm: 'ED25519', public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }).toString() };
  const trustRootBytes = jsonBytes(trust);
  const head = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_CURRENT_HEAD', issuer_id: 'owner-root-1', authority_epoch: epoch, trust_root_sha256: digest(trustRootBytes), revocation_registry_sha256: digest(revocationBytes), updated_at: '2026-08-16T00:00:00Z' };
  return { receipt, receiptBytes: jsonBytes(receipt), trustRootBytes, revocationBytes, authorityHeadBytes: jsonBytes(head) };
}

function signedSource() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const revocations = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_REVOCATIONS', issuer_id: 'owner-root-1', authority_epoch: 7, revoked_authority_ids: [], updated_at: '2026-08-16T00:00:00Z' };
  const revocationBytes = jsonBytes(revocations); const receipt = sourceAuthorization(); receipt.revocation_coordinate_sha256 = digest(revocationBytes); receipt.signed_payload_sha256 = ''; receipt.signature_base64 = '';
  const payload = signedAuthorizationPayload(receipt); receipt.signed_payload_sha256 = digest(payload); receipt.signature_base64 = crypto.sign(null, payload, privateKey).toString('base64');
  const trustRootBytes = jsonBytes({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_TRUST_ROOT', issuer_id: 'owner-root-1', algorithm: 'ED25519', public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }).toString() });
  const authorityHeadBytes = jsonBytes({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_CURRENT_HEAD', issuer_id: 'owner-root-1', authority_epoch: 7, trust_root_sha256: digest(trustRootBytes), revocation_registry_sha256: digest(revocationBytes), updated_at: '2026-08-16T00:00:00Z' });
  return { receiptBytes: jsonBytes(receipt), trustRootBytes, revocationBytes, authorityHeadBytes };
}

test('validators accept complete closed receipts and deeply freeze returned values', () => {
  const accepted = validateBackupRestoreEvidence(backup()); assert.equal(accepted.result, 'LOCAL_ENCRYPTED_BACKUP_RESTORE_REHEARSAL_PASS'); assert.equal(Object.isFrozen(accepted.restore.table_counts), true);
  assert.equal(validateBackupSourceManifest(sourceManifest()).table_counts.schema_migrations, 2);
  assert.equal(validateBackupSourceAuthorization(sourceAuthorization(), { now: Date.parse('2026-08-16T12:00:00Z') }).source_database, 'knowledge_hub');
  assert.equal(validateRehearsalRecoveryAuthorization(recoveryAuthorization(), { now: Date.parse('2026-08-16T12:00:00Z') }).action, 'VERIFY_ABSENT_AND_SEAL');
  assert.equal(validateCertificateDecision(certificate()).decision, 'PENDING_OWNER_DECISION');
  assert.equal(validateProductionTlsEvidence(productionTls()).provider, 'LETS_ENCRYPT');
  assert.equal(validatePilotDecision(pilot()).limits.max_events, 1000);
});

test('signed target authorization rejects forged, revoked, expired and epoch-mismatched receipts', () => {
  const valid = signedTarget(); assert.equal(verifySignatureAgainstSuppliedAuthoritySet({ ...valid, now: Date.parse('2026-08-16T12:00:00Z') }).receipt.production_target, false);
  const forged = JSON.parse(valid.receiptBytes); forged.restore_role = 'other_role';
  assert.throws(() => verifySignatureAgainstSuppliedAuthoritySet({ receiptBytes: jsonBytes(forged), trustRootBytes: valid.trustRootBytes, revocationBytes: valid.revocationBytes, authorityHeadBytes: valid.authorityHeadBytes, now: Date.parse('2026-08-16T12:00:00Z') }), /payload hash|signature/);
  const revoked = signedTarget({ revoked: true }); assert.throws(() => verifySignatureAgainstSuppliedAuthoritySet({ ...revoked, now: Date.parse('2026-08-16T12:00:00Z') }), /revoked/);
  assert.throws(() => verifySignatureAgainstSuppliedAuthoritySet({ ...valid, now: Date.parse('2026-08-18T00:00:00Z') }), /not current|not fresh/);
  const wrongEpoch = JSON.parse(valid.revocationBytes); wrongEpoch.authority_epoch = 8;
  assert.throws(() => verifySignatureAgainstSuppliedAuthoritySet({ receiptBytes: valid.receiptBytes, trustRootBytes: valid.trustRootBytes, revocationBytes: jsonBytes(wrongEpoch), authorityHeadBytes: valid.authorityHeadBytes, now: Date.parse('2026-08-16T12:00:00Z') }), /epoch|coordinate|constituent/);
  const invalidHead = JSON.parse(valid.authorityHeadBytes); invalidHead.updated_at = '2026-02-30T00:00:00Z';
  assert.throws(() => verifySignatureAgainstSuppliedAuthoritySet({ receiptBytes: valid.receiptBytes, trustRootBytes: valid.trustRootBytes, revocationBytes: valid.revocationBytes, authorityHeadBytes: jsonBytes(invalidHead), now: Date.parse('2026-08-16T12:00:00Z') }), /head is not current/);
  const invalidRevocations = JSON.parse(valid.revocationBytes); invalidRevocations.updated_at = '2026-02-30T00:00:00Z';
  const invalidRevocationBytes = jsonBytes(invalidRevocations); const invalidRevocationHead = JSON.parse(valid.authorityHeadBytes); invalidRevocationHead.revocation_registry_sha256 = digest(invalidRevocationBytes);
  assert.throws(() => verifySignatureAgainstSuppliedAuthoritySet({ receiptBytes: valid.receiptBytes, trustRootBytes: valid.trustRootBytes, revocationBytes: invalidRevocationBytes, authorityHeadBytes: jsonBytes(invalidRevocationHead), now: Date.parse('2026-08-16T12:00:00Z') }), /registry invalid/);
  const source = signedSource(); assert.equal(verifySignatureAgainstSuppliedAuthoritySet({ ...source, now: Date.parse('2026-08-16T12:00:00Z'), validateReceipt: validateBackupSourceAuthorization }).receipt.source_database, 'knowledge_hub');
});

test('shape-only target validator cannot substitute for signature verification', () => {
  const valid = signedTarget(); assert.equal(validateRehearsalTargetAuthorization(valid.receipt, { now: Date.parse('2026-08-16T12:00:00Z') }).authority_epoch, 7);
  assert.throws(() => validateRehearsalTargetAuthorization({ ...valid.receipt, production_target: true }, { now: Date.parse('2026-08-16T12:00:00Z') }), /boundary/);
});

test('backup receipt rejects partial restore, timing mismatch, cleanup and effect inflation', () => {
  const partial = backup(); partial.restore.table_counts.evidence_events = 0; assert.throws(() => validateBackupRestoreEvidence(partial), /restored count/);
  const timing = backup(); timing.completed_at = '2026-08-16T00:00:09Z'; assert.throws(() => validateBackupRestoreEvidence(timing), /completed_at/);
  const cleanup = backup(); cleanup.restore.temporary_plaintext_deleted = false; assert.throws(() => validateBackupRestoreEvidence(cleanup), /cleanup incomplete/);
  const upload = backup(); upload.effects.offsite_uploaded = true; assert.throws(() => validateBackupRestoreEvidence(upload), /effect inflation/);
});

test('committed bundle shape is crash-safe while supplied trust sets cannot mint canonical authority', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-bundle-'));
  const evidence = backup(); const cipher = Buffer.from('ciphertext payload'); evidence.backup.ciphertext_sha256 = digest(cipher); evidence.backup.ciphertext_bytes = cipher.length;
  const manifestBytes = jsonBytes(sourceManifest());
  const authority = signedTarget({ backupSha: evidence.backup.plaintext_sha256, manifestSha: digest(manifestBytes), targetSha: evidence.target.cluster_system_identifier_sha256 });
  const verified = verifySignatureAgainstSuppliedAuthoritySet({ ...authority, now: Date.parse('2026-08-16T12:00:00Z') });
  evidence.target.authorization_receipt_sha256 = verified.receipt_sha256; evidence.provenance.source_manifest_sha256 = digest(manifestBytes);
  fs.writeFileSync(path.join(dir, 'evidence.json.incomplete'), jsonBytes(evidence)); fs.writeFileSync(path.join(dir, 'encrypted-backup.age.incomplete'), cipher);
  assert.throws(() => validateCommittedBackupRehearsalBundleShape(dir), /marker missing/);
  assert.throws(() => commitBackupRehearsalBundle(dir, verified, manifestBytes, '2026-08-16T00:00:11Z'), /canonical verified authority/);
  fs.renameSync(path.join(dir, 'evidence.json.incomplete'), path.join(dir, 'evidence.json')); fs.renameSync(path.join(dir, 'encrypted-backup.age.incomplete'), path.join(dir, 'encrypted-backup.age'));
  const evidenceBytes = fs.readFileSync(path.join(dir, 'evidence.json'));
  const inputs = path.join(dir, 'inputs'); fs.mkdirSync(inputs); const consumptionBytes = jsonBytes({ schema_version: '1.0', result: 'REHEARSAL_AUTHORIZATION_CONSUMED', run_id: evidence.provenance.run_id, authority_receipt_sha256: verified.receipt_sha256, execution_nonce_sha256: verified.receipt.execution_nonce_sha256 }); fs.writeFileSync(path.join(inputs, 'authorization-consumption.json'), consumptionBytes); fs.writeFileSync(path.join(inputs, 'target-authorization.json'), authority.receiptBytes); fs.writeFileSync(path.join(inputs, 'backup.dump.manifest.json'), manifestBytes);
  const postEffectBytes = jsonBytes({ schema_version: '1.0', result: 'REHEARSAL_POST_EFFECT_COMPLETED', run_id: evidence.provenance.run_id, authority_receipt_sha256: verified.receipt_sha256, execution_nonce_sha256: verified.receipt.execution_nonce_sha256, evidence_sha256: digest(evidenceBytes), recovery_journal_safe_entry_sha256: sha('e'), database_absent: true, temporary_plaintext_absent: true, completed_at: '2026-08-16T00:00:10Z' }); fs.writeFileSync(path.join(inputs, 'post-effect-completion.json'), postEffectBytes);
  const marker = { schema_version: '1.0', result: 'LOCAL_BACKUP_REHEARSAL_BUNDLE_COMMITTED', run_id: evidence.provenance.run_id, evidence_sha256: digest(evidenceBytes), ciphertext_sha256: digest(cipher), ciphertext_bytes: cipher.length, authorization_receipt_sha256: verified.receipt_sha256, authorization_consumption_sha256: digest(consumptionBytes), post_effect_completion_sha256: digest(postEffectBytes), execution_nonce_sha256: verified.receipt.execution_nonce_sha256, authority_id: verified.receipt.authority_id, authority_epoch: verified.receipt.authority_epoch, revocation_registry_sha256: verified.revocation_sha256, source_manifest_sha256: digest(manifestBytes), source_sidecar_sha256: evidence.provenance.source_sidecar_sha256, source_commit_sha256: evidence.provenance.source_commit_sha256, committed_at: '2026-08-16T00:00:11Z' };
  fs.writeFileSync(path.join(dir, 'COMMITTED.json'), jsonBytes(marker)); assert.throws(() => validateCommittedBackupRehearsalBundleShape(dir), /durable completion/);
  fs.writeFileSync(path.join(dir, 'COMMIT-DURABLE.json'), jsonBytes({ schema_version: '1.0', result: 'LOCAL_BACKUP_REHEARSAL_BUNDLE_DURABLE', run_id: marker.run_id, committed_marker_sha256: digest(fs.readFileSync(path.join(dir, 'COMMITTED.json'))), recovery_journal_terminal_sha256: sha('e'), completed_at: marker.committed_at })); assert.equal(validateCommittedBackupRehearsalBundleShape(dir).marker.result, 'LOCAL_BACKUP_REHEARSAL_BUNDLE_COMMITTED');
  assert.throws(() => validateCommittedBackupRehearsalBundle(dir, verified, manifestBytes), /canonical verified authority/);
  fs.appendFileSync(path.join(dir, 'encrypted-backup.age'), 'tamper'); assert.throws(() => validateCommittedBackupRehearsalBundleShape(dir), /hash mismatch/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('canonical bundle cross-field verifier is self-contained and rejects constituent drift', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-canonical-bundle-')); const inputs = path.join(dir, 'inputs'); fs.mkdirSync(inputs);
  const cipher = Buffer.from('canonical encrypted payload'); const source = sourceManifest(); source.backup_ciphertext_sha256 = digest(cipher); source.backup_ciphertext_bytes = cipher.length;
  const sourceBytes = jsonBytes(source); const evidence = backup(); evidence.backup.ciphertext_sha256 = digest(cipher); evidence.backup.ciphertext_bytes = cipher.length; evidence.encryption.recipient_fingerprint_sha256 = source.encryption.recipient_fingerprint_sha256; evidence.target.cluster_system_identifier_sha256 = sha('f');
  const authority = signedTarget({ backupSha: source.backup_plaintext_sha256, manifestSha: digest(sourceBytes), targetSha: evidence.target.cluster_system_identifier_sha256 });
  const verified = verifySignatureAgainstSuppliedAuthoritySet({ ...authority, now: Date.parse('2026-08-16T12:00:00Z') }); evidence.target.authorization_receipt_sha256 = verified.receipt_sha256; evidence.provenance.source_manifest_sha256 = digest(sourceBytes);
  const sidecarBytes = Buffer.from(`${digest(cipher)}  knowledge-hub.dump.age\n`); const sourceCommitBytes = jsonBytes({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_BACKUP_SOURCE_COMMITTED', backup_plaintext_sha256: source.backup_plaintext_sha256, backup_ciphertext_sha256: digest(cipher), source_manifest_sha256: digest(sourceBytes), committed_at: '2026-08-16T00:00:00Z' });
  evidence.provenance.source_sidecar_sha256 = digest(sidecarBytes); evidence.provenance.source_commit_sha256 = digest(sourceCommitBytes);
  const consumptionBytes = jsonBytes({ schema_version: '1.0', result: 'REHEARSAL_AUTHORIZATION_CONSUMED', run_id: evidence.provenance.run_id, authority_receipt_sha256: verified.receipt_sha256, execution_nonce_sha256: verified.receipt.execution_nonce_sha256 });
  fs.writeFileSync(path.join(inputs, 'target-authorization.json'), authority.receiptBytes); fs.writeFileSync(path.join(inputs, 'backup.dump.manifest.json'), sourceBytes); fs.writeFileSync(path.join(inputs, 'backup.dump.sha256'), sidecarBytes); fs.writeFileSync(path.join(inputs, 'SOURCE-COMMITTED.json'), sourceCommitBytes); fs.writeFileSync(path.join(inputs, 'authorization-consumption.json'), consumptionBytes);
  const evidenceBytes = jsonBytes(evidence); fs.writeFileSync(path.join(dir, 'evidence.json'), evidenceBytes); fs.writeFileSync(path.join(dir, 'encrypted-backup.age'), cipher);
  const postEffectBytes = jsonBytes({ schema_version: '1.0', result: 'REHEARSAL_POST_EFFECT_COMPLETED', run_id: evidence.provenance.run_id, authority_receipt_sha256: verified.receipt_sha256, execution_nonce_sha256: verified.receipt.execution_nonce_sha256, evidence_sha256: digest(evidenceBytes), recovery_journal_safe_entry_sha256: sha('e'), database_absent: true, temporary_plaintext_absent: true, completed_at: '2026-08-16T00:00:10Z' }); fs.writeFileSync(path.join(inputs, 'post-effect-completion.json'), postEffectBytes);
  const marker = { schema_version: '1.0', result: 'LOCAL_BACKUP_REHEARSAL_BUNDLE_COMMITTED', run_id: evidence.provenance.run_id, evidence_sha256: digest(evidenceBytes), ciphertext_sha256: digest(cipher), ciphertext_bytes: cipher.length, authorization_receipt_sha256: verified.receipt_sha256, authorization_consumption_sha256: digest(consumptionBytes), post_effect_completion_sha256: digest(postEffectBytes), execution_nonce_sha256: verified.receipt.execution_nonce_sha256, authority_id: verified.receipt.authority_id, authority_epoch: verified.receipt.authority_epoch, revocation_registry_sha256: verified.revocation_sha256, source_manifest_sha256: digest(sourceBytes), source_sidecar_sha256: digest(sidecarBytes), source_commit_sha256: digest(sourceCommitBytes), committed_at: '2026-08-16T00:00:11Z' }; fs.writeFileSync(path.join(dir, 'COMMITTED.json'), jsonBytes(marker));
  const journalFile = path.join(dir, 'recovery-journal.jsonl'); const state = { run_id: evidence.provenance.run_id, restore_database: evidence.restore.database, postgres_socket_identity_sha256: sha('0'), target_cluster_identifier_sha256: evidence.target.cluster_system_identifier_sha256, temporary_plaintext_path: path.join(dir, 'plain.dump'), database_created: false, database_dropped: true, temporary_plaintext_deleted: true };
  appendRecoveryJournal(journalFile, { ...state, phase: 'RESERVED' }, '2026-08-16T00:00:00Z'); appendRecoveryJournal(journalFile, { ...state, phase: 'AUTHORIZATION_CONSUMED' }, '2026-08-16T00:00:00.100Z'); appendRecoveryJournal(journalFile, { ...state, phase: 'PLAINTEXT_CREATE_STARTED', temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.200Z'); appendRecoveryJournal(journalFile, { ...state, phase: 'PLAINTEXT_CREATED', temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.300Z'); appendRecoveryJournal(journalFile, { ...state, phase: 'DATABASE_CREATE_STARTED', database_created: true, database_dropped: false, temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.400Z'); appendRecoveryJournal(journalFile, { ...state, phase: 'DATABASE_CREATED', database_created: true, database_dropped: false, temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.500Z'); appendRecoveryJournal(journalFile, { ...state, phase: 'DATABASE_DROPPED', temporary_plaintext_deleted: false }, '2026-08-16T00:00:09Z'); appendRecoveryJournal(journalFile, { ...state, phase: 'PLAINTEXT_DELETED' }, '2026-08-16T00:00:10Z'); const terminal = appendRecoveryJournal(journalFile, { ...state, phase: 'BUNDLE_COMMITTED' }, marker.committed_at);
  fs.writeFileSync(path.join(dir, 'COMMIT-DURABLE.json'), jsonBytes({ schema_version: '1.0', result: 'LOCAL_BACKUP_REHEARSAL_BUNDLE_DURABLE', run_id: marker.run_id, committed_marker_sha256: digest(fs.readFileSync(path.join(dir, 'COMMITTED.json'))), recovery_journal_terminal_sha256: terminal.entry_sha256, completed_at: marker.committed_at }));
  const result = validateCommittedBackupRehearsalBundleShape(dir); assert.equal(validateBundleCanonicalCrossFields(dir, result, verified).journal.terminal.phase, 'BUNDLE_COMMITTED');
  const missingAuthority = path.join(inputs, 'target-authorization.json'); fs.renameSync(missingAuthority, `${missingAuthority}.missing`); assert.throws(() => validateCommittedBackupRehearsalBundleShape(dir), /ENOENT|authorization/); fs.renameSync(`${missingAuthority}.missing`, missingAuthority);
  for (const mutate of [
    (value) => { value.backup_plaintext_bytes += 1; },
    (value) => { value.source_cluster_identifier_sha256 = evidence.target.cluster_system_identifier_sha256; },
    (value) => { value.encryption.recipient_fingerprint_sha256 = sha('9'); },
    (value) => { value.created_at = '2026-08-16T00:00:12Z'; }
  ]) { const changed = structuredClone(source); mutate(changed); assert.throws(() => validateBundleCanonicalCrossFields(dir, { ...result, sourceManifestBytes: jsonBytes(changed) }, verified), /mismatch|recipient|time order|sidecar|manifest/); }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('bundle constituent time order binds source commit before target execution', () => {
  const valid = {
    sourceCreatedAt: '2026-08-16T00:00:00Z', sourceCommittedAt: '2026-08-16T00:00:01Z',
    evidenceStartedAt: '2026-08-16T00:00:02Z', evidenceCompletedAt: '2026-08-16T00:00:10Z',
    markerCommittedAt: '2026-08-16T00:00:11Z', journalRecordedAt: '2026-08-16T00:00:11Z', durableCompletedAt: '2026-08-16T00:00:12Z'
  };
  assert.equal(validateBundleConstituentTimeOrder(valid), true);
  assert.throws(() => validateBundleConstituentTimeOrder({ ...valid, sourceCommittedAt: '2026-08-16T00:00:03Z' }), /time order/);
  assert.throws(() => validateBundleConstituentTimeOrder({ ...valid, durableCompletedAt: 'invalid' }), /time order/);
});

test('raw certificate and pilot artifacts cannot self-promote into decision receipts', () => {
  const staging = { schema_version: '1.0', result: 'PUBLIC_TLS_STAGING_REHEARSAL_PASS', target: { host: 'hub.example.test', acme_ca_directory: 'https://acme-staging-v02.api.letsencrypt.org/directory' }, certificate: { sha256: sha('a'), san_verified: true, issuer_staging_verified: true, not_before: '2026-08-15T00:00:00Z', not_after: '2026-08-22T00:00:00Z' }, routing: { https_ready: true, http_redirect_to_https: true }, exposure: { tcp_80: true, tcp_443: true, udp_443: false, api_8787_public: false, postgres_5432_public: false, caddy_admin_2019_public: false }, activation: { explicit_acknowledgement: true, production_acme_used: false, public_profile_deactivated_after_rehearsal: true }, completed_at: '2026-08-16T00:00:00Z' };
  assert.throws(() => buildCertificateDecision({ stagingEvidenceBytes: jsonBytes(staging), targetHost: 'hub.example.test', runbookBytes: Buffer.from('runbook'), rollbackPlanBytes: prerequisite('PRODUCTION_ROLLBACK_PLAN', 'hub.example.test'), budgetRecordBytes: prerequisite('PRODUCTION_BUDGET_BOUND', 'hub.example.test'), completedAt: '2026-08-16T00:01:00Z' }), /authentic Owner certificate authority/);
  assert.throws(() => buildCertificateDecision({ stagingEvidenceBytes: jsonBytes(staging), targetHost: 'hub.example.test', runbookBytes: Buffer.alloc(0), rollbackPlanBytes: prerequisite('PRODUCTION_ROLLBACK_PLAN', 'hub.example.test'), budgetRecordBytes: prerequisite('PRODUCTION_BUDGET_BOUND', 'hub.example.test'), completedAt: '2026-08-16T00:01:00Z' }), /empty/);
  assert.throws(() => buildCertificateDecision({ stagingEvidenceBytes: jsonBytes(staging), targetHost: 'hub.example.test', runbookBytes: Buffer.from('runbook'), rollbackPlanBytes: prerequisite('PILOT_DELETION_PLAN', 'hub.example.test'), budgetRecordBytes: prerequisite('PRODUCTION_BUDGET_BOUND', 'hub.example.test'), completedAt: '2026-08-16T00:01:00Z' }), /type invalid/);
  assert.throws(() => buildPilotDecision({ productionTlsEvidenceBytes: jsonBytes(productionTls()), productId: 'bai-video-production', scopes: ['evidence:write'], limits: { max_installations: 1, max_events: 10, max_days: 2 }, privacyReviewBytes: prerequisite('PILOT_PRIVACY_REVIEW', 'bai-video-production'), deletionPlanBytes: prerequisite('PILOT_DELETION_PLAN', 'bai-video-production'), credentialRevocationPlanBytes: prerequisite('PILOT_CREDENTIAL_REVOCATION_PLAN', 'bai-video-production'), productRollbackBytes: prerequisite('PILOT_PRODUCT_ROLLBACK', 'bai-video-production'), completedAt: '2026-08-16T00:03:00Z' }), /authentic Production TLS/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-tls-shape-')); const file = path.join(dir, 'tls.json'); fs.writeFileSync(file, jsonBytes(productionTls()));
  const cli = spawnSync(process.execPath, ['scripts/validate-knowledge-hub-remaining-deployment-gates.mjs', 'productionTls', file], { encoding: 'utf8' }); assert.equal(cli.status, 0); const output = JSON.parse(cli.stdout); assert.equal(output.status, 'SHAPE_ONLY_PASS'); assert.equal(output.operational_pass, false); assert.equal(output.authority_verified, false); fs.rmSync(dir, { recursive: true, force: true });
});

test('pilot scope, cap and no-effect boundaries fail closed', () => {
  const cap = pilot(); cap.limits.max_events = 1001; assert.throws(() => validatePilotDecision(cap), /ceiling/);
  const duplicate = pilot(); duplicate.scopes = ['evidence:write', 'evidence:write']; assert.throws(() => validatePilotDecision(duplicate), /duplicate/);
  const unknown = pilot(); unknown.scopes = ['admin:all']; assert.throws(() => validatePilotDecision(unknown), /allowlist/);
  const issued = pilot(); issued.effects.credential_issued = true; assert.throws(() => validatePilotDecision(issued), /effect inflation/);
});

test('all new deployment schemas are closed', () => {
  const names = ['knowledge-hub-backup-source-manifest.schema.json', 'knowledge-hub-backup-source-authorization.schema.json', 'knowledge-hub-backup-source-authorization-consumption.schema.json', 'knowledge-hub-rehearsal-recovery-authorization.schema.json', 'knowledge-hub-rehearsal-target-authorization.schema.json', 'knowledge-hub-rehearsal-authority-trust-root.schema.json', 'knowledge-hub-rehearsal-authority-revocations.schema.json', 'knowledge-hub-rehearsal-authority-head.schema.json', 'knowledge-hub-rehearsal-authority-audit-checkpoints.schema.json', 'knowledge-hub-rehearsal-post-effect-completion.schema.json', 'knowledge-hub-backup-restore-rehearsal-evidence.schema.json', 'knowledge-hub-backup-rehearsal-bundle.schema.json', 'knowledge-hub-gate-prerequisite-evidence.schema.json', 'knowledge-hub-production-certificate-decision.schema.json', 'knowledge-hub-production-tls-evidence.schema.json', 'knowledge-hub-limited-product-pilot-decision.schema.json'];
  for (const name of names) assert.equal(JSON.parse(fs.readFileSync(`schemas/knowledge-evolution/${name}`, 'utf8')).additionalProperties, false, name);
});

test('Ajv Draft 2020-12 validates all sixteen contracts and field mutation matrix', () => {
  const signed = signedTarget();
  const sourceConsumption = { schema_version: '1.0', result: 'BACKUP_SOURCE_AUTHORIZATION_CONSUMED', authority_receipt_sha256: sha('1'), execution_nonce_sha256: sha('2'), consumed_at: '2026-08-16T00:00:01Z', effect_deadline_at: '2026-08-17T00:00:00Z' };
  const auditCheckpoints = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_AUDIT_CHECKPOINTS', owner_anchor_id: 'OWNER-AUDIT-ROOT-1', checkpoints: [{ issuer_id: signed.receipt.issuer_id, authority_epoch: signed.receipt.authority_epoch, trust_root_sha256: digest(signed.trustRootBytes), revocation_registry_sha256: digest(signed.revocationBytes), authority_head_sha256: digest(signed.authorityHeadBytes), effect_window_started_at: '2026-08-16T00:00:00Z', effect_window_ended_at: '2026-08-17T00:00:00Z' }], updated_at: '2026-08-17T00:00:00Z' };
  const postEffect = { schema_version: '1.0', result: 'REHEARSAL_POST_EFFECT_COMPLETED', run_id: 'run-1', authority_receipt_sha256: sha('3'), execution_nonce_sha256: sha('5'), evidence_sha256: sha('1'), recovery_journal_safe_entry_sha256: sha('9'), database_absent: true, temporary_plaintext_absent: true, completed_at: '2026-08-16T00:00:09Z' };
  const marker = { schema_version: '1.0', result: 'LOCAL_BACKUP_REHEARSAL_BUNDLE_COMMITTED', run_id: 'run-1', evidence_sha256: sha('1'), ciphertext_sha256: sha('2'), ciphertext_bytes: 10, authorization_receipt_sha256: sha('3'), authorization_consumption_sha256: sha('4'), post_effect_completion_sha256: digest(jsonBytes(postEffect)), execution_nonce_sha256: sha('5'), authority_id: 'OWNER-T17-REHEARSAL-1', authority_epoch: 7, revocation_registry_sha256: digest(signed.revocationBytes), source_manifest_sha256: sha('6'), source_sidecar_sha256: sha('7'), source_commit_sha256: sha('8'), committed_at: '2026-08-16T00:00:10Z' };
  const instances = new Map([
    ['knowledge-hub-backup-source-manifest.schema.json', sourceManifest()],
    ['knowledge-hub-backup-source-authorization.schema.json', sourceAuthorization()],
    ['knowledge-hub-backup-source-authorization-consumption.schema.json', sourceConsumption],
    ['knowledge-hub-rehearsal-recovery-authorization.schema.json', recoveryAuthorization()],
    ['knowledge-hub-rehearsal-target-authorization.schema.json', signed.receipt],
    ['knowledge-hub-rehearsal-authority-trust-root.schema.json', JSON.parse(signed.trustRootBytes)],
    ['knowledge-hub-rehearsal-authority-revocations.schema.json', JSON.parse(signed.revocationBytes)],
    ['knowledge-hub-rehearsal-authority-head.schema.json', JSON.parse(signed.authorityHeadBytes)],
    ['knowledge-hub-rehearsal-authority-audit-checkpoints.schema.json', auditCheckpoints],
    ['knowledge-hub-rehearsal-post-effect-completion.schema.json', postEffect],
    ['knowledge-hub-backup-restore-rehearsal-evidence.schema.json', backup()],
    ['knowledge-hub-backup-rehearsal-bundle.schema.json', marker],
    ['knowledge-hub-gate-prerequisite-evidence.schema.json', JSON.parse(prerequisite('PRODUCTION_BUDGET_BOUND', 'hub.example.test'))],
    ['knowledge-hub-production-certificate-decision.schema.json', certificate()],
    ['knowledge-hub-production-tls-evidence.schema.json', productionTls()],
    ['knowledge-hub-limited-product-pilot-decision.schema.json', pilot()]
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true }); addFormats(ajv);
  const deleteAt = (value, pathParts) => { const clone = structuredClone(value); let parent = clone; for (const part of pathParts.slice(0, -1)) parent = parent[part]; delete parent[pathParts.at(-1)]; return clone; };
  const requiredPaths = (schema, prefix = []) => [
    ...(schema.required ?? []).map((key) => [...prefix, key]),
    ...Object.entries(schema.properties ?? {}).flatMap(([key, child]) => requiredPaths(child, [...prefix, key]))
  ];
  const validators = new Map();
  for (const [name, instance] of instances) {
    const schema = JSON.parse(fs.readFileSync(`schemas/knowledge-evolution/${name}`, 'utf8')); assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema'); const validate = ajv.compile(schema);
    validators.set(name, validate);
    assert.equal(validate(instance), true, `${name}: ${ajv.errorsText(validate.errors)}`);
    assert.equal(validate({ ...instance, unexpected: true }), false, `${name}: additional property`);
    for (const requiredPath of requiredPaths(schema)) assert.equal(validate(deleteAt(instance, requiredPath)), false, `${name}: missing ${requiredPath.join('.')}`);
  }
  const offset = sourceManifest(); offset.created_at = '2026-08-16T09:00:00+09:00'; assert.equal(validators.get('knowledge-hub-backup-source-manifest.schema.json')(offset), false, 'UTC Z parity'); assert.throws(() => validateBackupSourceManifest(offset), /created_at/);
});

test('restore-list validator admits only closed data/schema objects', () => {
  const tables = ['api_credentials', 'client_policies', 'delivery_receipts', 'evidence_events', 'schema_migrations'];
  const bodies = ['ENCODING - ENCODING', 'STDSTRINGS - STDSTRINGS', 'SEARCHPATH - SEARCHPATH', 'SCHEMA - public owner', ...tables.flatMap((name) => [`TABLE public ${name} owner`, `TABLE DATA public ${name} owner`]), 'DEFAULT public client_policies updated_at owner', 'DEFAULT public schema_migrations applied_at owner', 'CONSTRAINT public api_credentials api_credentials_pkey owner', 'CONSTRAINT public api_credentials api_credentials_status_check owner', 'CONSTRAINT public client_policies client_policies_pkey owner', 'CONSTRAINT public delivery_receipts delivery_receipts_pkey owner', 'CONSTRAINT public evidence_events evidence_events_pkey owner', 'CONSTRAINT public schema_migrations schema_migrations_pkey owner', ...['api_credentials_expires_at_idx', 'api_credentials_product_status_idx', 'delivery_receipts_batch_idx', 'evidence_events_expires_at_idx', 'evidence_events_product_type_idx', 'evidence_events_received_at_idx'].map((name) => `INDEX public ${name} owner`), 'PRE_DATA_BOUNDARY - PRE_DATA_BOUNDARY', 'POST_DATA_BOUNDARY - POST_DATA_BOUNDARY'];
  const archive = (rows) => `; Archive created at 2026-08-16\n${rows.map((body, index) => `${index + 1}; 0 0 ${body}`).join('\n')}\n`;
  const safe = archive(bodies); assert.equal(validateKnowledgeHubRestoreList(safe).entries, 30);
  for (const index of [0, 3, 5, 14, 16, 22, 29]) assert.throws(() => validateKnowledgeHubRestoreList(archive(bodies.filter((_, position) => position !== index))), /exactly 30 Hub coordinates|missing required Hub coordinates/);
  assert.throws(() => validateKnowledgeHubRestoreList(archive([...bodies, 'TABLE DATA public api_credentials owner'])), /duplicate archive coordinate/);
  assert.throws(() => validateKnowledgeHubRestoreList(archive([...bodies, 'CONSTRAINT public evidence_events api_credentials_status_check owner'])), /exact Hub allowlist|exact Phase-0 inventory/);
  for (const body of ['FUNCTION public hostile owner', 'TRIGGER public hostile owner', 'EXTENSION public hostile owner', 'DEFAULT ACL public hostile owner', 'TABLE ATTACH public hostile owner', 'TABLE HOSTILE public hostile owner', 'RULE public hostile owner', 'MATERIALIZED VIEW public hostile owner', 'TABLE public unknown_table owner', 'INDEX public unknown_idx owner', 'TABLE DATA public evidence_events owner EXTRA']) assert.throws(() => validateKnowledgeHubRestoreList(`1; 0 0 ${body}\n`), /exact Hub allowlist/);
});

test('schema SQL validator rejects cluster-scope commands with an otherwise exact inventory', () => {
  const safe = fs.readFileSync('tests/knowledge-hub/fixtures/phase0-schema.sql', 'utf8');
  assert.match(validateKnowledgeHubSchemaSql(safe).schema_semantics_sha256, /^[a-f0-9]{64}$/);
  assert.throws(() => validateKnowledgeHubSchemaSql(`${safe}\nALTER/**/ ROLE bai_restore_rehearsal PASSWORD 'stolen';`), /allowlist/);
  assert.throws(() => validateKnowledgeHubSchemaSql(`${safe}\nCOPY public.evidence_events TO PROGRAM 'id';`), /TABLE DATA COPY/);
  assert.throws(() => validateKnowledgeHubSchemaSql(`${safe}\nCREATE INDEX evidence_events_received_at_idx ON public.evidence_events USING btree (received_at);`), /exactly one/);
  assert.throws(() => validateKnowledgeHubSchemaSql(safe.replace('CREATE INDEX evidence_events_received_at_idx ON public.evidence_events', 'CREATE INDEX evidence_events_received_at_idx ON public.api_credentials')), /outside the exact|index definition/);
});

test('backup harness binds signed authority, source closure and committed bundle without network commands', () => {
  const script = fs.readFileSync('deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh', 'utf8');
  const producer = fs.readFileSync('deploy/knowledge-hub/scripts/backup-postgres.sh', 'utf8'); const snapshotProducer = fs.readFileSync('deploy/knowledge-hub/runtime/create-consistent-backup.mjs', 'utf8');
  const verifier = fs.readFileSync('scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs', 'utf8');
  assert.equal((script.match(/verify_authority/g) || []).length >= 4, true); assert.match(script, /BACKUP_MANIFEST_FILE/); assert.match(script, /BACKUP_SOURCE_COMMIT_FILE/); assert.match(script, /cp --no-clobber "\$BACKUP_FILE" "\$encrypted_tmp"/); assert.doesNotMatch(script, /age --recipient/); assert.match(script, /toolchain_manifest_sha256/); assert.match(script, /protected toolchain differs from target authorization/); assert.match(script, /AUTHORIZATION_CONSUMPTION_DIR/); assert.match(script, /PLAINTEXT_TMPFS_ROOT/); assert.match(script, /recovery-journal\.jsonl/); assert.match(script, /table_counts/); assert.match(script, /migration_set_sha256/); assert.match(script, /commit-knowledge-hub-backup-rehearsal-bundle\.mjs/); assert.match(verifier, /\/etc\/bai-development-os\/knowledge-hub\/rehearsal-authority-trust-root\.json/); assert.match(verifier, /canonical authority file protection invalid/);
  assert.match(script, /TRUSTED_REHEARSAL_REPOSITORY='\/opt\/bai-development-os'/); assert.match(script, /snapshot_ordinary/); assert.match(script, /PLAINTEXT_CREATE_STARTED/); assert.match(script, /DATABASE_CREATE_STARTED/);
  assert.doesNotMatch(script, /\b(curl|wget|scp|rsync|rclone|aws|az|gsutil)\b/); assert.doesNotMatch(script, /acme|ufw|firewall-cmd/);
  assert.match(producer, /runtime\/create-consistent-backup\.mjs/); assert.match(producer, /node_modules\/pg/); assert.match(snapshotProducer, /pg_export_snapshot/); assert.match(snapshotProducer, /--snapshot=/); assert.match(snapshotProducer, /BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/); assert.match(snapshotProducer, /source_exported_snapshot_sha256/); assert.match(snapshotProducer, /COMMITTED\.json/);
  assert.match(script, /NODE_OPTIONS NODE_PATH LD_PRELOAD/); assert.match(script, /ulimit -c 0/); assert.match(script, /\/proc\/swaps/); assert.match(script, /flock --shared 9/); assert.match(script, /0:0:0:0:0:0:0:-1:1:1/);
  assert.match(producer, /NODE_OPTIONS NODE_PATH LD_PRELOAD/); assert.match(producer, /canonical-source/); assert.match(producer, /BACKUP_SOURCE_AUTHORIZATION_FILE/); assert.match(producer, /SOURCE_AUTHORIZATION_CONSUMPTION_DIR/); assert.match(producer, /flock --shared 9/);
  for (const unit of ['bai-knowledge-hub-source-backup.service', 'bai-knowledge-hub-restore-rehearsal.service', 'bai-knowledge-hub-rehearsal-recovery.service']) { const body = fs.readFileSync(`deploy/knowledge-hub/systemd/${unit}`, 'utf8'); assert.match(body, /^User=root$/m); assert.match(body, /^UnsetEnvironment=.*NODE_OPTIONS.*BASH_ENV|^UnsetEnvironment=.*BASH_ENV.*NODE_OPTIONS/m); assert.match(body, /\/usr\/bin\/flock --shared \/etc\/bai-development-os\/knowledge-hub\/rehearsal-authority\.lock/); assert.match(body, /^LimitCORE=0$/m); assert.match(body, /^PrivateNetwork=yes$/m); }
});

test('recovery journal is fsync-oriented, hash chained and reports interrupted state', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-journal-')); const file = path.join(root, 'recovery-journal.jsonl');
  const state = { run_id: 'run-1', restore_database: 'knowledge_hub_restore_rehearsal', postgres_socket_identity_sha256: sha('1'), target_cluster_identifier_sha256: sha('2'), phase: 'RESERVED', temporary_plaintext_path: path.join(root, 'plain.dump'), database_created: false, database_dropped: true, temporary_plaintext_deleted: true };
  appendRecoveryJournal(file, state, '2026-08-16T00:00:00Z'); assert.equal(inspectRecoveryJournal(file).requires_recovery, true);
  appendRecoveryJournal(file, { ...state, phase: 'AUTHORIZATION_CONSUMED' }, '2026-08-16T00:00:00.1Z');
  appendRecoveryJournal(file, { ...state, phase: 'PLAINTEXT_CREATE_STARTED', temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.2Z');
  appendRecoveryJournal(file, { ...state, phase: 'PLAINTEXT_CREATED', temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.3Z');
  appendRecoveryJournal(file, { ...state, phase: 'DATABASE_CREATE_STARTED', database_created: true, database_dropped: false, temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.4Z');
  appendRecoveryJournal(file, { ...state, phase: 'DATABASE_CREATED', database_created: true, database_dropped: false, temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.5Z');
  appendRecoveryJournal(file, { ...state, phase: 'DATABASE_DROPPED', temporary_plaintext_deleted: false }, '2026-08-16T00:00:00.6Z');
  appendRecoveryJournal(file, { ...state, phase: 'PLAINTEXT_DELETED' }, '2026-08-16T00:00:00.7Z');
  assert.throws(() => appendRecoveryJournal(file, { ...state, phase: 'RECOVERED', database_dropped: false }, '2026-08-16T00:00:00.8Z'), /transition|safety|canonical recovery authority/);
  appendRecoveryJournal(file, { ...state, phase: 'BUNDLE_COMMITTED' }, '2026-08-16T00:00:01Z'); const terminal = inspectRecoveryJournal(file); assert.equal(terminal.entries, 9); assert.equal(terminal.requires_recovery, false);
  fs.appendFileSync(file, '{'); assert.throws(() => inspectRecoveryJournal(file), /truncated|JSON/); fs.rmSync(root, { recursive: true, force: true });
});

test('backup producer binds pg_dump and manifest queries to one exported transaction snapshot', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-source-'));
  const calls = [];
  class FakeClient {
    async connect() { calls.push('connect'); }
    async query(sql) {
      calls.push(sql);
      if (sql.includes('pg_export_snapshot')) return { rows: [{ snapshot_id: '00000003-0000001B-1' }] };
      if (sql.includes('pg_control_system')) return { rows: [{ system_identifier: '123456789', evidence_events: '4', delivery_receipts: '3', client_policies: '1', api_credentials: '2', schema_migrations: '2', migration_set: '001:a,002:b' }] };
      return { rows: [] };
    }
    async end() { calls.push('end'); }
  }
  const dumpCalls = [];
  const result = await createConsistentKnowledgeHubBackup({
    backupDir: root, plaintextDir: root, env: { PGHOST: '/run/postgresql', PGPORT: '5432', PGDATABASE: 'knowledge_hub', PGUSER: 'backup', AGE_RECIPIENT: 'age1-test-recipient', BAI_SOURCE_AUTHORITY_RECEIPT_SHA256: sha('f'), BAI_SOURCE_AUTHORITY_CONSUMPTION_SHA256: sha('0'), BAI_AUTHORIZED_SOURCE_CLUSTER_SHA256: digest(Buffer.from('123456789')) }, now: new Date('2026-08-16T00:00:00Z'), clientFactory: FakeClient,
    producerAttestation: producerAttestation(),
    archiveInspector: () => ({ archive_toc_sha256: sha('b'), schema_sql_sha256: sha('c'), schema_semantics_sha256: sha('e'), archive_inventory_entries: 30 }),
    encryptBackup: async (input, output) => { fs.writeFileSync(output, `encrypted:${fs.readFileSync(input, 'utf8')}`); },
    runDump: async (args) => { dumpCalls.push(args); const output = args.find((arg) => arg.startsWith('--file=')).slice(7); fs.writeFileSync(output, 'same-snapshot-dump'); }
  });
  assert.deepEqual(calls.slice(0, 3), ['connect', 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY', 'SELECT pg_export_snapshot() AS snapshot_id']); assert.match(calls[3], /api_credentials/); assert.equal(calls[4], 'ROLLBACK'); assert.equal(calls.at(-1), 'end');
  assert.equal(dumpCalls.length, 1); assert.equal(dumpCalls[0].includes('--snapshot=00000003-0000001B-1'), true);
  const manifest = JSON.parse(fs.readFileSync(result.manifestFile, 'utf8')); assert.deepEqual(manifest.table_counts, tableCounts()); assert.equal(manifest.backup_plaintext_bytes, Buffer.byteLength('same-snapshot-dump')); assert.equal(manifest.backup_ciphertext_sha256, digest(fs.readFileSync(result.backupFile))); assert.deepEqual(manifest.producer, producerAttestation()); assert.equal(fs.existsSync(result.markerFile), true); assert.equal(fs.readdirSync(root).some((entry) => entry.endsWith('.dump')), false);
  const sourceSet = { cipherBytes: fs.readFileSync(result.backupFile), sidecarBytes: fs.readFileSync(`${result.backupFile}.sha256`), commitBytes: fs.readFileSync(result.markerFile), sourceManifestBytes: fs.readFileSync(result.manifestFile) };
  assert.equal(validateBackupSourceArtifactSet(sourceSet).sidecar_filename, path.basename(result.backupFile));
  assert.throws(() => validateBackupSourceArtifactSet({ ...sourceSet, sidecarBytes: Buffer.from(`${sha('0')}  ${path.basename(result.backupFile)}\n`) }), /sidecar or ciphertext/);
  const earlyCommit = JSON.parse(sourceSet.commitBytes); earlyCommit.committed_at = '2026-08-15T23:59:59Z';
  assert.throws(() => validateBackupSourceArtifactSet({ ...sourceSet, commitBytes: jsonBytes(earlyCommit) }), /precedes/);
  assert.equal(fs.existsSync(path.join(result.runDir, 'PLAINTEXT-RECOVERY.json')), false); assert.equal(fs.existsSync(path.join(result.runDir, 'PLAINTEXT-RECOVERY-CLOSED.json')), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test('backup producer never commits when the exported-snapshot dump fails', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-source-fail-')); const calls = [];
  class FakeClient { async connect() {} async query(sql) { calls.push(sql); if (sql.includes('pg_export_snapshot')) return { rows: [{ snapshot_id: '00000003-0000001B-1' }] }; if (sql.includes('pg_control_system')) return { rows: [{ system_identifier: '1', evidence_events: '1', delivery_receipts: '0', client_policies: '0', api_credentials: '0', schema_migrations: '1', migration_set: '001:a' }] }; return { rows: [] }; } async end() {} }
  await assert.rejects(() => createConsistentKnowledgeHubBackup({ backupDir: root, plaintextDir: root, env: { PGHOST: '/run/postgresql', PGDATABASE: 'knowledge_hub', PGUSER: 'backup', AGE_RECIPIENT: 'age1-test-recipient', BAI_SOURCE_AUTHORITY_RECEIPT_SHA256: sha('f'), BAI_SOURCE_AUTHORITY_CONSUMPTION_SHA256: sha('0'), BAI_AUTHORIZED_SOURCE_CLUSTER_SHA256: digest(Buffer.from('1')) }, clientFactory: FakeClient, producerAttestation: producerAttestation(), archiveInspector: () => ({ archive_toc_sha256: sha('b'), schema_sql_sha256: sha('c'), schema_semantics_sha256: sha('e'), archive_inventory_entries: 30 }), encryptBackup: async (input, output) => { fs.copyFileSync(input, output); }, runDump: async () => { throw new Error('concurrent mutation simulation'); } }), /concurrent mutation simulation/);
  assert.equal(calls.filter((sql) => sql === 'ROLLBACK').length, 1); assert.equal(fs.readdirSync(root).some((entry) => fs.existsSync(path.join(root, entry, 'COMMITTED.json'))), false); fs.rmSync(root, { recursive: true, force: true });
});

test('static checker and JavaScript syntax pass', () => {
  for (const file of ['scripts/validate-knowledge-hub-remaining-deployment-gates.mjs', 'scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs', 'scripts/validate-knowledge-hub-pg-restore-list.mjs', 'scripts/validate-knowledge-hub-schema-sql.mjs', 'scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs', 'scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs', 'scripts/recover-knowledge-hub-rehearsal.mjs', 'deploy/knowledge-hub/runtime/create-consistent-backup.mjs', 'scripts/build-knowledge-hub-decision-readiness.mjs']) { const parsed = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' }); assert.equal(parsed.status, 0, parsed.stderr); }
  const checked = spawnSync(process.execPath, ['scripts/check-knowledge-hub-remaining-deployment-gates.mjs'], { encoding: 'utf8' }); assert.equal(checked.status, 0, checked.stderr); assert.match(checked.stdout, /"status": "PASS"/);
});
