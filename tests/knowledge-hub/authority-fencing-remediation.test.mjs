import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  auditHistoricalBackupSourceAuthorityArtifactSet,
  signedAuthorizationPayload,
  verifyHistoricalAuthorizationForAudit
} from '../../scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs';
import {
  validateBackupSourceAuthorization,
  validateBackupSourceAuthorizationConsumption
} from '../../scripts/validate-knowledge-hub-remaining-deployment-gates.mjs';

const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value)}\n`);
const sha = (character) => character.repeat(64);

function historicalSourceSet() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const trust = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_TRUST_ROOT', issuer_id: 'owner-root-1', algorithm: 'ED25519', public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }) };
  const revocations = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_REVOCATIONS', issuer_id: 'owner-root-1', authority_epoch: 9, revoked_authority_ids: [], updated_at: '2026-08-16T00:00:00Z' };
  const trustRootBytes = jsonBytes(trust); const revocationBytes = jsonBytes(revocations);
  const head = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_CURRENT_HEAD', issuer_id: 'owner-root-1', authority_epoch: 9, trust_root_sha256: digest(trustRootBytes), revocation_registry_sha256: digest(revocationBytes), updated_at: '2026-08-16T00:00:00Z' };
  const authorityHeadBytes = jsonBytes(head);
  const ownerCheckpointBytes = jsonBytes({
    schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_AUDIT_CHECKPOINTS', owner_anchor_id: 'OWNER-AUDIT-ROOT-1',
    checkpoints: [{ issuer_id: trust.issuer_id, authority_epoch: revocations.authority_epoch, trust_root_sha256: digest(trustRootBytes), revocation_registry_sha256: digest(revocationBytes), authority_head_sha256: digest(authorityHeadBytes), effect_window_started_at: '2026-08-16T00:00:00Z', effect_window_ended_at: '2026-08-18T00:00:00Z' }],
    updated_at: '2026-08-18T00:00:00Z'
  });
  const receipt = {
    schema_version: '1.0', result: 'NON_PRODUCTION_BACKUP_SOURCE_AUTHORIZED', authority_id: 'OWNER-T17-SOURCE-AUDIT-1', issuer_id: 'owner-root-1', authority_epoch: 9,
    revocation_coordinate_sha256: digest(revocationBytes), environment: 'NON_PRODUCTION_BACKUP_SOURCE', source_database: 'knowledge_hub', source_cluster_identifier_sha256: sha('1'), postgres_socket_identity_sha256: sha('2'), age_recipient_fingerprint_sha256: sha('3'), backup_output_root_sha256: sha('4'), plaintext_tmpfs_root_sha256: sha('5'), runner_code_revision: '6'.repeat(40), toolchain_manifest_sha256: sha('7'), network_namespace_inode_sha256: sha('8'), boot_id_sha256: sha('9'), network_policy_sha256: sha('a'), execution_nonce_sha256: sha('b'), consumption_ledger_directory_sha256: sha('c'), network_egress_blocked: true, offsite_upload_authorized: false, owner_authorized: true, issued_at: '2026-08-16T00:00:00Z', expires_at: '2026-08-17T00:00:00Z', signed_payload_sha256: '', signature_base64: ''
  };
  const payload = signedAuthorizationPayload(receipt);
  receipt.signed_payload_sha256 = digest(payload);
  receipt.signature_base64 = crypto.sign(null, payload, privateKey).toString('base64');
  return { receipt, receiptBytes: jsonBytes(receipt), trustRootBytes, revocationBytes, authorityHeadBytes, ownerCheckpointBytes };
}

test('source producer uses a fixed verifier bootstrap and binds the complete runtime graph', () => {
  const shell = fs.readFileSync('deploy/knowledge-hub/scripts/backup-postgres.sh', 'utf8');
  const producer = fs.readFileSync('deploy/knowledge-hub/runtime/create-consistent-backup.mjs', 'utf8');
  assert.match(shell, /trusted_node_bin='\/usr\/bin\/node'/);
  assert.match(shell, /BAI_NODE_BIN.*fixed protected \/usr\/bin\/node verifier bootstrap/);
  assert.doesNotMatch(shell, /"\$BAI_NODE_BIN" "\$repo_root\/scripts\/verify-knowledge-hub/);
  for (const helper of ['verify-knowledge-hub-rehearsal-target-authorization.mjs', 'validate-knowledge-hub-pg-restore-list.mjs', 'validate-knowledge-hub-schema-sql.mjs']) assert.match(shell, new RegExp(helper.replaceAll('.', '\\.')));
  assert.match(shell, /producer-runtime-graph/); assert.match(shell, /producer-node-modules/);
  assert.match(producer, /PRODUCER_SOURCE_GRAPH/); assert.match(producer, /runtime_dependency_tree_sha256/);
  assert.match(producer, /authority effect deadline elapsed/); assert.match(producer, /SIGKILL/);
  for (const artifact of ['SOURCE-AUTHORIZATION.json', 'SOURCE-AUTHORIZATION-CONSUMPTION.json', 'SOURCE-AUTHORITY-TRUST-ROOT.json', 'SOURCE-AUTHORITY-REVOCATIONS.json', 'SOURCE-AUTHORITY-HEAD.json']) assert.match(producer, new RegExp(artifact.replaceAll('.', '\\.')));
});

test('target effects are deadline-bounded and fenced by the full restore-role/session graph', () => {
  const shell = fs.readFileSync('deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh', 'utf8');
  assert.match(shell, /AUTHORITY_FINALIZATION_RESERVE_SECONDS=5/);
  assert.match(shell, /timeout --foreground --kill-after=1s/);
  assert.match(shell, /sleep 0\.1/);
  assert.match(shell, /measure_executor_membership_graph/);
  assert.match(shell, /pg_stat_activity WHERE backend_type='client backend'/);
  assert.match(shell, /exact lease\/executor backend session fence/);
  assert.match(shell, /historical-source-bundle/);
  assert.match(shell, /historical-target-bundle/);
  for (const artifact of ['target-authority-trust-root.json', 'target-authority-revocations.json', 'target-authority-head.json']) assert.match(shell, new RegExp(artifact.replaceAll('.', '\\.')));
  assert.match(shell, /verify_target_state\nvalidate_remaining=/);
  assert.match(shell, /scripts\/validate-knowledge-hub-schema-sql\.mjs/);
});

test('authorization validators impose bounded TTL and typed source consumption deadlines', () => {
  const source = historicalSourceSet().receipt;
  assert.equal(validateBackupSourceAuthorization(source, { now: Date.parse('2026-08-16T00:01:00Z') }).authority_id, source.authority_id);
  assert.throws(() => validateBackupSourceAuthorization({ ...source, expires_at: '2026-08-17T00:00:01Z' }, { now: Date.parse('2026-08-16T00:01:00Z') }), /bounded TTL/);
  const consumption = { schema_version: '1.0', result: 'BACKUP_SOURCE_AUTHORIZATION_CONSUMED', authority_receipt_sha256: sha('d'), execution_nonce_sha256: sha('e'), consumed_at: '2026-08-16T00:00:01Z', effect_deadline_at: '2026-08-17T00:00:00Z' };
  assert.equal(validateBackupSourceAuthorizationConsumption(consumption).effect_deadline_at, source.expires_at);
  assert.throws(() => validateBackupSourceAuthorizationConsumption({ ...consumption, effect_deadline_at: consumption.consumed_at }), /time invalid/);
});

test('historical audit verifies expired-at-present evidence without minting execution authority', () => {
  const set = historicalSourceSet();
  const audited = verifyHistoricalAuthorizationForAudit({ ...set, effectAt: '2026-08-16T00:00:01Z', validateReceipt: validateBackupSourceAuthorization });
  assert.equal(audited.audit_only, true); assert.equal(audited.execution_authority, false);
  assert.throws(() => verifyHistoricalAuthorizationForAudit({ ...set, effectAt: '2026-08-18T00:00:00Z', validateReceipt: validateBackupSourceAuthorization }), /not current|not fresh/);
});

test('historical source bundle audit binds embedded receipt and consumption bytes through source commit', () => {
  const set = historicalSourceSet(); const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-authority-audit-')); const inputs = path.join(root, 'inputs'); fs.mkdirSync(inputs);
  const consumption = { schema_version: '1.0', result: 'BACKUP_SOURCE_AUTHORIZATION_CONSUMED', authority_receipt_sha256: digest(set.receiptBytes), execution_nonce_sha256: set.receipt.execution_nonce_sha256, consumed_at: '2026-08-16T00:00:01Z', effect_deadline_at: set.receipt.expires_at };
  const consumptionBytes = jsonBytes(consumption);
  const producer = { code_revision: '6'.repeat(40), producer_source_sha256: sha('1'), runtime_lock_sha256: sha('2'), runtime_dependency_tree_sha256: sha('3'), node_binary_sha256: sha('4'), node_version_sha256: sha('5'), pg_dump_binary_sha256: sha('6'), pg_dump_version_sha256: sha('7'), pg_restore_binary_sha256: sha('8'), pg_restore_version_sha256: sha('9'), age_binary_sha256: sha('a'), age_version_sha256: sha('b') };
  const manifest = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_BACKUP_SOURCE_MANIFEST', source_authorization: { receipt_sha256: digest(set.receiptBytes), consumption_receipt_sha256: digest(consumptionBytes) }, backup_plaintext_sha256: sha('1'), backup_plaintext_bytes: 10, backup_ciphertext_sha256: sha('2'), backup_ciphertext_bytes: 20, encryption: { format: 'age-v1', recipient_fingerprint_sha256: sha('3'), plaintext_persisted: false }, archive_toc_sha256: sha('4'), schema_sql_sha256: sha('5'), schema_semantics_sha256: sha('6'), source_cluster_identifier_sha256: sha('7'), source_exported_snapshot_sha256: sha('8'), table_counts: { evidence_events: 1, delivery_receipts: 0, client_policies: 0, api_credentials: 0, schema_migrations: 1 }, migration_set_sha256: sha('9'), producer, created_at: '2026-08-16T00:00:02Z' };
  const manifestBytes = jsonBytes(manifest);
  const commit = { schema_version: '1.0', result: 'KNOWLEDGE_HUB_BACKUP_SOURCE_COMMITTED', backup_plaintext_sha256: manifest.backup_plaintext_sha256, backup_ciphertext_sha256: manifest.backup_ciphertext_sha256, source_manifest_sha256: digest(manifestBytes), committed_at: '2026-08-16T00:00:03Z' };
  for (const [name, bytes] of [['source-authorization.json', set.receiptBytes], ['source-authorization-consumption.json', consumptionBytes], ['source-authority-trust-root.json', set.trustRootBytes], ['source-authority-revocations.json', set.revocationBytes], ['source-authority-head.json', set.authorityHeadBytes], ['backup.dump.manifest.json', manifestBytes], ['SOURCE-COMMITTED.json', jsonBytes(commit)]]) fs.writeFileSync(path.join(inputs, name), bytes);
  try {
    const audit = auditHistoricalBackupSourceAuthorityArtifactSet(root, { ownerCheckpointBytes: set.ownerCheckpointBytes }); assert.equal(audit.audit_only, true); assert.equal(audit.execution_authority, false);
    fs.writeFileSync(path.join(inputs, 'source-authorization-consumption.json'), jsonBytes({ ...consumption, execution_nonce_sha256: sha('f') }));
    assert.throws(() => auditHistoricalBackupSourceAuthorityArtifactSet(root, { ownerCheckpointBytes: set.ownerCheckpointBytes }), /binding mismatch|artifact mismatch/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
