#!/usr/bin/env node
import fs from 'node:fs';
import { checkRuntimeLockCandidate } from './check-knowledge-hub-runtime-lock-candidate.mjs';
const failures=[];
const read=p=>fs.readFileSync(p,'utf8');
const workflow='.github/workflows/knowledge-hub-live-gate.yml';
for (const p of [workflow,'scripts/build-knowledge-hub-ci-live-gate-evidence.mjs','scripts/validate-knowledge-hub-ci-live-gate-evidence.mjs','schemas/knowledge-evolution/knowledge-hub-ci-live-gate-evidence.schema.json','scripts/check-knowledge-hub-runtime-lock-candidate.mjs','deploy/knowledge-hub/runtime/package-lock.json']) if(!fs.existsSync(p)) failures.push(`${p}: missing`);
if(fs.existsSync(workflow)){
  const w=read(workflow);
  const must=(re,label)=>{if(!re.test(w)) failures.push(`${workflow}: ${label}`);};
  const mustNot=(re,label)=>{if(re.test(w)) failures.push(`${workflow}: ${label}`);};
  must(/permissions:\s*\n\s*contents: read/,'contents read-only permission missing');
  must(/actions\/checkout@v6/,'checkout@v6 missing');
  must(/actions\/setup-node@v4/,'setup-node@v4 missing');
  must(/actions\/upload-artifact@v4/,'upload-artifact@v4 missing');
  must(/docker compose version/,'Docker Compose capability probe missing');
  must(/Validate public Caddy configuration without activation/,'real Caddy configuration validation step missing');
  must(/HUB_DOMAIN: 203\.0\.113\.10/,'Caddy validation must use a non-production documentation IP');
  must(/BAI_KNOWLEDGE_HUB_ACME_CA_DIRECTORY: https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory/,'Caddy validation must use Let\'s Encrypt staging');
  must(/caddy:2\.11\.4-alpine[\s\\]*\n\s*caddy validate --config \/etc\/caddy\/Caddyfile --adapter caddyfile/,'pinned Caddy 2.11.4 validation command missing');
  const caddyValidationStep=w.match(/- name: Validate public Caddy configuration without activation([\s\S]*?)(?=\n\s*- name:)/)?.[1] ?? '';
  if(!caddyValidationStep) failures.push(`${workflow}: Caddy validation step body missing`);
  else if(/--publish|(^|\s)-p(\s|$)/m.test(caddyValidationStep)) failures.push(`${workflow}: Caddy validation must not publish host ports`);
  must(/run-live-rehearsal\.sh/,'live rehearsal harness not invoked');
  must(/npm run check:knowledge-hub-public-tls-staging/,'public TLS staging static gate missing');
  must(/Validate canonical deployment runtime lock/,'canonical runtime lock validation step missing');
  mustNot(/package-lock-only/,'CI must not regenerate the canonical runtime lock');
  must(/check-knowledge-hub-runtime-lock-candidate\.mjs/,'runtime lock supply-chain policy missing');
  must(/github\.event\.pull_request\.head\.repo\.full_name == github\.repository/,'fork PR live-execution guard missing');
  must(/workflow_dispatch/,'manual trusted execution path missing');
  mustNot(/pull_request_target/,'pull_request_target is prohibited for this untrusted-code gate');
  mustNot(/--profile\s+public/,'CI live gate must never activate public profile');
}
const docker=read('deploy/knowledge-hub/Dockerfile');
if(!/COPY deploy\/knowledge-hub\/runtime\/package\.json deploy\/knowledge-hub\/runtime\/package-lock\.json/.test(docker)) failures.push('Dockerfile: canonical package-lock is not copied explicitly');
if(!/npm ci --omit=dev --ignore-scripts --no-audit --no-fund/.test(docker)) failures.push('Dockerfile: canonical npm ci locked path missing');
if(/npm install/.test(docker)) failures.push('Dockerfile: npm install fallback is prohibited after runtime lock canonicalization');
if(fs.existsSync('deploy/knowledge-hub/runtime/package-lock.json')){try{const result=checkRuntimeLockCandidate(JSON.parse(read('deploy/knowledge-hub/runtime/package-lock.json')));if(result.status!=='PASS') failures.push(`deploy/knowledge-hub/runtime/package-lock.json: ${result.failures.join('; ')}`);}catch(error){failures.push(`deploy/knowledge-hub/runtime/package-lock.json: ${error.message}`);}}
if(failures.length){console.error(JSON.stringify({status:'FAIL',failures},null,2));process.exit(1);}console.log(JSON.stringify({status:'PASS',gate:'TASK-017 GitHub Actions live gate',public_activation:'NOT_AUTHORIZED'},null,2));
