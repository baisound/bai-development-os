#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRuntimeLockCandidate } from './check-knowledge-hub-runtime-lock-candidate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const failures=[];
function must(rel,pattern,label){const text=read(rel);if(!pattern.test(text))failures.push(`${rel}: ${label}`);}
function mustNot(rel,pattern,label){const text=read(rel);if(pattern.test(text))failures.push(`${rel}: ${label}`);}
for(const rel of [
 'deploy/knowledge-hub/compose.yaml','deploy/knowledge-hub/compose.private.yaml','deploy/knowledge-hub/compose.rehearsal.yaml','deploy/knowledge-hub/Caddyfile',
 'deploy/knowledge-hub/Dockerfile','deploy/knowledge-hub/runtime/package.json','deploy/knowledge-hub/runtime/package-lock.json','deploy/knowledge-hub/.env.example','deploy/knowledge-hub/postgres/001_initial.sql',
 'deploy/knowledge-hub/postgres/002_auth_and_operations.sql','deploy/knowledge-hub/postgres/postgresql.tuned-2gb.conf','deploy/knowledge-hub/postgres/postgresql.tuned-4gb.conf','deploy/knowledge-hub/postgres/postgresql.tuned-8gb.conf','deploy/knowledge-hub/postgres/verify-tuning.sql','deploy/knowledge-hub/scripts/prepare-compose-env.sh','deploy/knowledge-hub/scripts/verify-postgres-tuning.sh','deploy/knowledge-hub/scripts/start-local-compose.sh','deploy/knowledge-hub/scripts/stop-local-compose.sh','deploy/knowledge-hub/scripts/backup-postgres.sh',
 'deploy/knowledge-hub/scripts/restore-rehearsal.sh','deploy/knowledge-hub/scripts/run-live-rehearsal.sh','deploy/knowledge-hub/scripts/ensure-runtime-db-credentials.sh','deploy/knowledge-hub/scripts/verify-runtime-db-role.sh','deploy/knowledge-hub/runtime/server.mjs','deploy/knowledge-hub/runtime/migrate.mjs','deploy/knowledge-hub/runtime/rehearsal-client.mjs','deploy/knowledge-hub/runtime/postgres-config.mjs','scripts/validate-knowledge-hub-live-rehearsal-evidence.mjs','.github/workflows/knowledge-hub-live-gate.yml','scripts/build-knowledge-hub-ci-live-gate-evidence.mjs','scripts/validate-knowledge-hub-ci-live-gate-evidence.mjs','scripts/check-knowledge-hub-runtime-lock-candidate.mjs'
]) if(!fs.existsSync(path.join(root,rel))) failures.push(`${rel}: missing`);
must('deploy/knowledge-hub/compose.yaml',/postgres:16\.14-alpine/,'PostgreSQL major image missing');
must('deploy/knowledge-hub/compose.yaml',/profiles:\s*\["public"\]/,'public TLS activation must be explicit profile');
must('deploy/knowledge-hub/compose.yaml',/image: caddy:2\.11\.4-alpine/,'Caddy public gateway image must be pinned to the reviewed 2.11.4 Alpine release');
must('deploy/knowledge-hub/compose.yaml',/BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY: \${BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY:-https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory}/,'public gateway must default to Let\'s Encrypt staging until production is explicitly selected');
must('deploy/knowledge-hub/compose.yaml',/ports:[\s\S]*"80:80\/tcp"[\s\S]*"443:443\/tcp"/,'public gateway must publish only explicit TCP HTTP/HTTPS ports');
mustNot('deploy/knowledge-hub/compose.yaml',/443:443\/udp|2019:2019|"443:443"/,'public gateway must not publish QUIC/UDP, Caddy admin, or an ambiguous HTTPS transport');
must('deploy/knowledge-hub/compose.private.yaml',/ports:[\s\S]*127\.0\.0\.1:8787:8787/,'private API must publish only the loopback 8787 binding');
mustNot('deploy/knowledge-hub/compose.private.yaml',/0\.0\.0\.0:8787|\[::\]:8787/,'private API must never publish 8787 on a public wildcard');
mustNot('deploy/knowledge-hub/compose.rehearsal.yaml',/ports:/,'rehearsal API must not publish a host port');
must('deploy/knowledge-hub/compose.rehearsal.yaml',/expose:[\s\S]*8787/,'rehearsal API internal port declaration missing');
must('deploy/knowledge-hub/scripts/start-local-compose.sh',/compose\.private\.yaml/,'private startup must use the private loopback override');
mustNot('deploy/knowledge-hub/scripts/start-local-compose.sh',/compose\.rehearsal\.yaml/,'private startup must not use the rehearsal override');
must('deploy/knowledge-hub/scripts/stop-local-compose.sh',/compose\.private\.yaml/,'private shutdown must use the private loopback override');
mustNot('deploy/knowledge-hub/scripts/stop-local-compose.sh',/compose\.rehearsal\.yaml/,'private shutdown must not use the rehearsal override');
must('deploy/knowledge-hub/scripts/verify-runtime-db-role.sh',/compose\.private\.yaml/,'runtime DB role verification must target the private deployment');
mustNot('deploy/knowledge-hub/scripts/verify-runtime-db-role.sh',/compose\.rehearsal\.yaml/,'runtime DB role verification must not target the rehearsal override');
must('deploy/knowledge-hub/scripts/run-live-rehearsal.sh',/compose\.rehearsal\.yaml/,'live rehearsal must keep the isolated rehearsal override');
mustNot('deploy/knowledge-hub/scripts/run-live-rehearsal.sh',/compose\.private\.yaml/,'live rehearsal must not claim the private host loopback port');
must('deploy/knowledge-hub/compose.yaml',/PGHOST: postgres[\s\S]*PGPASSWORD:/,'split PostgreSQL secret fields missing');
must('deploy/knowledge-hub/compose.yaml',/knowledge-migrate:[\s\S]*PGUSER: "\$\{POSTGRES_USER\}"[\s\S]*BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER/,'migration service must use bootstrap DB identity and receive runtime role contract');
must('deploy/knowledge-hub/compose.yaml',/knowledge-api:[\s\S]*PGUSER: "\$\{BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER:\?set runtime DB user\}"[\s\S]*PGPASSWORD: "\$\{BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD:\?set runtime DB password\}"/,'Knowledge API must use dedicated runtime DB credentials');
must('deploy/knowledge-hub/compose.yaml',/knowledge-api:[\s\S]*depends_on:[\s\S]*knowledge-migrate:[\s\S]*service_completed_successfully/,'Knowledge API must wait for successful migration service completion');
must('deploy/knowledge-hub/compose.yaml',/knowledge-admin:[\s\S]*profiles: \["admin"\]/,'admin DB identity must be isolated behind explicit admin profile');
mustNot('deploy/knowledge-hub/runtime/server.mjs',/applyPostgresMigrations|schema_migrations/,'runtime API must not perform schema migration');
must('deploy/knowledge-hub/runtime/migrate.mjs',/NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS/,'runtime DB role least-privilege attributes missing');
must('deploy/knowledge-hub/runtime/migrate.mjs',/REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM bai_hub_runtime/,'runtime table privileges must be reset before grants');
must('deploy/knowledge-hub/runtime/migrate.mjs',/GRANT SELECT ON TABLE api_credentials TO bai_hub_runtime/,'runtime API credential access must remain read-only');
mustNot('deploy/knowledge-hub/runtime/migrate.mjs',/GRANT[^\n]*ALL PRIVILEGES[^\n]*bai_hub_runtime/i,'runtime DB role must never receive ALL PRIVILEGES');
must('deploy/knowledge-hub/scripts/prepare-compose-env.sh',/BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER=bai_hub_runtime[\s\S]*BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD=\$runtime_password/,'new environments must contain separate runtime DB credentials');
must('deploy/knowledge-hub/scripts/ensure-runtime-db-credentials.sh',/without changing existing PostgreSQL credentials/,'existing environment credential migration contract missing');
must('deploy/knowledge-hub/compose.yaml',/POSTGRES_HOST_AUTH_METHOD: "scram-sha-256"/,'SCRAM host authentication missing');
must('deploy/knowledge-hub/compose.yaml',/POSTGRES_INITDB_ARGS: "--data-checksums"/,'data checksum init missing');
must('deploy/knowledge-hub/compose.yaml',/POSTGRES_CONFIG_FILE:\?set POSTGRES_CONFIG_FILE/,'explicit PostgreSQL config profile contract missing');
must('deploy/knowledge-hub/compose.yaml',/POSTGRES_SHM_SIZE:\?set POSTGRES_SHM_SIZE/,'explicit PostgreSQL shm profile contract missing');
mustNot('deploy/knowledge-hub/compose.yaml',/POSTGRES_CONFIG_FILE:-|POSTGRES_SHM_SIZE:-/,'host-memory profile must not silently fall back');
mustNot('deploy/knowledge-hub/compose.yaml',/DATABASE_URL:/,'Compose must not interpolate DB password into a connection URL');
must('deploy/knowledge-hub/Caddyfile',/admin off/,'Caddy admin API must remain disabled');
must('deploy/knowledge-hub/Caddyfile',/default_sni \{\$HUB_DOMAIN\}/,'literal-IP TLS must define a default SNI certificate selector');
must('deploy/knowledge-hub/Caddyfile',/servers :443 \{[\s\S]*protocols h1 h2[\s\S]*\}/,'public HTTPS must disable HTTP\/3 while UDP 443 is not adopted');
mustNot('deploy/knowledge-hub/Caddyfile',/protocols[^\n]*h3/,'HTTP\/3 must remain disabled until UDP 443 is formally adopted');
must('deploy/knowledge-hub/Caddyfile',/issuer acme \{\$BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY\} \{[\s\S]*profile shortlived[\s\S]*\}/,'explicit ACME shortlived issuer contract missing');
must('deploy/knowledge-hub/Caddyfile',/reverse_proxy knowledge-api:8787/,'reverse proxy target missing');
must('deploy/knowledge-hub/Caddyfile',/Strict-Transport-Security/,'HSTS missing');
must('deploy/knowledge-hub/.env.example',/BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY=https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory/,'example env must remain fail-safe on Let\'s Encrypt staging');
must('deploy/knowledge-hub/scripts/prepare-compose-env.sh',/BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY=https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory/,'generated env must remain fail-safe on Let\'s Encrypt staging');
must('deploy/knowledge-hub/postgres/002_auth_and_operations.sql',/secret_hash/,'hashed credential storage missing');
mustNot('deploy/knowledge-hub/postgres/002_auth_and_operations.sql',/api_key\s+text|raw_secret|plaintext_secret/i,'raw credential column prohibited');
must('deploy/knowledge-hub/scripts/restore-rehearsal.sh',/Legacy restore rehearsal entrypoint is disabled/,'legacy restore entrypoint is not fail-closed');
must('deploy/knowledge-hub/scripts/run-live-rehearsal.sh',/down -v --remove-orphans/,'live rehearsal must self-clean volumes');
must('deploy/knowledge-hub/scripts/run-live-rehearsal.sh',/BAI_KNOWLEDGE_HUB_REHEARSAL_EVIDENCE_OUT/,'machine-readable rehearsal evidence output missing');
must('deploy/knowledge-hub/scripts/run-live-rehearsal.sh',/cleanup_complete/,'rehearsal evidence must bind successful cleanup');
mustNot('deploy/knowledge-hub/scripts/run-live-rehearsal.sh',/--profile\s+public/,'live rehearsal must never activate public profile');
mustNot('deploy/knowledge-hub/.env.example',/(bkh1\.|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9])/,'real-looking credential in example');
must('deploy/knowledge-hub/Dockerfile',/COPY deploy\/knowledge-hub\/runtime\/package\.json deploy\/knowledge-hub\/runtime\/package-lock\.json/,'canonical runtime package-lock copy missing');
must('deploy/knowledge-hub/Dockerfile',/npm ci --omit=dev --ignore-scripts --no-audit --no-fund/,'canonical npm ci deployment path missing');
mustNot('deploy/knowledge-hub/Dockerfile',/npm install/,'npm install fallback is prohibited after runtime lock canonicalization');
const runtimePackage=JSON.parse(read('deploy/knowledge-hub/runtime/package.json'));if(runtimePackage?.dependencies?.pg!=='8.13.1')failures.push('deploy/knowledge-hub/runtime/package.json: pg direct version must be exact 8.13.1 for this readiness baseline');
if(fs.existsSync(path.join(root,'deploy/knowledge-hub/runtime/package-lock.json'))){try{const runtimeLock=JSON.parse(read('deploy/knowledge-hub/runtime/package-lock.json'));const result=checkRuntimeLockCandidate(runtimeLock);if(result.status!=='PASS')failures.push(`deploy/knowledge-hub/runtime/package-lock.json: ${result.failures.join('; ')}`);}catch(error){failures.push(`deploy/knowledge-hub/runtime/package-lock.json: ${error.message}`);}}
if(failures.length){console.error(JSON.stringify({status:'FAIL',failures},null,2));process.exit(1);}console.log(JSON.stringify({status:'PASS',deployment_contract:'TASK-017 Phase 0 readiness',public_activation:'NOT_AUTHORIZED'},null,2));
