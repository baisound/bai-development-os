#!/usr/bin/env node
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA256 = /^[a-f0-9]{64}$/;
const RFC3339_UTC = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;
const DATE_TIME = (value) => {
  if (typeof value !== 'string') return false;
  const match = RFC3339_UTC.exec(value); if (!match) return false;
  const [, year, month, day, hour, minute, second, fraction = '0'] = match;
  const timestamp = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, +fraction.padEnd(3, '0'));
  if (!Number.isFinite(timestamp)) return false;
  const date = new Date(timestamp);
  return date.getUTCFullYear() === +year && date.getUTCMonth() === +month - 1 && date.getUTCDate() === +day && date.getUTCHours() === +hour && date.getUTCMinutes() === +minute && date.getUTCSeconds() === +second;
};
const PILOT_SCOPES = new Set(['evidence:read', 'evidence:write', 'policy:read']);
const MAX_AUTHORIZATION_LIFETIME_MS = 86_400_000;

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const frozenClone = (value) => deepFreeze(structuredClone(value));

function validHost(value) {
  if (typeof value !== 'string' || value.length < 3 || value.length > 253) return false;
  if (net.isIP(value)) return true;
  if (!/^[A-Za-z0-9.-]+$/.test(value) || value.startsWith('.') || value.endsWith('.') || value.includes('..')) return false;
  const labels = value.split('.');
  return labels.length >= 2 && labels.every((label) => label.length >= 1 && label.length <= 63 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} object required`);
  return value;
}

function exactKeys(value, expected, label) {
  const keys = Object.keys(object(value, label)).sort();
  const wanted = [...expected].sort();
  if (keys.length !== wanted.length || keys.some((key, index) => key !== wanted[index])) {
    throw new Error(`${label} fields invalid: expected ${wanted.join(', ')}`);
  }
}

function sha(value, label) {
  if (!SHA256.test(value)) throw new Error(`${label} sha256 invalid`);
}

function noSecretKeys(value, label) {
  const forbidden = /password|raw[_-]?secret|secret[_-]?(value|material|content)|credential[_-]?(value|material|content)|private[_-]?key|identity[_-]?(file|content)|access[_-]?token/i;
  const visit = (node, current) => {
    if (!node || typeof node !== 'object') return;
    for (const [key, child] of Object.entries(node)) {
      if (forbidden.test(key)) throw new Error(`${label} secret-bearing field prohibited: ${current}${key}`);
      visit(child, `${current}${key}.`);
    }
  };
  visit(value, '');
}

export function validateBackupRestoreEvidence(value) {
  exactKeys(value, ['schema_version', 'result', 'target', 'backup', 'encryption', 'restore', 'provenance', 'effects', 'completed_at'], 'evidence');
  if (value.schema_version !== '1.0' || value.result !== 'LOCAL_ENCRYPTED_BACKUP_RESTORE_REHEARSAL_PASS') throw new Error('backup result invalid');
  exactKeys(value.target, ['environment', 'authorization_receipt_sha256', 'cluster_system_identifier_sha256', 'host_binding_sha256'], 'target');
  if (value.target.environment !== 'NON_PRODUCTION_REHEARSAL') throw new Error('target environment is not non-production rehearsal');
  for (const key of ['authorization_receipt_sha256', 'cluster_system_identifier_sha256', 'host_binding_sha256']) sha(value.target[key], key);
  exactKeys(value.backup, ['plaintext_sha256', 'plaintext_bytes', 'ciphertext_sha256', 'ciphertext_bytes'], 'backup');
  sha(value.backup.plaintext_sha256, 'plaintext');
  sha(value.backup.ciphertext_sha256, 'ciphertext');
  if (value.backup.plaintext_sha256 === value.backup.ciphertext_sha256) throw new Error('plaintext and ciphertext hashes must differ');
  for (const key of ['plaintext_bytes', 'ciphertext_bytes']) if (!Number.isSafeInteger(value.backup[key]) || value.backup[key] < 1) throw new Error(`${key} invalid`);
  exactKeys(value.encryption, ['format', 'recipient_fingerprint_sha256', 'identity_material_in_evidence'], 'encryption');
  if (value.encryption.format !== 'age-v1') throw new Error('encryption format invalid');
  sha(value.encryption.recipient_fingerprint_sha256, 'recipient fingerprint');
  if (value.encryption.identity_material_in_evidence !== false) throw new Error('identity material must not enter Evidence');
  exactKeys(value.restore, ['database', 'table_counts', 'migration_set_sha256', 'plaintext_hash_verified', 'database_dropped', 'temporary_plaintext_deleted'], 'restore');
  if (!/^[A-Za-z0-9_]+_restore_rehearsal$/.test(value.restore.database) || value.restore.database.length > 63) throw new Error('restore database is not isolated');
  exactKeys(value.restore.table_counts, ['evidence_events', 'delivery_receipts', 'client_policies', 'api_credentials', 'schema_migrations'], 'restored table counts');
  for (const [name, count] of Object.entries(value.restore.table_counts)) if (!Number.isSafeInteger(count) || count < (name === 'evidence_events' || name === 'schema_migrations' ? 1 : 0)) throw new Error(`${name} restored count invalid`);
  sha(value.restore.migration_set_sha256, 'restored migration set');
  if (value.restore.plaintext_hash_verified !== true || value.restore.database_dropped !== true || value.restore.temporary_plaintext_deleted !== true) throw new Error('restore cleanup incomplete');
  exactKeys(value.provenance, ['run_id', 'source_sidecar_sha256', 'source_manifest_sha256', 'source_commit_sha256', 'code_revision', 'age_version_sha256', 'postgres_tools_version_sha256', 'started_at', 'duration_seconds'], 'provenance');
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(value.provenance.run_id)) throw new Error('run_id invalid');
  for (const key of ['source_sidecar_sha256', 'source_manifest_sha256', 'source_commit_sha256', 'age_version_sha256', 'postgres_tools_version_sha256']) sha(value.provenance[key], key);
  if (!/^[a-f0-9]{40}$/.test(value.provenance.code_revision)) throw new Error('code_revision invalid');
  if (!DATE_TIME(value.provenance.started_at) || !Number.isSafeInteger(value.provenance.duration_seconds) || value.provenance.duration_seconds < 0 || value.provenance.duration_seconds > 86400) throw new Error('provenance timing invalid');
  exactKeys(value.effects, ['offsite_uploaded', 'production_database_mutated', 'production_certificate_issued', 'product_credential_issued'], 'effects');
  if (Object.values(value.effects).some((entry) => entry !== false)) throw new Error('operational effect inflation prohibited');
  if (!DATE_TIME(value.completed_at) || Date.parse(value.completed_at) !== Date.parse(value.provenance.started_at) + value.provenance.duration_seconds * 1000) throw new Error('completed_at invalid');
  noSecretKeys(value, 'backup Evidence');
  return frozenClone(value);
}

export function validateRehearsalTargetAuthorization(value, { now = Date.now() } = {}) {
  exactKeys(value, ['schema_version', 'result', 'authority_id', 'issuer_id', 'authority_epoch', 'revocation_coordinate_sha256', 'environment', 'run_id', 'restore_database', 'age_recipient_fingerprint_sha256', 'runner_code_revision', 'execution_nonce_sha256', 'consumption_ledger_directory_sha256', 'target_cluster_identifier_sha256', 'network_namespace_inode_sha256', 'boot_id_sha256', 'network_policy_sha256', 'postgres_socket_identity_sha256', 'toolchain_manifest_sha256', 'backup_plaintext_sha256', 'backup_manifest_sha256', 'restore_role', 'restore_executor_role', 'restore_executor_pgpass_file_sha256', 'restore_executor_membership_graph_sha256', 'restore_executor_application_name', 'restore_executor_lease_coordinate_sha256', 'allowed_database_suffix', 'disposable_cluster', 'network_egress_blocked', 'production_target', 'owner_authorized', 'issued_at', 'expires_at', 'signed_payload_sha256', 'signature_base64'], 'target authorization');
  if (value.schema_version !== '1.0' || value.result !== 'NON_PRODUCTION_REHEARSAL_TARGET_AUTHORIZED') throw new Error('target authorization result invalid');
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value.authority_id) || !/^[A-Za-z0-9._:-]{1,128}$/.test(value.issuer_id)) throw new Error('authority identity invalid');
  if (!Number.isSafeInteger(value.authority_epoch) || value.authority_epoch < 1) throw new Error('authority epoch invalid');
  sha(value.revocation_coordinate_sha256, 'revocation coordinate'); sha(value.signed_payload_sha256, 'signed payload');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value.signature_base64)) throw new Error('signature invalid');
  if (value.environment !== 'NON_PRODUCTION_REHEARSAL' || value.allowed_database_suffix !== '_restore_rehearsal' || value.disposable_cluster !== true || value.network_egress_blocked !== true || value.production_target !== false || value.owner_authorized !== true) throw new Error('target authorization boundary invalid');
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(value.run_id) || !/^[A-Za-z0-9_]+_restore_rehearsal$/.test(value.restore_database) || value.restore_database.length > 63 || !/^[a-f0-9]{40}$/.test(value.runner_code_revision)) throw new Error('target authorization execution binding invalid');
  sha(value.age_recipient_fingerprint_sha256, 'authorized age recipient'); sha(value.execution_nonce_sha256, 'execution nonce'); sha(value.consumption_ledger_directory_sha256, 'consumption ledger directory');
  sha(value.target_cluster_identifier_sha256, 'target cluster system identifier'); sha(value.network_namespace_inode_sha256, 'network namespace inode'); sha(value.boot_id_sha256, 'boot id'); sha(value.network_policy_sha256, 'network policy'); sha(value.postgres_socket_identity_sha256, 'PostgreSQL socket identity'); sha(value.toolchain_manifest_sha256, 'toolchain manifest');
  sha(value.restore_executor_pgpass_file_sha256, 'restore executor credential file'); sha(value.restore_executor_membership_graph_sha256, 'restore executor membership graph'); sha(value.restore_executor_lease_coordinate_sha256, 'restore executor lease coordinate');
  sha(value.backup_plaintext_sha256, 'authorized backup');
  sha(value.backup_manifest_sha256, 'authorized backup manifest');
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(value.restore_role) || !/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(value.restore_executor_role) || value.restore_executor_role === value.restore_role) throw new Error('restore role or dedicated executor role invalid');
  if (!/^[A-Za-z][A-Za-z0-9._-]{0,62}$/.test(value.restore_executor_application_name)) throw new Error('restore executor application name invalid');
  if (!DATE_TIME(value.issued_at) || !DATE_TIME(value.expires_at)) throw new Error('target authorization time invalid');
  const issued = Date.parse(value.issued_at); const expires = Date.parse(value.expires_at);
  if (expires <= issued || expires - issued > MAX_AUTHORIZATION_LIFETIME_MS || now < issued || now >= expires) throw new Error('target authorization is not current or exceeds the bounded TTL');
  return frozenClone(value);
}

export function validateBackupSourceAuthorization(value, { now = Date.now() } = {}) {
  exactKeys(value, ['schema_version', 'result', 'authority_id', 'issuer_id', 'authority_epoch', 'revocation_coordinate_sha256', 'environment', 'source_database', 'source_cluster_identifier_sha256', 'postgres_socket_identity_sha256', 'age_recipient_fingerprint_sha256', 'backup_output_root_sha256', 'plaintext_tmpfs_root_sha256', 'runner_code_revision', 'toolchain_manifest_sha256', 'network_namespace_inode_sha256', 'boot_id_sha256', 'network_policy_sha256', 'execution_nonce_sha256', 'consumption_ledger_directory_sha256', 'network_egress_blocked', 'offsite_upload_authorized', 'owner_authorized', 'issued_at', 'expires_at', 'signed_payload_sha256', 'signature_base64'], 'backup source authorization');
  if (value.schema_version !== '1.0' || value.result !== 'NON_PRODUCTION_BACKUP_SOURCE_AUTHORIZED' || value.environment !== 'NON_PRODUCTION_BACKUP_SOURCE' || value.source_database !== 'knowledge_hub' || value.network_egress_blocked !== true || value.offsite_upload_authorized !== false || value.owner_authorized !== true) throw new Error('backup source authorization boundary invalid');
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value.authority_id) || !/^[A-Za-z0-9._:-]{1,128}$/.test(value.issuer_id) || !Number.isSafeInteger(value.authority_epoch) || value.authority_epoch < 1 || !/^[a-f0-9]{40}$/.test(value.runner_code_revision)) throw new Error('backup source authorization identity invalid');
  for (const field of ['revocation_coordinate_sha256', 'source_cluster_identifier_sha256', 'postgres_socket_identity_sha256', 'age_recipient_fingerprint_sha256', 'backup_output_root_sha256', 'plaintext_tmpfs_root_sha256', 'toolchain_manifest_sha256', 'network_namespace_inode_sha256', 'boot_id_sha256', 'network_policy_sha256', 'execution_nonce_sha256', 'consumption_ledger_directory_sha256', 'signed_payload_sha256']) sha(value[field], `backup source ${field}`);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value.signature_base64) || !DATE_TIME(value.issued_at) || !DATE_TIME(value.expires_at)) throw new Error('backup source authorization signature or time invalid');
  const issued = Date.parse(value.issued_at); const expires = Date.parse(value.expires_at);
  if (expires <= issued || expires - issued > MAX_AUTHORIZATION_LIFETIME_MS || now < issued || now >= expires) throw new Error('backup source authorization is not current or exceeds the bounded TTL');
  return frozenClone(value);
}

export function validateBackupSourceAuthorizationConsumption(value) {
  exactKeys(value, ['schema_version', 'result', 'authority_receipt_sha256', 'execution_nonce_sha256', 'consumed_at', 'effect_deadline_at'], 'backup source authorization consumption');
  if (value.schema_version !== '1.0' || value.result !== 'BACKUP_SOURCE_AUTHORIZATION_CONSUMED') throw new Error('backup source authorization consumption result invalid');
  sha(value.authority_receipt_sha256, 'backup source consumed authority');
  sha(value.execution_nonce_sha256, 'backup source consumed nonce');
  if (!DATE_TIME(value.consumed_at) || !DATE_TIME(value.effect_deadline_at) || Date.parse(value.consumed_at) >= Date.parse(value.effect_deadline_at)) throw new Error('backup source authorization consumption time invalid');
  return frozenClone(value);
}

export function validateRehearsalRecoveryAuthorization(value, { now = Date.now() } = {}) {
  exactKeys(value, ['schema_version', 'result', 'authority_id', 'issuer_id', 'authority_epoch', 'revocation_coordinate_sha256', 'environment', 'run_id', 'restore_database', 'target_cluster_identifier_sha256', 'postgres_socket_identity_sha256', 'temporary_plaintext_path_sha256', 'recovery_journal_sha256', 'psql_binary_sha256', 'action', 'owner_authorized', 'issued_at', 'expires_at', 'signed_payload_sha256', 'signature_base64'], 'recovery authorization');
  if (value.schema_version !== '1.0' || value.result !== 'NON_PRODUCTION_REHEARSAL_RECOVERY_AUTHORIZED' || value.environment !== 'NON_PRODUCTION_REHEARSAL_RECOVERY' || value.action !== 'VERIFY_ABSENT_AND_SEAL' || value.owner_authorized !== true) throw new Error('recovery authorization boundary invalid');
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value.authority_id) || !/^[A-Za-z0-9._:-]{1,128}$/.test(value.issuer_id) || !Number.isSafeInteger(value.authority_epoch) || value.authority_epoch < 1 || !/^[A-Za-z0-9._-]{1,64}$/.test(value.run_id) || !/^[A-Za-z0-9_]+_restore_rehearsal$/.test(value.restore_database) || value.restore_database.length > 63) throw new Error('recovery authorization identity invalid');
  for (const field of ['revocation_coordinate_sha256', 'target_cluster_identifier_sha256', 'postgres_socket_identity_sha256', 'temporary_plaintext_path_sha256', 'recovery_journal_sha256', 'psql_binary_sha256', 'signed_payload_sha256']) sha(value[field], `recovery ${field}`);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value.signature_base64) || !DATE_TIME(value.issued_at) || !DATE_TIME(value.expires_at)) throw new Error('recovery authorization signature or time invalid');
  const issued = Date.parse(value.issued_at); const expires = Date.parse(value.expires_at);
  if (expires <= issued || expires - issued > MAX_AUTHORIZATION_LIFETIME_MS || now < issued || now >= expires) throw new Error('recovery authorization is not current or exceeds the bounded TTL');
  return frozenClone(value);
}

export function validateBackupSourceManifest(value) {
  exactKeys(value, ['schema_version', 'result', 'source_authorization', 'backup_plaintext_sha256', 'backup_plaintext_bytes', 'backup_ciphertext_sha256', 'backup_ciphertext_bytes', 'encryption', 'archive_toc_sha256', 'schema_sql_sha256', 'schema_semantics_sha256', 'source_cluster_identifier_sha256', 'source_exported_snapshot_sha256', 'table_counts', 'migration_set_sha256', 'producer', 'created_at'], 'backup source manifest');
  if (value.schema_version !== '1.0' || value.result !== 'KNOWLEDGE_HUB_BACKUP_SOURCE_MANIFEST') throw new Error('backup source manifest result invalid');
  exactKeys(value.source_authorization, ['receipt_sha256', 'consumption_receipt_sha256'], 'backup source authorization provenance');
  sha(value.source_authorization.receipt_sha256, 'backup source authority receipt'); sha(value.source_authorization.consumption_receipt_sha256, 'backup source authority consumption');
  sha(value.backup_plaintext_sha256, 'backup plaintext'); sha(value.backup_ciphertext_sha256, 'backup ciphertext'); sha(value.archive_toc_sha256, 'archive TOC'); sha(value.schema_sql_sha256, 'schema SQL'); sha(value.schema_semantics_sha256, 'schema semantics'); sha(value.source_cluster_identifier_sha256, 'source cluster identifier'); sha(value.source_exported_snapshot_sha256, 'source exported snapshot'); sha(value.migration_set_sha256, 'migration set');
  if (!Number.isSafeInteger(value.backup_plaintext_bytes) || value.backup_plaintext_bytes < 1 || !Number.isSafeInteger(value.backup_ciphertext_bytes) || value.backup_ciphertext_bytes < 1 || value.backup_plaintext_sha256 === value.backup_ciphertext_sha256) throw new Error('backup byte identity invalid');
  exactKeys(value.encryption, ['format', 'recipient_fingerprint_sha256', 'plaintext_persisted'], 'backup source encryption');
  if (value.encryption.format !== 'age-v1' || value.encryption.plaintext_persisted !== false) throw new Error('backup source encryption boundary invalid');
  sha(value.encryption.recipient_fingerprint_sha256, 'backup source recipient');
  exactKeys(value.table_counts, ['evidence_events', 'delivery_receipts', 'client_policies', 'api_credentials', 'schema_migrations'], 'table counts');
  for (const [name, count] of Object.entries(value.table_counts)) if (!Number.isSafeInteger(count) || count < (name === 'evidence_events' || name === 'schema_migrations' ? 1 : 0)) throw new Error(`${name} count invalid`);
  exactKeys(value.producer, ['code_revision', 'producer_source_sha256', 'runtime_lock_sha256', 'runtime_dependency_tree_sha256', 'node_binary_sha256', 'node_version_sha256', 'pg_dump_binary_sha256', 'pg_dump_version_sha256', 'pg_restore_binary_sha256', 'pg_restore_version_sha256', 'age_binary_sha256', 'age_version_sha256'], 'backup producer');
  if (!/^[a-f0-9]{40}$/.test(value.producer.code_revision)) throw new Error('backup producer code revision invalid');
  for (const key of ['producer_source_sha256', 'runtime_lock_sha256', 'runtime_dependency_tree_sha256', 'node_binary_sha256', 'node_version_sha256', 'pg_dump_binary_sha256', 'pg_dump_version_sha256', 'pg_restore_binary_sha256', 'pg_restore_version_sha256', 'age_binary_sha256', 'age_version_sha256']) sha(value.producer[key], `backup producer ${key}`);
  if (!DATE_TIME(value.created_at)) throw new Error('backup source manifest created_at invalid');
  return frozenClone(value);
}

export function validateGatePrerequisiteArtifact(value, { artifactType, subject } = {}) {
  exactKeys(value, ['schema_version', 'result', 'artifact_type', 'subject', 'revision', 'status', 'superseded', 'completed_at'], 'gate prerequisite artifact');
  if (value.schema_version !== '1.0' || value.result !== 'KNOWLEDGE_HUB_GATE_PREREQUISITE_EVIDENCE' || value.status !== 'PASS' || value.superseded !== false) throw new Error('gate prerequisite artifact not current PASS');
  if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(value.artifact_type) || (artifactType && value.artifact_type !== artifactType)) throw new Error('gate prerequisite artifact type invalid');
  if (!/^[A-Za-z0-9._:-]{1,253}$/.test(value.subject) || (subject && value.subject !== subject)) throw new Error('gate prerequisite artifact subject invalid');
  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(value.revision) || !DATE_TIME(value.completed_at)) throw new Error('gate prerequisite artifact provenance invalid');
  noSecretKeys(value, 'gate prerequisite artifact');
  return frozenClone(value);
}

export function validateCertificateDecision(value) {
  exactKeys(value, ['schema_version', 'result', 'staging_evidence_sha256', 'target_host', 'certificate_provider', 'prerequisite_artifacts', 'prerequisites', 'decision', 'effects', 'completed_at'], 'decision');
  if (value.schema_version !== '1.0' || value.result !== 'PRODUCTION_CERTIFICATE_DECISION_READY') throw new Error('certificate result invalid');
  sha(value.staging_evidence_sha256, 'staging evidence');
  if (!validHost(value.target_host) || net.isIP(value.target_host)) throw new Error('target host invalid');
  if (value.certificate_provider !== 'LETS_ENCRYPT') throw new Error('certificate provider invalid');
  exactKeys(value.prerequisite_artifacts, ['runbook_sha256', 'rollback_plan_sha256', 'budget_record_sha256'], 'prerequisite artifacts');
  for (const key of Object.keys(value.prerequisite_artifacts)) sha(value.prerequisite_artifacts[key], key);
  exactKeys(value.prerequisites, ['staging_rehearsal_pass', 'staging_deactivated', 'private_services_not_public', 'rollback_documented', 'budget_bound'], 'prerequisites');
  if (Object.values(value.prerequisites).some((entry) => entry !== true)) throw new Error('certificate prerequisites incomplete');
  if (value.decision !== 'PENDING_OWNER_DECISION') throw new Error('certificate Owner decision must remain pending');
  exactKeys(value.effects, ['production_acme_issued', 'firewall_mutated', 'public_profile_activated'], 'effects');
  if (Object.values(value.effects).some((entry) => entry !== false)) throw new Error('certificate operational effect inflation prohibited');
  if (!DATE_TIME(value.completed_at)) throw new Error('completed_at invalid');
  noSecretKeys(value, 'certificate decision');
  return frozenClone(value);
}

export function validateProductionTlsEvidence(value) {
  exactKeys(value, ['schema_version', 'result', 'authority_receipt_sha256', 'target_host', 'provider', 'certificate', 'exposure', 'renewal', 'completed_at'], 'production TLS Evidence');
  if (value.schema_version !== '1.0' || value.result !== 'PRODUCTION_TLS_ACTIVATION_PASS' || value.provider !== 'LETS_ENCRYPT') throw new Error('production TLS result invalid');
  sha(value.authority_receipt_sha256, 'authority receipt');
  if (!validHost(value.target_host) || net.isIP(value.target_host)) throw new Error('production TLS requires a valid DNS host');
  exactKeys(value.certificate, ['sha256', 'dns_san_verified', 'chain_verified', 'not_before', 'not_after'], 'certificate');
  sha(value.certificate.sha256, 'certificate');
  if (value.certificate.dns_san_verified !== true || value.certificate.chain_verified !== true || !DATE_TIME(value.certificate.not_before) || !DATE_TIME(value.certificate.not_after) || Date.parse(value.certificate.not_after) <= Date.parse(value.certificate.not_before)) throw new Error('production certificate invalid');
  exactKeys(value.exposure, ['tcp_80', 'tcp_443', 'udp_443', 'api_8787_public', 'postgres_5432_public', 'caddy_admin_2019_public'], 'exposure');
  if (value.exposure.tcp_80 !== true || value.exposure.tcp_443 !== true || value.exposure.udp_443 !== false || value.exposure.api_8787_public !== false || value.exposure.postgres_5432_public !== false || value.exposure.caddy_admin_2019_public !== false) throw new Error('production exposure invalid');
  exactKeys(value.renewal, ['automation_configured', 'dry_run_pass'], 'renewal');
  if (value.renewal.automation_configured !== true || value.renewal.dry_run_pass !== true) throw new Error('certificate renewal not verified');
  if (!DATE_TIME(value.completed_at) || Date.parse(value.completed_at) < Date.parse(value.certificate.not_before) || Date.parse(value.completed_at) >= Date.parse(value.certificate.not_after)) throw new Error('completed_at invalid');
  noSecretKeys(value, 'production TLS Evidence');
  return frozenClone(value);
}

export function validatePilotDecision(value) {
  exactKeys(value, ['schema_version', 'result', 'production_tls_evidence_sha256', 'product_id', 'scopes', 'limits', 'prerequisite_artifacts', 'prerequisites', 'decision', 'effects', 'completed_at'], 'decision');
  if (value.schema_version !== '1.0' || value.result !== 'LIMITED_PRODUCT_PILOT_DECISION_READY') throw new Error('pilot result invalid');
  sha(value.production_tls_evidence_sha256, 'production TLS evidence');
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(value.product_id)) throw new Error('product_id invalid');
  if (!Array.isArray(value.scopes) || value.scopes.length < 1 || value.scopes.length > 8) throw new Error('scopes invalid');
  if (value.scopes.some((scope) => !/^[a-z][a-z0-9:_-]{0,63}$/.test(scope))) throw new Error('scope invalid');
  if (value.scopes.some((scope) => !PILOT_SCOPES.has(scope))) throw new Error('scope is not in the Knowledge Hub allowlist');
  if (new Set(value.scopes).size !== value.scopes.length) throw new Error('duplicate scopes prohibited');
  if (value.scopes.join('\n') !== [...value.scopes].sort().join('\n')) throw new Error('scopes must be sorted');
  exactKeys(value.limits, ['max_installations', 'max_events', 'max_days'], 'limits');
  const ceilings = { max_installations: 5, max_events: 1000, max_days: 14 };
  for (const [key, ceiling] of Object.entries(ceilings)) {
    if (!Number.isSafeInteger(value.limits[key]) || value.limits[key] < 1 || value.limits[key] > ceiling) throw new Error(`${key} exceeds limited pilot ceiling`);
  }
  exactKeys(value.prerequisite_artifacts, ['privacy_review_sha256', 'deletion_plan_sha256', 'credential_revocation_plan_sha256', 'product_rollback_sha256'], 'prerequisite artifacts');
  for (const key of Object.keys(value.prerequisite_artifacts)) sha(value.prerequisite_artifacts[key], key);
  exactKeys(value.prerequisites, ['privacy_review_pass', 'deletion_plan_bound', 'credential_revocation_plan_bound', 'product_rollback_bound'], 'prerequisites');
  if (Object.values(value.prerequisites).some((entry) => entry !== true)) throw new Error('pilot prerequisites incomplete');
  if (value.decision !== 'PENDING_OWNER_DECISION') throw new Error('pilot Owner decision must remain pending');
  exactKeys(value.effects, ['credential_issued', 'ingestion_performed', 'real_user_evidence_collected'], 'effects');
  if (Object.values(value.effects).some((entry) => entry !== false)) throw new Error('pilot operational effect inflation prohibited');
  if (!DATE_TIME(value.completed_at)) throw new Error('completed_at invalid');
  noSecretKeys(value, 'pilot decision');
  return frozenClone(value);
}

const validators = {
  backup: validateBackupRestoreEvidence,
  target: validateRehearsalTargetAuthorization,
  sourceAuthority: validateBackupSourceAuthorization,
  sourceConsumption: validateBackupSourceAuthorizationConsumption,
  recoveryAuthority: validateRehearsalRecoveryAuthorization,
  sourceManifest: validateBackupSourceManifest,
  certificate: validateCertificateDecision,
  productionTls: validateProductionTlsEvidence,
  pilot: validatePilotDecision
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [kind, file] = process.argv.slice(2);
  if (!validators[kind] || !file) {
    console.error('usage: node scripts/validate-knowledge-hub-remaining-deployment-gates.mjs <backup|target|sourceAuthority|sourceConsumption|recoveryAuthority|sourceManifest|certificate|productionTls|pilot> <evidence.json>');
    process.exit(2);
  }
  try {
    const value = validators[kind](JSON.parse(fs.readFileSync(file, 'utf8')));
    const shapeOnly = ['target', 'sourceAuthority', 'recoveryAuthority', 'certificate', 'productionTls', 'pilot'].includes(kind);
    console.log(JSON.stringify(shapeOnly ? { status: 'SHAPE_ONLY_PASS', kind, result: value.result, operational_pass: false, authority_verified: false } : { status: 'PASS', kind, result: value.result }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', kind, reason: error.message }, null, 2));
    process.exit(1);
  }
}
