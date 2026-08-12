import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('deployment compose is single-VPS shaped and does not expose database or API by default',()=>{
 const compose=read('deploy/knowledge-hub/compose.yaml');assert.match(compose,/postgres:16\.14-alpine/);assert.match(compose,/knowledge-api:/);assert.match(compose,/caddy:/);assert.doesNotMatch(compose,/5432:5432/);assert.doesNotMatch(compose,/8787:8787/);assert.match(compose,/profiles: \["public"\]/);
 const privateCompose=read('deploy/knowledge-hub/compose.private.yaml');assert.match(privateCompose,/ports:/);assert.match(privateCompose,/127\.0\.0\.1:8787:8787/);assert.doesNotMatch(privateCompose,/0\.0\.0\.0:8787|\[::\]:8787/);
 const rehearsal=read('deploy/knowledge-hub/compose.rehearsal.yaml');assert.doesNotMatch(rehearsal,/ports:/);assert.match(rehearsal,/expose:/);assert.match(rehearsal,/\"8787\"/);
});

test('public TLS gateway is version-pinned, staging-first, TCP-only and short-lived-IP ready',()=>{
 const compose=read('deploy/knowledge-hub/compose.yaml');
 assert.match(compose,/image: caddy:2\.11\.4-alpine/);
 assert.match(compose,/BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY: \${BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY:-https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory}/);
 assert.match(compose,/"80:80\/tcp"/);assert.match(compose,/"443:443\/tcp"/);
 assert.doesNotMatch(compose,/443:443\/udp|2019:2019|"443:443"/);
 const caddy=read('deploy/knowledge-hub/Caddyfile');
 assert.match(caddy,/admin off/);assert.match(caddy,/default_sni \{\$HUB_DOMAIN\}/);
 assert.match(caddy,/servers :443 \{[\s\S]*protocols h1 h2[\s\S]*\}/);assert.doesNotMatch(caddy,/protocols[^\n]*h3/);
 assert.match(caddy,/issuer acme \{\$BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY\} \{[\s\S]*profile shortlived[\s\S]*\}/);
 assert.match(caddy,/reverse_proxy knowledge-api:8787/);
 assert.match(read('deploy/knowledge-hub/.env.example'),/BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY=https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory/);
 assert.match(read('deploy/knowledge-hub/scripts/prepare-compose-env.sh'),/BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY=https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory/);
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



test('deployment runtime dependency lock is canonical and Docker build is fail-closed',()=>{
 const docker=read('deploy/knowledge-hub/Dockerfile');
 assert.match(docker,/COPY deploy\/knowledge-hub\/runtime\/package\.json deploy\/knowledge-hub\/runtime\/package-lock\.json/);
 assert.match(docker,/npm ci --omit=dev --ignore-scripts --no-audit --no-fund/);
 assert.doesNotMatch(docker,/npm install/);
 const lockPath=path.join(root,'deploy/knowledge-hub/runtime/package-lock.json');assert.equal(fs.existsSync(lockPath),true);
 const checked=spawnSync(process.execPath,['scripts/check-knowledge-hub-runtime-lock-candidate.mjs','deploy/knowledge-hub/runtime/package-lock.json'],{cwd:root,encoding:'utf8'});
 assert.equal(checked.status,0,checked.stderr);assert.match(checked.stdout,/"status": "PASS"/);assert.match(checked.stdout,/"pg_version": "8.13.1"/);
});

test('deployment PostgreSQL configuration supports split secret fields and exact direct driver version',async()=>{
 const compose=read('deploy/knowledge-hub/compose.yaml');assert.doesNotMatch(compose,/DATABASE_URL:/);assert.match(compose,/PGHOST: postgres/);assert.match(compose,/PGPASSWORD: "\$\{POSTGRES_PASSWORD\}"/);
 const runtime=JSON.parse(read('deploy/knowledge-hub/runtime/package.json'));assert.equal(runtime.dependencies.pg,'8.13.1');
 const {postgresPoolConfig}=await import('../../deploy/knowledge-hub/runtime/postgres-config.mjs');
 const split=postgresPoolConfig({PGHOST:'postgres',PGPORT:'5432',PGDATABASE:'db',PGUSER:'user',PGPASSWORD:'p@ss:# with spaces'},{max:3,applicationName:'test'});
 assert.equal(split.password,'p@ss:# with spaces');assert.equal(split.host,'postgres');assert.equal(split.port,5432);assert.equal(split.max,3);
 const url=postgresPoolConfig({DATABASE_URL:'postgresql://example.invalid/db'},{max:1});assert.equal(url.connectionString,'postgresql://example.invalid/db');
 assert.throws(()=>postgresPoolConfig({PGHOST:'postgres',PGDATABASE:'db',PGUSER:'user'}),/PGPASSWORD is required/);
});
