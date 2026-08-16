#!/usr/bin/env node
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const script = read('deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh');
const validator = read('scripts/validate-knowledge-hub-remaining-deployment-gates.mjs');
const authorityVerifier = read('scripts/verify-knowledge-hub-rehearsal-target-authorization.mjs');
const bundleCommitter = read('scripts/commit-knowledge-hub-backup-rehearsal-bundle.mjs');
const sourceProducer = read('deploy/knowledge-hub/runtime/create-consistent-backup.mjs');
const archiveValidator = read('scripts/validate-knowledge-hub-pg-restore-list.mjs');
const schemas = [
  'knowledge-hub-backup-source-manifest.schema.json',
  'knowledge-hub-backup-source-authorization.schema.json',
  'knowledge-hub-rehearsal-recovery-authorization.schema.json',
  'knowledge-hub-rehearsal-authority-trust-root.schema.json',
  'knowledge-hub-rehearsal-authority-revocations.schema.json',
  'knowledge-hub-rehearsal-authority-head.schema.json',
  'knowledge-hub-rehearsal-target-authorization.schema.json',
  'knowledge-hub-backup-restore-rehearsal-evidence.schema.json',
  'knowledge-hub-backup-rehearsal-bundle.schema.json',
  'knowledge-hub-gate-prerequisite-evidence.schema.json',
  'knowledge-hub-production-certificate-decision.schema.json',
  'knowledge-hub-production-tls-evidence.schema.json',
  'knowledge-hub-limited-product-pilot-decision.schema.json'
].map((name) => JSON.parse(read(`schemas/knowledge-evolution/${name}`)));
const failures = [];
const must = (pattern, message) => { if (!pattern.test(script)) failures.push(message); };
const mustNot = (pattern, message) => { if (pattern.test(script)) failures.push(message); };

must(/BACKUP_RESTORE_REHEARSAL_ONLY/, 'explicit rehearsal acknowledgement missing');
must(/REQUIRED_COMMANDS='age[\s\S]*for cmd in \$REQUIRED_COMMANDS/, 'external command protection gate missing');
must(/_restore_rehearsal/, 'isolated restore database suffix missing');
must(/database_dropped/, 'database cleanup Evidence missing');
must(/temporary_plaintext_deleted/, 'temporary plaintext cleanup Evidence missing');
must(/offsite_uploaded[^\n]*false/, 'offsite upload negative Evidence missing');
must(/validate-knowledge-hub-remaining-deployment-gates\.mjs/, 'machine Evidence validation missing');
must(/verify-knowledge-hub-rehearsal-target-authorization\.mjs/, 'signed target authority verification missing');
must(/BACKUP_MANIFEST_FILE/, 'source backup manifest binding missing');
must(/toolchain_manifest_sha256/, 'signed toolchain manifest binding missing');
must(/commit-knowledge-hub-backup-rehearsal-bundle\.mjs/, 'crash-safe bundle commit missing');
mustNot(/\b(curl|wget|scp|rsync|rclone|aws|az|gsutil)\b/, 'network or offsite transfer command prohibited');
mustNot(/acme|ufw|firewall-cmd/, 'certificate or firewall mutation command prohibited');
mustNot(/PGPASSWORD[=:][^$"']+/, 'embedded database password prohibited');

if (!/PENDING_OWNER_DECISION/.test(validator) || !/operational effect inflation prohibited/.test(validator)) failures.push('decision validators must preserve pending/no-effect boundary');
if (!/crypto\.verify/.test(authorityVerifier) || !/authority epoch mismatch/.test(authorityVerifier) || !/authority receipt revoked/.test(authorityVerifier)) failures.push('authentic revocable authority verifier incomplete');
if (!/COMMITTED\.json/.test(bundleCommitter) || !/fsyncSync/.test(bundleCommitter) || !/validateCommittedBackupRehearsalBundle/.test(bundleCommitter)) failures.push('committed bundle boundary incomplete');
if (!/pg_export_snapshot/.test(sourceProducer) || !/--snapshot=/.test(sourceProducer) || !/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/.test(sourceProducer)) failures.push('exported source snapshot boundary incomplete');
if (!/KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES/.test(archiveValidator) || !/INVENTORY_MODULE_SHA256/.test(archiveValidator) || !/REQUIRED_COORDINATE_SET/.test(archiveValidator) || /startsWith\(`\$\{candidate\}/.test(archiveValidator)) failures.push('exact Hub archive inventory boundary incomplete');
for (const schema of schemas) if (schema.additionalProperties !== false) failures.push(`${schema.title} schema is not closed`);

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'PASS', gate: 'TASK-017 Remaining Deployment Gates', external_effects: 'NOT_AUTHORIZED' }, null, 2));
