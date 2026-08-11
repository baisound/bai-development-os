import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateCiLiveGateEvidence } from '../../scripts/validate-knowledge-hub-ci-live-gate-evidence.mjs';

test('GitHub Actions live gate contract is fail-closed and public-profile safe',()=>{
  const out=execFileSync(process.execPath,['scripts/check-knowledge-hub-ci-live-gate.mjs'],{encoding:'utf8'});
  assert.match(out,/"status": "PASS"/);
});

test('CI live gate evidence validator accepts only sanitized pass evidence',()=>{
  const value={
    schema_version:'1.0',result:'GITHUB_ACTIONS_LIVE_GATE_PASS',
    source:{repository:'baisound/bai-development-os',commit_sha:'a'.repeat(40),run_id:'123',run_attempt:'1',event:'workflow_dispatch'},
    runtime_lock_sha256:'b'.repeat(64),
    live_rehearsal:{result:'LIVE_REHEARSAL_PASS',persisted_and_restored_events:4,backup_sha256:'c'.repeat(64),public_profile_activated:false,cleanup_complete:true,completed_at:'2026-08-11T06:00:00Z'},
    completed_at:'2026-08-11T06:01:00Z'
  };
  assert.equal(validateCiLiveGateEvidence(value).result,'GITHUB_ACTIONS_LIVE_GATE_PASS');
  assert.throws(()=>validateCiLiveGateEvidence({...value,api_key:'secret'}),/unexpected top-level fields/);
  assert.throws(()=>validateCiLiveGateEvidence({...value,live_rehearsal:{...value.live_rehearsal,public_profile_activated:true}}),/public profile/);
});

test('CI evidence builder binds lock checksum and exact pg version',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'bai-hub-ci-gate-'));
  try{
    const rehearsal=path.join(root,'rehearsal.json'), lock=path.join(root,'package-lock.json'), out=path.join(root,'out.json');
    fs.writeFileSync(rehearsal,JSON.stringify({schema_version:'1.0',result:'LIVE_REHEARSAL_PASS',persisted_and_restored_events:5,backup_sha256:'d'.repeat(64),public_profile_activated:false,cleanup_complete:true,completed_at:'2026-08-11T06:00:00Z'}));
    fs.writeFileSync(lock,JSON.stringify({lockfileVersion:3,packages:{'node_modules/pg':{version:'8.13.1'}}}));
    execFileSync(process.execPath,['scripts/build-knowledge-hub-ci-live-gate-evidence.mjs','--rehearsal',rehearsal,'--lock',lock,'--out',out,'--repository','baisound/bai-development-os','--sha','e'.repeat(40),'--run-id','99','--run-attempt','2','--event','push'],{encoding:'utf8'});
    const built=validateCiLiveGateEvidence(JSON.parse(fs.readFileSync(out,'utf8')));
    assert.equal(built.source.run_id,'99');
    assert.match(built.runtime_lock_sha256,/^[a-f0-9]{64}$/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
