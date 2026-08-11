#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { postgresPoolConfig } from './postgres-config.mjs';
import {
  applyPostgresMigrations,
  createApiKeyAuthenticator,
  createCommonIngestionCore,
  createFixedWindowRateLimiter,
  createKnowledgeHubHttpServer,
  createPostgresApiKeyStore,
  createPostgresEvidenceRepository
} from '../../../src/knowledge-hub/index.mjs';

const { Pool } = pg;
const here = path.dirname(fileURLToPath(import.meta.url));
function positiveInt(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name]; const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} invalid`);
  return value;
}
const host = process.env.BAI_KNOWLEDGE_HUB_HOST ?? '0.0.0.0';
const port = positiveInt('BAI_KNOWLEDGE_HUB_PORT', 8787, { max: 65535 });
const retentionDays = positiveInt('BAI_KNOWLEDGE_HUB_RETENTION_DAYS', 30, { max: 3650 });
const rateLimit = positiveInt('BAI_KNOWLEDGE_HUB_RATE_LIMIT_PER_MINUTE', 120, { max: 100000 });
let poolConfig;
try { poolConfig = postgresPoolConfig(process.env, { max: positiveInt('BAI_KNOWLEDGE_HUB_DB_POOL_MAX', 10, { max: 100 }), applicationName: 'bai-knowledge-hub' }); }
catch (error) { console.error(`PostgreSQL configuration invalid: ${error.message}`); process.exit(2); }
const pool = new Pool(poolConfig);
const query = (sql, params) => pool.query(sql, params);
await applyPostgresMigrations({
  query,
  directory: path.resolve(here, '../postgres'),
  executeMigration: async ({ name, sql, checksum }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(170017)');
      const existing = await client.query('SELECT checksum FROM schema_migrations WHERE migration_name=$1', [name]);
      let applied = false;
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Migration checksum mismatch during locked apply: ${name}`);
      } else {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(migration_name, checksum) VALUES($1,$2)', [name, checksum]);
        applied = true;
      }
      await client.query('COMMIT');
      return { applied };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  }
});
const repository = createPostgresEvidenceRepository({ query });
const credentialStore = createPostgresApiKeyStore({ query });
const authenticate = createApiKeyAuthenticator({ credentialStore });
const core = createCommonIngestionCore({ repository, rateLimiter: createFixedWindowRateLimiter({ limit: rateLimit, windowMs: 60_000 }), retentionDays });
const hub = createKnowledgeHubHttpServer({ core, authenticate, bodyLimitBytes: positiveInt('BAI_KNOWLEDGE_HUB_BODY_LIMIT_BYTES', 262144, { max: 1048576 }) });
const address = await hub.start({ host, port });
console.log(`BAI Knowledge Hub started on ${address.base_url}; PostgreSQL persistence active.`);
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  try { await hub.stop(); } finally { await pool.end(); }
}
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, async () => { await stop(); process.exit(0); });
process.on('uncaughtException', async error => { console.error('Knowledge Hub fatal error:', error?.code ?? error?.name ?? 'UNKNOWN'); await stop(); process.exit(1); });
process.on('unhandledRejection', async error => { console.error('Knowledge Hub unhandled rejection:', error?.code ?? error?.name ?? 'UNKNOWN'); await stop(); process.exit(1); });
