import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createEvidenceSession } from '../../src/context-guard/evidence-store.mjs';
import { createCanonicalPreflightResult, issueRoleActivationPermit } from '../../src/context-guard/permit.mjs';
import { activateRoleWithPermit } from '../../src/context-guard/activation-gateway.mjs';

const permitChecksum = (permit) => {
  const copy = { ...permit };
  delete copy.content_checksum;
  return `sha256:${createHash('sha256').update(JSON.stringify(copy)).digest('hex')}`;
};

test('CG-GATE: Gateway requires a valid Permit and consumes it before handoff', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'one' });
  const request = { project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'one', selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }] };
  await assert.rejects(
    () => activateRoleWithPermit({ session, request }),
    (error) => error.code === 'CONTEXT_GATEWAY_PREFLIGHT_VERIFICATION_FAILED',
  );
  const preflight = await createCanonicalPreflightResult({
    session, ...request,
    output_estimates: { estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
  });
  const permit = await issueRoleActivationPermit({
    session, ...request, preflight_result: preflight, preflight_result_checksum: preflight.content_checksum,
  });
  assert.equal((await activateRoleWithPermit({ session, permit, request })).status, 'ROLE_ACTIVATION_HANDOFF_READY');
});

test('CG-GATE: rejects legacy, missing, and mismatched Preflight Permit bindings before consumption', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'guard-')); t.after(() => rm(root, { recursive: true, force: true }));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-004', sessionId: 'negative' });
  const request = { project_id: 'javascript-roulette', task_id: 'TASK-004', role: 'Builder', session_id: 'negative', selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }] };
  const preflight = await createCanonicalPreflightResult({
    session, ...request,
    output_estimates: { estimated_output_tokens: 0, estimated_artifact_bytes: 0, expected_top_level_sections: 0 },
  });
  const permit = await issueRoleActivationPermit({
    session, ...request, preflight_result: preflight, preflight_result_checksum: preflight.content_checksum,
  });
  for (const mutation of [
    (value) => { delete value.preflight_result_checksum; },
    (value) => { value.preflight_result_id = 'forged'; },
    (value) => { value.estimated_output_tokens = 1; },
    (value) => { value.guard_decision = 'HARD_STOP'; },
  ]) {
    const malformed = structuredClone(permit);
    mutation(malformed);
    malformed.content_checksum = permitChecksum(malformed);
    await assert.rejects(
      () => activateRoleWithPermit({ session, permit: malformed, request }),
      (error) => error.code === 'CONTEXT_GATEWAY_PREFLIGHT_VERIFICATION_FAILED',
    );
  }
});
