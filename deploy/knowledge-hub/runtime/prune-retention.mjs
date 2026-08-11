#!/usr/bin/env node
import pg from 'pg';
import { postgresPoolConfig } from './postgres-config.mjs';
import { createCommonIngestionCore, createPostgresEvidenceRepository } from '../../../src/knowledge-hub/index.mjs';
const { Pool } = pg;
let config;
try { config = postgresPoolConfig(process.env, { max: 1, applicationName: 'bai-knowledge-hub-retention' }); }
catch (error) { console.error(`PostgreSQL configuration invalid: ${error.message}`); process.exit(2); }
const pool = new Pool(config);
try {
  const repository = createPostgresEvidenceRepository({ query: (sql, params) => pool.query(sql, params) });
  const core = createCommonIngestionCore({ repository });
  const removed = await core.pruneExpired();
  console.log(`expired_events_removed=${removed}`);
} finally { await pool.end(); }
