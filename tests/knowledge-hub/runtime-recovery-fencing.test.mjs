import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { recoveryProbeTimeoutMs } from '../../scripts/recover-knowledge-hub-rehearsal.mjs';
import { isCanonicalRecoverySourcePhase } from '../../scripts/write-knowledge-hub-rehearsal-recovery-journal.mjs';
import { validateKnowledgeHubDataOnlyCopy } from '../../scripts/validate-knowledge-hub-data-only-copy.mjs';

const copy = (table, columns, row = null) => `COPY public.${table} (${columns.join(', ')}) FROM stdin;\n${row ? `${row}\n` : ''}\\.\n`;
const fixture = () => `-- PostgreSQL database dump\n\\restrict TOKEN_1\nSET statement_timeout = 0;\nSET client_encoding = 'UTF8';\n${copy('api_credentials', ['key_id', 'subject_id', 'product_id', 'scopes_json', 'trust_level', 'salt', 'secret_hash', 'status', 'created_at', 'expires_at', 'revoked_at'])}${copy('client_policies', ['product_id', 'policy_json', 'updated_at'])}${copy('delivery_receipts', ['receipt_id', 'batch_id', 'subject_id', 'product_id', 'transport', 'receipt_json', 'created_at'])}${copy('evidence_events', ['product_id', 'installation_id', 'event_id', 'event_hash', 'event_json', 'knowledge_evidence_json', 'subject_id', 'trust_level', 'transport', 'received_at', 'expires_at'])}${copy('schema_migrations', ['migration_name', 'checksum', 'applied_at'])}\\unrestrict TOKEN_1\n`;

test('data-only SQL admits only the exact five-table COPY framing', () => {
  assert.deepEqual(validateKnowledgeHubDataOnlyCopy(Buffer.from(fixture())), { status: 'PASS', tables: 5, rows: 0, bytes: Buffer.byteLength(fixture()) });
  assert.throws(() => validateKnowledgeHubDataOnlyCopy(Buffer.from(fixture().replace('COPY public.client_policies', 'DROP TABLE client_policies;\nCOPY public.client_policies'))), /outside the closed COPY framing/);
  assert.throws(() => validateKnowledgeHubDataOnlyCopy(Buffer.from(fixture().replace('product_id, policy_json, updated_at', 'product_id, policy_json'))), /COPY header invalid/);
  assert.throws(() => validateKnowledgeHubDataOnlyCopy(Buffer.from(fixture().replace('\\unrestrict TOKEN_1', '\\unrestrict OTHER'))), /restrict pair mismatch/);
});

test('recovery probe timeout reserves final revalidation and rejects expiry', () => {
  const now = Date.parse('2026-08-16T00:00:00Z');
  assert.equal(recoveryProbeTimeoutMs('2026-08-16T00:00:35Z', now), 30_000);
  assert.equal(recoveryProbeTimeoutMs('2026-08-16T00:00:06Z', now), 1_000);
  assert.throws(() => recoveryProbeTimeoutMs('2026-08-16T00:00:05Z', now), /deadline elapsed/);
});

test('signed absence recovery can classify pre-effect and STARTED states, never terminal states', () => {
  for (const phase of ['RESERVED', 'AUTHORIZATION_CONSUMED', 'PLAINTEXT_CREATE_STARTED', 'PLAINTEXT_CREATED', 'DATABASE_CREATE_STARTED', 'DATABASE_CREATED', 'DATABASE_DROPPED', 'PLAINTEXT_DELETED', 'FAILED']) assert.equal(isCanonicalRecoverySourcePhase(phase), true, phase);
  for (const phase of ['BUNDLE_COMMITTED', 'RECOVERED', 'QUARANTINED', 'UNKNOWN']) assert.equal(isCanonicalRecoverySourcePhase(phase), false, phase);
});

test('restore harness binds exact DB lease, executor backend and nonroot archive sandbox', () => {
  const shell = fs.readFileSync('deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh', 'utf8');
  for (const token of ['restore_executor_role', 'restore_executor_membership_graph_sha256', 'restore_executor_application_name', 'restore_executor_lease_coordinate_sha256', 'pg_advisory_lock', 'lease_backend_pid', "application_name='$authorized_executor_app'", 'PGRESTOREEXECUTOR', 'setpriv --reuid', 'PGPASSFILE=/proc/self/fd/8', 'validate-knowledge-hub-data-only-copy.mjs', "CANONICAL_REHEARSAL_ROOT='/var/lib/bai-development-os/knowledge-hub/rehearsals'", "CANONICAL_AUTHORITY_CONSUMPTION_DIR='/var/lib/bai-development-os/knowledge-hub/authority-consumption'", 'post_effect_completed_at']) assert.ok(shell.includes(token), token);
  assert.match(shell, /--username="\$PGRESTOREEXECUTOR" --role="\$PGRESTOREUSER"/);
  assert.doesNotMatch(shell, /pg_restore --host=.*--username="\$PGADMINUSER"/);
  assert.match(shell, /"\$post_effect_completed_at" "\$authorized_expires_at"/);
  const unit = fs.readFileSync('deploy/knowledge-hub/systemd/bai-knowledge-hub-restore-rehearsal.service', 'utf8');
  assert.match(unit, /^CapabilityBoundingSet=CAP_SETUID CAP_SETGID CAP_KILL$/m);
  assert.match(unit, /^ProtectProc=invisible$/m);
  const environmentValidator = fs.readFileSync('deploy/knowledge-hub/systemd/validate-rehearsal-execution-environment.mjs', 'utf8');
  assert.match(environmentValidator, /restore run and authority ledger roots must be canonical/);
});
