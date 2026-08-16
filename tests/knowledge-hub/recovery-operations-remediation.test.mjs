import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  REQUIRED_RECOVERY_ENV_KEYS, assertUnixProtection, parseRecoveryEnvironment, validateRecoveryEnvironment
} from '../../deploy/knowledge-hub/systemd/validate-rehearsal-recovery-environment.mjs';

const repo = process.cwd();
const templateFile = path.join(repo, 'deploy/knowledge-hub/systemd/rehearsal-recovery.env.example');
const unitFile = path.join(repo, 'deploy/knowledge-hub/systemd/bai-knowledge-hub-rehearsal-recovery.service');
const runbookFile = path.join(repo, 'tasks/TASK-017/remaining-deployment-gates-operator-runbook.md');
const harnessFile = path.join(repo, 'deploy/knowledge-hub/scripts/run-encrypted-backup-restore-rehearsal.sh');

test('recovery environment template has exact keys and supports a no-effect dry run', (t) => {
  const template = fs.readFileSync(templateFile, 'utf8');
  const parsedTemplate = parseRecoveryEnvironment(template, { allowPlaceholders: true });
  assert.deepEqual(Object.keys(parsedTemplate).sort(), [...REQUIRED_RECOVERY_ENV_KEYS].sort());
  assert.equal(REQUIRED_RECOVERY_ENV_KEYS.length, 8);
  assert.doesNotMatch(template, /PASSWORD=|PGPASSWORD|BEGIN [A-Z ]*PRIVATE KEY/);
  const cli = spawnSync(process.execPath, [
    'deploy/knowledge-hub/systemd/validate-rehearsal-recovery-environment.mjs', '--lint-template', templateFile
  ], { cwd: repo, encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr); assert.equal(JSON.parse(cli.stdout).mode, 'TEMPLATE_LINT');

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-recovery-env-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const values = {
    RECOVERY_JOURNAL_FILE: '/var/lib/bai-development-os/knowledge-hub/rehearsals/run-1/recovery-journal.jsonl',
    RECOVERY_AUTHORIZATION_FILE: '/run/bai-development-os/knowledge-hub/recovery-authorization.json',
    BAI_RECOVERY_PSQL_BIN: '/usr/bin/psql', PGHOST: '/run/postgresql', PGPORT: '5432',
    PGADMINUSER: 'bai_hub', PGDATABASE: 'knowledge_hub',
    PGPASSFILE: '/run/bai-development-os/knowledge-hub/recovery.pgpass'
  };
  const environmentFile = path.join(root, 'rehearsal-recovery.env');
  fs.writeFileSync(environmentFile, `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`);
  assert.equal(validateRecoveryEnvironment({ environmentFile, environment: values, platform: 'win32' }).status, 'PASS');
  assert.throws(() => validateRecoveryEnvironment({ environmentFile, environment: {}, platform: 'win32', requireLoadedEnvironment: true }), /loaded recovery environment differs/);
  assert.equal(validateRecoveryEnvironment({ environmentFile, environment: values, platform: 'win32', requireLoadedEnvironment: true }).status, 'PASS');
  assert.throws(() => parseRecoveryEnvironment(`${fs.readFileSync(environmentFile)}EXTRA_KEY=x\n`), /exactly the required keys/);
  assert.throws(() => parseRecoveryEnvironment(fs.readFileSync(environmentFile, 'utf8').replace('PGPORT=5432', 'PGPORT=$(id)')), /literal KEY=value/);
  assert.throws(() => assertUnixProtection({ uid: 1, mode: 0o100600 }, 'fixture'), /root-owned/);
  assert.throws(() => assertUnixProtection({ uid: 0, mode: 0o100620 }, 'fixture', { exactMode: 0o600 }), /permissions/);
  assert.doesNotThrow(() => assertUnixProtection({ uid: 0, mode: 0o100600 }, 'fixture', { exactMode: 0o600 }));
});

test('systemd recovery unit gates execution on the canonical preflight', () => {
  const unit = fs.readFileSync(unitFile, 'utf8');
  assert.match(unit, /^EnvironmentFile=\/run\/bai-development-os\/knowledge-hub\/rehearsal-recovery\.env$/m);
  assert.match(unit, /^ExecStartPre=\/usr\/bin\/node \/opt\/bai-development-os\/deploy\/knowledge-hub\/systemd\/validate-rehearsal-recovery-environment\.mjs --require-loaded \/run\/bai-development-os\/knowledge-hub\/rehearsal-recovery\.env$/m);
  assert.match(unit, /^ExecStart=.*\$\{RECOVERY_JOURNAL_FILE\} \$\{RECOVERY_AUTHORIZATION_FILE\}$/m);
  assert.match(unit, /^User=root$/m); assert.match(unit, /^PrivateNetwork=yes$/m); assert.match(unit, /^LimitCORE=0$/m);
});

test('operator runbook provides exact recovery preflight, execution, terminal and destructive handoff', () => {
  const runbook = fs.readFileSync(runbookFile, 'utf8');
  for (const key of REQUIRED_RECOVERY_ENV_KEYS) assert.match(runbook, new RegExp(`\\b${key}\\b`));
  for (const token of [
    'install -o root -g root -m 0600', "stat -c '%U:%G:%a'", 'findmnt --noheadings --target',
    'validate-rehearsal-recovery-environment.mjs', 'systemctl start bai-knowledge-hub-rehearsal-recovery.service',
    'systemctl status bai-knowledge-hub-rehearsal-recovery.service --no-pager',
    'systemctl show -p Result,ExecMainStatus', 'journalctl -u bai-knowledge-hub-rehearsal-recovery.service',
    'phase=RECOVERED', 'requires_recovery=false', 'destructive-recovery decision packet'
  ]) assert.ok(runbook.includes(token), `runbook missing ${token}`);
  assert.match(runbook, /never drops a database or deletes plaintext/i);
  assert.match(runbook, /Do not edit the journal, reuse the rehearsal receipt, improvise a wildcard deletion/i);
});

const ordered = (source, before, after) => {
  const left = source.indexOf(before); const right = source.indexOf(after);
  assert.notEqual(left, -1, `missing ${before}`); assert.notEqual(right, -1, `missing ${after}`); assert.ok(left < right, `${before} must precede ${after}`);
};

function simulateEffectFailpoint(point) {
  const state = { database_at_risk: false, plaintext_at_risk: false, database_exists: false, plaintext_exists: false, external_effects: 0 };
  if (point.startsWith('age_')) state.plaintext_at_risk = true;
  if (point === 'age_after_effect' || point === 'createdb_after_intent' || point === 'createdb_after_effect' || point === 'cleanup_database_failure' || point === 'cleanup_plaintext_failure') { state.plaintext_at_risk = true; state.plaintext_exists = true; }
  if (point.startsWith('createdb_') || point === 'cleanup_database_failure' || point === 'cleanup_plaintext_failure') state.database_at_risk = true;
  if (point === 'createdb_after_effect' || point === 'cleanup_database_failure') state.database_exists = true;
  if (point === 'cleanup_plaintext_failure') state.database_exists = false;
  return Object.freeze(state);
}

test('stubbed kill matrix proves conservative pre-effect state without real effects', () => {
  const harness = fs.readFileSync(harnessFile, 'utf8');
  ordered(harness, 'append_recovery PLAINTEXT_CREATE_STARTED', 'age --decrypt');
  ordered(harness, 'append_recovery DATABASE_CREATE_STARTED', 'createdb --host');
  for (const point of ['age_after_intent', 'age_after_effect', 'createdb_after_intent', 'createdb_after_effect', 'cleanup_database_failure', 'cleanup_plaintext_failure']) {
    const state = simulateEffectFailpoint(point); assert.equal(state.external_effects, 0);
    if (point.startsWith('age_')) assert.equal(state.plaintext_at_risk, true);
    if (point.startsWith('createdb_')) assert.equal(state.database_at_risk, true);
  }
  assert.equal(simulateEffectFailpoint('createdb_after_intent').database_exists, false);
  assert.equal(simulateEffectFailpoint('createdb_after_effect').database_exists, true);
  assert.equal(simulateEffectFailpoint('cleanup_database_failure').database_exists, true);
  assert.equal(simulateEffectFailpoint('cleanup_plaintext_failure').plaintext_exists, true);
});

const gitBash = process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Git\\bin\\bash.exe')
  ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';
const toBashPath = (value) => process.platform === 'win32'
  ? value.replace(/^([A-Za-z]):\\/, (_, drive) => `/${drive.toLowerCase()}/`).replaceAll('\\', '/') : value;

function executeKilledEffectScenario(t, effect) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `bai-${effect}-kill-`));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const worker = path.join(root, 'worker.sh');
  const journal = path.join(root, 'recovery-journal.txt');
  const artifact = path.join(root, `${effect}.artifact`);
  fs.writeFileSync(worker, `#!/bin/bash
set -Eeuo pipefail
journal="$1"; effect="$2"; artifact="$3"; mode="$4"; cleanup_fail="$5"
append(){ printf '%s\\n' "$1" >> "$journal"; }
age(){ printf '%s\\n' 'stub plaintext' > "$artifact"; }
createdb(){ printf '%s\\n' 'stub database' > "$artifact"; }
if [[ "$mode" == recover ]]; then
  [[ -e "$artifact" ]] || { append RECOVERED; exit 0; }
  [[ "$cleanup_fail" == true ]] && { append CLEANUP_FAILED; exit 75; }
  rm -f "$artifact"; append RECOVERED; exit 0
fi
if [[ "$effect" == age ]]; then
  append PLAINTEXT_CREATE_STARTED; age; kill -KILL "$$"
fi
append DATABASE_CREATE_STARTED; createdb; kill -KILL "$$"
`);
  const args = [toBashPath(worker), toBashPath(journal), effect, toBashPath(artifact)];
  const killed = spawnSync(gitBash, [...args, 'run', 'false'], { encoding: 'utf8', timeout: 10_000 });
  assert.notEqual(killed.status, 0, `${effect} failpoint unexpectedly completed`);
  assert.equal(fs.existsSync(artifact), true, `${effect} stub effect did not occur before kill`);
  assert.equal(fs.readFileSync(journal, 'utf8').trim(), effect === 'age' ? 'PLAINTEXT_CREATE_STARTED' : 'DATABASE_CREATE_STARTED');

  const failedCleanup = spawnSync(gitBash, [...args, 'recover', 'true'], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(failedCleanup.status, 75, failedCleanup.stderr);
  assert.equal(fs.existsSync(artifact), true, 'failed cleanup must retain the recoverable artifact');
  assert.doesNotMatch(fs.readFileSync(journal, 'utf8'), /RECOVERED/);

  const retry = spawnSync(gitBash, [...args, 'recover', 'false'], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(retry.status, 0, retry.stderr);
  assert.equal(fs.existsSync(artifact), false, 'successful retry must remove the stub artifact');
  assert.match(fs.readFileSync(journal, 'utf8'), /CLEANUP_FAILED\nRECOVERED\n$/);
}

test('executable age/createdb stubs are killed after effect and require retryable recovery', (t) => {
  const harness = fs.readFileSync(harnessFile, 'utf8');
  ordered(harness, 'append_recovery PLAINTEXT_CREATE_STARTED', 'age --decrypt');
  ordered(harness, 'age --decrypt', 'append_recovery PLAINTEXT_CREATED');
  ordered(harness, 'append_recovery DATABASE_CREATE_STARTED', 'createdb --host');
  ordered(harness, 'createdb --host', 'append_recovery DATABASE_CREATED');
  executeKilledEffectScenario(t, 'age');
  executeKilledEffectScenario(t, 'createdb');
});
