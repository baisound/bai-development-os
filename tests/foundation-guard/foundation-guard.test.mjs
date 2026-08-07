import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createEvidenceSession } from '../../src/context-guard/evidence-store.mjs';
import { createCanonicalPreflightResult, revokeRoleActivationPermit, inspectRoleActivationPermitLedger } from '../../src/context-guard/permit.mjs';
import {
  FoundationGuardError, PERMIT_LEDGER_FAULT_MATRIX, TOCTOU_MATRIX, activateFoundationRole,
  assertFoundationMatricesComplete, createActivationEntryRegistry, createFoundationActivationRequest,
  issueFoundationRoleActivationPermit, resolveActivationEntry,
} from '../../src/foundation-guard/index.mjs';
import { readFoundationAudit } from '../../src/foundation-guard/audit.mjs';

const baseRequest = (session_id = 's1') => ({
  project_id: 'consumer-project', task_id: 'TASK-900', role: 'Builder', session_id,
  activation_entry_id: 'consumer.runtime.activate', requester_identity: 'orchestrator', phase: 'IMPLEMENTATION', scope: 'PROJECT',
  correlation_id: `corr-${session_id}`, selected_inputs: [{ content_checksum: 'sha256:a', bytes: 1, estimated_tokens: 1 }],
});
const registry = () => createActivationEntryRegistry({ revision: 4, entries: [{ entry_id: 'consumer.runtime.activate', owner: 'runtime', gateway: 'CONTEXT_GUARD_GATEWAY', roles: ['Builder'], scopes: ['PROJECT'] }] });
const state = (revision = 7, phase = 'IMPLEMENTATION') => ({ task_id: 'TASK-900', phase, revision });
async function fixture(t, id = 's1') {
  const root = await mkdtemp(path.join(tmpdir(), 'foundation-guard-')); t.after(() => rm(root,{recursive:true,force:true}));
  const session = await createEvidenceSession({ projectRoot: root, taskId: 'TASK-900', sessionId: id });
  const request = baseRequest(id); const reg = registry(); let currentState = state();
  const state_provider = async () => currentState;
  const preflight = await createCanonicalPreflightResult({ session, ...request, output_estimates: { estimated_output_tokens: 10, estimated_artifact_bytes: 100, expected_top_level_sections: 1 } });
  const permit = await issueFoundationRoleActivationPermit({ session, registry: reg, state_provider, request, preflight_result: preflight, preflight_result_checksum: preflight.content_checksum });
  return { root,session,request,reg,permit,state_provider,setState:(value)=>{currentState=value;} };
}

const permitChecksum = (permit) => { const copy={...permit}; delete copy.content_checksum; return `sha256:${createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(copy).sort().map(k=>[k,copy[k]])))).digest('hex')}`; };

test('FG-MATRIX: Phase 1.6 matrices are complete PL-01..28 and T-01..17', () => {
  assert.equal(PERMIT_LEDGER_FAULT_MATRIX.length,28); assert.equal(TOCTOU_MATRIX.length,17); assert.equal(assertFoundationMatricesComplete(),true);
});

test('FG-ENTRY: registry rejects duplicates, unregistered entries, role and scope bypasses', () => {
  assert.throws(() => createActivationEntryRegistry({entries:[{entry_id:'x',owner:'o',gateway:'CONTEXT_GUARD_GATEWAY'},{entry_id:'x',owner:'o',gateway:'CONTEXT_GUARD_GATEWAY'}]}), /FOUNDATION_ENTRY_DUPLICATE/);
  const reg=registry();
  assert.throws(() => resolveActivationEntry(reg,{activation_entry_id:'missing',role:'Builder',scope:'PROJECT'}),(e)=>e.code==='FOUNDATION_ENTRY_UNCLASSIFIED');
  assert.throws(() => resolveActivationEntry(reg,{activation_entry_id:'consumer.runtime.activate',role:'Judge',scope:'PROJECT'}),(e)=>e.code==='FOUNDATION_ENTRY_ROLE_DENIED');
  assert.throws(() => resolveActivationEntry(reg,{activation_entry_id:'consumer.runtime.activate',role:'Builder',scope:'GLOBAL'}),(e)=>e.code==='FOUNDATION_ENTRY_SCOPE_DENIED');
});

test('FG-REQUEST: all Foundation activation identity fields are mandatory', () => {
  const request=baseRequest(); for (const key of ['activation_entry_id','requester_identity','phase','scope','correlation_id']) { const value={...request}; delete value[key]; assert.throws(()=>createFoundationActivationRequest(value),(e)=>e.code==='FOUNDATION_REQUEST_INVALID'); }
});


test('FG-MATRIX: every matrix row carries a deterministic oracle and recovery/consistency contract', () => {
  for (const row of PERMIT_LEDGER_FAULT_MATRIX) for (const field of ['owner','precondition','stimulus','decision','durable_evidence','error_class','recovery','oracle']) assert.ok(row[field], `${row.id}.${field}`);
  for (const row of TOCTOU_MATRIX) for (const field of ['boundary','mutation_window','consistency_mechanism','expected','oracle']) assert.ok(row[field], `${row.id}.${field}`);
});

test('FG-PERMIT: a forged but checksummed Permit not equal to persisted canonical Permit is unknown and denied', async (t) => {
  const f=await fixture(t,'unknown'); const forged=structuredClone(f.permit); forged.permit_id='forged-id'; forged.content_checksum=permitChecksum(forged);
  await assert.rejects(()=>activateFoundationRole({session:f.session,permit:forged,request:f.request,registry:f.reg,state_provider:f.state_provider}),(e)=>e.code==='CONTEXT_ROLE_ACTIVATION_PERMIT_UNKNOWN');
});

test('FG-CLOCK: invalid clock evidence fails closed', async (t) => {
  const f=await fixture(t,'clock');
  const { validateRoleActivationPermit } = await import('../../src/context-guard/permit.mjs');
  await assert.rejects(()=>validateRoleActivationPermit({session:f.session,permit:f.permit,request:f.request,now:Number.NaN}),(e)=>e.code==='CONTEXT_CLOCK_UNCERTAIN');
});
test('FG-HAPPY: registered current request consumes once and returns guarded handoff', async (t) => {
  const f=await fixture(t,'happy'); const result=await activateFoundationRole({session:f.session,permit:f.permit,request:f.request,registry:f.reg,state_provider:f.state_provider});
  assert.equal(result.status,'ROLE_ACTIVATION_HANDOFF_READY'); assert.equal(result.activation_entry_id,f.request.activation_entry_id); assert.equal(result.correlation_id,f.request.correlation_id);
  const ledger=await inspectRoleActivationPermitLedger({session:f.session,permit_id:f.permit.permit_id}); assert.equal(ledger.consumed,true);
  const audit=await readFoundationAudit(f.session); assert.equal(audit.length,1); assert.equal(audit[0].decision,'ALLOW_PENDING_CONSUMPTION');
});

test('FG-TOCTOU: task/phase revision mutation immediately before use fails closed and does not consume', async (t) => {
  const f=await fixture(t,'state-race');
  await assert.rejects(()=>activateFoundationRole({session:f.session,permit:f.permit,request:f.request,registry:f.reg,state_provider:f.state_provider,before_use:async()=>f.setState(state(8))}),(e)=>e.code==='FOUNDATION_STATE_CHANGED_BEFORE_USE');
  assert.equal((await inspectRoleActivationPermitLedger({session:f.session,permit_id:f.permit.permit_id})).consumed,false);
});

test('FG-TOCTOU: registry revision/checksum mutation before dispatch fails closed', async (t) => {
  const f=await fixture(t,'registry-race'); const changed=createActivationEntryRegistry({revision:5,entries:[{entry_id:'consumer.runtime.activate',owner:'runtime',gateway:'CONTEXT_GUARD_GATEWAY',roles:['Builder'],scopes:['PROJECT']}]});
  await assert.rejects(()=>activateFoundationRole({session:f.session,permit:f.permit,request:f.request,registry:f.reg,registry_provider:async()=>changed,state_provider:f.state_provider}),(e)=>e.code==='FOUNDATION_REGISTRY_CHANGED_BEFORE_USE');
});

test('FG-BINDING: requester, phase, scope and entry changes cannot reuse a Foundation Permit', async (t) => {
  const fields=[['requester_identity','other'],['phase','REVIEW'],['scope','GLOBAL'],['activation_entry_id','other.entry']];
  for (const [index,[key,value]] of fields.entries()) { const f=await fixture(t,`bind-${index}`); const request={...f.request,[key]:value}; await assert.rejects(()=>activateFoundationRole({session:f.session,permit:f.permit,request,registry:f.reg,state_provider:f.state_provider})); }
});

test('FG-LEDGER: explicit revocation is durable and blocks later activation', async (t) => {
  const f=await fixture(t,'revoke'); const rev=await revokeRoleActivationPermit({session:f.session,permit:f.permit,actor_identity:'owner',reason:'scope changed'}); assert.equal(rev.event_type,'PERMIT_REVOKED');
  await assert.rejects(()=>activateFoundationRole({session:f.session,permit:f.permit,request:f.request,registry:f.reg,state_provider:f.state_provider}),(e)=>['CONTEXT_ROLE_ACTIVATION_PERMIT_REVOKED','CONTEXT_GATEWAY_PREFLIGHT_VERIFICATION_FAILED'].includes(e.code));
  const ledger=await inspectRoleActivationPermitLedger({session:f.session,permit_id:f.permit.permit_id}); assert.equal(ledger.revoked,true); assert.equal(ledger.consumed,false);
});

test('FG-PERMIT: unsupported Permit version is denied', async (t) => {
  const f=await fixture(t,'version'); const malformed=structuredClone(f.permit); malformed.permit_version='99.0.0'; malformed.content_checksum=permitChecksum(malformed);
  await assert.rejects(()=>activateFoundationRole({session:f.session,permit:malformed,request:f.request,registry:f.reg,state_provider:f.state_provider}),(e)=>e.code==='CONTEXT_ROLE_ACTIVATION_PERMIT_UNSUPPORTED_VERSION');
});

test('FG-AUDIT: audit durability failure fails closed before role handoff', async (t) => {
  const f=await fixture(t,'audit-fail');
  await assert.rejects(()=>activateFoundationRole({session:f.session,permit:f.permit,request:f.request,registry:f.reg,state_provider:f.state_provider,audit_options:{syncDirectory:async()=>{throw new Error('disk sync failed')}}}),(e)=>e.code==='FOUNDATION_AUDIT_WRITE_FAILED');
  assert.equal((await inspectRoleActivationPermitLedger({session:f.session,permit_id:f.permit.permit_id})).consumed,false);
});

test('FG-LEDGER: corrupt event chain fails closed', async (t) => {
  const f=await fixture(t,'corrupt'); await revokeRoleActivationPermit({session:f.session,permit:f.permit});
  const file=path.join(f.session,'role-activation-permit-events.jsonl'); const text=await readFile(file,'utf8'); await writeFile(file,text.replace('PERMIT_REVOKED','PERMIT_CONSUMED'));
  await assert.rejects(()=>inspectRoleActivationPermitLedger({session:f.session,permit_id:f.permit.permit_id}),(e)=>e.code==='CONTEXT_ROLE_ACTIVATION_PERMIT_EVENT_CHAIN_INVALID');
});

test('FG-CONCURRENCY: same Permit has exactly one successful consumer', async (t) => {
  const f=await fixture(t,'race');
  const calls=[1,2].map(()=>activateFoundationRole({session:f.session,permit:f.permit,request:f.request,registry:f.reg,state_provider:f.state_provider}));
  const settled=await Promise.allSettled(calls); assert.equal(settled.filter(x=>x.status==='fulfilled').length,1); assert.equal(settled.filter(x=>x.status==='rejected').length,1);
  assert.equal((await inspectRoleActivationPermitLedger({session:f.session,permit_id:f.permit.permit_id})).events.filter(e=>e.event_type==='PERMIT_CONSUMED').length,1);
});
