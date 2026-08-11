import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('live rehearsal harness never activates public profile and always tears down volumes',()=>{
 const script=read('deploy/knowledge-hub/scripts/run-live-rehearsal.sh');assert.match(script,/compose\.rehearsal\.yaml/);assert.doesNotMatch(script,/--profile\s+public/);assert.match(script,/down -v --remove-orphans/);assert.match(script,/exec -T knowledge-api node deploy\/knowledge-hub\/runtime\/healthcheck\.mjs/);assert.doesNotMatch(script,/127\.0\.0\.1:8787\/readyz/);assert.match(script,/_restore_rehearsal/);
});

test('live rehearsal client verifies submit, retry, partial reject, persistence and revocation without printing raw key',()=>{
 const client=read('deploy/knowledge-hub/runtime/rehearsal-client.mjs');assert.match(client,/already_seen/);assert.match(client,/partialReceipt\.rejected/);assert.match(client,/revokeCredential/);assert.match(client,/SELECT count\(\*\)::int AS count FROM evidence_events/);assert.match(client,/postgresPoolConfig\(process\.env/);assert.doesNotMatch(client,/DATABASE_URL required/);assert.doesNotMatch(client,/console\.log\(issued\.api_key\)/);
 const parsed=spawnSync(process.execPath,['--check','deploy/knowledge-hub/runtime/rehearsal-client.mjs'],{cwd:root,encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
 const shell=spawnSync('bash',['-n','deploy/knowledge-hub/scripts/run-live-rehearsal.sh'],{cwd:root,encoding:'utf8'});assert.equal(shell.status,0,shell.stderr);
});

test('live rehearsal can emit sanitized machine evidence only after cleanup',async()=>{
 const script=read('deploy/knowledge-hub/scripts/run-live-rehearsal.sh');assert.match(script,/BAI_KNOWLEDGE_HUB_REHEARSAL_EVIDENCE_OUT/);assert.match(script,/cleanup_complete/);assert.match(script,/backup_sha256/);
 const down=script.indexOf('down -v --remove-orphans >/dev/null',script.indexOf('# A successful result'));const write=script.indexOf('cat > "$tmp_evidence"');assert.ok(down>=0&&write>down,'Evidence must be written only after successful teardown');
 const {validateLiveRehearsalEvidence}=await import('../../scripts/validate-knowledge-hub-live-rehearsal-evidence.mjs');
 const good={schema_version:'1.0',result:'LIVE_REHEARSAL_PASS',persisted_and_restored_events:4,backup_sha256:'a'.repeat(64),public_profile_activated:false,cleanup_complete:true,completed_at:'2026-08-11T00:00:00Z'};
 assert.equal(validateLiveRehearsalEvidence(good).result,'LIVE_REHEARSAL_PASS');
 assert.throws(()=>validateLiveRehearsalEvidence({...good,public_profile_activated:true}),/public profile/);
 assert.throws(()=>validateLiveRehearsalEvidence({...good,cleanup_complete:false}),/cleanup/);
});
