import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  SOURCE_FINALIZATION_RESERVE_MS,
  assertSourceAuthorityWindow,
  createConsistentKnowledgeHubBackup,
  runBoundedChild
} from '../../deploy/knowledge-hub/runtime/create-consistent-backup.mjs';
import {
  REQUIRED_RESTORE_ENV_KEYS,
  REQUIRED_SOURCE_ENV_KEYS,
  parseExecutionEnvironment,
  validateExecutionEnvironment
} from '../../deploy/knowledge-hub/systemd/validate-rehearsal-execution-environment.mjs';
import {
  KNOWLEDGE_HUB_PHASE0_SCHEMA_INVENTORY as INVENTORY,
  KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES
} from '../../scripts/knowledge-hub-phase0-schema-inventory.mjs';
import { validateKnowledgeHubRestoreList } from '../../scripts/validate-knowledge-hub-pg-restore-list.mjs';

const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const sha = (character) => character.repeat(64);
const producerAttestation = () => ({
  code_revision: '4'.repeat(40), producer_source_sha256: sha('1'), runtime_lock_sha256: sha('2'), runtime_dependency_tree_sha256: sha('3'),
  node_binary_sha256: sha('4'), node_version_sha256: sha('5'), pg_dump_binary_sha256: sha('6'), pg_dump_version_sha256: sha('7'),
  pg_restore_binary_sha256: sha('8'), pg_restore_version_sha256: sha('9'), age_binary_sha256: sha('a'), age_version_sha256: sha('b')
});

test('schema inventory is transitively revision-bound in source and target validator closures', () => {
  const producer = fs.readFileSync('deploy/knowledge-hub/runtime/create-consistent-backup.mjs', 'utf8');
  const source = fs.readFileSync('deploy/knowledge-hub/scripts/backup-postgres.sh', 'utf8');
  const target = fs.readFileSync('deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh', 'utf8');
  const semantic = fs.readFileSync('scripts/validate-knowledge-hub-schema-sql.mjs', 'utf8');
  const toc = fs.readFileSync('scripts/validate-knowledge-hub-pg-restore-list.mjs', 'utf8');
  const inventorySha = digest(fs.readFileSync('scripts/knowledge-hub-phase0-schema-inventory.mjs'));
  assert.match(producer, /scripts\/knowledge-hub-phase0-schema-inventory\.mjs/);
  assert.match(source, /scripts\/knowledge-hub-phase0-schema-inventory\.mjs/);
  for (const validator of ['validate-knowledge-hub-schema-sql.mjs', 'validate-knowledge-hub-pg-restore-list.mjs']) assert.match(target, new RegExp(validator.replaceAll('.', '\\.')));
  for (const validatorSource of [semantic, toc]) {
    assert.match(validatorSource, /knowledge-hub-phase0-schema-inventory\.mjs/);
    assert.ok(validatorSource.includes(inventorySha), 'validator must bind exact inventory module bytes');
  }
});

test('exact 30 TOC coordinates are derived from the strict semantic inventory', () => {
  assert.equal(KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.length, 30);
  for (const table of Object.keys(INVENTORY.tables)) {
    assert.ok(KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.includes(`TABLE public ${table}`));
    assert.ok(KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.includes(`TABLE DATA public ${table}`));
  }
  for (const [name, value] of Object.entries(INVENTORY.constraints)) assert.ok(KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.includes(`CONSTRAINT public ${value.table} ${name}`));
  for (const name of Object.keys(INVENTORY.indexes)) assert.ok(KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.includes(`INDEX public ${name}`));
  const bodies = KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.map((coordinate) => /^(?:SCHEMA|TABLE|DEFAULT|CONSTRAINT|INDEX) /.test(coordinate) ? `${coordinate} owner` : coordinate);
  const list = bodies.map((body, index) => `${index + 1}; 0 0 ${body}`).join('\n');
  assert.equal(validateKnowledgeHubRestoreList(`${list}\n`).entries, 30);
  assert.throws(() => validateKnowledgeHubRestoreList(`${list.replace('INDEX public evidence_events_received_at_idx owner', 'INDEX public hostile_idx owner')}\n`), /exact Phase-0 inventory/);
});

test('source and restore environment files have exact literal schemas and systemd preflights', (t) => {
  const sourceTemplateFile = 'deploy/knowledge-hub/systemd/source-backup.env.example';
  const restoreTemplateFile = 'deploy/knowledge-hub/systemd/restore-rehearsal.env.example';
  const sourceTemplate = fs.readFileSync(sourceTemplateFile, 'utf8'); const restoreTemplate = fs.readFileSync(restoreTemplateFile, 'utf8');
  assert.equal(Object.keys(parseExecutionEnvironment('source', sourceTemplate, { allowPlaceholders: true })).length, REQUIRED_SOURCE_ENV_KEYS.length);
  assert.equal(Object.keys(parseExecutionEnvironment('restore', restoreTemplate, { allowPlaceholders: true })).length, REQUIRED_RESTORE_ENV_KEYS.length);
  assert.throws(() => parseExecutionEnvironment('source', `${sourceTemplate}EXTRA_KEY=x\n`, { allowPlaceholders: true }), /exactly the required keys/);
  assert.throws(() => parseExecutionEnvironment('restore', restoreTemplate.replace('PGPORT=5432', 'PGPORT=$(id)'), { allowPlaceholders: true }), /literal KEY=value/);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-remediation-c-env-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const materialize = (mode, template) => {
    const values = { ...parseExecutionEnvironment(mode, template, { allowPlaceholders: true }) };
    for (const [key, value] of Object.entries(values)) values[key] = value.replaceAll('CHANGE-ME', 'run-1');
    values.AGE_RECIPIENT = 'age1testrecipient';
    if (mode === 'source') values.BAI_CODE_REVISION = '4'.repeat(40);
    else { values.CODE_REVISION = '4'.repeat(40); values.RUN_ID = 'run-1'; values.BACKUP_RESTORE_RUN_DIR = `${values.BACKUP_RESTORE_ROOT}/run-1`; values.RESTORE_TARGET_DATABASE = 'knowledge_hub_restore_rehearsal'; }
    const file = path.join(root, `${mode}.env`); fs.writeFileSync(file, `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`);
    assert.equal(validateExecutionEnvironment({ mode, environmentFile: file, environment: values, platform: 'win32', requireLoadedEnvironment: true }).status, 'PASS');
  };
  materialize('source', sourceTemplate); materialize('restore', restoreTemplate);

  for (const [unitName, mode] of [['bai-knowledge-hub-source-backup.service', 'source'], ['bai-knowledge-hub-restore-rehearsal.service', 'restore']]) {
    const unit = fs.readFileSync(`deploy/knowledge-hub/systemd/${unitName}`, 'utf8');
    assert.match(unit, new RegExp(`^ExecStartPre=.*validate-rehearsal-execution-environment\\.mjs ${mode} --require-loaded`, 'm'));
  }
  for (const unitName of ['bai-knowledge-hub-source-backup.service', 'bai-knowledge-hub-restore-rehearsal.service', 'bai-knowledge-hub-rehearsal-recovery.service']) {
    const unit = fs.readFileSync(`deploy/knowledge-hub/systemd/${unitName}`, 'utf8');
    for (const directive of ['PrivateDevices=yes', 'ProtectProc=invisible', 'RestrictNamespaces=yes', 'CapabilityBoundingSet=', 'KillMode=control-group', 'SendSIGKILL=yes']) assert.ok(unit.includes(directive), `${unitName} missing ${directive}`);
  }
});

test('source publication reserve quarantines a marker when the post-publication failpoint crosses expiry', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-remediation-c-source-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  let current = Date.parse('2026-08-16T00:00:00Z'); const deadline = current + 60_000;
  assert.doesNotThrow(() => assertSourceAuthorityWindow(deadline, 'fixture', { clock: () => current, reserveMs: SOURCE_FINALIZATION_RESERVE_MS }));
  class FakeClient {
    async connect() {}
    async query(sql) {
      if (sql.includes('pg_export_snapshot')) return { rows: [{ snapshot_id: '00000003-0000001B-1' }] };
      if (sql.includes('pg_control_system')) return { rows: [{ system_identifier: '123', evidence_events: '1', delivery_receipts: '0', client_policies: '0', api_credentials: '0', schema_migrations: '1', migration_set: '001:a' }] };
      return { rows: [] };
    }
    async end() {}
  }
  const env = { PGHOST: '/run/postgresql', PGPORT: '5432', PGDATABASE: 'knowledge_hub', PGUSER: 'backup', AGE_RECIPIENT: 'age1testrecipient', BAI_SOURCE_AUTHORITY_RECEIPT_SHA256: sha('f'), BAI_SOURCE_AUTHORITY_CONSUMPTION_SHA256: sha('0'), BAI_AUTHORIZED_SOURCE_CLUSTER_SHA256: digest(Buffer.from('123')), BAI_AUTHORITY_EXPIRES_AT: new Date(deadline).toISOString() };
  await assert.rejects(() => createConsistentKnowledgeHubBackup({
    backupDir: root, plaintextDir: root, env, now: new Date(current), clock: () => current,
    failpoint: (name) => { if (name === 'after-source-marker-publication-fsync') current = deadline; },
    clientFactory: FakeClient, producerAttestation: producerAttestation(),
    archiveInspector: () => ({ archive_toc_sha256: sha('b'), schema_sql_sha256: sha('c'), schema_semantics_sha256: sha('d'), archive_inventory_entries: 30 }),
    runDump: async (args) => { fs.writeFileSync(args.find((arg) => arg.startsWith('--file=')).slice(7), 'snapshot'); },
    encryptBackup: async (input, output) => fs.writeFileSync(output, `encrypted:${fs.readFileSync(input, 'utf8')}`)
  }), /expired before source commit durable completion/);
  const runDir = fs.readdirSync(root).map((name) => path.join(root, name)).find((entry) => fs.statSync(entry).isDirectory());
  assert.equal(fs.existsSync(path.join(runDir, 'COMMITTED.json')), false);
  assert.equal(fs.existsSync(path.join(runDir, 'COMMITTED.expired-or-incomplete-quarantine.json')), true);
});

test('bounded child backstop kills a child that crosses its authority effect deadline', async () => {
  const started = Date.now();
  await assert.rejects(() => runBoundedChild(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], process.env, 'deadline fixture', started + 150), /failed or crossed authority deadline/);
  assert.ok(Date.now() - started < 5_000, 'deadline backstop did not terminate the child promptly');
});
