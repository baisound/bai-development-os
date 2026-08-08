import { DISTRIBUTED_VERSION } from './constants.mjs';
import { DistributedError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, requireString, safeId } from './util.mjs';
export function createDistributedCheckpointReceipt(input = {}, { clock = () => new Date() } = {}) {
  const r={distributed_checkpoint_receipt_version:DISTRIBUTED_VERSION,receipt_id:safeId(input.receipt_id??newId('DCP'),'receipt_id'),scope:safeId(input.scope,'scope'),node_id:safeId(input.node_id??'local-node','node_id'),local_revision:String(input.local_revision??'0'),local_checksum:requireString(input.local_checksum,'local_checksum'),canonical_epoch:input.canonical_epoch??null,created_at:nowIso(clock),previous_receipt_checksum:input.previous_receipt_checksum??null,statement:'TAMPER_EVIDENT_LOCAL_RECEIPT_NOT_GLOBAL_ATOMIC_LEDGER'}; r.content_checksum=checksumObject(r); return deepFreeze(r);
}
export function verifyDistributedCheckpointReceipt(r,{previous_receipt_checksum=null}={}){if(!r||r.distributed_checkpoint_receipt_version!==DISTRIBUTED_VERSION||r.content_checksum!==checksumObject(r))throw new DistributedError('DISTRIBUTED_CHECKPOINT_TAMPERED'); if(previous_receipt_checksum!==null&&r.previous_receipt_checksum!==previous_receipt_checksum)throw new DistributedError('DISTRIBUTED_CHECKPOINT_CHAIN_MISMATCH'); return true;}
