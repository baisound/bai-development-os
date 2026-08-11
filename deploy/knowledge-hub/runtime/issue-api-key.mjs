#!/usr/bin/env node
import pg from 'pg';
import { postgresPoolConfig } from './postgres-config.mjs';
import { createApiKeyCredential, createPostgresApiKeyStore } from '../../../src/knowledge-hub/index.mjs';
const { Pool } = pg;
const productId = process.env.BAI_HUB_CREDENTIAL_PRODUCT_ID;
const subjectId = process.env.BAI_HUB_CREDENTIAL_SUBJECT_ID;
if (!productId || !subjectId) {
  console.error('BAI_HUB_CREDENTIAL_PRODUCT_ID and BAI_HUB_CREDENTIAL_SUBJECT_ID are required.'); process.exit(2);
}
const scopes = (process.env.BAI_HUB_CREDENTIAL_SCOPES ?? 'evidence:write,policy:read').split(',').map(v => v.trim()).filter(Boolean);
let config;
try { config = postgresPoolConfig(process.env, { max: 1, applicationName: 'bai-knowledge-hub-key-issuer' }); }
catch (error) { console.error(`PostgreSQL configuration invalid: ${error.message}`); process.exit(2); }
const pool = new Pool(config);
try {
  const store = createPostgresApiKeyStore({ query: (sql, params) => pool.query(sql, params) });
  const issued = await createApiKeyCredential({ productId, subjectId, scopes, trustLevel: 'REGISTERED_CLIENT' });
  await store.saveCredential(issued.record);
  console.log('ONE-TIME API KEY — store it in the Product-selected password manager; it is not recoverable from the Hub database:');
  console.log(issued.api_key);
  console.log(`key_id=${issued.record.key_id}`);
} finally { await pool.end(); }
