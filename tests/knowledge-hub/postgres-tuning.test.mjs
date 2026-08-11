import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

function value(text,name){const m=text.match(new RegExp(`^${name}\\s*=\\s*([^#\\n]+)`,`m`));return m?.[1]?.trim().replace(/^['"]|['"]$/g,'');}

test('default 2 GiB PostgreSQL profile is bounded and preserves durability',()=>{
 const text=read('deploy/knowledge-hub/postgres/postgresql.tuned-2gb.conf');
 assert.equal(value(text,'shared_buffers'),'256MB');assert.equal(value(text,'effective_cache_size'),'1GB');assert.equal(value(text,'work_mem'),'4MB');assert.equal(value(text,'max_connections'),'40');
 for(const name of ['fsync','synchronous_commit','full_page_writes','autovacuum'])assert.equal(value(text,name),'on');
 assert.equal(value(text,'password_encryption'),'scram-sha-256');assert.equal(value(text,'jit'),'off');
 assert.doesNotMatch(text,/^random_page_cost\s*=|^effective_io_concurrency\s*=/m);
});

test('4 GiB PostgreSQL profile scales memory without disabling safety',()=>{
 const text=read('deploy/knowledge-hub/postgres/postgresql.tuned-4gb.conf');
 assert.equal(value(text,'shared_buffers'),'768MB');assert.equal(value(text,'effective_cache_size'),'2560MB');assert.equal(value(text,'work_mem'),'8MB');assert.equal(value(text,'max_connections'),'60');
 assert.equal(value(text,'fsync'),'on');assert.equal(value(text,'synchronous_commit'),'on');assert.equal(value(text,'full_page_writes'),'on');
});

test('Compose mounts tuning profile and initializes checksums plus SCRAM without exposing PostgreSQL',()=>{
 const compose=read('deploy/knowledge-hub/compose.yaml');assert.match(compose,/postgres:16\.14-alpine/);assert.match(compose,/POSTGRES_HOST_AUTH_METHOD: "scram-sha-256"/);assert.match(compose,/POSTGRES_INITDB_ARGS: "--data-checksums"/);assert.match(compose,/postgresql\.tuned-2gb\.conf/);assert.match(compose,/config_file=\/etc\/postgresql\/postgresql\.conf/);assert.doesNotMatch(compose,/5432:5432/);
});

test('environment bootstrap and active tuning verification scripts are syntax-safe and secret-free in repo',()=>{
 for(const rel of ['deploy/knowledge-hub/scripts/prepare-compose-env.sh','deploy/knowledge-hub/scripts/verify-postgres-tuning.sh','deploy/knowledge-hub/scripts/start-local-compose.sh','deploy/knowledge-hub/scripts/stop-local-compose.sh']){const r=spawnSync('bash',['-n',rel],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,`${rel}: ${r.stderr}`);}
 const example=read('deploy/knowledge-hub/.env.example');assert.match(example,/POSTGRES_PASSWORD=REPLACE_AT_DEPLOYMENT/);assert.doesNotMatch(example,/POSTGRES_PASSWORD=[0-9a-f]{32,}/);
});

test('machine PostgreSQL tuning checker passes',()=>{
 const r=spawnSync(process.execPath,['scripts/check-knowledge-hub-postgres-tuning.mjs'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/"status": "PASS"/);
});


test('environment bootstrap generates 0600 host-only env without printing the DB password',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bai-hub-env-'));const out=path.join(dir,'.env');
 const r=spawnSync('bash',['deploy/knowledge-hub/scripts/prepare-compose-env.sh',out],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const text=fs.readFileSync(out,'utf8');const password=text.match(/^POSTGRES_PASSWORD=([0-9a-f]+)$/m)?.[1];assert.ok(password&&password.length===64);assert.ok(!r.stdout.includes(password));
 if(process.platform!=='win32')assert.equal(fs.statSync(out).mode & 0o777,0o600);
 fs.rmSync(dir,{recursive:true,force:true});
});

test('local compose helper preserves data by default and requires explicit destructive flag',()=>{
 const stop=read('deploy/knowledge-hub/scripts/stop-local-compose.sh');assert.match(stop,/--destroy-data/);assert.match(stop,/down -v --remove-orphans/);assert.match(stop,/down --remove-orphans/);
 const start=read('deploy/knowledge-hub/scripts/start-local-compose.sh');assert.match(start,/127\.0\.0\.1:8787\/readyz/);assert.doesNotMatch(start,/--profile\s+public/);assert.match(start,/verify-postgres-tuning\.sh/);
});
