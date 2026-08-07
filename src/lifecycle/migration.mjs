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
export {digest as migrationChecksum};
