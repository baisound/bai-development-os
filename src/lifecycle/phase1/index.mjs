import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ENUMS = Object.freeze({
  task_status: ['DRAFT', 'ACTIVE', 'PAUSED', 'BLOCKED', 'STALLED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'ARCHIVED'],
  current_phase: ['TASK_DEFINITION', 'DESIGN', 'FINAL_PLAN', 'IMPLEMENTATION_AUTHORIZATION', 'IMPLEMENTATION', 'TESTING', 'IMPLEMENTATION_REVIEW', 'FINAL_JUDGMENT', 'POLICY_REVIEW', 'CLOSURE', 'ARCHIVE'],
  gate_status: ['NOT_EVALUATED', 'READY', 'NOT_READY', 'PASS', 'FAIL', 'NOT_CONFIRMED', 'BLOCKED'],
  authorization_status: ['NOT_REQUIRED', 'PENDING', 'AUTHORIZED', 'DENIED', 'EXPIRED', 'REVOKED'],
  archive_status: ['NOT_ELIGIBLE', 'REVIEW_PENDING', 'READY', 'DEFERRED', 'ARCHIVED'],
});

const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'REJECTED', 'ARCHIVED']);
const CORE_ROLES = new Set(['Orchestrator', 'Builder', 'Critic', 'Tester', 'Judge', 'Project Policy Agent']);
const FORWARD = new Map(ENUMS.current_phase.slice(0, -1).map((value, i) => [value, ENUMS.current_phase[i + 1]]));
const REWORK = new Map([
  ['DESIGN:DESIGN', { gates: ['FAIL', 'NOT_CONFIRMED'], code: 'REWORK_DESIGN' }],
  ['FINAL_PLAN:FINAL_PLAN', { gates: ['FAIL'], code: 'REWORK_FINAL_PLAN' }],
  ['FINAL_PLAN:DESIGN', { gates: ['FAIL', 'NOT_CONFIRMED'], code: 'REDESIGN_REQUIRED', judge: true }],
  ['IMPLEMENTATION_AUTHORIZATION:FINAL_PLAN', { gates: ['FAIL', 'NOT_CONFIRMED'], code: 'AUTHORIZATION_PLAN_REWORK' }],
  ['TESTING:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_TEST_FAILURE', implementation: true }],
  ['IMPLEMENTATION_REVIEW:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_REVIEW_FINDING', implementation: true }],
  ['FINAL_JUDGMENT:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_JUDGE_FIX', implementation: true }],
  ['FINAL_JUDGMENT:IMPLEMENTATION_REVIEW', { gates: ['NOT_CONFIRMED'], code: 'REVIEW_EVIDENCE_REQUIRED' }],
  ['POLICY_REVIEW:POLICY_REVIEW', { gates: ['FAIL'], code: 'REWORK_POLICY_VERIFY' }],
  ['POLICY_REVIEW:IMPLEMENTATION', { gates: ['FAIL'], code: 'REWORK_POLICY_IMPLEMENTATION', implementation: true }],
]);

export class LifecycleError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export const canonicalJson = (value) => JSON.stringify(sort(value));
export const checksum = (value) => `sha256:${createHash('sha256').update(canonicalJson(withoutChecksum(value))).digest('hex')}`;
const sort = (value) => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])])) : value;
const withoutChecksum = (value) => {
  if (!value || typeof value !== 'object') return value;
  const copy = structuredClone(value);
  delete copy.content_checksum; delete copy.entry_checksum;
  return copy;
};
const assertEnum = (field, value) => {
  if (!ENUMS[field].includes(value)) throw new LifecycleError('SCHEMA_INVALID', `${field} is invalid`);
};
const assertChecksum = (value, field = 'content_checksum') => {
  if (value[field] !== checksum(value)) throw new LifecycleError('CHECKSUM_INVALID', `${field} does not match canonical JSON`);
};
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const EVENT_ACKNOWLEDGEMENT_FIELDS = Object.freeze([
  'transition_id',
  'entry_checksum',
  'resulting_revision',
  'event_appended',
  'log_file_synced',
  'log_directory_synced',
  'event_verified',
]);
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const assertTime = (value, field) => {
  if (typeof value !== 'string' || !RFC3339.test(value) || Number.isNaN(Date.parse(value))) throw new LifecycleError('SCHEMA_INVALID', `${field} must be RFC 3339 UTC`);
};
const assertProjectPath = (value) => {
  if (typeof value !== 'string' || !value || path.isAbsolute(value) || value.split('/').includes('..')) throw new LifecycleError('EVIDENCE_INVALID', 'evidence path must remain project-relative');
};

export function validateActor(actor) {
  if (!actor || typeof actor.actor_id !== 'string' || !actor.actor_id) throw new LifecycleError('SCHEMA_INVALID', 'actor_id is required');
  if (!['ROLE', 'SYSTEM_COMPONENT', 'OWNER'].includes(actor.actor_type)) throw new LifecycleError('SCHEMA_INVALID', 'actor_type is invalid');
  if (actor.actor_type === 'ROLE' && !CORE_ROLES.has(actor.role_id)) throw new LifecycleError('SCHEMA_INVALID', 'role_id must be a core role');
  if (actor.actor_type !== 'ROLE' && actor.role_id !== null) throw new LifecycleError('SCHEMA_INVALID', 'non-role actor must have null role_id');
  for (const key of ['session_id', 'run_id']) if (!(key in actor) || (actor[key] !== null && typeof actor[key] !== 'string')) throw new LifecycleError('SCHEMA_INVALID', `${key} must be string or null`);
}
export function validateEvidence(evidence) {
  if (!Array.isArray(evidence) || !evidence.length) throw new LifecycleError('EVIDENCE_INVALID', 'evidence is required');
  for (const item of evidence) {
    if (!item || typeof item !== 'object') throw new LifecycleError('EVIDENCE_INVALID', 'evidence entry is invalid');
    assertProjectPath(item.path);
    if (!SHA256.test(item.checksum) || typeof item.result !== 'string' || !item.result) throw new LifecycleError('EVIDENCE_INVALID', 'evidence fields are invalid');
    if (!(CORE_ROLES.has(item.authoring_role) || item.authoring_role === 'Owner')) throw new LifecycleError('EVIDENCE_INVALID', 'evidence author is invalid');
    assertTime(item.observed_at, 'evidence.observed_at');
  }
}
export function validateAuthorization(reference) {
  if (!reference || typeof reference !== 'object' || typeof reference.authorization_id !== 'string' || !reference.authorization_id) throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization reference is required');
  if (!['RULE', 'JUDGE', 'OWNER'].includes(reference.authority_type) || !SHA256.test(reference.authority_checksum) || typeof reference.decision !== 'string') throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization fields are invalid');
  assertProjectPath(reference.authority_path); assertTime(reference.effective_at, 'authorization.effective_at');
  if (reference.expires_at !== null) assertTime(reference.expires_at, 'authorization.expires_at');
  if (!reference.scope || !/^TASK-\d{3,}$/.test(reference.scope.task_id) || !Array.isArray(reference.scope.phases) || !Array.isArray(reference.scope.operations)) throw new LifecycleError('AUTHORIZATION_MISSING', 'authorization scope is invalid');
}

export function validateRecord(record) {
  const required = ['record_schema_version', 'task_id', 'project_id', 'record_revision', 'status_reason', 'entered_at', 'updated_at', 'last_verified_at', 'requested_by', 'authorized_by', 'applied_by', 'authorization_reference', 'authoritative_evidence', 'blocking_items', 'next_eligible_phases', 'verification_result', 'last_transition_id', 'content_checksum'];
  if (required.some((field) => !(field in record)) || record.record_schema_version !== '1.1.0' || !/^TASK-\d{3,}$/.test(record.task_id) || typeof record.project_id !== 'string' || !record.project_id.trim() || !Number.isInteger(record.record_revision) || record.record_revision < 1 || typeof record.status_reason !== 'string' || !record.status_reason) throw new LifecycleError('SCHEMA_INVALID', 'record identity is invalid');
  for (const field of Object.keys(ENUMS)) assertEnum(field, record[field]);
  for (const actor of ['requested_by', 'authorized_by', 'applied_by']) validateActor(record[actor]);
  for (const field of ['entered_at', 'updated_at', 'last_verified_at']) assertTime(record[field], field);
  if (Date.parse(record.updated_at) < Date.parse(record.entered_at) || !['PASS', 'FAIL', 'NOT_CONFIRMED'].includes(record.verification_result)) throw new LifecycleError('SCHEMA_INVALID', 'verification state is invalid');
  validateAuthorization(record.authorization_reference); validateEvidence(record.authoritative_evidence);
  if (!Array.isArray(record.blocking_items) || (record.task_status === 'BLOCKED' && !record.blocking_items.length)) throw new LifecycleError('SCHEMA_INVALID', 'blocking_items is invalid');
  if (record.archive_status === 'ARCHIVED' && record.task_status !== 'ARCHIVED') throw new LifecycleError('SCHEMA_INVALID', 'archive state is inconsistent');
  assertChecksum(record);
}

export function validateTransition(current, request) {
  if (request.expected_revision !== current.record_revision) throw new LifecycleError('REVISION_CONFLICT', 'expected revision differs from canonical revision');
  const from = request.from; const to = request.to;
  for (const field of Object.keys(ENUMS)) {
    if (from[field] !== current[field]) throw new LifecycleError('SCHEMA_INVALID', `from.${field} differs from canonical state`);
    assertEnum(field, to[field]);
  }
  const domain = request.operation_domain ?? 'PHASE1';
  const lateDomain = ['RECOVERY', 'CLOSURE', 'ARCHIVE'].includes(domain);
  if (TERMINAL.has(current.task_status) && to.task_status !== current.task_status && !(domain === 'ARCHIVE' && current.task_status === 'COMPLETED' && to.task_status === 'ARCHIVED')) throw new LifecycleError('TERMINAL_REOPEN_FORBIDDEN', 'terminal task cannot reopen');
  if (!lateDomain && to.archive_status !== 'NOT_ELIGIBLE' && to.archive_status !== current.archive_status) throw new LifecycleError('UNDEFINED_TRANSITION', 'archive operation is outside phase 1');
  if (domain === 'RECOVERY') {
    if (from.current_phase !== to.current_phase || from.gate_status !== to.gate_status || from.authorization_status !== to.authorization_status || from.archive_status !== to.archive_status) throw new LifecycleError('UNDEFINED_TRANSITION', 'recovery control changes only task status');
    const edge = `${from.task_status}:${to.task_status}`;
    if (!['ACTIVE:PAUSED','ACTIVE:BLOCKED','ACTIVE:STALLED','PAUSED:ACTIVE','BLOCKED:ACTIVE','STALLED:ACTIVE'].includes(edge)) throw new LifecycleError('UNDEFINED_TRANSITION', 'recovery status edge is not allowed');
    if (from.task_status === 'PAUSED' && to.task_status === 'ACTIVE' && !(request.owner_authorized || request.scheduled_time_reached)) throw new LifecycleError('AUTHORIZATION_MISSING', 'paused resume condition not met');
    if (from.task_status === 'BLOCKED' && to.task_status === 'ACTIVE' && !request.condition_verified) throw new LifecycleError('NOT_CONFIRMED', 'blocked condition is not verified');
    if (from.task_status === 'STALLED' && to.task_status === 'ACTIVE' && !(request.environment_recovered || request.hypothesis_changed || request.handoff_present)) throw new LifecycleError('NOT_CONFIRMED', 'stalled recovery evidence missing');
    if (request.emergency_stop && to.task_status === 'ACTIVE' && !request.owner_authorized) throw new LifecycleError('AUTHORIZATION_MISSING', 'emergency stop requires Owner resume');
    return;
  }
  if (domain === 'CLOSURE') {
    if (from.current_phase !== 'CLOSURE' || to.current_phase !== 'CLOSURE' || from.task_status !== 'ACTIVE' || to.task_status !== 'COMPLETED' || to.gate_status !== 'PASS' || !['REVIEW_PENDING','READY'].includes(to.archive_status)) throw new LifecycleError('UNDEFINED_TRANSITION', 'closure transition preconditions are invalid');
    if (!request.closure_ready || !request.owner_authorized) throw new LifecycleError('AUTHORIZATION_MISSING', 'closure readiness and Owner authorization required');
    return;
  }
  if (domain === 'ARCHIVE') {
    if (from.task_status !== 'COMPLETED' || to.task_status !== 'ARCHIVED' || from.current_phase !== 'ARCHIVE' || to.current_phase !== 'ARCHIVE' || to.archive_status !== 'ARCHIVED' || !request.archive_verified) throw new LifecycleError('UNDEFINED_TRANSITION', 'archive transition preconditions are invalid');
    if (!request.owner_authorized) throw new LifecycleError('AUTHORIZATION_MISSING', 'archive requires Owner authorization');
    return;
  }
  const phaseChanged = from.current_phase !== to.current_phase;
  if (phaseChanged) {
    const key = `${from.current_phase}:${to.current_phase}`;
    const rule = REWORK.get(key);
    if (FORWARD.get(from.current_phase) !== to.current_phase && !rule) throw new LifecycleError('UNDEFINED_TRANSITION', 'phase edge is not allowed');
    if (rule) {
      if (!rule.gates.includes(to.gate_status) || request.reason_code !== rule.code) throw new LifecycleError('UNDEFINED_TRANSITION', 'rework preconditions are invalid');
      if (rule.implementation && to.authorization_status !== 'AUTHORIZED') throw new LifecycleError('AUTHORIZATION_MISSING', 'implementation rework requires authorization');
    } else {
      if (to.gate_status !== 'PASS') throw new LifecycleError('PHASE_SKIP_FORBIDDEN', 'forward phase requires PASS gate');
      if (to.current_phase === 'IMPLEMENTATION' && to.authorization_status !== 'AUTHORIZED') throw new LifecycleError('AUTHORIZATION_MISSING', 'implementation requires authorization');
    }
  }
  if (['PAUSED', 'BLOCKED', 'STALLED', 'COMPLETED', 'ARCHIVED'].includes(to.task_status) && to.task_status !== current.task_status) throw new LifecycleError('UNDEFINED_TRANSITION', 'later phase task status operation');
}

async function syncFile(file) { const handle = await open(file, 'r'); try { await handle.sync(); } finally { await handle.close(); } }
async function syncDirectory(directory) { const handle = await open(directory, 'r'); try { await handle.sync(); } finally { await handle.close(); } }
async function readJson(file) { return JSON.parse(await readFile(file, 'utf8')); }

export class LifecycleStore {
  constructor(taskDir, { clock = () => new Date(), crashAt = null, projectRoot = process.cwd(), beforeCommit = null, durability = { syncFile, syncDirectory } } = {}) {
    this.dir = taskDir; this.clock = clock; this.crashAt = crashAt; this.projectRoot = projectRoot; this.beforeCommit = beforeCommit; this.durability = durability;
    this.recordPath = path.join(taskDir, 'canonical-status.json');
    this.logPath = path.join(taskDir, 'transition-log.jsonl');
    this.journalPath = path.join(taskDir, 'transaction-journal.json');
    this.leasePath = path.join(taskDir, 'lease.json');
    this.txDir = path.join(taskDir, 'transactions');
  }
  async writeDurable(file, content) {
    await writeFile(file, content);
    try { await this.durability.syncFile(file); }
    catch (error) { throw new LifecycleError('DURABILITY_SYNC_FAILED', `file sync failed: ${error.code ?? error.message}`); }
  }
  async syncDirectory(directory) {
    try { await this.durability.syncDirectory(directory); }
    catch (error) { throw new LifecycleError('DURABILITY_SYNC_FAILED', `directory sync failed: ${error.code ?? error.message}`); }
  }
  async init(initialRecord) {
    await mkdir(this.txDir, { recursive: true });
    if (!(await exists(this.recordPath))) { validateRecord(initialRecord); await this.writeDurable(this.recordPath, canonicalJson(initialRecord)); await this.writeDurable(this.logPath, ''); }
    await this.recover();
  }
  async readRecord() { const record = await readJson(this.recordPath); validateRecord(record); return record; }
  async acquireLease(record, holder) {
    if (await exists(this.leasePath)) {
      const lease = await readJson(this.leasePath);
      if (Date.parse(lease.expires_at) > this.clock().getTime()) throw new LifecycleError('LEASE_INVALID', 'active lease exists');
      await unlink(this.leasePath);
    }
    const lease = { lease_id: randomUUID(), task_id: record.task_id, holder, bound_revision: record.record_revision, lease_generation: record.record_revision + 1, fencing_token: record.record_revision + 1, acquired_at: this.clock().toISOString(), expires_at: new Date(this.clock().getTime() + 60_000).toISOString(), purpose: 'CANONICAL_STATE_COMMIT', nonce: randomBytes(16).toString('hex') };
    try { const handle = await open(this.leasePath, 'wx'); await handle.writeFile(canonicalJson(lease)); await handle.sync(); await handle.close(); return lease; }
    catch { throw new LifecycleError('LEASE_INVALID', 'lease acquisition failed'); }
  }
  async transition(request, appliedBy) {
    await this.recover();
    const current = await this.readRecord();
    try { this.validateRequestIdentity(request, current); validateTransition(current, request); await this.validateRequestAuthorizationAndEvidence(request); }
    catch (error) { await this.recordFailure(current, request, appliedBy, error, 'REJECTED'); throw error; }
    let lease;
    try { lease = await this.acquireLease(current, appliedBy); }
    catch (error) { await this.recordFailure(current, request, appliedBy, error, 'REJECTED'); throw error; }
    try {
      const now = this.clock().toISOString();
      const allowedPatch = {};
      if (request.record_patch) {
        for (const key of ['blocking_items', 'next_eligible_phases', 'checkpoint_reference']) if (key in request.record_patch) allowedPatch[key] = structuredClone(request.record_patch[key]);
        if ('blocking_items' in allowedPatch && !Array.isArray(allowedPatch.blocking_items)) throw new LifecycleError('SCHEMA_INVALID', 'blocking_items patch must be an array');
        if ('next_eligible_phases' in allowedPatch && !Array.isArray(allowedPatch.next_eligible_phases)) throw new LifecycleError('SCHEMA_INVALID', 'next_eligible_phases patch must be an array');
        if ('checkpoint_reference' in allowedPatch && allowedPatch.checkpoint_reference !== null && typeof allowedPatch.checkpoint_reference !== 'string') throw new LifecycleError('SCHEMA_INVALID', 'checkpoint_reference patch must be string or null');
      }
      const next = { ...current, ...request.to, ...allowedPatch, record_revision: current.record_revision + 1, status_reason: request.reason, requested_by: request.requested_by, authorized_by: request.authorized_by, applied_by: appliedBy, authorization_reference: request.authorization_reference, authoritative_evidence: request.evidence, updated_at: now, last_verified_at: now, verification_result: 'PASS', last_transition_id: request.request_id };
      next.content_checksum = checksum(next);
      validateRecord(next);
      const previous = await this.lastEventChecksum();
      const event = { event_schema_version: '1.1.0', transition_id: request.request_id, task_id: current.task_id, expected_revision: current.record_revision, resulting_revision: next.record_revision, from: request.from, to: request.to, outcome: 'COMMITTED', reason_code: request.reason_code, reason: request.reason, requested_by: request.requested_by, authorized_by: request.authorized_by, applied_by: appliedBy, authorization_reference: request.authorization_reference, evidence: request.evidence, lease_id: lease.lease_id, fencing_token: lease.fencing_token, created_at: now, verified_at: now, previous_entry_checksum: previous };
      event.entry_checksum = checksum(event);
      const snapshotTmp = path.join(this.txDir, `${request.request_id}.snapshot.tmp`);
      const eventTmp = path.join(this.txDir, `${request.request_id}.event.tmp`);
      await this.writeDurable(snapshotTmp, canonicalJson(next)); await this.writeDurable(eventTmp, `${canonicalJson(event)}\n`); await this.syncDirectory(this.txDir);
      const journal = {
        transition_id: request.request_id,
        stage: 'PREPARED',
        snapshot_tmp: snapshotTmp,
        event_tmp: eventTmp,
        snapshot_checksum: next.content_checksum,
        event_checksum: event.entry_checksum,
        event_acknowledgement: {
          transition_id: event.transition_id,
          entry_checksum: event.entry_checksum,
          resulting_revision: event.resulting_revision,
          event_appended: false,
          log_file_synced: false,
          log_directory_synced: false,
          event_verified: false,
        },
      };
      await this.writeDurable(this.journalPath, canonicalJson(journal)); await this.syncDirectory(this.dir);
      if (this.beforeCommit) await this.beforeCommit(this.leasePath, this.journalPath);
      await this.verifyCommitEligibility(lease, current, request); if (this.crashAt === 'PREPARED') throw new Error('SIMULATED_CRASH');
      await rename(snapshotTmp, this.recordPath); await this.syncDirectory(this.dir); journal.stage = 'APPLIED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      if (this.crashAt === 'APPLIED') throw new Error('SIMULATED_CRASH');
      await this.appendEventWithDurableAcknowledgement(event, eventTmp, journal);
      if (this.crashAt === 'ACKNOWLEDGED') throw new Error('SIMULATED_CRASH');
      const verifyRecord = await this.readRecord();
      const verifiedEvent = await this.readCommittedEvent(event.transition_id);
      if (verifyRecord.content_checksum !== next.content_checksum
        || !verifiedEvent
        || verifiedEvent.entry_checksum !== event.entry_checksum
        || verifiedEvent.resulting_revision !== next.record_revision) {
        journal.stage = 'RECOVERY_REQUIRED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
        throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'verification failed');
      }
      try { await this.assertCompleteEventAcknowledgement(journal, verifyRecord, verifiedEvent); }
      catch (error) {
        journal.stage = 'RECOVERY_REQUIRED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
        throw error;
      }
      journal.stage = 'VERIFIED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      if (this.crashAt === 'VERIFIED') throw new Error('SIMULATED_CRASH');
      journal.stage = 'COMMITTED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      if (this.crashAt === 'COMMITTED') throw new Error('SIMULATED_CRASH');
      await rm(this.journalPath); await unlink(this.leasePath); await rm(eventTmp, { force: true }); await this.syncDirectory(this.dir); return next;
    } catch (error) {
      if (error.message === 'SIMULATED_CRASH') throw error;
      const failure = error.code === 'DURABILITY_SYNC_FAILED' ? error : error;
      await this.abortFailedTransition(current, request, appliedBy, failure);
      throw failure;
    }
  }
  validateRequestIdentity(request, current) {
    if (!request || typeof request !== 'object') throw new LifecycleError('SCHEMA_INVALID', 'TransitionRequest is required');
    if (typeof request.request_id !== 'string' || !request.request_id.trim() || typeof request.task_id !== 'string' || !request.task_id.trim() || request.task_id !== current.task_id || path.basename(this.dir) !== current.task_id) throw new LifecycleError('SCHEMA_INVALID', 'TransitionRequest task_id is invalid');
    if (!Number.isInteger(request.expected_revision) || request.expected_revision < 1 || !request.from || typeof request.from !== 'object' || !request.to || typeof request.to !== 'object' || typeof request.reason_code !== 'string' || !request.reason_code.trim() || typeof request.reason !== 'string' || !request.reason.trim()) throw new LifecycleError('SCHEMA_INVALID', 'TransitionRequest required fields are invalid');
    validateActor(request.requested_by); validateActor(request.authorized_by);
  }
  async validateRequestAuthorizationAndEvidence(request) {
    validateEvidence(request.evidence); validateAuthorization(request.authorization_reference);
    const reference = request.authorization_reference;
    const requiresImplementation = request.to.current_phase === 'IMPLEMENTATION';
    if (requiresImplementation) {
      if (request.to.gate_status !== 'PASS' || request.to.authorization_status !== 'AUTHORIZED' || reference.authority_type === 'RULE' || reference.decision !== 'AUTHORIZED' || reference.expires_at === null || Date.parse(reference.expires_at) <= this.clock().getTime() || reference.scope.task_id !== request.task_id || !reference.scope.phases.includes('IMPLEMENTATION') || !reference.scope.operations.includes('CANONICAL_STATE_COMMIT')) throw new LifecycleError('AUTHORIZATION_MISSING', 'implementation authorization is invalid');
    }
    for (const item of request.evidence) {
      const body = await readFile(path.resolve(this.projectRoot, item.path));
      const actual = `sha256:${createHash('sha256').update(body).digest('hex')}`;
      if (actual !== item.checksum) throw new LifecycleError('EVIDENCE_INVALID', 'evidence checksum mismatch');
    }
  }
  async recordFailure(current, request, appliedBy, error, outcome) {
    const now = this.clock().toISOString();
    const event = { event_schema_version: '1.1.0', transition_id: request.request_id, task_id: current.task_id, expected_revision: request.expected_revision, resulting_revision: null, from: request.from, to: request.to, outcome, reason_code: request.reason_code, reason: request.reason, failure_code: error.code ?? 'VERIFY_FAILED', failure_reason: error.message, requested_by: request.requested_by, authorized_by: request.authorized_by, applied_by: appliedBy, authorization_reference: request.authorization_reference, evidence: request.evidence, lease_id: null, fencing_token: null, created_at: now, verified_at: null, previous_entry_checksum: await this.lastEventChecksum() };
    event.entry_checksum = checksum(event);
    await this.writeDurable(this.logPath, (await readFile(this.logPath, 'utf8')) + `${canonicalJson(event)}\n`);
  }
  async abortFailedTransition(current, request, appliedBy, error) {
    const journal = await exists(this.journalPath) ? await readJson(this.journalPath) : null;
    const snapshotApplied = journal && await exists(this.recordPath)
      && (await this.readRecord()).content_checksum === journal.snapshot_checksum;
    if (journal) {
      journal.stage = snapshotApplied ? 'RECOVERY_REQUIRED' : 'ABORTED';
      journal.failure_code = error.code ?? 'VERIFY_FAILED';
      journal.failure_reason = error.message;
      await this.writeDurable(this.journalPath, canonicalJson(journal));
    }
    // After the Snapshot is canonical, an Event append may have reached the log
    // even when its durability acknowledgement failed. Preserve all transaction
    // evidence and make no further log writes; a failure Event could otherwise
    // obscure the authoritative tail or create a duplicate transition.
    if (snapshotApplied) return;
    await this.recordFailure(current, request, appliedBy, error, 'VERIFICATION_FAILED');
    if (journal && !snapshotApplied) {
      await rm(journal.snapshot_tmp, { force: true });
      await rm(journal.event_tmp, { force: true });
    }
    await rm(this.leasePath, { force: true });
    await this.syncDirectory(this.dir);
  }
  async verifyCommitEligibility(lease, record, request) {
    const persisted = await readJson(this.leasePath);
    const journal = await readJson(this.journalPath);
    const log = await readFile(this.logPath, 'utf8');
    if (journal.transition_id !== request.request_id || journal.stage !== 'PREPARED' || journal.superseded_by || ['SUPERSEDED', 'ABORTED', 'RECOVERED', 'COMMITTED'].includes(journal.stage)) throw new LifecycleError('TRANSACTION_SUPERSEDED', 'transaction is not commit eligible');
    if (log.split('\n').filter(Boolean).some((line) => JSON.parse(line).transition_id === request.request_id && JSON.parse(line).outcome === 'COMMITTED')) throw new LifecycleError('TRANSACTION_ALREADY_FINALIZED', 'transaction already committed');
    if (persisted.lease_id !== lease.lease_id || canonicalJson(persisted.holder) !== canonicalJson(lease.holder) || persisted.bound_revision !== record.record_revision || persisted.lease_generation !== lease.lease_generation || persisted.fencing_token !== lease.fencing_token || Date.parse(persisted.expires_at) <= this.clock().getTime() || request.expected_revision !== record.record_revision || (await this.readRecord()).record_revision !== record.record_revision) throw new LifecycleError('STALE_FENCING_TOKEN', 'persisted lease no longer valid');
  }
  async persistJournalAcknowledgement(journal) {
    await this.writeDurable(this.journalPath, canonicalJson(journal));
    await this.syncDirectory(this.dir);
  }
  async appendEventWithDurableAcknowledgement(event, eventTmp, journal) {
    const existing = await this.readCommittedEvent(event.transition_id);
    if (existing) {
      throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'existing transition event has no durable acknowledgement');
    }
    const handle = await open(this.logPath, 'a');
    try {
      await handle.writeFile(await readFile(eventTmp, 'utf8'));
    } finally {
      await handle.close();
    }
    journal.event_acknowledgement.event_appended = true;
    await this.persistJournalAcknowledgement(journal);
    try { await this.durability.syncFile(this.logPath); }
    catch (error) { throw new LifecycleError('DURABILITY_SYNC_FAILED', `event file sync failed: ${error.code ?? error.message}`); }
    journal.event_acknowledgement.log_file_synced = true;
    await this.persistJournalAcknowledgement(journal);
    await this.syncDirectory(this.dir);
    journal.event_acknowledgement.log_directory_synced = true;
    await this.persistJournalAcknowledgement(journal);
    await this.verifyLogIntegrity();
    const appended = await this.readCommittedEvent(event.transition_id);
    if (!appended || appended.entry_checksum !== event.entry_checksum || appended.resulting_revision !== event.resulting_revision) {
      throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'durable event verification failed');
    }
    journal.event_acknowledgement.event_verified = true;
    await this.persistJournalAcknowledgement(journal);
  }
  async assertCompleteEventAcknowledgement(journal, record, event) {
    const ack = journal.event_acknowledgement;
    if (!isPlainObject(journal)
      || typeof journal.transition_id !== 'string'
      || !journal.transition_id.trim()
      || typeof journal.event_checksum !== 'string'
      || !SHA256.test(journal.event_checksum)
      || typeof journal.snapshot_checksum !== 'string'
      || !SHA256.test(journal.snapshot_checksum)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'journal transaction identity is invalid');
    if (!isPlainObject(ack) || Object.keys(ack).length !== EVENT_ACKNOWLEDGEMENT_FIELDS.length
      || EVENT_ACKNOWLEDGEMENT_FIELDS.some((field) => !(field in ack))) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement schema is invalid');
    if (typeof ack.transition_id !== 'string' || !ack.transition_id.trim()
      || typeof ack.entry_checksum !== 'string' || !SHA256.test(ack.entry_checksum)
      || !Number.isInteger(ack.resulting_revision) || ack.resulting_revision < 1) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement identity is invalid');
    for (const field of ['event_appended', 'log_file_synced', 'log_directory_synced', 'event_verified']) {
      if (typeof ack[field] !== 'boolean') throw new LifecycleError('COMMIT_STATE_UNKNOWN', `event acknowledgement ${field} must be boolean`);
    }
    if ((ack.event_appended === false && (ack.log_file_synced === true || ack.log_directory_synced === true || ack.event_verified === true))
      || (ack.log_file_synced === false && (ack.log_directory_synced === true || ack.event_verified === true))
      || (ack.log_directory_synced === false && ack.event_verified === true)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement order is impossible');
    if (ack.event_appended !== true || ack.log_file_synced !== true || ack.log_directory_synced !== true || ack.event_verified !== true) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'event acknowledgement is incomplete');
    if (ack.transition_id !== journal.transition_id
      || ack.entry_checksum !== journal.event_checksum
      || ack.resulting_revision !== record.record_revision
      || !event
      || event.outcome !== 'COMMITTED'
      || event.transition_id !== journal.transition_id
      || event.entry_checksum !== journal.event_checksum
      || event.resulting_revision !== record.record_revision) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'durable event acknowledgement is mismatched');
  }
  async requireRecovery(journal, message) {
    journal.stage = 'RECOVERY_REQUIRED';
    await this.writeDurable(this.journalPath, canonicalJson(journal));
    throw new LifecycleError('COMMIT_STATE_UNKNOWN', message);
  }
  async readCommittedEvent(transitionId) {
    const events = (await readFile(this.logPath, 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));
    const matches = events.filter((event) => event.transition_id === transitionId);
    if (matches.length > 1) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'duplicate transition_id in log');
    return matches[0] ?? null;
  }
  async lastEventChecksum() {
    const log = await readFile(this.logPath, 'utf8'); const lines = log.trim().split('\n').filter(Boolean);
    return lines.length ? JSON.parse(lines.at(-1)).entry_checksum : 'sha256:GENESIS';
  }
  async recover() {
    await this.verifyLogIntegrity();
    await this.verifyMigrationMappings();
    if (!(await exists(this.journalPath))) return;
    const journal = await readJson(this.journalPath);
    if (journal.stage === 'PREPARED') {
      await rm(journal.snapshot_tmp, { force: true }); await rm(journal.event_tmp, { force: true });
      await this.recordRecovery(journal, 'ABORTED');
      await rm(this.journalPath); await rm(this.leasePath, { force: true }); await this.syncDirectory(this.dir); return;
    }
    if (journal.stage === 'ABORTED') {
      await rm(journal.snapshot_tmp, { force: true }); await rm(journal.event_tmp, { force: true });
      await rm(this.journalPath); await rm(this.leasePath, { force: true }); await this.syncDirectory(this.dir); return;
    }
    if (journal.stage === 'APPLIED') {
      const record = await this.readRecord();
      if (record.content_checksum !== journal.snapshot_checksum || record.last_transition_id !== journal.transition_id) {
        await this.requireRecovery(journal, 'journal snapshot mismatch in APPLIED');
      }
      let event;
      try { event = JSON.parse(await readFile(journal.event_tmp, 'utf8')); }
      catch { await this.requireRecovery(journal, 'journal pending event is unreadable in APPLIED'); }
      if (!isPlainObject(event)
        || event.transition_id !== journal.transition_id
        || event.entry_checksum !== journal.event_checksum
        || event.resulting_revision !== record.record_revision) {
        await this.requireRecovery(journal, 'journal event mismatch in APPLIED');
      }
      const committedEvent = await this.readCommittedEvent(journal.transition_id);
      try { await this.assertCompleteEventAcknowledgement(journal, record, committedEvent); }
      catch (error) { await this.requireRecovery(journal, error.message); }
      journal.stage = 'VERIFIED'; await this.writeDurable(this.journalPath, canonicalJson(journal));
      // fall through to VERIFIED
    }
    if (journal.stage === 'VERIFIED' || journal.stage === 'COMMITTED') {
      const record = await this.readRecord();
      const committedEvent = await this.readCommittedEvent(journal.transition_id);
      try { await this.assertCompleteEventAcknowledgement(journal, record, committedEvent); }
      catch (error) { await this.requireRecovery(journal, error.message); }
      if (journal.stage === 'VERIFIED') {
        journal.stage = 'COMMITTED';
        await this.writeDurable(this.journalPath, canonicalJson(journal));
      }
      await rm(journal.event_tmp, { force: true }); await rm(this.journalPath); await rm(this.leasePath, { force: true }); await this.syncDirectory(this.dir); return;
    }
    throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'manual recovery required');
  }
  async recordRecovery(journal, outcome) {
    const current = await this.readRecord(); const now = this.clock().toISOString();
    const system = { actor_id: 'lifecycle-manager-recovery', actor_type: 'SYSTEM_COMPONENT', role_id: null, session_id: null, run_id: null };
    const event = { event_schema_version: '1.1.0', transition_id: `${journal.transition_id}:recovery`, task_id: current.task_id, expected_revision: current.record_revision, resulting_revision: null, from: Object.fromEntries(Object.keys(ENUMS).map((key) => [key, current[key]])), to: Object.fromEntries(Object.keys(ENUMS).map((key) => [key, current[key]])), outcome: 'RECOVERED', reason_code: outcome, reason: 'Prepared transaction aborted during safe recovery.', requested_by: system, authorized_by: system, applied_by: system, authorization_reference: current.authorization_reference, evidence: current.authoritative_evidence, lease_id: null, fencing_token: null, created_at: now, verified_at: now, previous_entry_checksum: await this.lastEventChecksum() };
    event.entry_checksum = checksum(event); await writeFile(this.logPath, (await readFile(this.logPath, 'utf8')) + `${canonicalJson(event)}\n`);
  }
  async verifyLogIntegrity() {
    if (!(await exists(this.logPath))) return;
    const log = await readFile(this.logPath, 'utf8');
    const lines = log.split('\n').filter(Boolean);
    let previousChecksum = 'sha256:GENESIS';
    const seenTransitionIds = new Set();
    const seenRevisions = new Set();
    let maxRevision = 0;
    for (const line of lines) {
      let event;
      try { event = JSON.parse(line); } catch { throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'malformed JSON in log'); }
      if (event.event_schema_version !== '1.1.0') throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'unknown schema version in log');
      if (event.previous_entry_checksum !== previousChecksum) throw new LifecycleError('CHECKSUM_MISMATCH', 'broken previous_entry_checksum chain');
      if (event.entry_checksum !== checksum(event)) throw new LifecycleError('CHECKSUM_MISMATCH', 'invalid entry_checksum in log');
      if (seenTransitionIds.has(event.transition_id)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'duplicate transition_id in log');
      seenTransitionIds.add(event.transition_id);
      if (event.outcome === 'COMMITTED') {
        if (!Number.isInteger(event.resulting_revision)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'illegal outcome/revision combination');
        if (seenRevisions.has(event.resulting_revision)) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'duplicate resulting_revision in log');
        seenRevisions.add(event.resulting_revision);
        maxRevision = Math.max(maxRevision, event.resulting_revision);
      } else {
        if (event.resulting_revision !== null) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'illegal outcome/revision combination');
      }
      previousChecksum = event.entry_checksum;
    }
    if (await exists(this.recordPath)) {
      const record = await this.readRecord();
      if (maxRevision > 0 && record.record_revision !== maxRevision) throw new LifecycleError('COMMIT_STATE_UNKNOWN', 'snapshot/log revision disagreement');
    }
  }
  async verifyMigrationMappings() {
    const mappingPath = path.join(this.dir, 'migration-mapping.jsonl');
    if (!(await exists(mappingPath))) return;
    const lines = (await readFile(mappingPath, 'utf8')).split('\n').filter(Boolean);
    const seenIds = new Set();
    const seenEvidence = new Set();
    for (const line of lines) {
      let mapping;
      try { mapping = JSON.parse(line); } catch { throw new LifecycleError('NOT_CONFIRMED', 'malformed JSON in migration mapping'); }
      const required = ['mapping_id', 'source_task_id', 'legacy_expression', 'mapped_state', 'confidence', 'source_evidence', 'mapped_by', 'created_at', 'checksum'];
      if (required.some(field => !(field in mapping))) throw new LifecycleError('NOT_CONFIRMED', 'missing required fields in migration mapping');
      if (mapping.checksum !== checksum(mapping)) throw new LifecycleError('NOT_CONFIRMED', 'invalid checksum in migration mapping');
      if (seenIds.has(mapping.mapping_id)) throw new LifecycleError('NOT_CONFIRMED', 'duplicate mapping_id');
      seenIds.add(mapping.mapping_id);
      if (!Array.isArray(mapping.source_evidence) || mapping.source_evidence.length === 0) throw new LifecycleError('NOT_CONFIRMED', 'empty source_evidence in migration mapping');
      const evidenceKey = mapping.source_evidence.map(e => `${e.path}:${e.checksum}`).sort().join('|');
      if (seenEvidence.has(evidenceKey)) throw new LifecycleError('NOT_CONFIRMED', 'duplicate source-evidence/checksum mapping');
      seenEvidence.add(evidenceKey);
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(mapping.confidence)) throw new LifecycleError('NOT_CONFIRMED', 'invalid confidence in migration mapping');
      if (mapping.confidence === 'LOW') throw new LifecycleError('NOT_CONFIRMED', 'LOW confidence migration mapping is not confirmed');
      for (const axis of Object.keys(ENUMS)) {
        if (!(axis in mapping.mapped_state) || !ENUMS[axis].includes(mapping.mapped_state[axis])) throw new LifecycleError('NOT_CONFIRMED', 'invalid mapped_state in migration mapping');
      }
      for (const item of mapping.source_evidence) {
        if (!item.path.includes(mapping.source_task_id)) throw new LifecycleError('NOT_CONFIRMED', 'source_task_id does not match evidence path');
        try {
          const body = await readFile(path.resolve(this.projectRoot, item.path));
          const actual = `sha256:${createHash('sha256').update(body).digest('hex')}`;
          if (actual !== item.checksum) throw new LifecycleError('NOT_CONFIRMED', 'evidence checksum mismatch in migration mapping');
        } catch {
          throw new LifecycleError('NOT_CONFIRMED', 'missing evidence in migration mapping');
        }
      }
    }
  }
}
const exists = async (file) => stat(file).then(() => true).catch(() => false);
