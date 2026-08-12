#!/usr/bin/env node
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const script = read('deploy/knowledge-hub/scripts/run-public-tls-staging-rehearsal.sh');
const schema = JSON.parse(read('schemas/knowledge-evolution/knowledge-hub-public-tls-staging-evidence.schema.json'));
const failures = [];
const must = (pattern, message) => { if (!pattern.test(script)) failures.push(message); };
const mustNot = (pattern, message) => { if (pattern.test(script)) failures.push(message); };

must(/STAGING_PUBLIC_TLS_REHEARSAL/, 'explicit staging acknowledgement is required');
must(/https:\/\/acme-staging-v02\.api\.letsencrypt\.org\/directory/, 'exact staging ACME directory is required');
must(/public_profile_deactivated_after_rehearsal/, 'post-rehearsal public-profile deactivation evidence is required');
must(/--profile public stop caddy/, 'Caddy must be stopped after rehearsal');
must(/sport = :8787 or sport = :5432 or sport = :2019/, 'private-port listener audit is required');
must(/sport = :443[\s\S]*UDP 443/, 'UDP 443 rejection is required');
must(/validate-knowledge-hub-public-tls-staging-evidence\.mjs/, 'machine Evidence validation is required before publication');
mustNot(/acme-v02\.api\.letsencrypt\.org\/directory/, 'production ACME directory must not appear in the staging harness');
mustNot(/ufw\s+(allow|delete|enable|disable|reset)/, 'staging harness must not mutate the firewall');
mustNot(/docker compose[^\n]*down\s+-v/, 'staging harness must not destroy persistent data');

if (schema.additionalProperties !== false || schema.properties?.activation?.properties?.production_acme_used?.const !== false) {
  failures.push('Evidence schema must be closed and production-ACME negative');
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'PASS', gate: 'TASK-017 Public TLS Staging Gate', public_activation: 'STAGING_ONLY_EXPLICIT_ACK', production_activation: 'NOT_AUTHORIZED' }, null, 2));
