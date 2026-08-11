import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('deployment compose is single-VPS shaped and does not expose database or API by default',()=>{
 const compose=read('deploy/knowledge-hub/compose.yaml');assert.match(compose,/postgres:16-alpine/);assert.match(compose,/knowledge-api:/);assert.match(compose,/caddy:/);assert.doesNotMatch(compose,/5432:5432/);assert.doesNotMatch(compose,/8787:8787/);assert.match(compose,/profiles: \["public"\]/);
 const rehearsal=read('deploy/knowledge-hub/compose.rehearsal.yaml');assert.match(rehearsal,/127\.0\.0\.1:8787:8787/);
});

test('deployment files contain safety controls and no embedded API credential',()=>{
 const caddy=read('deploy/knowledge-hub/Caddyfile');assert.match(caddy,/Strict-Transport-Security/);assert.match(caddy,/max_size 1MB/);
 const migration=read('deploy/knowledge-hub/postgres/002_auth_and_operations.sql');assert.match(migration,/secret_hash/);assert.doesNotMatch(migration,/raw_secret|plaintext_secret/i);
 const env=read('deploy/knowledge-hub/.env.example');assert.doesNotMatch(env,/bkh1\.|ghp_|sk-proj-/);
 const restore=read('deploy/knowledge-hub/scripts/restore-rehearsal.sh');assert.match(restore,/_restore_rehearsal/);assert.match(restore,/REHEARSAL_ONLY/);
});

test('deployment readiness checker and runtime scripts parse',()=>{
 const check=spawnSync(process.execPath,['scripts/check-knowledge-hub-deployment-readiness.mjs'],{cwd:root,encoding:'utf8'});assert.equal(check.status,0,check.stderr);assert.match(check.stdout,/"status": "PASS"/);
 for(const rel of ['deploy/knowledge-hub/runtime/server.mjs','deploy/knowledge-hub/runtime/issue-api-key.mjs','deploy/knowledge-hub/runtime/prune-retention.mjs']){const parsed=spawnSync(process.execPath,['--check',rel],{cwd:root,encoding:'utf8'});assert.equal(parsed.status,0,`${rel}: ${parsed.stderr}`);}
});
