import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CALIBRATION_CATALOG, CALIBRATION_SUBSYSTEMS, IMMUTABLE_POLICY_PREFIXES } from '../src/calibration/index.mjs';

const root = process.cwd();
const schemaDir = path.join(root, 'schemas/calibration');
const expected = ['calibration-evidence.schema.json','calibration-report.schema.json','policy-candidate.schema.json','calibration-evaluation.schema.json','calibration-ledger-record.schema.json','calibration-snapshot.schema.json'];
for (const name of expected) JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8'));
const covered = new Set(DEFAULT_CALIBRATION_CATALOG.map((x) => x.subsystem));
const missing = CALIBRATION_SUBSYSTEMS.filter((x) => !covered.has(x));
if (missing.length) throw new Error(`CALIBRATION_CONFORMANCE_FAIL missing catalog subsystems: ${missing.join(',')}`);
if (!IMMUTABLE_POLICY_PREFIXES.includes('integration.external_authorization.') || !IMMUTABLE_POLICY_PREFIXES.includes('extension.core_authority.')) throw new Error('CALIBRATION_CONFORMANCE_FAIL safety floor catalog incomplete');
const state = fs.readFileSync(path.join(root, 'registry/current-state.md'), 'utf8');
if (!/TASK-014/.test(state)) throw new Error('CALIBRATION_CONFORMANCE_FAIL TASK-014 missing from current state');
console.log(`CALIBRATION_CONFORMANCE_PASS schemas=${expected.length} subsystems=${CALIBRATION_SUBSYSTEMS.length} catalog=${DEFAULT_CALIBRATION_CATALOG.length} immutable_prefixes=${IMMUTABLE_POLICY_PREFIXES.length}`);
