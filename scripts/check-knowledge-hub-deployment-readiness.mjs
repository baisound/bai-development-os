#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const failures=[];
function must(rel,pattern,label){const text=read(rel);if(!pattern.test(text))failures.push(`${rel}: ${label}`);}
function mustNot(rel,pattern,label){const text=read(rel);if(pattern.test(text))failures.push(`${rel}: ${label}`);}
for(const rel of [
 'deploy/knowledge-hub/compose.yaml','deploy/knowledge-hub/compose.rehearsal.yaml','deploy/knowledge-hub/Caddyfile',
 'deploy/knowledge-hub/Dockerfile','deploy/knowledge-hub/.env.example','deploy/knowledge-hub/postgres/001_initial.sql',
 'deploy/knowledge-hub/postgres/002_auth_and_operations.sql','deploy/knowledge-hub/scripts/backup-postgres.sh',
 'deploy/knowledge-hub/scripts/restore-rehearsal.sh','deploy/knowledge-hub/runtime/server.mjs'
]) if(!fs.existsSync(path.join(root,rel))) failures.push(`${rel}: missing`);
must('deploy/knowledge-hub/compose.yaml',/postgres:16-alpine/,'PostgreSQL major image missing');
must('deploy/knowledge-hub/compose.yaml',/profiles:\s*\["public"\]/,'public TLS activation must be explicit profile');
must('deploy/knowledge-hub/compose.rehearsal.yaml',/127\.0\.0\.1:8787:8787/,'rehearsal API must bind loopback only');
must('deploy/knowledge-hub/Caddyfile',/reverse_proxy knowledge-api:8787/,'reverse proxy target missing');
must('deploy/knowledge-hub/Caddyfile',/Strict-Transport-Security/,'HSTS missing');
must('deploy/knowledge-hub/postgres/002_auth_and_operations.sql',/secret_hash/,'hashed credential storage missing');
mustNot('deploy/knowledge-hub/postgres/002_auth_and_operations.sql',/api_key\s+text|raw_secret|plaintext_secret/i,'raw credential column prohibited');
must('deploy/knowledge-hub/scripts/restore-rehearsal.sh',/_restore_rehearsal/,'restore target safety suffix missing');
mustNot('deploy/knowledge-hub/.env.example',/(bkh1\.|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9])/,'real-looking credential in example');
if(failures.length){console.error(JSON.stringify({status:'FAIL',failures},null,2));process.exit(1);}console.log(JSON.stringify({status:'PASS',deployment_contract:'TASK-017 Phase 0 readiness',public_activation:'NOT_AUTHORIZED'},null,2));
