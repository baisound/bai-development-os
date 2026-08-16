#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KNOWLEDGE_HUB_PHASE0_SCHEMA_INVENTORY as INVENTORY } from './knowledge-hub-phase0-schema-inventory.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INVENTORY_MODULE = fileURLToPath(new URL('./knowledge-hub-phase0-schema-inventory.mjs', import.meta.url));
const INVENTORY_MODULE_SHA256 = '6f9961634458cb4879720a3afa6d376587378d4cc1d3365fa4a6e11a4b356620';
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const exactKeys = (value) => Object.keys(value).sort();

function verifyTrustedInventorySources() {
  if (sha256(fs.readFileSync(INVENTORY_MODULE)) !== INVENTORY_MODULE_SHA256) throw new Error('Phase-0 schema inventory module differs from the revision-bound validator');
  for (const source of INVENTORY.sources) {
    const absolute = path.resolve(ROOT, source.path);
    if (!absolute.startsWith(`${ROOT}${path.sep}`)) throw new Error('Phase-0 inventory source path escapes the repository');
    let actual;
    try { actual = sha256(fs.readFileSync(absolute)); }
    catch { throw new Error(`trusted Phase-0 schema source is unavailable: ${source.path}`); }
    if (actual !== source.sha256) throw new Error(`trusted Phase-0 schema source drifted: ${source.path}`);
  }
}

function removeComments(sql) {
  let output = '';
  for (let index = 0; index < sql.length;) {
    if (sql.startsWith('--', index)) {
      const end = sql.indexOf('\n', index + 2);
      output += '\n'; index = end < 0 ? sql.length : end + 1; continue;
    }
    if (sql.startsWith('/*', index)) {
      let depth = 1; index += 2;
      while (index < sql.length && depth > 0) {
        if (sql.startsWith('/*', index)) { depth += 1; index += 2; continue; }
        if (sql.startsWith('*/', index)) { depth -= 1; index += 2; continue; }
        index += 1;
      }
      if (depth !== 0) throw new Error('schema SQL block comment is truncated');
      output += ' '; continue;
    }
    if (sql[index] === "'") {
      const start = index; index += 1; let closed = false;
      while (index < sql.length) {
        if (sql[index] === "'" && sql[index + 1] === "'") { index += 2; continue; }
        if (sql[index] === "'") { index += 1; closed = true; break; }
        index += 1;
      }
      if (!closed) throw new Error('schema SQL string literal is truncated');
      output += sql.slice(start, index); continue;
    }
    if (sql[index] === '$') {
      const tag = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(index))?.[0];
      if (tag) {
        const end = sql.indexOf(tag, index + tag.length);
        if (end < 0) throw new Error('schema SQL dollar quote is truncated');
        output += sql.slice(index, end + tag.length); index = end + tag.length; continue;
      }
    }
    output += sql[index]; index += 1;
  }
  return output;
}

function removeAndValidatePsqlGuards(sql) {
  const guards = [];
  const body = sql.split('\n').map((line) => {
    if (!line.trimStart().startsWith('\\')) return line;
    const match = /^\\(restrict|unrestrict)\s+([A-Za-z0-9]+)\s*$/.exec(line.trim());
    if (!match) throw new Error('schema SQL contains an unapproved psql command');
    guards.push([match[1], match[2]]); return '';
  }).join('\n');
  if (guards.length !== 0 && (guards.length !== 2 || guards[0][0] !== 'restrict'
    || guards[1][0] !== 'unrestrict' || guards[0][1] !== guards[1][1])) {
    throw new Error('schema SQL psql restrict guard is not an exact pair');
  }
  return body;
}

function splitStatements(sql) {
  const statements = []; let start = 0; let quote = false; let dollarTag = null;
  for (let index = 0; index < sql.length; index += 1) {
    if (dollarTag) {
      if (sql.startsWith(dollarTag, index)) { index += dollarTag.length - 1; dollarTag = null; }
      continue;
    }
    if (quote) {
      if (sql[index] === "'" && sql[index + 1] === "'") { index += 1; continue; }
      if (sql[index] === "'") quote = false;
      continue;
    }
    if (sql[index] === "'") { quote = true; continue; }
    if (sql[index] === '$') {
      const tag = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(index))?.[0];
      if (tag) { dollarTag = tag; index += tag.length - 1; continue; }
    }
    if (sql[index] === ';') {
      const statement = sql.slice(start, index).replace(/\s+/g, ' ').trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }
  if (quote || dollarTag) throw new Error('schema SQL literal is truncated');
  const tail = sql.slice(start).trim();
  if (tail) throw new Error(`schema SQL statement lacks a terminator: ${tail.slice(0, 96)}`);
  return statements;
}

function splitTopLevelList(value) {
  const parts = []; let start = 0; let depth = 0; let quote = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === "'" && value[index + 1] === "'") { index += 1; continue; }
      if (character === "'") quote = false;
      continue;
    }
    if (character === "'") { quote = true; continue; }
    if (character === '(') depth += 1;
    else if (character === ')') { depth -= 1; if (depth < 0) throw new Error('schema SQL parentheses are unbalanced'); }
    else if (character === ',' && depth === 0) { parts.push(value.slice(start, index).trim()); start = index + 1; }
  }
  if (quote || depth !== 0) throw new Error('schema SQL table or index structure is truncated');
  parts.push(value.slice(start).trim());
  return parts;
}

function canonical(value) {
  return value.replace(/\s+/g, ' ').trim().replace(/\s*,\s*/g, ', ')
    .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
}

function sameSql(actual, expected) {
  return canonical(actual).localeCompare(canonical(expected), 'en', { sensitivity: 'accent' }) === 0;
}

function parseIndexStatement(statement) {
  const prefix = /^CREATE INDEX ([a-z_]+) ON public\.([a-z_]+) USING btree \(/i.exec(statement);
  if (!prefix) return null;
  const keysStart = prefix[0].length; let depth = 1; let quote = false; let close = -1;
  for (let index = keysStart; index < statement.length; index += 1) {
    const character = statement[index];
    if (quote) {
      if (character === "'" && statement[index + 1] === "'") { index += 1; continue; }
      if (character === "'") quote = false;
      continue;
    }
    if (character === "'") { quote = true; continue; }
    if (character === '(') depth += 1;
    else if (character === ')') {
      depth -= 1;
      if (depth === 0) { close = index; break; }
    }
  }
  if (quote || close < 0) throw new Error('schema SQL index structure is truncated');
  const tail = statement.slice(close + 1);
  if (tail && !tail.startsWith(' WHERE ')) return null;
  return Object.freeze({ name: prefix[1], table: prefix[2], keys: statement.slice(keysStart, close), predicate: tail ? tail.slice(7) : null });
}

function recordExactlyOnce(seen, group, coordinate) {
  const key = `${group}:${coordinate}`;
  if (seen.has(key)) throw new Error(`schema SQL requires exactly one ${group} coordinate ${coordinate}`);
  seen.add(key);
}

const METADATA = Object.freeze([
  /^SET statement_timeout = 0$/i, /^SET lock_timeout = 0$/i,
  /^SET idle_in_transaction_session_timeout = 0$/i, /^SET transaction_timeout = 0$/i,
  /^SET client_encoding = 'UTF8'$/i, /^SET standard_conforming_strings = on$/i,
  /^SELECT pg_catalog\.set_config\('search_path', '', false\)$/i,
  /^SET check_function_bodies = false$/i, /^SET xmloption = content$/i,
  /^SET client_min_messages = warning$/i, /^SET row_security = off$/i,
  /^SET default_tablespace = ''$/i, /^SET default_table_access_method = heap$/i
]);

export function validateKnowledgeHubSchemaSql(sqlText) {
  verifyTrustedInventorySources();
  const sql = String(sqlText);
  if (!sql || sql.includes('\0') || sql.includes('\r') || sql.includes('"')) throw new Error('schema SQL encoding or identifier form invalid');
  const statements = splitStatements(removeAndValidatePsqlGuards(removeComments(sql)));
  const seen = new Set(); const semantics = [];

  for (const statement of statements) {
    if (/^COPY\b/i.test(statement)) throw new Error('schema SQL TABLE DATA COPY command is forbidden');
    const metadataIndex = METADATA.findIndex((pattern) => pattern.test(statement));
    if (metadataIndex >= 0) { recordExactlyOnce(seen, 'metadata', metadataIndex); continue; }
    if (/^CREATE SCHEMA public$/i.test(statement)) { recordExactlyOnce(seen, 'schema', 'public'); semantics.push('schema:public'); continue; }

    let match = /^CREATE TABLE public\.([a-z_]+) \(([\s\S]+)\)$/i.exec(statement);
    if (match) {
      const table = match[1].toLowerCase(); const expected = INVENTORY.tables[table];
      if (!expected) throw new Error(`schema SQL table is outside the exact Phase-0 inventory: ${table}`);
      const columns = splitTopLevelList(match[2]).map(canonical);
      if (columns.length !== expected.length || columns.some((column, index) => !sameSql(column, expected[index]))) {
        throw new Error(`schema SQL table columns/types/nullability are outside the exact Phase-0 inventory: ${table}`);
      }
      recordExactlyOnce(seen, 'table', table); semantics.push(`table:${table}:${expected.join('|')}`); continue;
    }

    match = /^ALTER TABLE ONLY public\.([a-z_]+) ALTER COLUMN ([a-z_]+) SET DEFAULT (.+)$/i.exec(statement);
    if (match) {
      const coordinate = `${match[1].toLowerCase()}.${match[2].toLowerCase()}`;
      if (!(coordinate in INVENTORY.defaults) || !sameSql(match[3], INVENTORY.defaults[coordinate])) {
        throw new Error(`schema SQL default is outside the exact Phase-0 inventory: ${coordinate}`);
      }
      recordExactlyOnce(seen, 'default', coordinate); semantics.push(`default:${coordinate}:${INVENTORY.defaults[coordinate]}`); continue;
    }

    match = /^ALTER TABLE ONLY public\.([a-z_]+) ADD CONSTRAINT ([a-z_]+) (.+)$/i.exec(statement);
    if (match) {
      const table = match[1].toLowerCase(); const name = match[2].toLowerCase(); const expected = INVENTORY.constraints[name];
      if (!expected || expected.table !== table || !sameSql(match[3], expected.definition)) {
        throw new Error(`schema SQL constraint definition is outside the exact Phase-0 inventory: ${table}.${name}`);
      }
      recordExactlyOnce(seen, 'constraint', name); semantics.push(`constraint:${name}:${expected.table}:${expected.definition}`); continue;
    }

    const indexStatement = parseIndexStatement(statement);
    if (indexStatement) {
      const name = indexStatement.name.toLowerCase(); const table = indexStatement.table.toLowerCase(); const expected = INVENTORY.indexes[name];
      const predicate = indexStatement.predicate;
      if (!expected || expected.table !== table || !sameSql(indexStatement.keys, expected.keys)
        || (predicate === null) !== (expected.predicate === null)
        || (predicate !== null && !sameSql(predicate, expected.predicate))) {
        throw new Error(`schema SQL index definition or predicate is outside the exact Phase-0 inventory: ${table}.${name}`);
      }
      recordExactlyOnce(seen, 'index', name); semantics.push(`index:${name}:${expected.table}:${expected.keys}:${expected.predicate ?? ''}`); continue;
    }

    throw new Error(`schema SQL statement structure is not in the exact Phase-0 allowlist: ${statement.slice(0, 96)}`);
  }

  for (const table of exactKeys(INVENTORY.tables)) if (!seen.has(`table:${table}`)) throw new Error(`schema SQL requires exactly one table coordinate ${table}`);
  for (const coordinate of exactKeys(INVENTORY.defaults)) if (!seen.has(`default:${coordinate}`)) throw new Error(`schema SQL requires exactly one default coordinate ${coordinate}`);
  for (const name of exactKeys(INVENTORY.constraints)) if (!seen.has(`constraint:${name}`)) throw new Error(`schema SQL requires exactly one constraint coordinate ${name}`);
  for (const name of exactKeys(INVENTORY.indexes)) if (!seen.has(`index:${name}`)) throw new Error(`schema SQL requires exactly one index coordinate ${name}`);
  if (!seen.has('schema:public')) throw new Error('schema SQL requires exactly one schema coordinate public');

  semantics.push(`inventory-revision:${INVENTORY.revision}`);
  return Object.freeze({ statements: statements.length, schema_semantics_sha256: sha256(Buffer.from(semantics.sort().join('\n'), 'utf8')) });
}

if (process.argv[1]?.endsWith('validate-knowledge-hub-schema-sql.mjs')) {
  try { console.log(JSON.stringify({ status: 'PASS', ...validateKnowledgeHubSchemaSql(fs.readFileSync(process.argv[2], 'utf8')) })); }
  catch (error) { console.error(JSON.stringify({ status: 'FAIL', reason: error.message })); process.exit(1); }
}
