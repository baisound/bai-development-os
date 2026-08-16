import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkRuntimeLockCandidate } from '../../scripts/check-knowledge-hub-runtime-lock-candidate.mjs';

const good = () => ({
  name: 'bai-knowledge-hub-runtime',
  version: '1.0.0',
  lockfileVersion: 3,
  requires: true,
  packages: {
    '': { name: 'bai-knowledge-hub-runtime', version: '1.0.0', dependencies: { pg: '8.13.1' } },
    'node_modules/pg': {
      version: '8.13.1',
      resolved: 'https://registry.npmjs.org/pg/-/pg-8.13.1.tgz',
      integrity: 'sha512-QUJDREVGR0g=',
    },
    'node_modules/example': {
      version: '1.0.0',
      resolved: 'https://registry.npmjs.org/example/-/example-1.0.0.tgz',
      integrity: 'sha512-QUJDREVGR0g=',
    },
  },
});

test('runtime lock candidate accepts exact registry+integrity graph', () => {
  assert.equal(checkRuntimeLockCandidate(good()).status, 'PASS');
});

test('runtime lock candidate rejects git/file/http source', () => {
  for (const resolved of [
    'git+https://example.invalid/x.git',
    'file:../x',
    'http://registry.npmjs.org/x.tgz',
  ]) {
    const value = good();
    value.packages['node_modules/example'].resolved = resolved;
    assert.equal(checkRuntimeLockCandidate(value).status, 'FAIL');
  }
});

test('runtime lock candidate rejects missing integrity or pg drift', () => {
  const missingIntegrity = good();
  delete missingIntegrity.packages['node_modules/example'].integrity;
  assert.equal(checkRuntimeLockCandidate(missingIntegrity).status, 'FAIL');

  const pgDrift = good();
  pgDrift.packages['node_modules/pg'].version = '8.13.2';
  assert.equal(checkRuntimeLockCandidate(pgDrift).status, 'FAIL');
});

test('canonical runtime lock passes the supply-chain policy', () => {
  const value = JSON.parse(
    fs.readFileSync(new URL('../../deploy/knowledge-hub/runtime/package-lock.json', import.meta.url), 'utf8'),
  );
  const result = checkRuntimeLockCandidate(value);
  assert.equal(result.status, 'PASS');
  assert.equal(result.pg_version, '8.13.1');
  assert.equal(result.packages, 19);
});
