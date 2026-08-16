#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePublicTlsStagingEvidence } from './validate-knowledge-hub-public-tls-staging-evidence.mjs';
import { validateCertificateDecision, validateGatePrerequisiteArtifact, validatePilotDecision, validateProductionTlsEvidence } from './validate-knowledge-hub-remaining-deployment-gates.mjs';

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const parseBytes = (bytes, label) => {
  try { return JSON.parse(Buffer.from(bytes).toString('utf8')); }
  catch { throw new Error(`${label} must be UTF-8 JSON`); }
};
const artifactSha = (bytes, label) => {
  if (!bytes || Buffer.byteLength(bytes) < 1) throw new Error(`${label} artifact is empty`);
  return sha256(bytes);
};
const prerequisiteSha = (bytes, label, artifactType, subject, completedAt) => {
  const artifact = validateGatePrerequisiteArtifact(parseBytes(bytes, label), { artifactType, subject });
  if (Date.parse(completedAt) < Date.parse(artifact.completed_at)) throw new Error(`${label} is newer than the decision`);
  return sha256(bytes);
};

export function buildCertificateDecision({ stagingEvidenceBytes, targetHost, runbookBytes, rollbackPlanBytes, budgetRecordBytes, completedAt }) {
  validatePublicTlsStagingEvidence(parseBytes(stagingEvidenceBytes, 'staging Evidence'));
  artifactSha(runbookBytes, 'runbook');
  prerequisiteSha(rollbackPlanBytes, 'rollback plan', 'PRODUCTION_ROLLBACK_PLAN', targetHost, completedAt);
  prerequisiteSha(budgetRecordBytes, 'budget record', 'PRODUCTION_BUDGET_BOUND', targetHost, completedAt);
  throw new Error('authentic Owner certificate authority and current prerequisite registry verification required');
}

export function buildPilotDecision({ productionTlsEvidenceBytes, productId, scopes, limits, privacyReviewBytes, deletionPlanBytes, credentialRevocationPlanBytes, productRollbackBytes, completedAt }) {
  validateProductionTlsEvidence(parseBytes(productionTlsEvidenceBytes, 'production TLS Evidence'));
  prerequisiteSha(privacyReviewBytes, 'privacy review', 'PILOT_PRIVACY_REVIEW', productId, completedAt);
  prerequisiteSha(deletionPlanBytes, 'deletion plan', 'PILOT_DELETION_PLAN', productId, completedAt);
  prerequisiteSha(credentialRevocationPlanBytes, 'credential revocation plan', 'PILOT_CREDENTIAL_REVOCATION_PLAN', productId, completedAt);
  prerequisiteSha(productRollbackBytes, 'product rollback', 'PILOT_PRODUCT_ROLLBACK', productId, completedAt);
  throw new Error('authentic Production TLS, Owner pilot authority and current prerequisite registry verification required');
}

function publishNewJson(file, value) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(file, bytes, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [kind, input, output, ...args] = process.argv.slice(2);
  try {
    if (kind === 'certificate') {
      const [targetHost, runbook, rollbackPlan, budgetRecord, completedAt] = args;
      publishNewJson(output, buildCertificateDecision({ stagingEvidenceBytes: fs.readFileSync(input), targetHost, runbookBytes: fs.readFileSync(runbook), rollbackPlanBytes: fs.readFileSync(rollbackPlan), budgetRecordBytes: fs.readFileSync(budgetRecord), completedAt }));
    } else if (kind === 'pilot') {
      const [productId, scopesJson, installations, events, days, privacyReview, deletionPlan, revocationPlan, productRollback, completedAt] = args;
      publishNewJson(output, buildPilotDecision({
        productionTlsEvidenceBytes: fs.readFileSync(input), productId, scopes: JSON.parse(scopesJson),
        limits: { max_installations: Number(installations), max_events: Number(events), max_days: Number(days) },
        privacyReviewBytes: fs.readFileSync(privacyReview), deletionPlanBytes: fs.readFileSync(deletionPlan), credentialRevocationPlanBytes: fs.readFileSync(revocationPlan), productRollbackBytes: fs.readFileSync(productRollback), completedAt
      }));
    } else {
      throw new Error('kind must be certificate or pilot');
    }
    console.log(JSON.stringify({ status: 'PASS', kind, output_created: true }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', kind, reason: error.message }, null, 2));
    process.exit(1);
  }
}
