#!/usr/bin/env node
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STAGING_CA = 'https://acme-staging-v02.api.letsencrypt.org/directory';
const TOP_LEVEL = ['schema_version', 'result', 'target', 'certificate', 'routing', 'exposure', 'activation', 'completed_at'];

function exactKeys(value, allowed, label) {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new Error(`${label} unexpected fields: ${unexpected.join(', ')}`);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} object required`);
  return value;
}

export function validatePublicTlsStagingEvidence(value) {
  object(value, 'evidence');
  exactKeys(value, TOP_LEVEL, 'evidence');
  if (value.schema_version !== '1.0') throw new Error('schema_version invalid');
  if (value.result !== 'PUBLIC_TLS_STAGING_REHEARSAL_PASS') throw new Error('result invalid');

  const target = object(value.target, 'target');
  exactKeys(target, ['host', 'acme_ca_directory'], 'target');
  if (typeof target.host !== 'string' || target.host.length < 3 || target.host.length > 253 || !/^[A-Za-z0-9.:-]+$/.test(target.host)) throw new Error('target host invalid');
  if (target.acme_ca_directory !== STAGING_CA) throw new Error('only Let\'s Encrypt staging is accepted');

  const certificate = object(value.certificate, 'certificate');
  exactKeys(certificate, ['sha256', 'san_verified', 'issuer_staging_verified', 'not_before', 'not_after'], 'certificate');
  if (!/^[a-f0-9]{64}$/.test(certificate.sha256)) throw new Error('certificate sha256 invalid');
  if (certificate.san_verified !== true) throw new Error('certificate SAN not verified');
  if (certificate.issuer_staging_verified !== true) throw new Error('certificate staging issuer not verified');
  const notBefore = Date.parse(certificate.not_before);
  const notAfter = Date.parse(certificate.not_after);
  if (!Number.isFinite(notBefore) || !Number.isFinite(notAfter) || notAfter <= notBefore) throw new Error('certificate validity invalid');

  const routing = object(value.routing, 'routing');
  exactKeys(routing, ['https_ready', 'http_redirect_to_https'], 'routing');
  if (routing.https_ready !== true || routing.http_redirect_to_https !== true) throw new Error('routing evidence incomplete');

  const exposure = object(value.exposure, 'exposure');
  exactKeys(exposure, ['tcp_80', 'tcp_443', 'udp_443', 'api_8787_public', 'postgres_5432_public', 'caddy_admin_2019_public'], 'exposure');
  if (exposure.tcp_80 !== true || exposure.tcp_443 !== true || exposure.udp_443 !== false) throw new Error('public transport exposure invalid');
  if (exposure.api_8787_public !== false || exposure.postgres_5432_public !== false || exposure.caddy_admin_2019_public !== false) throw new Error('private service exposure detected');

  const activation = object(value.activation, 'activation');
  exactKeys(activation, ['explicit_acknowledgement', 'production_acme_used', 'public_profile_deactivated_after_rehearsal'], 'activation');
  if (activation.explicit_acknowledgement !== true) throw new Error('explicit acknowledgement missing');
  if (activation.production_acme_used !== false) throw new Error('production ACME is prohibited');
  if (activation.public_profile_deactivated_after_rehearsal !== true) throw new Error('public profile teardown missing');
  if (!Number.isFinite(Date.parse(value.completed_at))) throw new Error('completed_at invalid');

  return Object.freeze({ ...value, target: Object.freeze({ ...target }) });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node scripts/validate-knowledge-hub-public-tls-staging-evidence.mjs <evidence.json>'); process.exit(2); }
  try {
    const value = validatePublicTlsStagingEvidence(JSON.parse(fs.readFileSync(file, 'utf8')));
    console.log(JSON.stringify({ status: 'PASS', result: value.result, host: net.isIP(value.target.host) ? '[ip-address]' : value.target.host }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', reason: error.message }, null, 2));
    process.exit(1);
  }
}
