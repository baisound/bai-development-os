import { readFile } from 'node:fs/promises';
import { MaintenanceService, runMaintenanceFsck, createRepairPlan, executeRepairPlan, securityJournalMaintenanceAdapter, releaseLockMaintenanceAdapter } from '../src/maintenance/index.mjs';
const schemas=['maintenance-finding','maintenance-fsck-report','repair-plan','repair-execution','maintenance-checkpoint','quarantine-record','retention-plan'];
for(const name of schemas){const p=`schemas/maintenance/${name}.schema.json`;const j=JSON.parse(await readFile(p,'utf8'));if(j?.$schema!=='https://json-schema.org/draft/2020-12/schema'||!j?.title)throw new Error(`MAINTENANCE_SCHEMA_INVALID:${name}`);}
for(const x of [MaintenanceService,runMaintenanceFsck,createRepairPlan,executeRepairPlan,securityJournalMaintenanceAdapter,releaseLockMaintenanceAdapter])if(!x)throw new Error('MAINTENANCE_EXPORT_MISSING');
console.log(`MAINTENANCE_CONFORMANCE_PASS schemas=${schemas.length} shared_contracts=6`);
