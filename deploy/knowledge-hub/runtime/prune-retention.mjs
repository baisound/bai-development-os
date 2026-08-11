#!/usr/bin/env node
import pg from 'pg';
import { createCommonIngestionCore, createPostgresEvidenceRepository } from '../../../src/knowledge-hub/index.mjs';
const { Pool } = pg;
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(2); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, application_name: 'bai-knowledge-hub-retention' });
try {
  const repository = createPostgresEvidenceRepository({ query: (sql, params) => pool.query(sql, params) });
  const core = createCommonIngestionCore({ repository });
  const removed = await core.pruneExpired();
  console.log(`expired_events_removed=${removed}`);
} finally { await pool.end(); }
