import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import Ajv2020 from '../../deploy/knowledge-hub/runtime/node_modules/ajv/dist/2020.js';
import addFormats from '../../deploy/knowledge-hub/runtime/node_modules/ajv-formats/dist/index.js';
import { validateRehearsalTargetAuthorization, validateBackupSourceAuthorization } from '../../scripts/validate-knowledge-hub-remaining-deployment-gates.mjs';
import { signedAuthorizationPayload, verifyHistoricalAuthorizationForAudit } from '../../scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs';
import { validateCanonicalConsumptionLedgerBinding } from '../../scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs';

const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value)}\n`);
const sha = (character) => character.repeat(64);

function signedSourceSet({ issuer = 'owner-root-1', epoch = 9, authority = 'OWNER-SOURCE-9' } = {}) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const trustRootBytes = jsonBytes({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_TRUST_ROOT', issuer_id: issuer, algorithm: 'ED25519', public_key_pem: publicKey.export({ type: 'spki', format: 'pem' }).toString() });
  const revocationBytes = jsonBytes({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_REVOCATIONS', issuer_id: issuer, authority_epoch: epoch, revoked_authority_ids: [], updated_at: '2026-08-16T00:00:00Z' });
  const authorityHeadBytes = jsonBytes({ schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_CURRENT_HEAD', issuer_id: issuer, authority_epoch: epoch, trust_root_sha256: digest(trustRootBytes), revocation_registry_sha256: digest(revocationBytes), updated_at: '2026-08-16T00:00:00Z' });
  const receipt = {
    schema_version: '1.0', result: 'NON_PRODUCTION_BACKUP_SOURCE_AUTHORIZED', authority_id: authority, issuer_id: issuer, authority_epoch: epoch,
    revocation_coordinate_sha256: digest(revocationBytes), environment: 'NON_PRODUCTION_BACKUP_SOURCE', source_database: 'knowledge_hub', source_cluster_identifier_sha256: sha('1'), postgres_socket_identity_sha256: sha('2'), age_recipient_fingerprint_sha256: sha('3'), backup_output_root_sha256: sha('4'), plaintext_tmpfs_root_sha256: sha('5'), runner_code_revision: '6'.repeat(40), toolchain_manifest_sha256: sha('7'), network_namespace_inode_sha256: sha('8'), boot_id_sha256: sha('9'), network_policy_sha256: sha('a'), execution_nonce_sha256: sha('b'), consumption_ledger_directory_sha256: sha('c'), network_egress_blocked: true, offsite_upload_authorized: false, owner_authorized: true, issued_at: '2026-08-16T00:00:00Z', expires_at: '2026-08-17T00:00:00Z', signed_payload_sha256: '', signature_base64: ''
  };
  const payload = signedAuthorizationPayload(receipt); receipt.signed_payload_sha256 = digest(payload); receipt.signature_base64 = crypto.sign(null, payload, privateKey).toString('base64');
  return { receipt, receiptBytes: jsonBytes(receipt), trustRootBytes, revocationBytes, authorityHeadBytes };
}

const checkpointBytes = (sets) => jsonBytes({
  schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_AUTHORITY_AUDIT_CHECKPOINTS', owner_anchor_id: 'OWNER-AUDIT-ROOT-1',
  checkpoints: sets.map((set) => ({ issuer_id: set.receipt.issuer_id, authority_epoch: set.receipt.authority_epoch, trust_root_sha256: digest(set.trustRootBytes), revocation_registry_sha256: digest(set.revocationBytes), authority_head_sha256: digest(set.authorityHeadBytes), effect_window_started_at: '2026-08-16T00:00:00Z', effect_window_ended_at: '2026-08-18T00:00:00Z' })),
  updated_at: '2026-08-18T00:00:00Z'
});

test('historical audit requires transitive Owner checkpoint provenance and survives authority rotation', () => {
  const historical = signedSourceSet(); const rotated = signedSourceSet({ epoch: 10, authority: 'OWNER-SOURCE-10' });
  assert.throws(() => verifyHistoricalAuthorizationForAudit({ ...historical, effectAt: '2026-08-16T00:00:01Z', validateReceipt: validateBackupSourceAuthorization }), /checkpoint required/);
  const audited = verifyHistoricalAuthorizationForAudit({ ...historical, ownerCheckpointBytes: checkpointBytes([historical, rotated]), effectAt: '2026-08-16T00:00:01Z', validateReceipt: validateBackupSourceAuthorization });
  assert.equal(audited.audit_only, true); assert.equal(audited.execution_authority, false); assert.equal(audited.owner_anchor_id, 'OWNER-AUDIT-ROOT-1'); assert.equal(audited.owner_checkpoint_provenance, 'SUPPLIED_UNANCHORED');
  const attacker = signedSourceSet({ epoch: historical.receipt.authority_epoch, authority: 'ATTACKER-FORGED' });
  assert.throws(() => verifyHistoricalAuthorizationForAudit({ ...attacker, ownerCheckpointBytes: checkpointBytes([historical, rotated]), effectAt: '2026-08-16T00:00:01Z', validateReceipt: validateBackupSourceAuthorization }), /not transitively bound/);
});

test('source consumption has a closed Draft 2020-12 schema', () => {
  const schema = JSON.parse(fs.readFileSync('schemas/knowledge-evolution/knowledge-hub-backup-source-authorization-consumption.schema.json', 'utf8'));
  const ajv = new Ajv2020({ strict: true, allErrors: true }); addFormats(ajv); const validate = ajv.compile(schema);
  const valid = { schema_version: '1.0', result: 'BACKUP_SOURCE_AUTHORIZATION_CONSUMED', authority_receipt_sha256: sha('1'), execution_nonce_sha256: sha('2'), consumed_at: '2026-08-16T00:00:01Z', effect_deadline_at: '2026-08-17T00:00:00Z' };
  assert.equal(validate(valid), true); assert.equal(validate({ ...valid, injected: true }), false); assert.equal(validate({ ...valid, authority_receipt_sha256: 'bad' }), false);
});

test('target authority requires a distinct bounded restore executor coordinate', () => {
  const target = {
    schema_version: '1.0', result: 'NON_PRODUCTION_REHEARSAL_TARGET_AUTHORIZED', authority_id: 'OWNER-TARGET-1', issuer_id: 'owner-root-1', authority_epoch: 9, revocation_coordinate_sha256: sha('1'), environment: 'NON_PRODUCTION_REHEARSAL', run_id: 'run-1', restore_database: 'knowledge_hub_restore_rehearsal', age_recipient_fingerprint_sha256: sha('2'), runner_code_revision: '4'.repeat(40), execution_nonce_sha256: sha('3'), consumption_ledger_directory_sha256: sha('4'), target_cluster_identifier_sha256: sha('5'), network_namespace_inode_sha256: sha('6'), boot_id_sha256: sha('7'), network_policy_sha256: sha('8'), postgres_socket_identity_sha256: sha('9'), toolchain_manifest_sha256: sha('a'), backup_plaintext_sha256: sha('b'), backup_manifest_sha256: sha('c'), restore_role: 'bai_restore_rehearsal', restore_executor_role: 'bai_restore_executor', restore_executor_pgpass_file_sha256: sha('d'), restore_executor_membership_graph_sha256: sha('e'), restore_executor_application_name: 'bai-kh-restore-run-1', restore_executor_lease_coordinate_sha256: sha('f'), allowed_database_suffix: '_restore_rehearsal', disposable_cluster: true, network_egress_blocked: true, production_target: false, owner_authorized: true, issued_at: '2026-08-16T00:00:00Z', expires_at: '2026-08-17T00:00:00Z', signed_payload_sha256: sha('0'), signature_base64: Buffer.alloc(64).toString('base64')
  };
  assert.equal(validateRehearsalTargetAuthorization(target, { now: Date.parse('2026-08-16T00:01:00Z') }).restore_executor_role, 'bai_restore_executor');
  assert.throws(() => validateRehearsalTargetAuthorization({ ...target, restore_executor_role: target.restore_role }, { now: Date.parse('2026-08-16T00:01:00Z') }), /dedicated executor/);
  assert.throws(() => validateRehearsalTargetAuthorization({ ...target, restore_executor_membership_graph_sha256: 'bad' }, { now: Date.parse('2026-08-16T00:01:00Z') }), /membership graph/);
});

test('committer consumption binding rejects noncanonical authority before considering copied bytes', () => {
  const bytes = jsonBytes({ schema_version: '1.0', result: 'REHEARSAL_AUTHORIZATION_CONSUMED', run_id: 'run-1', authority_receipt_sha256: sha('1'), execution_nonce_sha256: sha('2') });
  assert.throws(() => validateCanonicalConsumptionLedgerBinding({ canonicalConsumptionBytes: bytes, embeddedConsumptionBytes: bytes, verifiedAuthority: Object.freeze({ receipt: {} }), canonicalDirectoryIdentitySha256: sha('3') }), /canonical verified authority/);
  const source = fs.readFileSync('scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs', 'utf8');
  assert.match(source, /CANONICAL_AUTHORIZATION_CONSUMPTION_ROOT/); assert.match(source, /canonicalPostEffectCompletions = new WeakSet/); assert.match(source, /embedded authorization consumption differs from canonical ledger bytes/); assert.match(source, /run directory is not the authorization-bound canonical rehearsal directory/);
});
