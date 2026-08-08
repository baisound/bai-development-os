import { readFile } from 'node:fs/promises';
import * as Distributed from '../src/distributed/index.mjs';
const schemas=['distributed-event','distributed-worker','distributed-lease','distributed-broker-state','distributed-run-request','distributed-run-result','distributed-saga','distributed-rollout','distributed-calibration-evidence','distributed-checkpoint-receipt'];
for(const name of schemas){const j=JSON.parse(await readFile(`schemas/distributed/${name}.schema.json`,'utf8')); if(j?.$schema!=='https://json-schema.org/draft/2020-12/schema'||!j?.title)throw new Error(`DISTRIBUTED_SCHEMA_INVALID:${name}`);}
const exports=['DistributedService','createDistributedEventEnvelope','createDistributedTransportAdapter','createWorkerAdvertisement','issueDistributedLease','enqueueDistributedEvent','createRemoteRunRequest','createDistributedSaga','createDistributedRolloutPlan','createDistributedCalibrationEvidenceEnvelope','aggregateDistributedMetric','evaluateDistributedPartition','createDistributedCheckpointReceipt'];
for(const name of exports)if(!Distributed[name])throw new Error(`DISTRIBUTED_EXPORT_MISSING:${name}`);
const state=await readFile('registry/current-state.md','utf8'); if(!/TASK-015/.test(state))throw new Error('DISTRIBUTED_TASK015_STATE_MISSING');
console.log(`DISTRIBUTED_CONFORMANCE_PASS schemas=${schemas.length} shared_contracts=${exports.length}`);
