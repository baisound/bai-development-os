import test from 'node:test'; import assert from 'node:assert/strict'; import { classifyRetry, createSessionRecord, resolveWorktreeEvidence } from '../../src/automation/index.mjs';

test('retry stops at limit',()=>assert.equal(classifyRetry({attempt:2,limit:2,error_class:'TRANSIENT'}).result,'RETRY_EXHAUSTED'));
test('external side effect requires owner',()=>assert.equal(classifyRetry({attempt:0,limit:2,error_class:'TRANSIENT',external_side_effect:true}).result,'RETRY_REQUIRES_OWNER'));
test('deterministic retry requires changed hypothesis',()=>assert.equal(classifyRetry({attempt:0,limit:2,error_class:'SCHEMA'}).result,'RETRY_BLOCKED_SAME_HYPOTHESIS'));
test('changed hypothesis permits bounded deterministic retry',()=>assert.equal(classifyRetry({attempt:0,limit:2,error_class:'SCHEMA',hypothesis_changed:true}).result,'RETRY_ALLOWED'));
test('transient retry allowed within limit',()=>assert.equal(classifyRetry({attempt:0,limit:1,error_class:'NETWORK'}).retry_allowed,true));
test('session record carries run/session checksummed identity',()=>{const r=createSessionRecord({project_id:'P',task_id:'T',role:'Builder',startup_checksum:'sha256:'+'a'.repeat(64)});assert.match(r.content_checksum,/^sha256:/);assert.ok(r.run_id);assert.ok(r.session_id);});
test('worktree evidence uses git facts instead of inference',async()=>{const r=await resolveWorktreeEvidence(process.cwd());assert.equal(r.result,'WORKTREE_EVIDENCE_READY');assert.match(r.commit,/^[a-f0-9]{40}$/);});
test('worktree command failure safe-stops',async()=>{await assert.rejects(()=>resolveWorktreeEvidence('/tmp',{exec:async()=>{throw new Error('no git')}}),e=>e.code==='WORKTREE_EVIDENCE_UNAVAILABLE');});
