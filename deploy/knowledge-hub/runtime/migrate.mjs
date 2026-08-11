#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { postgresPoolConfig } from './postgres-config.mjs';
import { applyPostgresMigrations } from '../../../src/knowledge-hub/index.mjs';

const { Pool } = pg;
const here = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_ROLE = 'bai_hub_runtime';
if (process.env.DATABASE_URL) { console.error('Migration service requires split PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD fields'); process.exit(2); }
const runtimeUser = process.env.BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER;
const runtimePassword = process.env.BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD;
if (runtimeUser !== RUNTIME_ROLE) {
  console.error(`BAI_KNOWLEDGE_HUB_RUNTIME_DB_USER must be ${RUNTIME_ROLE}`);
  process.exit(2);
}
if (typeof runtimePassword !== 'string' || runtimePassword.length < 32) {
  console.error('BAI_KNOWLEDGE_HUB_RUNTIME_DB_PASSWORD must be at least 32 characters');
  process.exit(2);
}

let poolConfig;
try { poolConfig = postgresPoolConfig(process.env, { max: 1, applicationName: 'bai-knowledge-hub-migration' }); }
catch (error) { console.error(`PostgreSQL migration configuration invalid: ${error.message}`); process.exit(2); }
const pool = new Pool(poolConfig);

async function roleSql(client, template, value) {
  const result = await client.query(`SELECT format($1, $2) AS sql`, [template, value]);
  await client.query(result.rows[0].sql);
}

async function ensureRuntimeRole(client) {
  const found = await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [RUNTIME_ROLE]);
  const passwordClause = found.rows[0]
    ? 'ALTER ROLE bai_hub_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD %L'
    : 'CREATE ROLE bai_hub_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD %L';
  await roleSql(client, passwordClause, runtimePassword);
}


async function verifyRuntimeRole(client) {
  const role = await client.query(`SELECT rolsuper, rolcreatedb, rolcreaterole, rolinherit, rolreplication, rolbypassrls, rolcanlogin
FROM pg_roles WHERE rolname=$1`, [RUNTIME_ROLE]);
  const row = role.rows[0];
  if (!row || row.rolsuper || row.rolcreatedb || row.rolcreaterole || row.rolinherit || row.rolreplication || row.rolbypassrls || !row.rolcanlogin) {
    throw new Error('Runtime DB role attributes violate least-privilege contract');
  }
  const memberships = await client.query(`SELECT count(*)::int AS count FROM pg_auth_members
WHERE member=(SELECT oid FROM pg_roles WHERE rolname=$1)`, [RUNTIME_ROLE]);
  if (memberships.rows[0].count !== 0) throw new Error('Runtime DB role must not inherit membership privileges');
  const privilege = async (object, permission) => {
    const result = await client.query('SELECT has_table_privilege($1,$2,$3) AS allowed', [RUNTIME_ROLE, object, permission]);
    return result.rows[0].allowed;
  };
  const schema = await client.query(`SELECT
    has_schema_privilege($1,'public','USAGE') AS usage,
    has_schema_privilege($1,'public','CREATE') AS create_allowed`, [RUNTIME_ROLE]);
  if (!schema.rows[0].usage || schema.rows[0].create_allowed) throw new Error('Runtime DB schema privileges violate least-privilege contract');
  const required = [
    ['public.evidence_events', 'SELECT'], ['public.evidence_events', 'INSERT'], ['public.evidence_events', 'DELETE'],
    ['public.delivery_receipts', 'INSERT'],
    ['public.client_policies', 'SELECT'],
    ['public.api_credentials', 'SELECT']
  ];
  for (const [object, permission] of required) if (!(await privilege(object, permission))) throw new Error(`Runtime DB privilege missing: ${object} ${permission}`);
  const prohibited = [
    ['public.evidence_events', 'UPDATE'], ['public.evidence_events', 'TRUNCATE'],
    ['public.delivery_receipts', 'SELECT'], ['public.delivery_receipts', 'UPDATE'], ['public.delivery_receipts', 'DELETE'],
    ['public.client_policies', 'INSERT'], ['public.client_policies', 'UPDATE'], ['public.client_policies', 'DELETE'], ['public.client_policies', 'TRUNCATE'],
    ['public.api_credentials', 'INSERT'], ['public.api_credentials', 'UPDATE'], ['public.api_credentials', 'DELETE'],
    ['public.schema_migrations', 'SELECT'], ['public.schema_migrations', 'INSERT'], ['public.schema_migrations', 'UPDATE'], ['public.schema_migrations', 'DELETE']
  ];
  for (const [object, permission] of prohibited) if (await privilege(object, permission)) throw new Error(`Runtime DB privilege unexpectedly granted: ${object} ${permission}`);
}

async function grantRuntimePrivileges(client) {
  await roleSql(client, 'GRANT CONNECT ON DATABASE %I TO bai_hub_runtime', poolConfig.database);
  await client.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
  await client.query('GRANT USAGE ON SCHEMA public TO bai_hub_runtime');
  await client.query('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM bai_hub_runtime');
  await client.query('GRANT SELECT, INSERT, DELETE ON TABLE evidence_events TO bai_hub_runtime');
  await client.query('GRANT INSERT ON TABLE delivery_receipts TO bai_hub_runtime');
  await client.query('GRANT SELECT ON TABLE client_policies TO bai_hub_runtime');
  await client.query('GRANT SELECT ON TABLE api_credentials TO bai_hub_runtime');
}

try {
  const admin = await pool.connect();
  try {
    await admin.query('BEGIN');
    await ensureRuntimeRole(admin);
    await admin.query('COMMIT');
  } catch (error) {
    await admin.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { admin.release(); }

  const query = (sql, params) => pool.query(sql, params);
  const migration = await applyPostgresMigrations({
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

  const grants = await pool.connect();
  try {
    await grants.query('BEGIN');
    await grantRuntimePrivileges(grants);
    await verifyRuntimeRole(grants);
    await grants.query('COMMIT');
  } catch (error) {
    await grants.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { grants.release(); }

  console.log(`KNOWLEDGE_HUB_DB_MIGRATION_PASS runtime_role=${RUNTIME_ROLE} applied=${migration.applied.length} skipped=${migration.skipped.length}`);
} finally { await pool.end(); }
