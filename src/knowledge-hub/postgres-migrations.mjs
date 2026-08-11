import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from '../knowledge-evolution/util.mjs';
import { KnowledgeHubError } from './errors.mjs';

const MIGRATION_NAME = /^\d{3}_[A-Za-z0-9._-]+\.sql$/;

function listMigrationFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && MIGRATION_NAME.test(entry.name))
    .map(entry => entry.name)
    .sort();
}

export async function applyPostgresMigrations({ query, directory, executeMigration = null } = {}) {
  if (typeof query !== 'function') throw new TypeError('query is required');
  if (typeof directory !== 'string' || !directory) throw new TypeError('directory is required');
  const files = listMigrationFiles(directory);
  if (files.length < 1) throw new KnowledgeHubError('HUB_MIGRATIONS_EMPTY', 'No PostgreSQL migrations found', { status: 500 });
  await query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    migration_name text PRIMARY KEY,
    checksum char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const applied = [], skipped = [];
  for (const name of files) {
    const sql = fs.readFileSync(path.join(directory, name), 'utf8');
    const checksum = sha256(sql);
    const existing = await query('SELECT checksum FROM schema_migrations WHERE migration_name=$1', [name]);
    const oldChecksum = existing?.rows?.[0]?.checksum;
    if (oldChecksum) {
      if (oldChecksum !== checksum) throw new KnowledgeHubError('HUB_MIGRATION_CHECKSUM_MISMATCH', `Migration changed after application: ${name}`, { status: 500 });
      skipped.push(name);
      continue;
    }
    if (executeMigration) {
      const execution = await executeMigration({ name, sql, checksum });
      if (execution?.applied === false) { skipped.push(name); continue; }
    } else {
      await query(sql);
      await query('INSERT INTO schema_migrations(migration_name, checksum) VALUES($1,$2)', [name, checksum]);
    }
    applied.push(name);
  }
  return Object.freeze({ applied: Object.freeze(applied), skipped: Object.freeze(skipped) });
}
