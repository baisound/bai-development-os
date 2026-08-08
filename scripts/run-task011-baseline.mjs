import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createConformanceFixture,
  evaluatePortabilityCoverage,
  referenceFixtures,
  runConformanceLab,
  runConsumerContract,
} from '../src/conformance/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const javascriptRouletteRoot = path.resolve(process.argv[2] ?? path.join(root, '../projects/javascript-roulette'));
const refs = referenceFixtures();
const roulette = refs.find((fixture) => fixture.fixture_id === 'javascript-roulette');
const coreFixture = createConformanceFixture({
  fixture_id: 'core-node', project_id: 'core-node', name: 'Core Node Synthetic Consumer',
  scale: 'MEDIUM', risk_tier: 'CORE_CRITICAL', domains: ['software','automation'], languages: ['javascript'],
  platform: { os: process.platform, arch: process.arch, filesystem: 'local', evidence_level: 'REAL' },
  runtime: { name: 'node', version: process.versions.node, shell: process.platform === 'win32' ? 'powershell' : 'sh' },
  consumer_contract: { mode: 'NODE_TEST', target: 'tests/contract.test.mjs', trust: 'TRUSTED_LOCAL' },
  evidence_level: 'REAL', capabilities: ['consumer-contract','security','release','boundary'],
});
const runs = [
  await runConsumerContract({ fixture: roulette, cwd: javascriptRouletteRoot }),
  await runConsumerContract({ fixture: coreFixture, cwd: path.join(root, 'fixtures/conformance/core-node') }),
];
const lab = await runConformanceLab({
  fixtures: [roulette, coreFixture], consumer_runs: runs,
  required_coverage: { scales: ['SMALL','MEDIUM'], risk_tiers: ['STANDARD','CORE_CRITICAL'], domains: ['software'] },
  ownership_records: [
    { project_id: roulette.project_id, owner_project_id: roulette.project_id, resource_type: 'CONSUMER' },
    { project_id: coreFixture.project_id, owner_project_id: coreFixture.project_id, resource_type: 'CONSUMER' },
  ],
  quota_probe: { capacity: 20, minimum_share: 5, demands: [
    { project_id: roulette.project_id, demand: 1000, weight: 1 },
    { project_id: coreFixture.project_id, demand: 10, weight: 1 },
  ] },
  required_level: 'C3_MULTI_PROJECT',
});
const simulated = [
  createConformanceFixture({ fixture_id:'windows-x64-sim', project_id:'windows-x64-sim', name:'Windows x64 simulated target', scale:'SMALL', risk_tier:'STANDARD', domains:['software'], languages:['javascript'], platform:{os:'win32',arch:'x64',filesystem:'ntfs',evidence_level:'SIMULATED'}, runtime:{name:'node',shell:'powershell'}, consumer_contract:{mode:'NONE'}, evidence_level:'SIMULATED' }),
  createConformanceFixture({ fixture_id:'macos-arm64-sim', project_id:'macos-arm64-sim', name:'macOS arm64 simulated target', scale:'SMALL', risk_tier:'STANDARD', domains:['software'], languages:['javascript'], platform:{os:'darwin',arch:'arm64',filesystem:'apfs',evidence_level:'SIMULATED'}, runtime:{name:'node',shell:'sh'}, consumer_contract:{mode:'NONE'}, evidence_level:'SIMULATED' }),
];
const portability = evaluatePortabilityCoverage({ fixtures:[roulette,...simulated], required_targets:[{os:process.platform},{os:'win32',arch:'x64'},{os:'darwin',arch:'arm64'}] });
console.log(JSON.stringify({ baseline_version:'1.0.0', local_multi_project_lab:lab, cross_platform_portability:portability, declared_reference:refs.find(f=>f.project_id==='makeTikTokGiftMaster') },null,2));
