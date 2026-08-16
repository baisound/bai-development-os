#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCanonicalVerifiedRehearsalRecoveryAuthorization } from './verify-knowledge-hub-rehearsal-target-authorization.mjs';

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const PHASES = new Set(['RESERVED', 'AUTHORIZATION_CONSUMED', 'PLAINTEXT_CREATE_STARTED', 'PLAINTEXT_CREATED', 'DATABASE_CREATE_STARTED', 'DATABASE_CREATED', 'DATABASE_DROPPED', 'PLAINTEXT_DELETED', 'BUNDLE_COMMITTED', 'FAILED', 'RECOVERED', 'QUARANTINED']);
const SHA = /^[a-f0-9]{64}$/;
const TERMINAL_PHASES = new Set(['BUNDLE_COMMITTED', 'RECOVERED', 'QUARANTINED']);
export const isCanonicalRecoverySourcePhase = (phase) => PHASES.has(phase) && !TERMINAL_PHASES.has(phase);
const TRANSITIONS = new Map([
  ['RESERVED', new Set(['AUTHORIZATION_CONSUMED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['AUTHORIZATION_CONSUMED', new Set(['PLAINTEXT_CREATE_STARTED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['PLAINTEXT_CREATE_STARTED', new Set(['PLAINTEXT_CREATED', 'PLAINTEXT_DELETED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['PLAINTEXT_CREATED', new Set(['DATABASE_CREATE_STARTED', 'PLAINTEXT_DELETED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['DATABASE_CREATE_STARTED', new Set(['DATABASE_CREATED', 'DATABASE_DROPPED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['DATABASE_CREATED', new Set(['DATABASE_DROPPED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['DATABASE_DROPPED', new Set(['PLAINTEXT_DELETED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['PLAINTEXT_DELETED', new Set(['BUNDLE_COMMITTED', 'FAILED', 'RECOVERED', 'QUARANTINED'])],
  ['FAILED', new Set(['RECOVERED', 'QUARANTINED'])]
]);

const validUtc = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(value ?? '');
  if (!match) return false;
  const [, year, month, day, hour, minute, second, fraction = ''] = match;
  const milliseconds = Number(fraction.padEnd(3, '0'));
  const epoch = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), milliseconds);
  const actual = new Date(epoch);
  return actual.getUTCFullYear() === Number(year) && actual.getUTCMonth() === Number(month) - 1 && actual.getUTCDate() === Number(day)
    && actual.getUTCHours() === Number(hour) && actual.getUTCMinutes() === Number(minute) && actual.getUTCSeconds() === Number(second)
    && actual.getUTCMilliseconds() === milliseconds;
};

function validatePhaseState(state) {
  const exact = (created, dropped, deleted) => state.database_created === created && state.database_dropped === dropped && state.temporary_plaintext_deleted === deleted;
  if (['RESERVED', 'AUTHORIZATION_CONSUMED'].includes(state.phase) && !exact(false, true, true)) throw new Error(`${state.phase} safety state invalid`);
  if (['PLAINTEXT_CREATE_STARTED', 'PLAINTEXT_CREATED'].includes(state.phase) && !exact(false, true, false)) throw new Error(`${state.phase} safety state invalid`);
  if (['DATABASE_CREATE_STARTED', 'DATABASE_CREATED'].includes(state.phase) && !exact(true, false, false)) throw new Error(`${state.phase} safety state invalid`);
  if (state.phase === 'DATABASE_DROPPED' && !exact(false, true, false)) throw new Error('DATABASE_DROPPED safety state invalid');
  if (['PLAINTEXT_DELETED', 'BUNDLE_COMMITTED', 'RECOVERED'].includes(state.phase) && !exact(false, true, true)) throw new Error(`${state.phase} safety state invalid`);
  if (['FAILED', 'QUARANTINED'].includes(state.phase) && state.database_created === state.database_dropped) throw new Error(`${state.phase} database state invalid`);
}

function syncDirectory(directory) {
  const fd = fs.openSync(directory, 'r');
  try { fs.fsyncSync(fd); }
  catch (error) { if (process.platform !== 'win32' || !['EPERM', 'EINVAL'].includes(error.code)) throw error; }
  finally { fs.closeSync(fd); }
}

function readEntries(file) {
  if (!fs.existsSync(file)) return [];
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('recovery journal must be an ordinary file');
  const text = fs.readFileSync(file, 'utf8');
  if (!text.endsWith('\n')) throw new Error('recovery journal is truncated');
  const entries = text.trimEnd() ? text.trimEnd().split('\n').map((line) => JSON.parse(line)) : [];
  let previous = '0'.repeat(64);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]; const { entry_sha256: actual, ...body } = entry;
    if (entry.sequence !== index || entry.previous_entry_sha256 !== previous || !SHA.test(actual) || sha256(Buffer.from(canonical(body))) !== actual || !validUtc(entry.recorded_at)) throw new Error('recovery journal chain invalid');
    validatePhaseState(entry);
    if (index > 0) {
      const prior = entries[index - 1];
      for (const key of ['run_id', 'restore_database', 'postgres_socket_identity_sha256', 'target_cluster_identifier_sha256', 'temporary_plaintext_path']) if (entry[key] !== prior[key]) throw new Error('recovery journal identity changed');
      if (!TRANSITIONS.get(prior.phase)?.has(entry.phase)) throw new Error('recovery journal transition invalid');
      if (Date.parse(entry.recorded_at) < Date.parse(prior.recorded_at)) throw new Error('recovery journal time regressed');
    } else if (entry.phase !== 'RESERVED') throw new Error('recovery journal must start RESERVED');
    previous = actual;
  }
  return entries;
}

function appendRecoveryJournalInternal(file, state, recordedAt, allowRecovered) {
  if (!path.isAbsolute(file)) throw new Error('recovery journal path must be absolute');
  const directory = path.dirname(file); const dirStat = fs.lstatSync(directory);
  if (!dirStat.isDirectory() || dirStat.isSymbolicLink() || fs.realpathSync(directory) !== path.resolve(directory)) throw new Error('recovery journal directory invalid');
  const entries = readEntries(file);
  if (state.phase === 'RECOVERED' && !allowRecovered) throw new Error('RECOVERED requires a separate canonical recovery authority and live probe; generic append is prohibited');
  if (!PHASES.has(state.phase) || !/^[A-Za-z0-9._-]{1,64}$/.test(state.run_id) || !/^[A-Za-z0-9_]+_restore_rehearsal$/.test(state.restore_database) || !SHA.test(state.postgres_socket_identity_sha256) || !SHA.test(state.target_cluster_identifier_sha256)) throw new Error('recovery journal state invalid');
  if (state.temporary_plaintext_path !== null && (!path.isAbsolute(state.temporary_plaintext_path) || state.temporary_plaintext_path.includes('\n'))) throw new Error('temporary plaintext path invalid');
  for (const key of ['database_created', 'database_dropped', 'temporary_plaintext_deleted']) if (typeof state[key] !== 'boolean') throw new Error(`${key} invalid`);
  if (!validUtc(recordedAt)) throw new Error('recorded_at invalid');
  validatePhaseState(state);
  if (entries.length > 0) {
    const prior = entries.at(-1);
    if (TERMINAL_PHASES.has(prior.phase) || !TRANSITIONS.get(prior.phase)?.has(state.phase)) throw new Error('recovery journal transition invalid');
    for (const key of ['run_id', 'restore_database', 'postgres_socket_identity_sha256', 'target_cluster_identifier_sha256', 'temporary_plaintext_path']) if (state[key] !== prior[key]) throw new Error('recovery journal identity changed');
    if (Date.parse(recordedAt) < Date.parse(prior.recorded_at)) throw new Error('recorded_at regressed');
  } else if (state.phase !== 'RESERVED') throw new Error('recovery journal must start RESERVED');
  const body = {
    schema_version: '1.0', result: 'KNOWLEDGE_HUB_REHEARSAL_RECOVERY_JOURNAL', sequence: entries.length,
    run_id: state.run_id, restore_database: state.restore_database, postgres_socket_identity_sha256: state.postgres_socket_identity_sha256,
    target_cluster_identifier_sha256: state.target_cluster_identifier_sha256, phase: state.phase,
    temporary_plaintext_path: state.temporary_plaintext_path, database_created: state.database_created,
    database_dropped: state.database_dropped, temporary_plaintext_deleted: state.temporary_plaintext_deleted,
    previous_entry_sha256: entries.at(-1)?.entry_sha256 ?? '0'.repeat(64), recorded_at: recordedAt
  };
  const entry = { ...body, entry_sha256: sha256(Buffer.from(canonical(body))) };
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND, 0o600);
  try { fs.writeSync(fd, `${JSON.stringify(entry)}\n`); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  syncDirectory(directory);
  return Object.freeze(entry);
}

export function appendRecoveryJournal(file, state, recordedAt = new Date().toISOString()) {
  return appendRecoveryJournalInternal(file, state, recordedAt, false);
}

export function appendCanonicalRecoveredJournal(file, verifiedRecoveryAuthority, liveProof, recordedAt = new Date().toISOString()) {
  if (!isCanonicalVerifiedRehearsalRecoveryAuthorization(verifiedRecoveryAuthority)) throw new Error('canonical verified recovery authority is required');
  const beforeBytes = fs.readFileSync(file); const before = inspectRecoveryJournal(file); const receipt = verifiedRecoveryAuthority.receipt;
  if (!before.requires_recovery || !isCanonicalRecoverySourcePhase(before.terminal.phase)
    || sha256(beforeBytes) !== receipt.recovery_journal_sha256 || before.terminal.run_id !== receipt.run_id
    || before.terminal.restore_database !== receipt.restore_database
    || before.terminal.target_cluster_identifier_sha256 !== receipt.target_cluster_identifier_sha256
    || before.terminal.postgres_socket_identity_sha256 !== receipt.postgres_socket_identity_sha256
    || sha256(Buffer.from(before.terminal.temporary_plaintext_path ?? '', 'utf8')) !== receipt.temporary_plaintext_path_sha256) {
    throw new Error('recovery authority does not bind the recoverable journal');
  }
  if (!liveProof || liveProof.database_absent !== true || liveProof.temporary_plaintext_absent !== true || liveProof.target_cluster_identifier_sha256 !== receipt.target_cluster_identifier_sha256 || liveProof.postgres_socket_identity_sha256 !== receipt.postgres_socket_identity_sha256 || liveProof.psql_binary_sha256 !== receipt.psql_binary_sha256) throw new Error('canonical recovery live proof invalid');
  return appendRecoveryJournalInternal(file, { ...before.terminal, phase: 'RECOVERED', database_created: false, database_dropped: true, temporary_plaintext_deleted: true }, recordedAt, true);
}

export function inspectRecoveryJournal(file) {
  const entries = readEntries(file);
  if (entries.length === 0) throw new Error('recovery journal is empty');
  return Object.freeze({ entries: entries.length, terminal: entries.at(-1), requires_recovery: !['BUNDLE_COMMITTED', 'RECOVERED'].includes(entries.at(-1).phase) });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, file, payload] = process.argv.slice(2);
    const result = mode === 'append' ? appendRecoveryJournal(file, JSON.parse(payload)) : mode === 'inspect' ? inspectRecoveryJournal(file) : (() => { throw new Error('usage: append <journal> <state-json> | inspect <journal>'); })();
    console.log(JSON.stringify({ status: 'PASS', ...result }, null, 2));
  } catch (error) { console.error(JSON.stringify({ status: 'FAIL', reason: error.message }, null, 2)); process.exit(1); }
}
