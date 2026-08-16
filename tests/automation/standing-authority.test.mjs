import assert from 'node:assert/strict';
import test from 'node:test';
import { createStandingAuthorityGrant, evaluateStandingAuthority } from '../../src/automation/index.mjs';

const grant = (extra = {}) => createStandingAuthorityGrant({
  grant_id: 'AUTH-1', issuer_id: 'OWNER', subject_id: 'developer-2', epoch: 7,
  valid_from: '2026-08-16T00:00:00.000Z', valid_until: '2026-08-17T00:00:00.000Z',
  allowed_capabilities: ['build.run', 'configure.run', 'repo.read'],
  denied_capabilities: ['release.deploy'], resource_scope: ['TASK-047'],
  evidence_coordinate: 'evidence:owner-message:1', signature_evidence: 'signature:fixture-valid',
  ...extra,
});
const context = { now: '2026-08-16T04:00:00.000Z', current_epoch: 7, verify_signature: (value) => value.signature_evidence === 'signature:fixture-valid' };

test('standing authority evaluates exact subject capability resource and epoch', () => {
  const result = evaluateStandingAuthority(grant(), { subject_id: 'developer-2', resource: 'TASK-047', capabilities: ['configure.run', 'build.run'] }, context);
  assert.equal(result.result, 'ALLOW');
});

test('explicit deny and absent capability fail closed', () => {
  assert.equal(evaluateStandingAuthority(grant(), { subject_id: 'developer-2', resource: 'TASK-047', capabilities: ['release.deploy'] }, context).reason_code, 'EXPLICIT_DENY');
  assert.equal(evaluateStandingAuthority(grant(), { subject_id: 'developer-2', resource: 'TASK-047', capabilities: ['install.run'] }, context).reason_code, 'CAPABILITY_NOT_GRANTED');
});

test('wrong subject stale epoch expiry revocation and bad signature deny', () => {
  assert.equal(evaluateStandingAuthority(grant(), { subject_id: 'developer-1', resource: 'TASK-047', capabilities: ['repo.read'] }, context).reason_code, 'SUBJECT_MISMATCH');
  assert.equal(evaluateStandingAuthority(grant(), { subject_id: 'developer-2', resource: 'TASK-047', capabilities: ['repo.read'] }, { ...context, current_epoch: 8 }).reason_code, 'STALE_AUTHORITY_EPOCH');
  assert.equal(evaluateStandingAuthority(grant(), { subject_id: 'developer-2', resource: 'TASK-047', capabilities: ['repo.read'] }, { ...context, now: '2026-08-17T00:00:00.000Z' }).reason_code, 'OUTSIDE_VALIDITY_WINDOW');
  assert.equal(evaluateStandingAuthority(grant({ revocation_coordinate: 'revoke:1' }), { subject_id: 'developer-2', resource: 'TASK-047', capabilities: ['repo.read'] }, context).reason_code, 'GRANT_REVOKED');
  assert.throws(() => evaluateStandingAuthority(grant(), { subject_id: 'developer-2', resource: 'TASK-047', capabilities: ['repo.read'] }, { ...context, verify_signature: () => false }), (error) => error.code === 'AUTHORITY_SIGNATURE_UNVERIFIED');
});

test('invalid authority timestamp cannot become a perpetual grant', () => {
  assert.throws(() => grant({ valid_from: 'not-a-date' }), (error) => error.code === 'AUTHORITY_WINDOW_INVALID');
});
