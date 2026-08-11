import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const prepareScript = 'deploy/knowledge-hub/scripts/prepare-compose-env.sh';

function value(text, name) {
  const match = text.match(new RegExp(`^${name}\\s*=\\s*([^#\\n]+)`, 'm'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

function prepare(args) {
  return spawnSync('bash', [prepareScript, ...args], { cwd: root, encoding: 'utf8' });
}

test('2 GiB low-resource PostgreSQL profile is bounded and preserves durability', () => {
  const text = read('deploy/knowledge-hub/postgres/postgresql.tuned-2gb.conf');
  assert.equal(value(text, 'shared_buffers'), '256MB');
  assert.equal(value(text, 'effective_cache_size'), '1GB');
  assert.equal(value(text, 'work_mem'), '4MB');
  assert.equal(value(text, 'max_connections'), '40');
  for (const name of ['fsync', 'synchronous_commit', 'full_page_writes', 'autovacuum']) assert.equal(value(text, name), 'on');
  assert.equal(value(text, 'password_encryption'), 'scram-sha-256');
  assert.equal(value(text, 'jit'), 'off');
  assert.doesNotMatch(text, /^random_page_cost\s*=|^effective_io_concurrency\s*=/m);
});

test('4 GiB PostgreSQL profile scales memory without disabling safety', () => {
  const text = read('deploy/knowledge-hub/postgres/postgresql.tuned-4gb.conf');
  assert.equal(value(text, 'shared_buffers'), '768MB');
  assert.equal(value(text, 'effective_cache_size'), '2560MB');
  assert.equal(value(text, 'work_mem'), '8MB');
  assert.equal(value(text, 'max_connections'), '60');
  assert.equal(value(text, 'fsync'), 'on');
  assert.equal(value(text, 'synchronous_commit'), 'on');
  assert.equal(value(text, 'full_page_writes'), 'on');
});

test('8 GiB startup PostgreSQL profile adds headroom without linear per-query memory growth', () => {
  const text = read('deploy/knowledge-hub/postgres/postgresql.tuned-8gb.conf');
  assert.equal(value(text, 'shared_buffers'), '1536MB');
  assert.equal(value(text, 'effective_cache_size'), '5GB');
  assert.equal(value(text, 'work_mem'), '8MB');
  assert.equal(value(text, 'max_connections'), '64');
  assert.equal(value(text, 'maintenance_work_mem'), '256MB');
  assert.equal(value(text, 'autovacuum_work_mem'), '256MB');
  assert.equal(value(text, 'fsync'), 'on');
  assert.equal(value(text, 'synchronous_commit'), 'on');
  assert.equal(value(text, 'full_page_writes'), 'on');
  assert.doesNotMatch(text, /^random_page_cost\s*=|^effective_io_concurrency\s*=/m);
});

test('Compose requires an explicit host-memory profile and never exposes PostgreSQL', () => {
  const compose = read('deploy/knowledge-hub/compose.yaml');
  assert.match(compose, /postgres:16\.14-alpine/);
  assert.match(compose, /POSTGRES_HOST_AUTH_METHOD: "scram-sha-256"/);
  assert.match(compose, /POSTGRES_INITDB_ARGS: "--data-checksums"/);
  assert.match(compose, /POSTGRES_CONFIG_FILE:\?set POSTGRES_CONFIG_FILE/);
  assert.match(compose, /POSTGRES_SHM_SIZE:\?set POSTGRES_SHM_SIZE/);
  assert.doesNotMatch(compose, /POSTGRES_CONFIG_FILE:-/);
  assert.doesNotMatch(compose, /POSTGRES_SHM_SIZE:-/);
  assert.match(compose, /config_file=\/etc\/postgresql\/postgresql\.conf/);
  assert.doesNotMatch(compose, /5432:5432/);
});

test('environment bootstrap and active tuning scripts are syntax-safe and repo example contains no real secret', () => {
  for (const rel of [
    'deploy/knowledge-hub/scripts/prepare-compose-env.sh',
    'deploy/knowledge-hub/scripts/verify-postgres-tuning.sh',
    'deploy/knowledge-hub/scripts/start-local-compose.sh',
    'deploy/knowledge-hub/scripts/stop-local-compose.sh',
    'deploy/knowledge-hub/scripts/run-live-rehearsal.sh'
  ]) {
    const result = spawnSync('bash', ['-n', rel], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, `${rel}: ${result.stderr}`);
  }
  const example = read('deploy/knowledge-hub/.env.example');
  assert.match(example, /POSTGRES_PASSWORD=REPLACE_AT_DEPLOYMENT/);
  assert.match(example, /POSTGRES_CONFIG_FILE=REPLACE_WITH_PROFILE_CONFIG/);
  assert.match(example, /POSTGRES_SHM_SIZE=REPLACE_WITH_PROFILE_SHM/);
  assert.match(example, /BAI_KNOWLEDGE_HUB_DB_POOL_MAX=REPLACE_WITH_PROFILE_POOL/);
  assert.doesNotMatch(example, /POSTGRES_PASSWORD=[0-9a-f]{32,}/);
});

test('machine PostgreSQL tuning checker passes all explicit profiles', () => {
  const result = spawnSync(process.execPath, ['scripts/check-knowledge-hub-postgres-tuning.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"status": "PASS"/);
  assert.match(result.stdout, /"profile_selection": "EXPLICIT_REQUIRED"/);
  assert.match(result.stdout, /"8gb"/);
});

test('environment bootstrap refuses to guess a profile', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-env-'));
  const out = path.join(dir, '.env');
  const result = prepare(['--output', out]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--profile is required/);
  assert.equal(fs.existsSync(out), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

for (const expected of [
  { profile: '2gb', config: './postgres/postgresql.tuned-2gb.conf', shm: '256mb', pool: '5' },
  { profile: '4gb', config: './postgres/postgresql.tuned-4gb.conf', shm: '512mb', pool: '10' },
  { profile: '8gb', config: './postgres/postgresql.tuned-8gb.conf', shm: '1gb', pool: '10' }
]) {
  test(`environment bootstrap generates the canonical ${expected.profile} profile tuple without printing the password`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-env-'));
    const out = path.join(dir, '.env');
    const result = prepare(['--profile', expected.profile, '--output', out]);
    assert.equal(result.status, 0, result.stderr);
    const text = fs.readFileSync(out, 'utf8');
    assert.equal(value(text, 'POSTGRES_IMAGE'), 'postgres:16.14-alpine');
    assert.equal(value(text, 'POSTGRES_DB'), 'bai_knowledge_hub');
    assert.equal(value(text, 'POSTGRES_USER'), 'bai_hub');
    assert.equal(value(text, 'POSTGRES_CONFIG_FILE'), expected.config);
    assert.equal(value(text, 'POSTGRES_SHM_SIZE'), expected.shm);
    assert.equal(value(text, 'BAI_KNOWLEDGE_HUB_DB_POOL_MAX'), expected.pool);
    const password = text.match(/^POSTGRES_PASSWORD=([0-9a-f]+)$/m)?.[1];
    const runtimePassword = text.match(/^BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=([0-9a-f]+)$/m)?.[1];
    assert.ok(password && password.length === 64);
    assert.equal(value(text, 'BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER'), 'bai_hub_runtime');
    assert.ok(runtimePassword && runtimePassword.length === 64);
    assert.notEqual(runtimePassword, password);
    assert.ok(!result.stdout.includes(password));
    assert.ok(!result.stdout.includes(runtimePassword));
    assert.match(result.stdout, new RegExp(`Selected profile\\s+: ${expected.profile}`));
    assert.match(result.stdout, /Public profile\s+: NOT AUTHORIZED/);
    if (process.platform !== 'win32') assert.equal(fs.statSync(out).mode & 0o777, 0o600);
    fs.rmSync(dir, { recursive: true, force: true });
  });
}

test('environment bootstrap accepts bounded operational overrides without changing canonical DB identity', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-env-'));
  const out = path.join(dir, '.env');
  const result = prepare([
    '--profile', '8gb',
    '--output', out,
    '--retention-days', '45',
    '--rate-limit-per-minute', '240',
    '--body-limit-bytes', '524288',
    '--db-pool-max', '12',
    '--hub-domain', '58.191.43.211'
  ]);
  assert.equal(result.status, 0, result.stderr);
  const text = fs.readFileSync(out, 'utf8');
  assert.equal(value(text, 'POSTGRES_IMAGE'), 'postgres:16.14-alpine');
  assert.equal(value(text, 'POSTGRES_DB'), 'bai_knowledge_hub');
  assert.equal(value(text, 'POSTGRES_USER'), 'bai_hub');
  assert.equal(value(text, 'BAI_KNOWLEDGE_HUB_RETENTION_DAYS'), '45');
  assert.equal(value(text, 'BAI_KNOWLEDGE_HUB_RATE_LIMIT_PER_MINUTE'), '240');
  assert.equal(value(text, 'BAI_KNOWLEDGE_HUB_BODY_LIMIT_BYTES'), '524288');
  assert.equal(value(text, 'BAI_KNOWLEDGE_HUB_DB_POOL_MAX'), '12');
  assert.equal(value(text, 'HUB_DOMAIN'), '58.191.43.211');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('environment bootstrap rejects unsupported profiles, invalid overrides, unsafe domain text and overwrite attempts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bai-hub-env-'));
  const out = path.join(dir, '.env');
  assert.equal(prepare(['--profile', '16gb', '--output', out]).status, 2);
  assert.equal(prepare(['--profile', '8gb', '--output', out, '--db-pool-max', '101']).status, 2);
  assert.equal(prepare(['--profile', '8gb', '--output', out, '--body-limit-bytes', '1048577']).status, 2);
  assert.equal(prepare(['--profile', '8gb', '--output', out, '--hub-domain', 'bad domain']).status, 2);
  const first = prepare(['--profile', '8gb', '--output', out]);
  assert.equal(first.status, 0, first.stderr);
  const second = prepare(['--profile', '8gb', '--output', out]);
  assert.equal(second.status, 2);
  assert.match(second.stderr, /refusing to overwrite existing environment file/i);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('local compose helper never guesses a missing profile and rehearsal declares its bounded profile explicitly', () => {
  const start = read('deploy/knowledge-hub/scripts/start-local-compose.sh');
  assert.match(start, /BAI_KNOWLEDGE_HUB_PROFILE/);
  assert.match(start, /bash "\$here\/scripts\/prepare-compose-env\.sh" --profile/);
  assert.match(start, /BAI_KNOWLEDGE_HUB_ENV_FILE="\$env_file" bash "\$here\/scripts\/verify-postgres-tuning\.sh"/);
  assert.match(start, /127\.0\.0\.1:8787\/readyz/);
  assert.doesNotMatch(start, /--profile\s+public/);
  assert.match(start, /verify-postgres-tuning\.sh/);

  const rehearsal = read('deploy/knowledge-hub/scripts/run-live-rehearsal.sh');
  assert.match(rehearsal, /POSTGRES_CONFIG_FILE=\.\/postgres\/postgresql\.tuned-2gb\.conf/);
  assert.match(rehearsal, /POSTGRES_SHM_SIZE=256mb/);
});

test('local compose helper preserves data by default and requires explicit destructive flag', () => {
  const stop = read('deploy/knowledge-hub/scripts/stop-local-compose.sh');
  assert.match(stop, /--destroy-data/);
  assert.match(stop, /down -v --remove-orphans/);
  assert.match(stop, /down --remove-orphans/);
});
