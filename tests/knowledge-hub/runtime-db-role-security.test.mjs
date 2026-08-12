import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const toBashPath=input=>process.platform==='win32'
  ? input.replace(/^([A-Za-z]):[\\/]/,(_,drive)=>`/${drive.toLowerCase()}/`).replaceAll('\\','/')
  : input;

test('Knowledge API uses a dedicated runtime DB role after an admin migration gate',()=>{
  const compose=read('deploy/knowledge-hub/compose.yaml');
  assert.match(compose,/knowledge-migrate:/);
  assert.match(compose,/knowledge-migrate:[\s\S]*PGUSER: "\$\{POSTGRES_USER\}"/);
  assert.match(compose,/knowledge-api:[\s\S]*PGUSER: "\$\{BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER:\?set runtime DB user\}"/);
  assert.match(compose,/knowledge-api:[\s\S]*PGPASSWORD: "\$\{BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD:\?set runtime DB password\}"/);
  assert.match(compose,/knowledge-api:[\s\S]*knowledge-migrate:[\s\S]*condition: service_completed_successfully/);
  assert.match(compose,/knowledge-admin:[\s\S]*profiles: \["admin"\]/);
});

test('runtime server performs no schema migration and migration runner enforces least privilege',()=>{
  const server=read('deploy/knowledge-hub/runtime/server.mjs');
  assert.doesNotMatch(server,/applyPostgresMigrations|schema_migrations/);
  const migrate=read('deploy/knowledge-hub/runtime/migrate.mjs');
  assert.match(migrate,/CREATE ROLE bai_hub_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS/);
  assert.match(migrate,/ALTER ROLE bai_hub_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS/);
  assert.match(migrate,/SELECT format\(\$1::text, \$2::text\) AS sql/);
  assert.doesNotMatch(migrate,/SELECT format\(\$1, \$2\) AS sql/);
  assert.match(migrate,/REVOKE CREATE ON SCHEMA public FROM PUBLIC/);
  assert.match(migrate,/REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM bai_hub_runtime/);
  assert.match(migrate,/GRANT SELECT, INSERT, DELETE ON TABLE evidence_events TO bai_hub_runtime/);
  assert.match(migrate,/GRANT INSERT ON TABLE delivery_receipts TO bai_hub_runtime/);
  assert.match(migrate,/GRANT SELECT ON TABLE client_policies TO bai_hub_runtime/);
  assert.doesNotMatch(migrate,/GRANT[^\n]*(INSERT|UPDATE|DELETE)[^\n]*client_policies[^\n]*bai_hub_runtime/i);
  assert.match(migrate,/GRANT SELECT ON TABLE api_credentials TO bai_hub_runtime/);
  assert.doesNotMatch(migrate,/GRANT[^\n]*ALL PRIVILEGES[^\n]*bai_hub_runtime/i);
  assert.match(migrate,/Runtime DB role must not inherit membership privileges/);
  assert.match(migrate,/public\.schema_migrations/);
});

test('runtime credential bootstrap augments an existing env atomically without changing admin credentials',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bai-hub-runtime-env-'));
  const envFile=path.join(dir,'knowledge-hub.env');
  const original='POSTGRES_DB=bai_knowledge_hub\nPOSTGRES_USER=bai_hub\nPOSTGRES_PASSWORD=keep-this-admin-secret\nPOSTGRES_CONFIG_FILE=./postgres/postgresql.tuned-8gb.conf\nPOSTGRES_SHM_SIZE=1gb\n';
  fs.writeFileSync(envFile,original,{mode:0o600});
  const script=path.join(root,'deploy/knowledge-hub/scripts/ensure-runtime-db-credentials.sh');
  const first=spawnSync('bash',[toBashPath(script),toBashPath(envFile)],{cwd:root,encoding:'utf8'});
  assert.equal(first.status,0,first.stderr);
  const after=fs.readFileSync(envFile,'utf8');
  assert.ok(after.startsWith(original));
  assert.match(after,/^BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime$/m);
  const password=after.match(/^BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=([0-9a-f]+)$/m)?.[1];
  assert.ok(password && password.length===64);
  assert.ok(!first.stdout.includes(password));
  assert.match(first.stdout,/without changing existing PostgreSQL credentials/);
  if(process.platform!=='win32') assert.equal(fs.statSync(envFile).mode & 0o777,0o600);
  const second=spawnSync('bash',[toBashPath(script),toBashPath(envFile)],{cwd:root,encoding:'utf8'});
  assert.equal(second.status,0,second.stderr);
  assert.equal(fs.readFileSync(envFile,'utf8'),after);
  assert.match(second.stdout,/already present/);
  fs.rmSync(dir,{recursive:true,force:true});
});

test('runtime credential bootstrap fails closed on partial or non-canonical existing state',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bai-hub-runtime-env-invalid-'));
  const script=path.join(root,'deploy/knowledge-hub/scripts/ensure-runtime-db-credentials.sh');
  const partial=path.join(dir,'partial.env');
  fs.writeFileSync(partial,'POSTGRES_PASSWORD=admin\nBAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime\n',{mode:0o600});
  const p=spawnSync('bash',[toBashPath(script),toBashPath(partial)],{cwd:root,encoding:'utf8'});
  assert.equal(p.status,2);assert.match(p.stderr,/password is missing/);
  const wrong=path.join(dir,'wrong.env');
  fs.writeFileSync(wrong,'POSTGRES_PASSWORD=admin\nBAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=wrong\nBAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=01234567890123456789012345678901\n',{mode:0o600});
  const w=spawnSync('bash',[toBashPath(script),toBashPath(wrong)],{cwd:root,encoding:'utf8'});
  assert.equal(w.status,2);assert.match(w.stderr,/non-canonical/);
  fs.rmSync(dir,{recursive:true,force:true});
});

test('runtime DB role verifier targets the private loopback deployment contract',()=>{
  const verifier=read('deploy/knowledge-hub/scripts/verify-runtime-db-role.sh');
  assert.match(verifier,/compose\.private\.yaml/);
  assert.doesNotMatch(verifier,/compose\.rehearsal\.yaml/);
});

test('runtime DB security scripts parse and machine readiness checker passes',()=>{
  for(const rel of ['deploy/knowledge-hub/scripts/ensure-runtime-db-credentials.sh','deploy/knowledge-hub/scripts/verify-runtime-db-role.sh']){
    const r=spawnSync('bash',['-n',rel],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,`${rel}: ${r.stderr}`);
  }
  const parsed=spawnSync(process.execPath,['--check','deploy/knowledge-hub/runtime/migrate.mjs'],{cwd:root,encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
  const checker=spawnSync(process.execPath,['scripts/check-knowledge-hub-deployment-readiness.mjs'],{cwd:root,encoding:'utf8'});assert.equal(checker.status,0,checker.stderr);
});
