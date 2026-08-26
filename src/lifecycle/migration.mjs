import { createHash, randomUUID } from 'node:crypto';
const canonical=(v)=>JSON.stringify(sort(v));const sort=(v)=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
const digest=(v)=>`sha256:${createHash('sha256').update(canonical((()=>{const c=structuredClone(v);delete c.checksum;return c;})())).digest('hex')}`;
export class MigrationError extends Error{constructor(code,message=code){super(message);this.code=code;}}
export function createLegacyMapping({source_task_id,legacy_expression,mapped_state,confidence,source_evidence,mapped_by},{clock=()=>new Date()}={}){
  if(!/^TASK-\d{3,}$/.test(source_task_id)||typeof legacy_expression!=='string'||!legacy_expression||!['HIGH','MEDIUM'].includes(confidence)||!Array.isArray(source_evidence)||!source_evidence.length||!mapped_by)throw new MigrationError('MIGRATION_NOT_CONFIRMED');
  const m={mapping_id:randomUUID(),source_task_id,legacy_expression,mapped_state:structuredClone(mapped_state),confidence,source_evidence:structuredClone(source_evidence),mapped_by,created_at:clock().toISOString()};m.checksum=digest(m);return Object.freeze(m);
}
export function verifyLegacyMapping(mapping,{valid_states}={}){
  if(!mapping||mapping.checksum!==digest(mapping)||!['HIGH','MEDIUM'].includes(mapping.confidence))throw new MigrationError('MIGRATION_NOT_CONFIRMED');
  if(valid_states){for(const [axis,allowed] of Object.entries(valid_states)){if(!allowed.includes(mapping.mapped_state?.[axis]))throw new MigrationError('MIGRATION_NOT_CONFIRMED');}}
  return Object.freeze({result:'MIGRATION_MAPPING_CONFIRMED',mapping_id:mapping.mapping_id});
}
export function createDesignOnlyClosureMigrationPlan({task_id,project_id,baseline_commit,required_runtime_commit,canonical_record_version='1.1.0',source_record_revision,source_record_checksum,writer_drained,lease_absent,journal_absent,backup_checksum,owner_authorization_checksum},{clock=()=>new Date()}={}){
  if(!/^TASK-\d{3,}$/.test(task_id)||typeof project_id!=='string'||!project_id||!/^[a-f0-9]{40}$/.test(baseline_commit??'')||!/^[a-f0-9]{40}$/.test(required_runtime_commit??'')||!['1.1.0','1.2.0'].includes(canonical_record_version)||!Number.isSafeInteger(source_record_revision)||source_record_revision<1||!/^sha256:[a-f0-9]{64}$/.test(source_record_checksum??'')||writer_drained!==true||lease_absent!==true||journal_absent!==true||!/^sha256:[a-f0-9]{64}$/.test(backup_checksum??'')||!/^sha256:[a-f0-9]{64}$/.test(owner_authorization_checksum??''))throw new MigrationError('DESIGN_ONLY_MIGRATION_NOT_READY');
  const plan={migration_plan_version:'1.0.0',task_id,project_id,baseline_commit,required_runtime_commit,source_record_version:canonical_record_version,source_record_revision,source_record_checksum,preconditions:{writer_drained:true,lease_absent:true,journal_absent:true,backup_checksum,owner_authorization_checksum},steps:['INSTALL_RUNTIME','SHADOW_VALIDATE_1_1','ESTABLISH_SINGLE_WRITER','PREPARE_CLASSIFICATION','COMMIT_CLASSIFICATION','VERIFY_CLASSIFICATION_RECEIPT','PREPARE_DESIGN_ONLY_CLOSURE','COMMIT_DESIGN_ONLY_CLOSURE','VERIFY_COMPLETION_RECEIPT','MATERIALIZE_SIGNED_BINDING_SNAPSHOT','RECALCULATE_DEPENDENCIES_AND_QUEUE'],point_of_no_return:'FIRST_COMMITTED_1_2_RECORD_OR_EVENT',created_at:clock().toISOString()};plan.checksum=digest(plan);return Object.freeze(plan);
}
export async function evaluateDesignOnlyRollback(plan,{lifecycle_store=null}={}){
  if(!plan||plan.checksum!==digest(plan)||plan.migration_plan_version!=='1.0.0')throw new MigrationError('DESIGN_ONLY_MIGRATION_NOT_READY');
  if(!lifecycle_store||typeof lifecycle_store.inspectDesignOnlyMigrationBoundary!=='function')return Object.freeze({decision:'ROLLBACK_BLOCKED',recovery:'VERIFIED_CANONICAL_LOG_RECEIPT_PROOF_REQUIRED'});
  let proof;try{proof=await lifecycle_store.inspectDesignOnlyMigrationBoundary();}catch{return Object.freeze({decision:'ROLLBACK_BLOCKED',recovery:'VERIFIED_CANONICAL_LOG_RECEIPT_PROOF_REQUIRED'});}
  const proofFields=['result','project_id','task_id','record_revision','record_checksum','record_schema_version','committed_1_2','journal_present','lease_present','legacy_journal_present'];
  if(!proof||Object.keys(proof).sort().join('|')!==proofFields.sort().join('|')||proof.result!=='DESIGN_ONLY_MIGRATION_BOUNDARY_VERIFIED'||proof.project_id!==plan.project_id||proof.task_id!==plan.task_id||proof.record_revision!==plan.source_record_revision||proof.record_checksum!==plan.source_record_checksum||proof.record_schema_version!==plan.source_record_version||['committed_1_2','journal_present','lease_present','legacy_journal_present'].some((field)=>typeof proof[field]!=='boolean')||proof.journal_present||proof.lease_present||proof.legacy_journal_present)return Object.freeze({decision:'ROLLBACK_BLOCKED',recovery:'DRAIN_OR_FORWARD_RECOVER'});
  if(proof.committed_1_2===true)return Object.freeze({decision:'DOWNGRADE_FORBIDDEN',recovery:'RESTORE_TASK021_RUNTIME_AND_FORWARD_RECOVER'});
  return Object.freeze({decision:'ROLLBACK_ALLOWED',recovery:'RESTORE_BACKUP_AND_PREVIOUS_RUNTIME'});
}
export {digest as migrationChecksum};
