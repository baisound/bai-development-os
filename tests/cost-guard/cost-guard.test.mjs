import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  CostGuardError, estimateModelCostMicrousd, evaluateCostReservation, readCostLedger, recordActualCost,
  releaseCostReservation, reserveCost, summarizeCostLedger, validateCostBudgets,
} from '../../src/cost-guard/index.mjs';
import { evaluateExecutionBudget, deriveExecutionLimits } from '../../src/governance/execution-budget-policy.mjs';
import { selectDevelopmentProfile } from '../../src/governance/adaptive-development-profile.mjs';
const budgets={soft_limit_ratio:.8,task:{max_input_tokens:1000,max_output_tokens:500,max_cost_microusd:1000},role:{max_cost_microusd:900},session:{max_cost_microusd:800}};
async function root(t){const value=await mkdtemp(path.join(tmpdir(),'cost-guard-'));t.after(()=>rm(value,{recursive:true,force:true}));return value;}
const ids={task_id:'TASK-004',role:'Builder',session_id:'s1'};

test('CGC-PRICE: token pricing converts USD-per-million to micro-USD deterministically',()=>{
  assert.equal(estimateModelCostMicrousd({input_tokens:1000,output_tokens:500,input_usd_per_million:2,output_usd_per_million:8}),6000);
  assert.throws(()=>estimateModelCostMicrousd({input_tokens:-1,input_usd_per_million:1,output_usd_per_million:1}),(e)=>e.code==='COST_USAGE_INVALID');
});

test('CGC-BUDGET: invalid budgets fail closed',()=>{assert.throws(()=>validateCostBudgets({task:{max_cost_microusd:-1}}),(e)=>e.code==='COST_BUDGET_INVALID');assert.throws(()=>validateCostBudgets({soft_limit_ratio:1}));});

test('CGC-RESERVE: normal reservation is persisted and counted',async(t)=>{const r=await root(t);const reserved=await reserveCost({root:r,budgets,...ids,input_tokens:100,output_tokens:40,cost_microusd:200});assert.equal(reserved.decision,'PASS');const summary=summarizeCostLedger(await readCostLedger(r),ids);assert.equal(summary.reserved_cost_microusd,200);assert.equal(summary.active_reservations,1);});

test('CGC-SOFT: near-limit reservation warns but remains executable',async(t)=>{const r=await root(t);const evaluation=await evaluateCostReservation({root:r,budgets,...ids,cost_microusd:650});assert.equal(evaluation.decision,'SOFT_LIMIT');assert.ok(evaluation.warnings.includes('session.cost_microusd'));});

test('CGC-HARD: any task/role/session projected hard budget violation stops before reservation',async(t)=>{for(const [i,cost] of [801,901,1001].entries()){const r=await root(t);const variant=structuredClone(budgets);if(i===0){variant.role.max_cost_microusd=5000;variant.task.max_cost_microusd=5000;}if(i===1){variant.session.max_cost_microusd=5000;variant.task.max_cost_microusd=5000;}if(i===2){variant.session.max_cost_microusd=5000;variant.role.max_cost_microusd=5000;}await assert.rejects(()=>reserveCost({root:r,budgets:variant,...ids,cost_microusd:cost}),(e)=>e.code==='COST_HARD_STOP');assert.equal((await readCostLedger(r)).length,0);}});

test('CGC-ACTUAL: actual usage settles reservation and is not double-counted',async(t)=>{const r=await root(t);const reservation=await reserveCost({root:r,budgets,...ids,cost_microusd:200,input_tokens:20});await recordActualCost({root:r,reservation_id:reservation.reservation_id,...ids,cost_microusd:180,input_tokens:18});const summary=summarizeCostLedger(await readCostLedger(r),ids);assert.equal(summary.reserved_cost_microusd,0);assert.equal(summary.actual_cost_microusd,180);await assert.rejects(()=>recordActualCost({root:r,reservation_id:reservation.reservation_id,...ids,cost_microusd:1}),(e)=>e.code==='COST_RESERVATION_INVALID');});

test('CGC-BINDING: reservation cannot be settled by another task/role/session',async(t)=>{const r=await root(t);const reservation=await reserveCost({root:r,budgets,...ids,cost_microusd:100});await assert.rejects(()=>recordActualCost({root:r,reservation_id:reservation.reservation_id,...ids,role:'Critic',cost_microusd:100}),(e)=>e.code==='COST_RESERVATION_BINDING_MISMATCH');});

test('CGC-RELEASE: unused reservation can be explicitly released',async(t)=>{const r=await root(t);const reservation=await reserveCost({root:r,budgets,...ids,cost_microusd:100});await releaseCostReservation({root:r,reservation_id:reservation.reservation_id,...ids});assert.equal(summarizeCostLedger(await readCostLedger(r),ids).active_reservations,0);});

test('CGC-LEDGER: tamper in append-only event chain is detected',async(t)=>{const r=await root(t);await reserveCost({root:r,budgets,...ids,cost_microusd:100});const file=path.join(r,'cost-events.jsonl');const text=await readFile(file,'utf8');await writeFile(file,text.replace('RESERVATION_CREATED','RESERVATION_RELEASED'));await assert.rejects(()=>readCostLedger(r),(e)=>e.code==='COST_LEDGER_CORRUPT');});



test('CGC-BINDING: task/role/session identifiers are mandatory before budget evaluation',async(t)=>{const r=await root(t);await assert.rejects(()=>reserveCost({root:r,budgets,task_id:'',role:'Builder',session_id:'s1',cost_microusd:1}),(e)=>e.code==='COST_BINDING_INVALID');assert.equal((await readCostLedger(r)).length,0);});

test('CGC-ATOMIC: concurrent reservations cannot both overcommit the same budget',async(t)=>{const r=await root(t);const tight={soft_limit_ratio:.8,task:{max_cost_microusd:100},role:{max_cost_microusd:100},session:{max_cost_microusd:100}};const results=await Promise.allSettled([reserveCost({root:r,budgets:tight,...ids,cost_microusd:60}),reserveCost({root:r,budgets:tight,...ids,cost_microusd:60})]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(results.filter(x=>x.status==='rejected').length,1);const rejected=results.find(x=>x.status==='rejected').reason;assert.ok(['COST_LEDGER_LOCK_CONFLICT','COST_HARD_STOP'].includes(rejected.code));const summary=summarizeCostLedger(await readCostLedger(r),ids);assert.equal(summary.reserved_cost_microusd,60);const evaluation=await evaluateCostReservation({root:r,budgets:tight,...ids,cost_microusd:60});assert.equal(evaluation.decision,'HARD_STOP');});

test('CGC-ATOMIC: concurrent settlement permits exactly one terminal event',async(t)=>{const r=await root(t);const reservation=await reserveCost({root:r,budgets,...ids,cost_microusd:100});const results=await Promise.allSettled([recordActualCost({root:r,reservation_id:reservation.reservation_id,...ids,cost_microusd:90}),releaseCostReservation({root:r,reservation_id:reservation.reservation_id,...ids})]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(results.filter(x=>x.status==='rejected').length,1);const summary=summarizeCostLedger(await readCostLedger(r),ids);assert.equal(summary.active_reservations,0);const terminals=(await readCostLedger(r)).filter(x=>x.reservation_id===reservation.reservation_id&&['ACTUAL_RECORDED','RESERVATION_RELEASED'].includes(x.event_type));assert.equal(terminals.length,1);});

test('CGC-BOUNDARY: exact hard budget remains executable and one-over hard stops',async(t)=>{const r=await root(t);const tight={soft_limit_ratio:.8,task:{max_cost_microusd:100},role:{max_cost_microusd:100},session:{max_cost_microusd:100}};const exact=await reserveCost({root:r,budgets:tight,...ids,cost_microusd:100});assert.equal(exact.decision,'SOFT_LIMIT');await releaseCostReservation({root:r,reservation_id:exact.reservation_id,...ids});await assert.rejects(()=>reserveCost({root:r,budgets:tight,...ids,cost_microusd:101}),(e)=>e.code==='COST_HARD_STOP');});

test('P18-BOUNDARY: exact retry/review/artifact/model limits pass hard-stop boundary',()=>{const result=evaluateExecutionBudget({usage:{retry_attempts:2,review_cycles:2,artifact_bytes:1000,model_call_cost_microusd:500},limits:{max_retry_attempts:2,max_review_cycles:2,max_artifact_bytes:1000,max_model_call_cost_microusd:500}});assert.notEqual(result.decision,'HARD_STOP');});

test('P18-PROFILE: execution review cap is bounded by Adaptive Development Profile',()=>{const profile=selectDevelopmentProfile({criticality:'FOUNDATION'});const limits=deriveExecutionLimits({profile_selection:profile,configured:{max_review_cycles:9}});assert.equal(limits.max_review_cycles,2);});

test('P18-RETRY: exceeding retry cap is a hard stop',()=>{const result=evaluateExecutionBudget({usage:{retry_attempts:3},limits:{max_retry_attempts:2}});assert.equal(result.decision,'HARD_STOP');assert.ok(result.hard_stop_reasons.includes('MAX_RETRY_ATTEMPTS'));});

test('P18-REVIEW: excessive Critic/fix cycles hard stop instead of looping tokens',()=>{const result=evaluateExecutionBudget({usage:{review_cycles:3},limits:{max_review_cycles:2}});assert.equal(result.decision,'HARD_STOP');assert.ok(result.hard_stop_reasons.includes('MAX_REVIEW_CYCLES'));});

test('P18-ARTIFACT: oversized artifact estimate hard stops before generation',()=>{const result=evaluateExecutionBudget({usage:{artifact_bytes:1001},limits:{max_artifact_bytes:1000}});assert.equal(result.decision,'HARD_STOP');assert.ok(result.hard_stop_reasons.includes('MAX_ARTIFACT_BYTES'));});

test('P18-MODEL-COST: expensive single call can be stopped without choosing a model',()=>{const result=evaluateExecutionBudget({usage:{model_call_cost_microusd:501},limits:{max_model_call_cost_microusd:500}});assert.equal(result.decision,'HARD_STOP');assert.equal(result.model_selection_policy,'UNCHANGED');});

test('P18-QUOTA: quota and billing errors hard stop automatic retries',()=>{for(const failure of ['QUOTA_EXCEEDED','BILLING_ERROR']){const result=evaluateExecutionBudget({failure});assert.equal(result.decision,'HARD_STOP');assert.ok(result.hard_stop_reasons.includes(failure));}});

test('P18-SOFT: near limit produces warning before hard stop',()=>{const result=evaluateExecutionBudget({usage:{artifact_bytes:850},limits:{max_artifact_bytes:1000,soft_limit_ratio:.8}});assert.equal(result.decision,'SOFT_LIMIT');assert.ok(result.warnings.includes('ARTIFACT_BYTES_NEAR_LIMIT'));});

test('P18-MODEL-POLICY: Phase 1.8 does not alter permanent model-selection policy',()=>{const result=evaluateExecutionBudget({usage:{model_call_cost_microusd:1}});assert.equal(result.model_selection_policy,'UNCHANGED');});
