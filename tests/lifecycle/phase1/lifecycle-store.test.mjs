import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { hostname, tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { checksum, LifecycleStore, validateActor, validateRecord } from '../../../src/lifecycle/phase1/index.mjs';
import { createDesignOnlyClosureMigrationPlan, evaluateDesignOnlyRollback } from '../../../src/lifecycle/migration.mjs';

const execFile = promisify(execFileCallback);
const fixtureBase = path.join(process.cwd(), '.lifecycle-phase1-fixtures');
const requested = { actor_id: 'builder-1', actor_type: 'ROLE', role_id: 'Builder', session_id: null, run_id: null };
const authorized = { actor_id: 'SYSTEM_RULE', actor_type: 'SYSTEM_COMPONENT', role_id: null, session_id: null, run_id: null };
const applied = { actor_id: 'lifecycle-manager-1', actor_type: 'SYSTEM_COMPONENT', role_id: null, session_id: null, run_id: null };
const authorization = { authorization_id: 'SYSTEM_RULE', authority_type: 'RULE', authority_path: 'authority.md', authority_checksum: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', decision: 'NOT_REQUIRED', effective_at: '2026-07-27T00:00:00Z', expires_at: null, scope: { task_id: 'TASK-004', phases: ['DESIGN'], operations: ['CANONICAL_STATE_COMMIT'] } };

async function createFixture(t) {
  await mkdir(fixtureBase, { recursive: true });
  const root = await mkdtemp(path.join(fixtureBase, 'fixture-'));
  const { stdout } = await execFile('findmnt', ['-T', root, '-no', 'FSTYPE,SOURCE']);
  const filesystem = stdout.trim();
  t.diagnostic(`fixture findmnt -T ${root}: ${filesystem}`);
  assert.match(filesystem, /^ext4\s/, 'fixture must be on WSL2 ext4');
  assert.doesNotMatch(filesystem, /\/mnt\/|tmpfs/i, 'fixture must not be a Windows mount or tmpfs');
  t.after(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(fixtureBase, { recursive: true, force: true });
  });
  return root;
}

function record(evidence, overrides = {}) {
  const value = { record_schema_version: '1.1.0', task_id: 'TASK-004', project_id: 'javascript-roulette', record_revision: 1, task_status: 'ACTIVE', current_phase: 'DESIGN', gate_status: 'FAIL', authorization_status: 'NOT_REQUIRED', archive_status: 'NOT_ELIGIBLE', status_reason: 'initial fixture', entered_at: '2026-07-27T00:00:00Z', updated_at: '2026-07-27T00:00:00Z', last_verified_at: '2026-07-27T00:00:00Z', requested_by: requested, authorized_by: authorized, applied_by: applied, authorization_reference: authorization, authoritative_evidence: evidence, blocking_items: [], next_eligible_phases: ['DESIGN'], verification_result: 'PASS', last_transition_id: '00000000-0000-4000-8000-000000000001', ...overrides };
  value.content_checksum = checksum(value);
  return value;
}

function request(current, evidence, to = {}) {
  return { request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, current[key]])), to: { task_status: current.task_status, current_phase: current.current_phase, gate_status: current.gate_status, authorization_status: current.authorization_status, archive_status: current.archive_status, ...to }, reason_code: 'REWORK_DESIGN', reason: 'design rework', requested_by: requested, authorized_by: authorized, authorization_reference: authorization, evidence };
}

async function setup(t, options = {}) {
  const root = await createFixture(t);
  const dir = path.join(root, 'TASK-004');
  await mkdir(dir);
  await writeFile(path.join(root, 'evidence.md'), 'verified evidence');
  const evidence = [{ path: 'evidence.md', checksum: `sha256:${createHash('sha256').update(await readFile(path.join(root, 'evidence.md'))).digest('hex')}`, authoring_role: 'Builder', result: 'PASS', observed_at: '2026-07-27T00:00:00Z' }];
  const { durability, initial = {}, ...storeOptions } = options;
  const initialized = new LifecycleStore(dir, { ...storeOptions, projectRoot: root });
  await initialized.init(record(evidence, initial));
  return { dir, root, evidence, store: durability ? new LifecycleStore(dir, { ...storeOptions, durability, projectRoot: root }) : initialized };
}

test('D-01/D-02: commits same-phase rework and rejects revision conflicts', async (t) => {
  const { evidence, store } = await setup(t);
  const current = await store.readRecord();
  const next = await store.transition(request(current, evidence), applied);
  assert.equal(next.record_revision, 2);
  await assert.rejects(() => store.transition({ ...request(current, evidence), expected_revision: 9 }, applied), (error) => error.code === 'REVISION_CONFLICT');
});

test('D-01/D-04: rejects invalid actor, schema, evidence, and task identity', async (t) => {
  const { evidence, store } = await setup(t);
  assert.throws(() => validateActor({ ...requested, role_id: null }), (error) => error.code === 'SCHEMA_INVALID');
  assert.throws(() => validateRecord(record(evidence, { record_schema_version: '2.0.0' })), (error) => error.code === 'SCHEMA_INVALID');
  const current = await store.readRecord();
  await assert.rejects(() => store.transition({ ...request(current, evidence), task_id: 'TASK-999' }, applied), (error) => error.code === 'SCHEMA_INVALID');
  assert.equal((await store.readRecord()).record_revision, 1);
});

test('D-02: rejects tampered fencing token without a committed event', async (t) => {
  const { dir, evidence, store } = await setup(t, { beforeCommit: async (leasePath) => {
    const lease = JSON.parse(await readFile(leasePath, 'utf8'));
    lease.fencing_token = 0;
    await writeFile(leasePath, JSON.stringify(lease));
  } });
  const current = await store.readRecord();
  const candidate = request(current, evidence);
  await assert.rejects(() => store.transition(candidate, applied), (error) => error.code === 'STALE_FENCING_TOKEN');
  assert.equal((await store.readRecord()).record_revision, 1);
  const log = await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8');
  assert.doesNotMatch(log, new RegExp(`"transition_id":"${candidate.request_id}"[^\\n]*"outcome":"COMMITTED"`));
});

test('D-03: recovers PREPARED crash with original revision and released lease', async (t) => {
  const { dir, evidence, store } = await setup(t, { crashAt: 'PREPARED' });
  const current = await store.readRecord();
  await assert.rejects(() => store.transition(request(current, evidence), applied), /SIMULATED_CRASH/);
  await new LifecycleStore(dir, { projectRoot: path.dirname(dir) }).recover();
  assert.equal((await new LifecycleStore(dir).readRecord()).record_revision, 1);
  await assert.rejects(() => readFile(path.join(dir, 'lease.json'), 'utf8'));
});

test('TASK-021 recovery never aborts a live matching transaction lease', async (t) => {
  let concurrentCode = null;
  const { dir, evidence, store } = await setup(t, { beforeCommit: async () => {
    await assert.rejects(() => new LifecycleStore(dir, { projectRoot: path.dirname(dir) }).recover(), (error) => { concurrentCode = error.code; return error.code === 'TRANSACTION_IN_PROGRESS'; });
  } });
  const next = await store.transition(request(await store.readRecord(), evidence), applied);
  assert.equal(concurrentCode, 'TRANSACTION_IN_PROGRESS'); assert.equal(next.record_revision, 2);
});

test('TASK-021 hostile journal paths fail closed without deleting outside files', async (t) => {
  const { root, dir, evidence, store } = await setup(t, { crashAt: 'PREPARED' });
  const current = await store.readRecord();
  await assert.rejects(() => store.transition(request(current, evidence), applied), /SIMULATED_CRASH/);
  const protectedFile = path.join(root, 'must-survive.txt'); await writeFile(protectedFile, 'protected');
  const journalPath = path.join(dir, 'transaction-journal.json'); const journal = JSON.parse(await readFile(journalPath, 'utf8')); journal.snapshot_tmp = protectedFile; await writeFile(journalPath, JSON.stringify(journal));
  await assert.rejects(() => new LifecycleStore(dir, { projectRoot: root }).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
  assert.equal(await readFile(protectedFile, 'utf8'), 'protected');
});

test('TASK-021 dead append owner is fenced and its tokenized lock is recoverable', async (t) => {
  const { dir, evidence, store } = await setup(t); const now = new Date();
  await writeFile(path.join(dir, 'audit-append.lock'), JSON.stringify({ lock_schema_version: '1.0.0', lock_token: crypto.randomUUID(), pid: 2147483647, host: hostname(), owner_instance_id: crypto.randomUUID(), fencing_token: now.getTime(), acquired_at: now.toISOString(), expires_at: new Date(now.getTime() + 60_000).toISOString() }));
  const invalid = { ...request(await store.readRecord(), evidence), expected_revision: 99 };
  await assert.rejects(() => store.transition(invalid, applied), (error) => error.code === 'REVISION_CONFLICT');
  await assert.rejects(() => readFile(path.join(dir, 'audit-append.lock'), 'utf8'));
});

test('TASK-021 migration evidence rejects parent-path escape', async (t) => {
  const { root, dir } = await setup(t); const outside = path.join(path.dirname(root), 'TASK-004-outside.txt'); await writeFile(outside, 'outside'); t.after(() => rm(outside, { force: true }));
  const mapping = { mapping_id: crypto.randomUUID(), source_task_id: 'TASK-004', legacy_expression: 'legacy', mapped_state: { task_status: 'ACTIVE', current_phase: 'DESIGN', gate_status: 'FAIL', authorization_status: 'NOT_REQUIRED', archive_status: 'NOT_ELIGIBLE' }, confidence: 'HIGH', source_evidence: [{ path: `../${path.basename(outside)}`, checksum: `sha256:${createHash('sha256').update('outside').digest('hex')}` }], mapped_by: 'migration-manager', created_at: new Date().toISOString() }; mapping.checksum = checksum(mapping);
  await writeFile(path.join(dir, 'migration-mapping.jsonl'), `${JSON.stringify(mapping)}\n`);
  await assert.rejects(() => new LifecycleStore(dir, { projectRoot: root }).recover(), (error) => ['EVIDENCE_INVALID', 'NOT_CONFIRMED'].includes(error.code));
});

test('TASK-021 real LifecycleStore proof binds rollback identity and any Event 1.2 is downgrade PONR', async (t) => {
  const { evidence, store } = await setup(t); const current = await store.readRecord();
  const plan = createDesignOnlyClosureMigrationPlan({ task_id: current.task_id, project_id: current.project_id, baseline_commit: 'a'.repeat(40), required_runtime_commit: 'b'.repeat(40), source_record_revision: current.record_revision, source_record_checksum: current.content_checksum, writer_drained: true, lease_absent: true, journal_absent: true, backup_checksum: `sha256:${'c'.repeat(64)}`, owner_authorization_checksum: `sha256:${'d'.repeat(64)}` });
  assert.equal((await evaluateDesignOnlyRollback(plan, { lifecycle_store: store })).decision, 'ROLLBACK_ALLOWED');
  const malformed = { ...request(current, evidence), operation_domain: 'TASK_CLASSIFICATION', owner_authorized: false, closure_ready: false };
  await assert.rejects(() => store.transition(malformed, applied));
  assert.equal((await evaluateDesignOnlyRollback(plan, { lifecycle_store: store })).decision, 'DOWNGRADE_FORBIDDEN');
});

test('D-05/IC5-01: recovers APPLIED journal only after complete durable acknowledgement', async (t) => {
  const { dir, evidence, store } = await setup(t, { crashAt: 'ACKNOWLEDGED' });
  const current = await store.readRecord();
  await assert.rejects(() => store.transition(request(current, evidence), applied), /SIMULATED_CRASH/);
  const recovered = new LifecycleStore(dir, { projectRoot: path.dirname(dir) });
  await recovered.recover();
  assert.equal((await recovered.readRecord()).record_revision, 2);
  assert.equal((await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8')).split('\n').filter(Boolean).length, 1);
  await assert.rejects(() => readFile(path.join(dir, 'transaction-journal.json'), 'utf8'));
  await assert.rejects(() => readFile(path.join(dir, 'lease.json'), 'utf8'));
});

test('D-05: preserves Safe Stop for a tampered APPLIED journal', async (t) => {
  const { dir, evidence, store } = await setup(t, { crashAt: 'APPLIED' });
  const current = await store.readRecord();
  await assert.rejects(() => store.transition(request(current, evidence), applied), /SIMULATED_CRASH/);
  const journalPath = path.join(dir, 'transaction-journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  journal.snapshot_checksum = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
  await writeFile(journalPath, JSON.stringify(journal));
  await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
});

test('D-06: detects append-only log tampering and duplicate transitions', async (t) => {
  const { dir, evidence, store } = await setup(t);
  const current = await store.readRecord();
  await store.transition(request(current, evidence), applied);
  const logPath = path.join(dir, 'transition-log.jsonl');
  const log = await readFile(logPath, 'utf8');
  await writeFile(logPath, log + log);
  await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => ['COMMIT_STATE_UNKNOWN', 'CHECKSUM_MISMATCH'].includes(error.code));
});

for (const [label, failureAt, errorCode] of [
  ['syncFile', 3, 'EPERM'],
  ['syncFile', 3, 'EINVAL'],
  ['syncDirectory', 2, 'EPERM'],
  ['syncDirectory', 2, 'EINVAL'],
  ['syncDirectory', 2, 'EISDIR'],
]) {
  test(`D-05 durability: ${label} ${errorCode} Safe Stops before snapshot commit`, async (t) => {
    let calls = 0;
    const failOnce = async () => {
      calls += 1;
      if (calls === failureAt) {
        const error = new Error(`${label} injected failure`);
        error.code = errorCode;
        throw error;
      }
    };
    const durability = label === 'syncFile'
      ? { syncFile: failOnce, syncDirectory: async () => {} }
      : { syncFile: async () => {}, syncDirectory: failOnce };
    const { dir, evidence, store } = await setup(t, { durability });
    const snapshotBefore = await readFile(path.join(dir, 'canonical-status.json'), 'utf8');
    const current = await store.readRecord();
    await assert.rejects(() => store.transition(request(current, evidence), applied), (error) => error.code === 'DURABILITY_SYNC_FAILED');
    assert.equal((await store.readRecord()).record_revision, 1);
    assert.equal(await readFile(path.join(dir, 'canonical-status.json'), 'utf8'), snapshotBefore);
    await assert.rejects(() => readFile(path.join(dir, 'lease.json'), 'utf8'));
    assert.deepEqual(await readdir(path.join(dir, 'transactions')), []);
    const journal = JSON.parse(await readFile(path.join(dir, 'transaction-journal.json'), 'utf8'));
    assert.equal(journal.stage, 'ABORTED');
    assert.equal(journal.failure_code, 'DURABILITY_SYNC_FAILED');
    const log = await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8');
    assert.match(log, /"outcome":"VERIFICATION_FAILED"/);
    assert.match(log, /"failure_code":"DURABILITY_SYNC_FAILED"/);
    assert.doesNotMatch(log, /"outcome":"COMMITTED"/);
  });
}

for (const [label, failureAt] of [
  ['syncFile', 8],
  ['syncDirectory', 6],
]) {
  test(`IC4-01/IC5-01 durability: event append ${label} failure preserves recovery evidence without duplicates`, async (t) => {
    let calls = 0;
    const failEventDurability = async () => {
      calls += 1;
      if (calls === failureAt) {
        const error = new Error(`${label} event append durability failure`);
        error.code = 'EPERM';
        throw error;
      }
    };
    const durability = label === 'syncFile'
      ? { syncFile: failEventDurability, syncDirectory: async () => {} }
      : { syncFile: async () => {}, syncDirectory: failEventDurability };
    const { dir, evidence, store } = await setup(t, { durability });
    const current = await store.readRecord();
    const candidate = request(current, evidence);
    await assert.rejects(() => store.transition(candidate, applied), (error) => error.code === 'DURABILITY_SYNC_FAILED');

    assert.equal((await store.readRecord()).record_revision, 2);
    const journal = JSON.parse(await readFile(path.join(dir, 'transaction-journal.json'), 'utf8'));
    assert.equal(journal.stage, 'RECOVERY_REQUIRED');
    assert.equal(journal.failure_code, 'DURABILITY_SYNC_FAILED');
    await readFile(path.join(dir, 'lease.json'), 'utf8');
    await readFile(journal.event_tmp, 'utf8');
    const log = await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8');
    assert.equal(log.split('\n').filter(Boolean).filter((line) => JSON.parse(line).transition_id === candidate.request_id).length, 1);
    await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
    const recoveredLog = await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8');
    assert.equal(recoveredLog.split('\n').filter(Boolean).filter((line) => JSON.parse(line).transition_id === candidate.request_id).length, 1);
  });
}

test('IC5-01: existing Event without durable acknowledgement remains a no-write Safe Stop', async (t) => {
  const { dir, evidence, store } = await setup(t, { crashAt: 'APPLIED' });
  const current = await store.readRecord();
  const candidate = request(current, evidence);
  await assert.rejects(() => store.transition(candidate, applied), /SIMULATED_CRASH/);
  const journalPath = path.join(dir, 'transaction-journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  await writeFile(path.join(dir, 'transition-log.jsonl'), await readFile(journal.event_tmp, 'utf8'));

  await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
  assert.equal(JSON.parse(await readFile(journalPath, 'utf8')).stage, 'RECOVERY_REQUIRED');
  await readFile(path.join(dir, 'lease.json'), 'utf8');
  await readFile(journal.event_tmp, 'utf8');
  const log = await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8');
  assert.equal(log.split('\n').filter(Boolean).filter((line) => JSON.parse(line).transition_id === candidate.request_id).length, 1);
});

for (const [field, invalid] of [
  ['transition_id', 'different-transition'],
  ['entry_checksum', 'sha256:0000000000000000000000000000000000000000000000000000000000000000'],
  ['resulting_revision', 999],
]) {
  test(`IC5-01: mismatched durable acknowledgement ${field} blocks APPLIED recovery`, async (t) => {
    const { dir, evidence, store } = await setup(t, { crashAt: 'ACKNOWLEDGED' });
    const current = await store.readRecord();
    await assert.rejects(() => store.transition(request(current, evidence), applied), /SIMULATED_CRASH/);
    const journalPath = path.join(dir, 'transaction-journal.json');
    const journal = JSON.parse(await readFile(journalPath, 'utf8'));
    journal.event_acknowledgement[field] = invalid;
    await writeFile(journalPath, JSON.stringify(journal));

    await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
    assert.equal(JSON.parse(await readFile(journalPath, 'utf8')).stage, 'RECOVERY_REQUIRED');
    await readFile(path.join(dir, 'lease.json'), 'utf8');
  });
}

test('IC5-01: RECOVERY_REQUIRED cannot auto-commit without recovery authorization', async (t) => {
  const { dir, evidence, store } = await setup(t, { crashAt: 'APPLIED' });
  const current = await store.readRecord();
  await assert.rejects(() => store.transition(request(current, evidence), applied), /SIMULATED_CRASH/);
  const journalPath = path.join(dir, 'transaction-journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  journal.stage = 'RECOVERY_REQUIRED';
  await writeFile(journalPath, JSON.stringify(journal));

  await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
  assert.equal(JSON.parse(await readFile(journalPath, 'utf8')).stage, 'RECOVERY_REQUIRED');
  await readFile(path.join(dir, 'lease.json'), 'utf8');
});

async function assertAcknowledgementSafeStop(t, mutateAcknowledgement) {
  const { dir, evidence, store } = await setup(t, { crashAt: 'ACKNOWLEDGED' });
  const current = await store.readRecord();
  const candidate = request(current, evidence);
  await assert.rejects(() => store.transition(candidate, applied), /SIMULATED_CRASH/);
  const journalPath = path.join(dir, 'transaction-journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8'));
  mutateAcknowledgement(journal.event_acknowledgement);
  await writeFile(journalPath, JSON.stringify(journal));

  await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
  assert.equal(JSON.parse(await readFile(journalPath, 'utf8')).stage, 'RECOVERY_REQUIRED');
  await readFile(path.join(dir, 'lease.json'), 'utf8');
  await readFile(journal.event_tmp, 'utf8');
  const events = (await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8'))
    .split('\n').filter(Boolean).filter((line) => JSON.parse(line).transition_id === candidate.request_id);
  assert.equal(events.length, 1, 'Safe Stop must not append a duplicate Event');
  assert.equal((await new LifecycleStore(dir).readRecord()).record_revision, 2, 'Safe Stop must not increment revision');
}

test('IC6-01: each acknowledgement boolean rejects truthy, false, and missing values', async (t) => {
  const invalidValues = [
    ['string true', 'true'], ['string false', 'false'], ['string yes', 'yes'], ['string one', '1'],
    ['number', 1], ['array', []], ['object', {}], ['null', null], ['missing', undefined], ['false', false],
  ];
  for (const field of ['event_appended', 'log_file_synced', 'log_directory_synced', 'event_verified']) {
    for (const [label, value] of invalidValues) {
      await t.test(`${field}: ${label}`, async (subtest) => {
        await assertAcknowledgementSafeStop(subtest, (ack) => {
          if (value === undefined) delete ack[field];
          else ack[field] = value;
        });
      });
    }
  }
});

test('IC6-01: acknowledgement identities reject wrong types, empty, null, and missing values', async (t) => {
  const invalidIdentities = [
    ['transition_id empty', 'transition_id', ''],
    ['transition_id number', 'transition_id', 1],
    ['transition_id array', 'transition_id', []],
    ['transition_id object', 'transition_id', {}],
    ['transition_id null', 'transition_id', null],
    ['transition_id missing', 'transition_id', undefined],
    ['entry_checksum invalid schema', 'entry_checksum', 'sha256:not-a-checksum'],
    ['entry_checksum number', 'entry_checksum', 1],
    ['entry_checksum array', 'entry_checksum', []],
    ['entry_checksum object', 'entry_checksum', {}],
    ['entry_checksum null', 'entry_checksum', null],
    ['entry_checksum missing', 'entry_checksum', undefined],
    ['resulting_revision string', 'resulting_revision', '2'],
    ['resulting_revision fraction', 'resulting_revision', 2.5],
    ['resulting_revision array', 'resulting_revision', []],
    ['resulting_revision object', 'resulting_revision', {}],
    ['resulting_revision null', 'resulting_revision', null],
    ['resulting_revision missing', 'resulting_revision', undefined],
  ];
  for (const [label, field, value] of invalidIdentities) {
    await t.test(label, async (subtest) => {
      await assertAcknowledgementSafeStop(subtest, (ack) => {
        if (value === undefined) delete ack[field];
        else ack[field] = value;
      });
    });
  }
});

test('IC6-01: unknown acknowledgement fields and impossible acknowledgement orders Safe Stop', async (t) => {
  const invalidCases = [
    ['unknown field', (ack) => { ack.unrecognized_acknowledgement = true; }],
    ['file before append', (ack) => { ack.event_appended = false; ack.log_file_synced = true; }],
    ['directory before file', (ack) => { ack.log_file_synced = false; ack.log_directory_synced = true; }],
    ['verification before directory', (ack) => { ack.log_directory_synced = false; ack.event_verified = true; }],
  ];
  for (const [label, mutate] of invalidCases) {
    await t.test(label, async (subtest) => assertAcknowledgementSafeStop(subtest, mutate));
  }
});

test('IC6-01: journal transaction mismatch and VERIFIED missing identity retain recovery evidence', async (t) => {
  for (const [label, mutate] of [
    ['journal transition mismatch', (journal) => { journal.transition_id = 'other-transaction'; }],
    ['VERIFIED acknowledgement identity missing', (journal) => {
      journal.stage = 'VERIFIED';
      delete journal.event_acknowledgement.entry_checksum;
    }],
  ]) {
    await t.test(label, async (subtest) => {
      const { dir, evidence, store } = await setup(subtest, { crashAt: 'ACKNOWLEDGED' });
      const current = await store.readRecord();
      const candidate = request(current, evidence);
      await assert.rejects(() => store.transition(candidate, applied), /SIMULATED_CRASH/);
      const journalPath = path.join(dir, 'transaction-journal.json');
      const journal = JSON.parse(await readFile(journalPath, 'utf8'));
      mutate(journal);
      await writeFile(journalPath, JSON.stringify(journal));

      await assert.rejects(() => new LifecycleStore(dir).recover(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
      const retainedStage = JSON.parse(await readFile(journalPath, 'utf8')).stage;
      assert.equal(retainedStage, label === 'journal transition mismatch' ? 'APPLIED' : 'RECOVERY_REQUIRED');
      await readFile(path.join(dir, 'lease.json'), 'utf8');
      await readFile(journal.event_tmp, 'utf8');
      const events = (await readFile(path.join(dir, 'transition-log.jsonl'), 'utf8')).split('\n').filter(Boolean);
      assert.equal(events.filter((line) => JSON.parse(line).transition_id === candidate.request_id).length, 1);
    });
  }
});

test('authorized ext4 normal transition still commits', async (t) => {
  const { evidence, store } = await setup(t);
  const current = await store.readRecord();
  const next = await store.transition(request(current, evidence), applied);
  assert.equal(next.record_revision, 2);
  assert.equal(next.last_transition_id.length > 0, true);
});
