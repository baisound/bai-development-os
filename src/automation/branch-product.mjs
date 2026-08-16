import { requireArray, requireString } from './util.mjs';

export class CompletionError extends Error {
  constructor(code, message){ super(message); this.name = 'CompletionError'; this.code = code; }
}

export function evaluateBranchCleanup(input){
  const branch = requireString(input?.branch, 'branch', CompletionError);
  const checks = {
    pr_merged: input?.pr_state === 'MERGED',
    head_reachable: input?.head_reachable_from_main === true,
    expected_oid: Boolean(input?.expected_head_oid) && input?.expected_head_oid === input?.actual_head_oid,
    clean_worktree: input?.worktree_clean === true,
    no_worktree_binding: input?.worktree_binding_count === 0,
    no_active_lock: input?.active_lock_count === 0,
    no_unmerged_descendants: input?.unmerged_descendant_count === 0,
    not_protected: input?.protected_branch !== true && branch !== 'main',
    delete_capability: input?.delete_capability === true,
  };
  const failed = Object.entries(checks).filter(([, pass]) => !pass).map(([name]) => name);
  return failed.length === 0 ? { result: 'BRANCH_CLEANUP_ELIGIBLE', branch } : { result: 'BRANCH_CLEANUP_BLOCKED', branch, failed };
}

export function evaluateProductCompletion(input){
  requireString(input?.product_id, 'product_id', CompletionError);
  requireString(input?.revision, 'revision', CompletionError);
  requireArray(input?.required_gates, 'required_gates', CompletionError);
  requireArray(input?.gate_receipts, 'gate_receipts', CompletionError);
  if(new Set(input.required_gates).size !== input.required_gates.length) throw new CompletionError('COMPLETION_REQUIRED_GATE_DUPLICATE', input.product_id);
  const receiptIds = input.gate_receipts.map((receipt) => receipt?.gate_id);
  if(new Set(receiptIds).size !== receiptIds.length) throw new CompletionError('COMPLETION_GATE_RECEIPT_DUPLICATE', input.product_id);
  const receipts = new Map(input.gate_receipts.map((receipt) => [receipt.gate_id, receipt]));
  const failed = [];
  for(const gate of input.required_gates){
    const receipt = receipts.get(gate);
    if(!receipt) failed.push(`${gate}:MISSING`);
    else if(receipt.revision !== input.revision) failed.push(`${gate}:STALE_REVISION`);
    else if(receipt.result !== 'PASS') failed.push(`${gate}:${receipt.result}`);
    else if(receipt.current_valid !== true) failed.push(`${gate}:NOT_CURRENT_VALID`);
  }
  for(const gateId of receiptIds) if(!input.required_gates.includes(gateId)) failed.push(`${gateId}:EXTRA`);
  if(input.judge_result !== 'PASS') failed.push(`JUDGE:${input.judge_result ?? 'MISSING'}`);
  if(input.lifecycle_state !== 'COMPLETED') failed.push(`LIFECYCLE:${input.lifecycle_state ?? 'MISSING'}`);
  if(input.closure_state !== 'CLOSED') failed.push(`CLOSURE:${input.closure_state ?? 'MISSING'}`);
  if(failed.length) return { result: 'PRODUCT_COMPLETION_NOT_ESTABLISHED', product_id: input.product_id, failed };
  return { result: 'PRODUCT_COMPLETE', product_id: input.product_id, revision: input.revision };
}
