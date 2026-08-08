import { appendSecurityLedger } from '../security/ledger.mjs';
import { runMaintenanceFsck } from './fsck.mjs';
import { createRepairPlan, executeRepairPlan } from './repair.mjs';
import { deepFreeze } from './util.mjs';
export class MaintenanceService{
  constructor({root,adapters=[],handlers={},signer=null,audit=false,clock=()=>new Date()}={}){this.root=root;this.adapters=adapters;this.handlers=handlers;this.signer=signer;this.audit=audit;this.clock=clock;}
  async inspect(context={}){const report=await runMaintenanceFsck({root:this.root,adapters:this.adapters,context,clock:this.clock});if(this.audit)await appendSecurityLedger(this.root,'maintenance-audit',{event_type:'FSCK_COMPLETED',subject:report.report_id,details:{status:report.status,summary:report.summary}},{signer:this.signer,clock:this.clock});return report;}
  plan(report){return createRepairPlan(report,{clock:this.clock});}
  async repair(plan,{owner_authorization_ref=null}={}){const result=await executeRepairPlan({root:this.root,plan,handlers:this.handlers,owner_authorization_ref,clock:this.clock});if(this.audit)await appendSecurityLedger(this.root,'maintenance-audit',{event_type:'REPAIR_COMPLETED',subject:result.execution_id,details:{repair_plan_id:plan.repair_plan_id,summary:result.summary}},{signer:this.signer,clock:this.clock});return deepFreeze(result);}
}
