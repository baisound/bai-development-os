import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validatePublicTlsStagingEvidence } from '../../scripts/validate-knowledge-hub-public-tls-staging-evidence.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const validEvidence = () => ({
  schema_version: '1.0',
  result: 'PUBLIC_TLS_STAGING_REHEARSAL_PASS',
  target: { host: '203.0.113.10', acme_ca_directory: 'https://acme-staging-v02.api.letsencrypt.org/directory' },
  certificate: { sha256: 'a'.repeat(64), san_verified: true, issuer_staging_verified: true, not_before: '2026-08-12T00:00:00Z', not_after: '2026-08-18T00:00:00Z' },
  routing: { https_ready: true, http_redirect_to_https: true },
  exposure: { tcp_80: true, tcp_443: true, udp_443: false, api_8787_public: false, postgres_5432_public: false, caddy_admin_2019_public: false },
  activation: { explicit_acknowledgement: true, production_acme_used: false, public_profile_deactivated_after_rehearsal: true },
  completed_at: '2026-08-12T01:00:00Z'
});

test('public TLS staging Evidence accepts the complete fail-closed result', () => {
  assert.equal(validatePublicTlsStagingEvidence(validEvidence()).result, 'PUBLIC_TLS_STAGING_REHEARSAL_PASS');
});

test('public TLS staging Evidence rejects production ACME and public private-service exposure', () => {
  const production = validEvidence();
  production.target.acme_ca_directory = 'https://acme-v02.api.letsencrypt.org/directory';
  assert.throws(() => validatePublicTlsStagingEvidence(production), /staging/);
  const exposed = validEvidence();
  exposed.exposure.postgres_5432_public = true;
  assert.throws(() => validatePublicTlsStagingEvidence(exposed), /exposure/);
});

test('public TLS staging Evidence rejects incomplete teardown, unknown fields and unsafe host text', () => {
  const active = validEvidence();
  active.activation.public_profile_deactivated_after_rehearsal = false;
  assert.throws(() => validatePublicTlsStagingEvidence(active), /teardown/);
  assert.throws(() => validatePublicTlsStagingEvidence({ ...validEvidence(), api_key: 'secret' }), /unexpected/);
  const injected = validEvidence();
  injected.target.host = 'host\"bad';
  assert.throws(() => validatePublicTlsStagingEvidence(injected), /host/);
});

test('staging harness is acknowledgement-gated, staging-only, non-destructive and self-deactivating', () => {
  const script = read('deploy/knowledge-hub/scripts/run-public-tls-staging-rehearsal.sh');
  assert.match(script, /STAGING_PUBLIC_TLS_REHEARSAL/);
  assert.match(script, /acme-staging-v02\.api\.letsencrypt\.org/);
  assert.doesNotMatch(script, /https:\/\/acme-v02\.api\.letsencrypt\.org/);
  assert.doesNotMatch(script, /ufw\s+(allow|delete|enable|disable|reset)/);
  assert.doesNotMatch(script, /down\s+-v/);
  assert.match(script, /--profile public stop caddy/);
  assert.match(script, /Evidence output already exists/);
});

test('public TLS staging Evidence JSON schema is closed and staging-only', () => {
  const schema = JSON.parse(read('schemas/knowledge-evolution/knowledge-hub-public-tls-staging-evidence.schema.json'));
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.target.properties.acme_ca_directory.const, 'https://acme-staging-v02.api.letsencrypt.org/directory');
  assert.equal(schema.properties.activation.properties.production_acme_used.const, false);
  assert.equal(schema.properties.activation.properties.public_profile_deactivated_after_rehearsal.const, true);
});
