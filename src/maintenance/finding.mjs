import { ARTIFACT_CLASS, MAINTENANCE_SEVERITY, REPAIR_CLASS, FINDING_STATE } from './constants.mjs';
import { MaintenanceError } from './errors.mjs';
import { deepFreeze, newId, nowIso, sha256, stable } from './util.mjs';
const sev=new Set(Object.values(MAINTENANCE_SEVERITY)); const rc=new Set(Object.values(REPAIR_CLASS)); const ac=new Set(Object.values(ARTIFACT_CLASS));
export function createMaintenanceFinding(input={}, {clock=()=>new Date()}={}){
  const severity=input.severity??MAINTENANCE_SEVERITY.WARNING; const repair_class=input.repair_class??REPAIR_CLASS.NONE; const artifact_class=input.artifact_class??ARTIFACT_CLASS.DERIVED;
  if(!sev.has(severity)||!rc.has(repair_class)||!ac.has(artifact_class)) throw new MaintenanceError('MAINTENANCE_FINDING_INVALID');
  if(!input.adapter_id||!input.code||!input.subject) throw new MaintenanceError('MAINTENANCE_FINDING_INVALID');
  const body={finding_version:'1.0.0',finding_id:input.finding_id??newId('finding'),detected_at:input.detected_at??nowIso(clock),adapter_id:String(input.adapter_id),code:String(input.code),severity,subject:String(input.subject),artifact_class,repair_class,state:FINDING_STATE.OPEN,authority_impact:Boolean(input.authority_impact),trust_impact:Boolean(input.trust_impact),canonical_impact:Boolean(input.canonical_impact),external_side_effect_ambiguous:Boolean(input.external_side_effect_ambiguous),data_loss_risk:Boolean(input.data_loss_risk),reversible:Boolean(input.reversible),repair_action:input.repair_action??null,evidence:structuredClone(input.evidence??{}),recommendation:input.recommendation??null};
  return deepFreeze({...body,finding_checksum:sha256(stable(body))});
}
export function verifyMaintenanceFinding(f){if(!f?.finding_checksum)throw new MaintenanceError('MAINTENANCE_FINDING_INVALID');const body=Object.fromEntries(Object.entries(f).filter(([k])=>k!=='finding_checksum'));if(sha256(stable(body))!==f.finding_checksum)throw new MaintenanceError('MAINTENANCE_FINDING_CHECKSUM_MISMATCH');return true;}
