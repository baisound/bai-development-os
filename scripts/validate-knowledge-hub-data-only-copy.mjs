#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TABLE_COLUMNS = Object.freeze({
  api_credentials: ['key_id', 'subject_id', 'product_id', 'scopes_json', 'trust_level', 'salt', 'secret_hash', 'status', 'created_at', 'expires_at', 'revoked_at'],
  client_policies: ['product_id', 'policy_json', 'updated_at'],
  delivery_receipts: ['receipt_id', 'batch_id', 'subject_id', 'product_id', 'transport', 'receipt_json', 'created_at'],
  evidence_events: ['product_id', 'installation_id', 'event_id', 'event_hash', 'event_json', 'knowledge_evidence_json', 'subject_id', 'trust_level', 'transport', 'received_at', 'expires_at'],
  schema_migrations: ['migration_name', 'checksum', 'applied_at']
});
const SET_STATEMENT = /^SET (?:statement_timeout|lock_timeout|idle_in_transaction_session_timeout|transaction_timeout|client_encoding|standard_conforming_strings|check_function_bodies|xmloption|client_min_messages|row_security) = [^;\r\n]+;$/;
const RESTRICT = /^\\restrict ([A-Za-z0-9_+/=-]{1,256})$/;
const UNRESTRICT = /^\\unrestrict ([A-Za-z0-9_+/=-]{1,256})$/;
const MAX_BYTES = 64 * 1024 * 1024;
const MAX_ROW_BYTES = 1024 * 1024;

export function validateKnowledgeHubDataOnlyCopy(bytes) {
  const input = Buffer.isBuffer(bytes) ? bytes : Buffer.from(String(bytes), 'utf8');
  if (input.length < 1 || input.length > MAX_BYTES || input.includes(0)) throw new Error('data-only SQL size or NUL invalid');
  const text = input.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(input) || !text.endsWith('\n')) throw new Error('data-only SQL must be canonical UTF-8 ending in newline');
  const seen = new Set(); let copy = null; let restrictToken = null; let rows = 0;
  for (const [index, raw] of text.split('\n').entries()) {
    const lineNumber = index + 1;
    if (Buffer.byteLength(raw, 'utf8') > MAX_ROW_BYTES) throw new Error(`data-only SQL line ${lineNumber} exceeds the bounded row size`);
    if (copy) {
      if (raw === '\\.') { copy = null; continue; }
      if (raw.includes('\r') || raw.split('\t').length !== TABLE_COLUMNS[copy].length) throw new Error(`COPY row framing invalid at line ${lineNumber}`);
      rows += 1; continue;
    }
    if (!raw || raw.startsWith('--')) continue;
    const restriction = RESTRICT.exec(raw);
    if (restriction) { if (restrictToken !== null) throw new Error('nested psql restrict block'); restrictToken = restriction[1]; continue; }
    const unrestricted = UNRESTRICT.exec(raw);
    if (unrestricted) { if (restrictToken === null || unrestricted[1] !== restrictToken) throw new Error('psql restrict pair mismatch'); restrictToken = null; continue; }
    if (SET_STATEMENT.test(raw) || raw === "SELECT pg_catalog.set_config('search_path', '', false);") continue;
    const header = /^COPY public\.([a-z_]+) \(([^)]+)\) FROM stdin;$/.exec(raw);
    if (header) {
      const [, table, columnText] = header; const expected = TABLE_COLUMNS[table];
      if (!expected || seen.has(table) || columnText.split(', ').join('\n') !== expected.join('\n')) throw new Error(`COPY header invalid at line ${lineNumber}`);
      seen.add(table); copy = table; continue;
    }
    throw new Error(`data-only SQL statement outside the closed COPY framing at line ${lineNumber}`);
  }
  if (copy || restrictToken !== null || seen.size !== Object.keys(TABLE_COLUMNS).length) throw new Error('data-only SQL framing incomplete');
  return Object.freeze({ status: 'PASS', tables: seen.size, rows, bytes: input.length });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv[2]) throw new Error('usage: validate-knowledge-hub-data-only-copy.mjs <data-only.sql>');
    console.log(JSON.stringify(validateKnowledgeHubDataOnlyCopy(fs.readFileSync(process.argv[2]))));
  } catch (error) { console.error(JSON.stringify({ status: 'FAIL', reason: error.message })); process.exit(1); }
}
