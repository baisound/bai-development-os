import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildContextManifest } from '../../../src/context-control/index.mjs';
import {
  LifecycleStore, checksum, createDesignOnlyClassificationStatement,
  createDesignOnlyClosureReadiness, createDesignOnlyCriticEvidence, createDesignOnlyJudgeEvidence, createDesignOnlyOperationBundle,
  createDesignOnlyOperationCoordinate, createLegacyCompletionStatement, DESIGN_ONLY_OPERATIONS, validateTransition,
} from '../../../src/lifecycle/phase1/index.mjs';
import { signAuthorizationEnvelope } from '../../../src/security/authorization.mjs';
import { signEnvelope } from '../../../src/security/signing.mjs';

const clock = () => new Date('2026-08-27T00:00:00.000Z');
const sha = (bytes) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const keySha = (key) => sha(key.export({ type: 'spki', format: 'der' }));
const requested = { actor_id: 'orchestrator', actor_type: 'ROLE', role_id: 'Orchestrator', session_id: null, run_id: null };
const owner = { actor_id: 'OWNER', actor_type: 'OWNER', role_id: null, session_id: null, run_id: null };
const applied = { actor_id: 'lifecycle', actor_type: 'SYSTEM_COMPONENT', role_id: null, session_id: null, run_id: null };

async function setup(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'task021-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dir = path.join(root, 'TASK-001'); await mkdir(dir);
  for (const [name, body] of Object.entries({ 'task.md': 'design only task', 'allowed.md': 'design files only', 'final-plan.md': 'final plan pass', 'seed.md': 'seed evidence' })) await writeFile(path.join(root, name), body);
  const seedChecksum = sha(await readFile(path.join(root, 'seed.md')));
  const authority = { authorization_id: 'OWNER-SEED', authority_type: 'OWNER', authority_path: 'task.md', authority_checksum: sha(await readFile(path.join(root, 'task.md'))), decision: 'AUTHORIZED', effective_at: '2026-08-27T00:00:00Z', expires_at: '2026-08-27T01:00:00Z', scope: { task_id: 'TASK-001', phases: ['FINAL_PLAN', 'CLOSURE'], operations: ['CANONICAL_STATE_COMMIT', 'CLASSIFY_DESIGN_ONLY', 'COMPLETE_TASK'] } };
  const record = { record_schema_version: '1.1.0', task_id: 'TASK-001', project_id: 'bai-voice-app', record_revision: 13, task_status: 'ACTIVE', current_phase: 'FINAL_PLAN', gate_status: 'PASS', authorization_status: 'PENDING', archive_status: 'NOT_ELIGIBLE', status_reason: 'design final plan passed', entered_at: '2026-08-26T00:00:00Z', updated_at: '2026-08-26T00:00:00Z', last_verified_at: '2026-08-26T00:00:00Z', requested_by: requested, authorized_by: owner, applied_by: applied, authorization_reference: authority, authoritative_evidence: [{ path: 'seed.md', checksum: seedChecksum, authoring_role: 'Builder', result: 'PASS', observed_at: '2026-08-26T00:00:00Z' }], blocking_items: [], next_eligible_phases: ['IMPLEMENTATION_AUTHORIZATION'], verification_result: 'PASS', last_transition_id: crypto.randomUUID() };
  record.content_checksum = checksum(record);
  const ownerKeys = generateKeyPairSync('ed25519'); const verifierKeys = generateKeyPairSync('ed25519'); const bindingKeys = generateKeyPairSync('ed25519');
  const authority_ledger_coordinate = { source_id: 'authority-ledger', revision: 7, content_checksum: `sha256:${'7'.repeat(64)}`, observed_at: '2026-08-26T23:58:00.000Z' };
  const history_proof = { proof_schema_version: '1.0.0', epoch_source_coordinate: { source_id: 'authority-epoch-ledger', revision: 7, content_checksum: `sha256:${'6'.repeat(64)}` }, revocation_source_coordinate: authority_ledger_coordinate, inclusion_checksum: `sha256:${'5'.repeat(64)}` };
  const historicalState = { owner_public_key: ownerKeys.publicKey, owner_key_id: 'OWNER', verifier_public_key: verifierKeys.publicKey, verifier_key_id: 'SECURITY-VERIFIER', current_authority_epoch: 7, revocation_proof_checksum: authority_ledger_coordinate.content_checksum, authority_ledger_coordinate, history_proof, history_proof_verified: true };
  const security = { ...historicalState, binding_private_key: bindingKeys.privateKey, binding_key_id: 'CANONICAL-STORE', get_historical_authority_state: ({ authority_epoch }) => authority_epoch === 7 ? historicalState : null };
  const durability = { syncFile: async () => {}, syncDirectory: async () => {} };
  const store = new LifecycleStore(dir, {
    projectRoot: root,
    clock,
    designOnlySecurity: security,
    durability
  });
  await store.init(record);
  return { root, dir, store, ownerKeys, verifierKeys, bindingKeys, authority };
}

async function source(root, source_id, rel) {
  const bytes = await readFile(path.join(root, rel));
  return { source_id, path: rel.replaceAll('\\', '/'), trust_level: 'CANONICAL', sensitivity: 'INTERNAL', content_checksum: sha(bytes), token_estimate: 10, updated_at: '2026-08-27T00:00:00.000Z' };
}

async function buildBundle(f, operation, preparation, { criticFindings = [], ownerEffectiveAt = '2026-08-26T23:59:00.000Z', attestationVerifiedAt = clock().toISOString() } = {}) {
  const current = await f.store.readRecord();
  let sources; let decision;
  if (operation === DESIGN_ONLY_OPERATIONS.CLASSIFY) {
    sources = [await source(f.root, 'canonical-status', 'TASK-001/canonical-status.json'), await source(f.root, 'task-definition', 'task.md'), await source(f.root, 'allowed-files', 'allowed.md'), await source(f.root, 'final-plan', 'final-plan.md')];
  } else if (operation === DESIGN_ONLY_OPERATIONS.COMPLETE) {
    const receiptRel = path.relative(f.root, f.store.receiptPath(current.last_transition_id)).replaceAll('\\', '/');
    for (let round = 1; round <= 3; round += 1) await writeFile(path.join(f.root, `critic-${round}.json`), JSON.stringify(createDesignOnlyCriticEvidence({ round, critic_id: `critic-${round}`, findings: round === 1 ? criticFindings : [] })));
    await writeFile(path.join(f.root, 'judge.json'), JSON.stringify(createDesignOnlyJudgeEvidence({ judge_id: 'judge', decision: 'PASS_DESIGN_READY_FOR_CLOSURE', unresolved_critical: 0, unresolved_high: 0 })));
    sources = [await source(f.root, 'canonical-status', 'TASK-001/canonical-status.json'), await source(f.root, 'task-definition', 'task.md'), await source(f.root, 'allowed-files', 'allowed.md'), await source(f.root, 'final-plan', 'final-plan.md'), await source(f.root, 'classification-commit-receipt', receiptRel), await source(f.root, 'critic-round-1', 'critic-1.json'), await source(f.root, 'critic-round-2', 'critic-2.json'), await source(f.root, 'critic-round-3', 'critic-3.json'), await source(f.root, 'judge-decision', 'judge.json')];
  } else {
    sources = [await source(f.root, 'canonical-status', 'TASK-001/canonical-status.json'), await source(f.root, 'task-definition', 'task.md'), await source(f.root, 'allowed-files', 'allowed.md'), await source(f.root, 'completion-evidence', 'seed.md'), await source(f.root, 'transition-log', 'TASK-001/transition-log.jsonl')];
  }
  const base_context = buildContextManifest({ task_id: current.task_id, status_revision: current.record_revision, role: 'Orchestrator', phase: operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST ? 'CLOSURE' : 'FINAL_PLAN', required_sources: sources, source_priority: sources.map((row) => row.source_id) }, { clock });
  if (operation === DESIGN_ONLY_OPERATIONS.CLASSIFY) {
    decision = createDesignOnlyClassificationStatement({ task_id: current.task_id, classification: 'DESIGN_ONLY', implementation_required: false, implementation_authorized: false, base_context_checksum: base_context.content_checksum, task_definition_checksum: sources.find((row) => row.source_id === 'task-definition').content_checksum, allowed_files_checksum: sources.find((row) => row.source_id === 'allowed-files').content_checksum });
  } else if (operation === DESIGN_ONLY_OPERATIONS.COMPLETE) {
    const evidenceChecksum = sources.find((row) => row.source_id === 'critic-round-1').content_checksum;
    const dimensions = Object.fromEntries(['technical', 'quality', 'policy', 'status', 'risk', 'follow_up', 'knowledge', 'resources', 'cost', 'owner'].map((name) => [name, { result: 'PASS', evidence_checksums: [evidenceChecksum] }]));
    decision = createDesignOnlyClosureReadiness({ project_id: current.project_id, task_id: current.task_id, record_revision: current.record_revision, canonical_checksum: current.content_checksum, task_classification: 'DESIGN_ONLY', base_context_checksum: base_context.content_checksum, dimensions, unresolved_critical: 0, unresolved_high: 0, critic_evidence_checksums: sources.filter((row) => row.source_id.startsWith('critic-round-')).map((row) => row.content_checksum), implementation_deliverables: Object.fromEntries(['implementation_authorization', 'implementation', 'testing', 'implementation_review', 'final_judgment', 'policy_implementation'].map((name) => [name, 'NOT_APPLICABLE'])) });
  } else {
    decision = createLegacyCompletionStatement({ project_id: current.project_id, task_id: current.task_id, record_revision: current.record_revision, canonical_checksum: current.content_checksum, log_prefix_length: preparation.log_prefix_length, log_prefix_head_checksum: preparation.log_prefix_head_checksum, completion_evidence_checksums: [sources.find((row) => row.source_id === 'completion-evidence').content_checksum], migration_epoch: 7, attested_at: clock().toISOString(), base_context_checksum: base_context.content_checksum });
  }
  const capabilities = operation === DESIGN_ONLY_OPERATIONS.CLASSIFY ? ['CANONICAL_STATE_COMMIT', 'CLASSIFY_DESIGN_ONLY'] : operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? ['CANONICAL_STATE_COMMIT', 'COMPLETE_TASK'] : ['ATTEST_LEGACY_COMPLETION', 'CANONICAL_QUEUE_BINDING'];
  const target = operation === DESIGN_ONLY_OPERATIONS.CLASSIFY
    ? { record_schema_version: '1.2.0', task_classification: 'DESIGN_ONLY', task_status: current.task_status, current_phase: current.current_phase, gate_status: current.gate_status, authorization_status: current.authorization_status, archive_status: current.archive_status }
    : operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? { record_schema_version: '1.2.0', task_classification: 'DESIGN_ONLY', task_status: 'COMPLETED', current_phase: 'CLOSURE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'REVIEW_PENDING' }
      : { record_schema_version: '1.1.0', task_status: current.task_status, current_phase: current.current_phase, gate_status: current.gate_status, authorization_status: current.authorization_status, archive_status: current.archive_status, log_prefix_length: preparation.log_prefix_length, log_prefix_head_checksum: preparation.log_prefix_head_checksum };
  const phase = operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST ? 'CLOSURE' : 'FINAL_PLAN';
  const coordinate = createDesignOnlyOperationCoordinate({ preparation_id: preparation.preparation_id, project_id: current.project_id, task_id: current.task_id, operation, phase, capabilities, source_revision: current.record_revision, source_canonical_checksum: current.content_checksum, base_context_checksum: base_context.content_checksum, decision_checksum: decision.content_checksum, target });
  const owner_authorization = signAuthorizationEnvelope({ approval_id: `OWNER-${operation}`, authorized: true, task_id: current.task_id, project_id: current.project_id, phase, role: 'Owner', operation, operation_coordinate_checksum: coordinate.content_checksum, authority_epoch: 7, revocation_proof_checksum: `sha256:${'7'.repeat(64)}`, authority_path: 'task.md', authority_checksum: sha(await readFile(path.join(f.root, 'task.md'))), effective_at: ownerEffectiveAt, expires_at: '2026-08-27T01:00:00.000Z' }, { private_key: f.ownerKeys.privateKey, key_id: 'OWNER', clock });
  const authority_attestation = signEnvelope({ attestation_schema_version: '1.0.0', result: 'ALLOW', issuer: 'SECURITY-VERIFIER', subject: current.task_id, operation_coordinate_checksum: coordinate.content_checksum, owner_payload_checksum: owner_authorization.payload_checksum, owner_signature_checksum: sha(owner_authorization.signature), owner_key_id: owner_authorization.key_id, owner_key_checksum: keySha(f.ownerKeys.publicKey), authority_epoch: 7, revocation_proof_checksum: `sha256:${'7'.repeat(64)}`, authority_ledger_coordinate: f.store.designOnlySecurity.authority_ledger_coordinate, history_proof: f.store.designOnlySecurity.history_proof, revoked: false, effective_at: '2026-08-26T23:59:00.000Z', expires_at: '2026-08-27T00:05:00.000Z', verified_at: attestationVerifiedAt }, { private_key: f.verifierKeys.privateKey, key_id: 'SECURITY-VERIFIER', clock });
  const operation_bundle = createDesignOnlyOperationBundle({ operation, base_context, decision_artifact: decision, operation_coordinate: coordinate, owner_authorization, authority_attestation });
  const evidence = sources.map((row) => ({ source_id: row.source_id, path: row.path, checksum: row.content_checksum, authoring_role: row.source_id.startsWith('critic') ? 'Critic' : row.source_id === 'judge-decision' ? 'Judge' : 'Builder', result: 'PASS', observed_at: clock().toISOString() }));
  return { operation_bundle, evidence };
}

function request(current, preparation, operation, built, authority) {
  const to = { task_status: current.task_status, current_phase: current.current_phase, gate_status: current.gate_status, authorization_status: current.authorization_status, archive_status: current.archive_status };
  const record_patch = operation === DESIGN_ONLY_OPERATIONS.CLASSIFY ? { task_classification: 'DESIGN_ONLY' } : undefined;
  if (operation === DESIGN_ONLY_OPERATIONS.COMPLETE) Object.assign(to, { task_status: 'COMPLETED', current_phase: 'CLOSURE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'REVIEW_PENDING' });
  const envelope = built.operation_bundle.owner_authorization; const coordinate = built.operation_bundle.operation_coordinate;
  const decision = operation === DESIGN_ONLY_OPERATIONS.COMPLETE ? 'COMPLETE_TASK' : operation === DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST ? 'CANONICAL_QUEUE_BINDING' : 'CLASSIFY_DESIGN_ONLY';
  return { request_id: preparation.preparation_id, task_id: current.task_id, expected_revision: current.record_revision, from: { task_status: current.task_status, current_phase: current.current_phase, gate_status: current.gate_status, authorization_status: current.authorization_status, archive_status: current.archive_status }, to, reason_code: operation, reason: 'Owner-authorized design-only lifecycle operation', requested_by: requested, authorized_by: owner, authorization_reference: { ...authority, authorization_id: envelope.approval_id, authority_type: 'OWNER', authority_path: envelope.authority_path, authority_checksum: envelope.authority_checksum, authority_envelope_payload_checksum: envelope.payload_checksum, authority_envelope_key_id: envelope.key_id, decision, effective_at: envelope.effective_at, expires_at: envelope.expires_at, scope: { task_id: current.task_id, phases: [coordinate.phase], operations: coordinate.capabilities } }, evidence: built.evidence, operation_domain: operation, operation_bundle: built.operation_bundle, owner_authorized: true, closure_ready: operation === DESIGN_ONLY_OPERATIONS.COMPLETE, record_patch };
}

async function classifyDesignOnlyFixture(t) {
  const f = await setup(t);
  let current = await f.store.readRecord();
  const classifyPrep = await f.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.CLASSIFY);
  const classifyBuilt = await buildBundle(f, DESIGN_ONLY_OPERATIONS.CLASSIFY, classifyPrep);
  current = await f.store.transition(request(current, classifyPrep, DESIGN_ONLY_OPERATIONS.CLASSIFY, classifyBuilt, f.authority), applied);
  assert.equal(current.task_classification, 'DESIGN_ONLY'); assert.equal(current.record_schema_version, '1.2.0');
  const classifyReceipt = await f.store.readDesignOnlyReceipt(current.last_transition_id); assert.equal(classifyReceipt.operation, DESIGN_ONLY_OPERATIONS.CLASSIFY);
  return { ...f, current };
}

export async function completeDesignOnlyFixture(t) {
  const f = await classifyDesignOnlyFixture(t);
  let current = f.current;
  const completionPrep = await f.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.COMPLETE);
  const completionBuilt = await buildBundle(f, DESIGN_ONLY_OPERATIONS.COMPLETE, completionPrep);
  current = await f.store.transition(request(current, completionPrep, DESIGN_ONLY_OPERATIONS.COMPLETE, completionBuilt, f.authority), applied);
  return { ...f, current };
}

test('explicit classification then design-only closure completes canonically without implementation phases', async (t) => {
  const f = await completeDesignOnlyFixture(t);
  assert.equal(f.current.task_status, 'COMPLETED'); assert.equal(f.current.current_phase, 'CLOSURE'); assert.equal(f.current.archive_status, 'REVIEW_PENDING'); assert.deepEqual(f.current.next_eligible_phases, ['ARCHIVE']);
  const verified = await f.store.readVerifiedCanonical(); assert.equal(verified.result, 'CANONICAL_READ_VERIFIED'); assert.equal(verified.binding.task_status, 'COMPLETED'); assert.match(verified.binding.receipt_checksum, /^sha256:/);
  f.store.designOnlySecurity.current_authority_epoch = 8;
  f.store.designOnlySecurity.revocation_proof_checksum = `sha256:${'8'.repeat(64)}`;
  f.store.designOnlySecurity.authority_ledger_coordinate = { source_id: 'authority-ledger', revision: 8, content_checksum: `sha256:${'8'.repeat(64)}`, observed_at: '2026-08-27T00:01:00.000Z' };
  assert.equal((await f.store.readVerifiedCanonical()).result, 'CANONICAL_READ_VERIFIED', 'later authority rotation must not revoke a valid historical commit');
  const historicalProvider = f.store.designOnlySecurity.get_historical_authority_state; delete f.store.designOnlySecurity.get_historical_authority_state;
  await assert.rejects(() => f.store.readVerifiedCanonical(), (error) => error.code === 'CANONICAL_READ_NOT_VERIFIED');
  f.store.designOnlySecurity.get_historical_authority_state = historicalProvider;
  const log = (await readFile(path.join(f.dir, 'transition-log.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.deepEqual(log.map((row) => row.operation_type), [DESIGN_ONLY_OPERATIONS.CLASSIFY, DESIGN_ONLY_OPERATIONS.COMPLETE]);
  assert.deepEqual(log[1].operation_audit.skipped_phases.map((row) => row.phase), ['IMPLEMENTATION_AUTHORIZATION', 'IMPLEMENTATION', 'TESTING', 'IMPLEMENTATION_REVIEW', 'FINAL_JUDGMENT', 'POLICY_REVIEW']);
  assert.ok(log[1].operation_audit.skipped_phases.every((row) => row.entered === false));
});

test('unknown, implementation, unsigned and replay inputs fail closed', async (t) => {
  const f = await setup(t); const current = await f.store.readRecord();
  const completionTo = { task_status: 'COMPLETED', current_phase: 'CLOSURE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'REVIEW_PENDING' };
  assert.throws(() => validateTransition(current, { expected_revision: 13, from: { task_status: 'ACTIVE', current_phase: 'FINAL_PLAN', gate_status: 'PASS', authorization_status: 'PENDING', archive_status: 'NOT_ELIGIBLE' }, to: completionTo, operation_domain: 'DESIGN_ONLY_CLOSURE', owner_authorized: true, closure_ready: true, authorized_by: owner }), (error) => error.code === 'DESIGN_ONLY_CLOSURE_INVALID');
  const prep = await f.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.CLASSIFY); const built = await buildBundle(f, DESIGN_ONLY_OPERATIONS.CLASSIFY, prep);
  const bad = structuredClone(built); bad.operation_bundle.owner_authorization.signature = 'AAAA'; bad.operation_bundle.content_checksum = checksum(bad.operation_bundle);
  await assert.rejects(() => f.store.transition(request(current, prep, DESIGN_ONLY_OPERATIONS.CLASSIFY, bad, f.authority), applied));
  const wrongSummary = request(current, prep, DESIGN_ONLY_OPERATIONS.CLASSIFY, built, f.authority); wrongSummary.authorization_reference.decision = 'DENY';
  await assert.rejects(() => f.store.transition(wrongSummary, applied), (error) => error.code === 'AUTHORIZATION_MISSING');
  assert.equal((await f.store.readRecord()).record_revision, 13);
});

test('mixed Event 1.2 branches and missing receipts fail closed', async (t) => {
  const mixed = await completeDesignOnlyFixture(t); const logPath = path.join(mixed.dir, 'transition-log.jsonl');
  const events = (await readFile(logPath, 'utf8')).trim().split('\n').map(JSON.parse); events.at(-1).failure_code = 'ILLEGAL_MIX'; events.at(-1).entry_checksum = checksum(events.at(-1));
  await writeFile(logPath, `${events.map((row) => JSON.stringify(row)).join('\n')}\n`);
  await assert.rejects(() => mixed.store.readVerifiedCanonical(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
  const missing = await completeDesignOnlyFixture(t); await unlink(missing.store.receiptPath(missing.current.last_transition_id));
  await assert.rejects(() => missing.store.readVerifiedCanonical(), (error) => ['AUDIT_RECEIPT_INVALID', 'CANONICAL_READ_NOT_VERIFIED'].includes(error.code));
});

test('Operation Audit skipped-phase rows are exact and closed', async (t) => {
  const f = await completeDesignOnlyFixture(t); const logPath = path.join(f.dir, 'transition-log.jsonl');
  const events = (await readFile(logPath, 'utf8')).trim().split('\n').map(JSON.parse); const completion = events.at(-1);
  completion.operation_audit.skipped_phases[0].unexpected = true;
  completion.operation_audit.content_checksum = checksum(completion.operation_audit);
  completion.operation_audit_checksum = completion.operation_audit.content_checksum;
  completion.entry_checksum = checksum(completion);
  await writeFile(logPath, `${events.map(JSON.stringify).join('\n')}\n`);
  await assert.rejects(() => f.store.readVerifiedCanonical(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
});

test('Operation Audit artifact checksums remain exactly bound to the committed Bundle', async (t) => {
  const bindings = [
    'context_manifest_checksum',
    'decision_checksum',
    'operation_coordinate_checksum',
    'owner_authorization_payload_checksum',
    'authority_attestation_payload_checksum',
  ];
  for (const field of bindings) await t.test(field, async (t) => {
    const f = await completeDesignOnlyFixture(t); const logPath = path.join(f.dir, 'transition-log.jsonl');
    const events = (await readFile(logPath, 'utf8')).trim().split('\n').map(JSON.parse); const completion = events.at(-1);
    completion.operation_audit[field] = `sha256:${'a'.repeat(64)}`;
    completion.operation_audit.content_checksum = checksum(completion.operation_audit);
    completion.operation_audit_checksum = completion.operation_audit.content_checksum;
    completion.entry_checksum = checksum(completion);
    await writeFile(logPath, `${events.map(JSON.stringify).join('\n')}\n`);
    const receiptPath = f.store.receiptPath(completion.transition_id); const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
    receipt.event_checksum = completion.entry_checksum;
    receipt.operation_audit_checksum = completion.operation_audit.content_checksum;
    receipt.content_checksum = checksum(receipt);
    await writeFile(receiptPath, JSON.stringify(receipt));
    await assert.rejects(() => f.store.readVerifiedCanonical(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
  });
});

test('paused design-only record cannot bypass into implementation authorization', () => {
  const state = { record_schema_version: '1.2.0', task_classification: 'DESIGN_ONLY', record_revision: 2, task_status: 'PAUSED', current_phase: 'FINAL_PLAN', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'NOT_ELIGIBLE' };
  assert.throws(() => validateTransition(state, { expected_revision: 2, from: { task_status: 'PAUSED', current_phase: 'FINAL_PLAN', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'NOT_ELIGIBLE' }, to: { task_status: 'PAUSED', current_phase: 'IMPLEMENTATION_AUTHORIZATION', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'NOT_ELIGIBLE' }, operation_domain: 'PHASE1' }), (error) => error.code === 'TASK_CLASSIFICATION_IMMUTABLE');
});

test('legacy 1.1 completion remains parked until signed prefix attestation is committed', async (t) => {
  const f = await setup(t); const original = await f.store.readRecord();
  const legacy = { ...original, task_status: 'COMPLETED', current_phase: 'CLOSURE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'REVIEW_PENDING', status_reason: 'legacy completed design task', next_eligible_phases: ['ARCHIVE'] };
  legacy.content_checksum = checksum(legacy);
  await writeFile(path.join(f.dir, 'canonical-status.json'), JSON.stringify(legacy));
  await assert.rejects(() => f.store.readVerifiedCanonical(), (error) => error.code === 'CANONICAL_READ_NOT_VERIFIED');
  const preparation = await f.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST);
  const built = await buildBundle(f, DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, preparation);
  const axes = Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, legacy[key]]));
  const legacyEnvelope = built.operation_bundle.owner_authorization;
  const authorization_reference = { ...f.authority, authorization_id: legacyEnvelope.approval_id, authority_type: 'OWNER', authority_path: legacyEnvelope.authority_path, authority_checksum: legacyEnvelope.authority_checksum, authority_envelope_payload_checksum: legacyEnvelope.payload_checksum, authority_envelope_key_id: legacyEnvelope.key_id, decision: 'CANONICAL_QUEUE_BINDING', effective_at: legacyEnvelope.effective_at, expires_at: legacyEnvelope.expires_at, scope: { task_id: legacy.task_id, phases: ['CLOSURE'], operations: ['ATTEST_LEGACY_COMPLETION', 'CANONICAL_QUEUE_BINDING'] } };
  const result = await f.store.attestLegacyCompletion({ request_id: preparation.preparation_id, task_id: legacy.task_id, expected_revision: legacy.record_revision, from: axes, to: axes, reason_code: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, reason: 'Owner-authorized legacy completion attestation', requested_by: requested, authorized_by: owner, authorization_reference, evidence: built.evidence, operation_domain: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, operation_bundle: built.operation_bundle }, applied);
  assert.equal(result.result, 'LEGACY_COMPLETION_ATTESTED');
  const verified = await f.store.readVerifiedCanonical();
  assert.equal(verified.binding.task_status, 'COMPLETED'); assert.match(verified.binding.receipt_checksum, /^sha256:/);
  await assert.rejects(() => f.store.attestLegacyCompletion({ request_id: preparation.preparation_id, task_id: legacy.task_id, expected_revision: legacy.record_revision, operation_domain: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, operation_bundle: built.operation_bundle }, applied));
});

test('legacy event-before-receipt crash recovers from its durable journal', async (t) => {
  const f = await setup(t); const original = await f.store.readRecord();
  const legacy = { ...original, task_status: 'COMPLETED', current_phase: 'CLOSURE', gate_status: 'PASS', authorization_status: 'NOT_REQUIRED', archive_status: 'REVIEW_PENDING', status_reason: 'legacy completed design task', next_eligible_phases: ['ARCHIVE'] }; legacy.content_checksum = checksum(legacy);
  await writeFile(path.join(f.dir, 'canonical-status.json'), JSON.stringify(legacy));
  const preparation = await f.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST); const built = await buildBundle(f, DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, preparation);
  const axes = Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, legacy[key]])); const envelope = built.operation_bundle.owner_authorization;
  const authorization_reference = { ...f.authority, authorization_id: envelope.approval_id, authority_type: 'OWNER', authority_path: envelope.authority_path, authority_checksum: envelope.authority_checksum, authority_envelope_payload_checksum: envelope.payload_checksum, authority_envelope_key_id: envelope.key_id, decision: 'CANONICAL_QUEUE_BINDING', effective_at: envelope.effective_at, expires_at: envelope.expires_at, scope: { task_id: legacy.task_id, phases: ['CLOSURE'], operations: ['ATTEST_LEGACY_COMPLETION', 'CANONICAL_QUEUE_BINDING'] } };
  f.store.crashAt = 'LEGACY_EVENT_APPENDED';
  await assert.rejects(() => f.store.attestLegacyCompletion({ request_id: preparation.preparation_id, task_id: legacy.task_id, expected_revision: legacy.record_revision, from: axes, to: axes, reason_code: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, reason: 'Owner-authorized legacy completion attestation', requested_by: requested, authorized_by: owner, authorization_reference, evidence: built.evidence, operation_domain: DESIGN_ONLY_OPERATIONS.LEGACY_ATTEST, operation_bundle: built.operation_bundle }, applied), /SIMULATED_CRASH/);
  f.store.crashAt = null; const verified = await f.store.readVerifiedCanonical();
  assert.equal(verified.binding.task_status, 'COMPLETED'); assert.match(verified.binding.receipt_checksum, /^sha256:/);
  await assert.rejects(() => readFile(f.store.legacyAttestationJournalPath, 'utf8'));
});

test('authority epoch/revocation changes and unresolved High critic evidence fail closed', async (t) => {
  const f = await setup(t); const current = await f.store.readRecord();
  const preparation = await f.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.CLASSIFY);
  const built = await buildBundle(f, DESIGN_ONLY_OPERATIONS.CLASSIFY, preparation);
  f.store.designOnlySecurity.revocation_proof_checksum = `sha256:${'8'.repeat(64)}`;
  await assert.rejects(() => f.store.transition(request(current, preparation, DESIGN_ONLY_OPERATIONS.CLASSIFY, built, f.authority), applied), (error) => error.code === 'DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED');

  const classified = await classifyDesignOnlyFixture(t); const completionPrep = await classified.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.COMPLETE);
  const completionBuilt = await buildBundle(classified, DESIGN_ONLY_OPERATIONS.COMPLETE, completionPrep, { criticFindings: [{ finding_id: 'H-001', severity: 'HIGH', status: 'OPEN' }] });
  await assert.rejects(() => classified.store.transition(request(classified.current, completionPrep, DESIGN_ONLY_OPERATIONS.COMPLETE, completionBuilt, classified.authority), applied), (error) => error.code === 'CRITIC_EVIDENCE_INVALID');
  assert.equal((await classified.store.readRecord()).task_status, 'ACTIVE');

  const malformed = await setup(t); const malformedCurrent = await malformed.store.readRecord();
  const malformedPreparation = await malformed.store.prepareDesignOnlyOperation(DESIGN_ONLY_OPERATIONS.CLASSIFY);
  const malformedBuilt = await buildBundle(malformed, DESIGN_ONLY_OPERATIONS.CLASSIFY, malformedPreparation, { ownerEffectiveAt: 'not-a-date' });
  await assert.rejects(() => malformed.store.transition(request(malformedCurrent, malformedPreparation, DESIGN_ONLY_OPERATIONS.CLASSIFY, malformedBuilt, malformed.authority), applied), (error) => ['DESIGN_ONLY_COMPLETE_TASK_AUTH_REQUIRED', 'SCHEMA_INVALID'].includes(error.code));
});

test('1.2 recovery and Archive branches retain design-only receipt provenance', async (t) => {
  const paused = await classifyDesignOnlyFixture(t); let current = paused.current;
  const seed = await source(paused.root, 'recovery-evidence', 'seed.md');
  const evidence = [{ source_id: seed.source_id, path: seed.path, checksum: seed.content_checksum, authoring_role: 'Builder', result: 'PASS', observed_at: clock().toISOString() }];
  const axes = (record) => Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, record[key]]));
  const pausedTo = { ...axes(current), task_status: 'PAUSED' };
  current = await paused.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: pausedTo, reason_code: 'OWNER_PAUSE', reason: 'pause design-only task', requested_by: requested, authorized_by: owner, authorization_reference: paused.authority, evidence, operation_domain: 'RECOVERY' }, applied);
  assert.equal(current.task_status, 'PAUSED'); assert.equal((await paused.store.readVerifiedCanonical()).record.task_status, 'PAUSED');

  const archived = await completeDesignOnlyFixture(t); current = archived.current;
  const archiveEvidenceSource = await source(archived.root, 'archive-evidence', 'seed.md');
  const archiveEvidence = [{ source_id: archiveEvidenceSource.source_id, path: archiveEvidenceSource.path, checksum: archiveEvidenceSource.content_checksum, authoring_role: 'Builder', result: 'PASS', observed_at: clock().toISOString() }];
  const phaseTo = { ...axes(current), current_phase: 'ARCHIVE' };
  current = await archived.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: phaseTo, reason_code: 'ADVANCE_ARCHIVE_REVIEW', reason: 'advance completed task to archive review', requested_by: requested, authorized_by: owner, authorization_reference: archived.authority, evidence: archiveEvidence, operation_domain: 'PHASE1' }, applied);
  assert.equal((await archived.store.readVerifiedCanonical()).record.current_phase, 'ARCHIVE');
  const archiveTo = { ...axes(current), task_status: 'ARCHIVED', archive_status: 'ARCHIVED' };
  const archiveEnvelope = signAuthorizationEnvelope({ approval_id: 'OWNER-ARCHIVE', authorized: true, task_id: current.task_id, project_id: current.project_id, phase: 'ARCHIVE', role: 'Owner', operation: 'ARCHIVE', authority_epoch: 7, revocation_proof_checksum: `sha256:${'7'.repeat(64)}`, authority_path: 'task.md', authority_checksum: sha(await readFile(path.join(archived.root, 'task.md'))), effective_at: '2026-08-26T23:59:00.000Z', expires_at: '2026-08-27T01:00:00.000Z' }, { private_key: archived.ownerKeys.privateKey, key_id: 'OWNER', clock });
  const archiveReference = { authorization_id: archiveEnvelope.approval_id, authority_type: 'OWNER', authority_path: archiveEnvelope.authority_path, authority_checksum: archiveEnvelope.authority_checksum, decision: 'ARCHIVE', effective_at: archiveEnvelope.effective_at, expires_at: archiveEnvelope.expires_at, authority_envelope_payload_checksum: archiveEnvelope.payload_checksum, authority_envelope_key_id: archiveEnvelope.key_id, scope: { task_id: current.task_id, phases: ['ARCHIVE'], operations: ['ARCHIVE', 'CANONICAL_STATE_COMMIT'] } };
  const archiveRequest = { request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: archiveTo, reason_code: 'OWNER_ARCHIVE', reason: 'Owner-authorized archive', requested_by: requested, authorized_by: owner, authorization_reference: archiveReference, evidence: archiveEvidence, operation_domain: 'ARCHIVE', owner_authorization: archiveEnvelope, owner_authorized: true, archive_verified: true };
  await assert.rejects(() => archived.store.transition({ ...archiveRequest, owner_authorization: null }, applied), (error) => error.code === 'DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED');
  current = await archived.store.transition(archiveRequest, applied);
  assert.equal(current.task_status, 'ARCHIVED'); assert.equal((await archived.store.readVerifiedCanonical()).record.task_status, 'ARCHIVED');
  const archiveLogPath = path.join(archived.dir, 'transition-log.jsonl');
  const archiveEvents = (await readFile(archiveLogPath, 'utf8')).trim().split('\n').map(JSON.parse);
  delete archiveEvents.at(-1).archive_authority;
  archiveEvents.at(-1).entry_checksum = checksum(archiveEvents.at(-1));
  await writeFile(archiveLogPath, `${archiveEvents.map(JSON.stringify).join('\n')}\n`);
  await assert.rejects(() => archived.store.readVerifiedCanonical(), (error) => ['COMMIT_STATE_UNKNOWN', 'CANONICAL_READ_NOT_VERIFIED'].includes(error.code));
});

test('Archive authority is revalidated after the lease and before Snapshot publication', async (t) => {
  const f = await completeDesignOnlyFixture(t); let current = f.current;
  const axes = (record) => Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, record[key]]));
  const evidenceSource = await source(f.root, 'archive-evidence', 'seed.md');
  const evidence = [{ source_id: evidenceSource.source_id, path: evidenceSource.path, checksum: evidenceSource.content_checksum, authoring_role: 'Builder', result: 'PASS', observed_at: clock().toISOString() }];
  current = await f.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: { ...axes(current), current_phase: 'ARCHIVE' }, reason_code: 'ADVANCE_ARCHIVE_REVIEW', reason: 'advance completed task to archive review', requested_by: requested, authorized_by: owner, authorization_reference: f.authority, evidence, operation_domain: 'PHASE1' }, applied);
  const envelope = signAuthorizationEnvelope({ approval_id: 'OWNER-ARCHIVE-TOCTOU', authorized: true, task_id: current.task_id, project_id: current.project_id, phase: 'ARCHIVE', role: 'Owner', operation: 'ARCHIVE', authority_epoch: 7, revocation_proof_checksum: `sha256:${'7'.repeat(64)}`, authority_path: 'task.md', authority_checksum: sha(await readFile(path.join(f.root, 'task.md'))), effective_at: '2026-08-26T23:59:00.000Z', expires_at: '2026-08-27T01:00:00.000Z' }, { private_key: f.ownerKeys.privateKey, key_id: 'OWNER', clock });
  const reference = { authorization_id: envelope.approval_id, authority_type: 'OWNER', authority_path: envelope.authority_path, authority_checksum: envelope.authority_checksum, decision: 'ARCHIVE', effective_at: envelope.effective_at, expires_at: envelope.expires_at, authority_envelope_payload_checksum: envelope.payload_checksum, authority_envelope_key_id: envelope.key_id, scope: { task_id: current.task_id, phases: ['ARCHIVE'], operations: ['ARCHIVE', 'CANONICAL_STATE_COMMIT'] } };
  f.store.beforeCommit = async () => { f.store.designOnlySecurity.current_authority_epoch = 8; f.store.designOnlySecurity.revocation_proof_checksum = `sha256:${'8'.repeat(64)}`; };
  await assert.rejects(() => f.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: { ...axes(current), task_status: 'ARCHIVED', archive_status: 'ARCHIVED' }, reason_code: 'OWNER_ARCHIVE', reason: 'Owner-authorized archive', requested_by: requested, authorized_by: owner, authorization_reference: reference, evidence, operation_domain: 'ARCHIVE', owner_authorization: envelope, owner_authorized: true, archive_verified: true }, applied), (error) => error.code === 'DESIGN_ONLY_ARCHIVE_AUTH_REQUIRED');
  assert.equal((await f.store.readRecord()).task_status, 'COMPLETED');
});

test('non-design-only Record 1.2 Archive remains backward compatible without design-only proof', async (t) => {
  const f = await setup(t); const original = await f.store.readRecord();
  const current = { ...original, record_schema_version: '1.2.0', task_classification: 'IMPLEMENTATION', task_status: 'COMPLETED', current_phase: 'ARCHIVE', gate_status: 'PASS', authorization_status: 'AUTHORIZED', archive_status: 'REVIEW_PENDING', status_reason: 'implementation task ready for archive', next_eligible_phases: ['ARCHIVE'] };
  current.content_checksum = checksum(current); await writeFile(path.join(f.dir, 'canonical-status.json'), JSON.stringify(current));
  const axes = (record) => Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, record[key]]));
  const evidenceSource = await source(f.root, 'archive-evidence', 'seed.md'); const evidence = [{ source_id: evidenceSource.source_id, path: evidenceSource.path, checksum: evidenceSource.content_checksum, authoring_role: 'Builder', result: 'PASS', observed_at: clock().toISOString() }];
  const next = await f.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: { ...axes(current), task_status: 'ARCHIVED', archive_status: 'ARCHIVED' }, reason_code: 'OWNER_ARCHIVE', reason: 'existing implementation lifecycle archive', requested_by: requested, authorized_by: owner, authorization_reference: f.authority, evidence, operation_domain: 'ARCHIVE', owner_authorized: true, archive_verified: true }, applied);
  assert.equal(next.task_status, 'ARCHIVED');
  const events = (await readFile(path.join(f.dir, 'transition-log.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(events.at(-1).operation_type, 'ARCHIVE'); assert.equal('archive_authority' in events.at(-1), false);
  assert.equal((await f.store.readVerifiedCanonical()).record.task_status, 'ARCHIVED');
});

test('receipt acknowledgement identity and commit timestamp are fail-closed', async (t) => {
  for (const [label, mutate] of [
    ['ack transition', (receipt) => { receipt.event_acknowledgement.transition_id = crypto.randomUUID(); }],
    ['invalid committed_at', (receipt) => { receipt.committed_at = 'not-a-date'; }],
  ]) await t.test(label, async (subtest) => {
    const f = await completeDesignOnlyFixture(subtest); const receiptPath = f.store.receiptPath(f.current.last_transition_id);
    const receipt = JSON.parse(await readFile(receiptPath, 'utf8')); mutate(receipt); receipt.content_checksum = checksum(receipt); await writeFile(receiptPath, JSON.stringify(receipt));
    await assert.rejects(() => f.store.readVerifiedCanonical(), (error) => ['AUDIT_RECEIPT_INVALID', 'CANONICAL_READ_NOT_VERIFIED'].includes(error.code));
  });
});

test('unknown attempted operation is normalized before audit append and cannot poison Event 1.2 log', async (t) => {
  const f = await completeDesignOnlyFixture(t); const current = await f.store.readRecord();
  const malformedActor = { ...requested, actor_id: '', unexpected: true };
  await assert.rejects(() => f.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: {}, to: {}, reason_code: 'MALFORMED', reason: 'malformed operation', requested_by: malformedActor, authorized_by: owner, operation_domain: 'UNKNOWN_CALLER_DOMAIN' }, applied));
  const events = (await readFile(path.join(f.dir, 'transition-log.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(events.at(-1).operation_type, 'PHASE1'); assert.equal(events.at(-1).outcome, 'REJECTED');
  assert.equal(events.at(-1).from, null); assert.equal(events.at(-1).to, null);
  assert.deepEqual(events.at(-1).requested_by, applied);
  assert.equal((await f.store.readVerifiedCanonical()).record.task_status, 'COMPLETED');
});

test('ordinary committed Event 1.2 requires design-only receipt provenance before append and on read', async (t) => {
  const f = await completeDesignOnlyFixture(t); const current = await f.store.readRecord();
  const axes = (record) => Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, record[key]]));
  const evidenceSource = await source(f.root, 'phase1-evidence', 'seed.md');
  const evidence = [{ source_id: evidenceSource.source_id, path: evidenceSource.path, checksum: evidenceSource.content_checksum, authoring_role: 'Builder', result: 'PASS', observed_at: clock().toISOString() }];
  await f.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: { ...axes(current), current_phase: 'ARCHIVE' }, reason_code: 'ADVANCE_ARCHIVE_REVIEW', reason: 'advance completed task to archive review', requested_by: requested, authorized_by: owner, authorization_reference: f.authority, evidence, operation_domain: 'PHASE1' }, applied);
  const logPath = path.join(f.dir, 'transition-log.jsonl'); const events = (await readFile(logPath, 'utf8')).trim().split('\n').map(JSON.parse);
  const ordinary = events.at(-1); assert.equal(ordinary.operation_type, 'PHASE1'); assert.ok(ordinary.design_only_receipt_coordinates.completion);
  const missingBeforeAppend = structuredClone(ordinary); missingBeforeAppend.transition_id = crypto.randomUUID(); delete missingBeforeAppend.design_only_receipt_coordinates; delete missingBeforeAppend.previous_entry_checksum; delete missingBeforeAppend.entry_checksum;
  await assert.rejects(() => f.store.appendSerializedAuditEvent(missingBeforeAppend), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
  assert.equal((await readFile(logPath, 'utf8')).trim().split('\n').length, events.length);
  delete ordinary.design_only_receipt_coordinates; ordinary.entry_checksum = checksum(ordinary);
  await writeFile(logPath, `${events.map(JSON.stringify).join('\n')}\n`);
  await assert.rejects(() => f.store.readVerifiedCanonical(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
});

test('Event 1.2 nested authorization and evidence reject extra fields before Snapshot', async (t) => {
  const f = await classifyDesignOnlyFixture(t); const current = await f.store.readRecord();
  const axes = (record) => Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, record[key]]));
  const evidenceSource = await source(f.root, 'recovery-evidence', 'seed.md'); const evidence = [{ source_id: evidenceSource.source_id, path: evidenceSource.path, checksum: evidenceSource.content_checksum, authoring_role: 'Builder', result: 'PASS', observed_at: clock().toISOString(), unexpected: true }];
  await assert.rejects(() => f.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: { ...axes(current), task_status: 'PAUSED' }, reason_code: 'OWNER_PAUSE', reason: 'extra field negative', requested_by: requested, authorized_by: owner, authorization_reference: { ...f.authority, unexpected: true }, evidence, operation_domain: 'RECOVERY' }, applied), (error) => ['AUTHORIZATION_MISSING', 'EVIDENCE_INVALID'].includes(error.code));
  assert.equal((await f.store.readRecord()).content_checksum, current.content_checksum);
  assert.equal((await f.store.readVerifiedCanonical()).record.task_status, 'ACTIVE');
});

test('design-only PREPARED recovery appends valid Event 1.2 with receipt provenance', async (t) => {
  const f = await classifyDesignOnlyFixture(t); const current = await f.store.readRecord();
  const axes = (record) => Object.fromEntries(['task_status', 'current_phase', 'gate_status', 'authorization_status', 'archive_status'].map((key) => [key, record[key]]));
  const evidenceSource = await source(f.root, 'recovery-evidence', 'seed.md'); const evidence = [{ source_id: evidenceSource.source_id, path: evidenceSource.path, checksum: evidenceSource.content_checksum, authoring_role: 'Builder', result: 'PASS', observed_at: clock().toISOString() }];
  f.store.crashAt = 'PREPARED';
  await assert.rejects(() => f.store.transition({ request_id: crypto.randomUUID(), task_id: current.task_id, expected_revision: current.record_revision, from: axes(current), to: { ...axes(current), task_status: 'PAUSED' }, reason_code: 'OWNER_PAUSE', reason: 'test prepared recovery', requested_by: requested, authorized_by: owner, authorization_reference: f.authority, evidence, operation_domain: 'RECOVERY' }, applied), /SIMULATED_CRASH/);
  f.store.crashAt = null; await f.store.recover();
  const events = (await readFile(path.join(f.dir, 'transition-log.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse); const recovery = events.at(-1);
  assert.equal(recovery.outcome, 'RECOVERED'); assert.equal(recovery.operation_type, 'LIFECYCLE_RECOVERY'); assert.ok(recovery.design_only_receipt_coordinates.classification);
  assert.equal((await f.store.readVerifiedCanonical()).record.task_status, 'ACTIVE');
  delete recovery.design_only_receipt_coordinates; recovery.entry_checksum = checksum(recovery);
  await writeFile(path.join(f.dir, 'transition-log.jsonl'), `${events.map(JSON.stringify).join('\n')}\n`);
  await assert.rejects(() => f.store.readVerifiedCanonical(), (error) => error.code === 'COMMIT_STATE_UNKNOWN');
});
