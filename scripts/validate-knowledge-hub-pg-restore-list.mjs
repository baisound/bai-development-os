#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES } from './knowledge-hub-phase0-schema-inventory.mjs';

// This Phase-0 restore admits only objects emitted by the current Hub
// migrations. A schema change requires an explicit validator revision; unknown
// PostgreSQL TOC classes never inherit permission from TABLE or DEFAULT.
const INVENTORY_MODULE_SHA256 = '6f9961634458cb4879720a3afa6d376587378d4cc1d3365fa4a6e11a4b356620';
const INVENTORY_MODULE = fileURLToPath(new URL('./knowledge-hub-phase0-schema-inventory.mjs', import.meta.url));
const OWNER = '[A-Za-z_][A-Za-z0-9_]{0,62}';
const REQUIRED_COORDINATE_SET = new Set(KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES);
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function verifyInventoryModuleBinding() {
  if (sha256(fs.readFileSync(INVENTORY_MODULE)) !== INVENTORY_MODULE_SHA256) throw new Error('Phase-0 schema inventory module differs from the revision-bound validator');
}

function normalizeCoordinate(value) {
  if (/^(?:ENCODING - ENCODING|STDSTRINGS - STDSTRINGS|SEARCHPATH - SEARCHPATH|PRE_DATA_BOUNDARY - PRE_DATA_BOUNDARY|POST_DATA_BOUNDARY - POST_DATA_BOUNDARY)$/.test(value)) return value;
  let match = new RegExp(`^SCHEMA - (public) ${OWNER}$`).exec(value);
  if (match) return `SCHEMA - ${match[1]}`;
  match = new RegExp(`^(TABLE(?: DATA)?) (public) ([a-z_]+) ${OWNER}$`).exec(value);
  if (match) return `${match[1]} ${match[2]} ${match[3]}`;
  match = new RegExp(`^(DEFAULT) (public) ([a-z_]+) ([a-z_]+) ${OWNER}$`).exec(value);
  if (match) return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  match = new RegExp(`^(CONSTRAINT) (public) ([a-z_]+) ([a-z_]+) ${OWNER}$`).exec(value);
  if (match) return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  match = new RegExp(`^(INDEX) (public) ([a-z_]+) ${OWNER}$`).exec(value);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : null;
}

export function validateKnowledgeHubRestoreList(text) {
  verifyInventoryModuleBinding();
  let entries = 0;
  const seenCoordinates = new Set();
  for (const [index, raw] of String(text).split(/\r?\n/).entries()) {
    const line = raw.trim(); if (!line || line.startsWith(';')) continue;
    const match = /^\d+;\s+\d+\s+\d+\s+([^\r\n;]+)$/.exec(line); if (!match) throw new Error(`archive list line ${index + 1} invalid`);
    const coordinate = normalizeCoordinate(match[1]);
    if (!coordinate) throw new Error(`archive object is not in the exact Hub allowlist at line ${index + 1}`);
    if (!REQUIRED_COORDINATE_SET.has(coordinate)) throw new Error(`archive object is not in the exact Hub allowlist; exact Phase-0 inventory mismatch at line ${index + 1}`);
    if (seenCoordinates.has(coordinate)) throw new Error(`duplicate archive coordinate at line ${index + 1}`);
    seenCoordinates.add(coordinate);
    entries += 1;
  }
  if (entries !== KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.length || seenCoordinates.size !== KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.length) throw new Error(`archive list must contain exactly ${KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.length} Hub coordinates`);
  const missing = KNOWLEDGE_HUB_PHASE0_TOC_COORDINATES.filter((coordinate) => !seenCoordinates.has(coordinate));
  if (missing.length) throw new Error(`archive list missing required Hub coordinates: ${missing.join(',')}`);
  return Object.freeze({ entries });
}

if (process.argv[1] && process.argv[1].endsWith('validate-knowledge-hub-pg-restore-list.mjs')) {
  try { const result = validateKnowledgeHubRestoreList(fs.readFileSync(process.argv[2], 'utf8')); console.log(JSON.stringify({ status: 'PASS', ...result })); }
  catch (error) { console.error(JSON.stringify({ status: 'FAIL', reason: error.message })); process.exit(1); }
}
