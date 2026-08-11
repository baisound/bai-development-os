import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('live rehearsal harness never activates public profile and always tears down volumes',()=>{
 const script=read('deploy/knowledge-hub/scripts/run-live-rehearsal.sh');assert.match(script,/compose\.rehearsal\.yaml/);assert.doesNotMatch(script,/--profile\s+public/);assert.match(script,/down -v --remove-orphans/);assert.match(script,/127\.0\.0\.1:8787\/readyz/);assert.match(script,/_restore_rehearsal/);
});

test('live rehearsal client verifies submit, retry, partial reject, persistence and revocation without printing raw key',()=>{
 const client=read('deploy/knowledge-hub/runtime/rehearsal-client.mjs');assert.match(client,/already_seen/);assert.match(client,/partialReceipt\.rejected/);assert.match(client,/revokeCredential/);assert.match(client,/SELECT count\(\*\)::int AS count FROM evidence_events/);assert.doesNotMatch(client,/console\.log\(issued\.api_key\)/);
 const parsed=spawnSync(process.execPath,['--check','deploy/knowledge-hub/runtime/rehearsal-client.mjs'],{cwd:root,encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
 const shell=spawnSync('bash',['-n','deploy/knowledge-hub/scripts/run-live-rehearsal.sh'],{cwd:root,encoding:'utf8'});assert.equal(shell.status,0,shell.stderr);
});
