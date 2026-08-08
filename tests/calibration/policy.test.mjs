import test from 'node:test';import assert from 'node:assert/strict';
import { evaluateAdjustmentSafety, createPolicyCandidate, verifyPolicyCandidate } from '../../src/calibration/policy.mjs';
import { buildCalibrationReport } from '../../src/calibration/recommendation.mjs';
import { series } from './helpers.mjs';

test('advisory calibration is allowed',()=>assert.equal(evaluateAdjustmentSafety({policy_key:'integration.timeout_ms',current_value:1000,proposed_value:1200,effect:'ADVISORY'}).decision,'ALLOW'));
test('mandatory security floor weakening is blocked',()=>assert.equal(evaluateAdjustmentSafety({policy_key:'security.mandatory.secret_handling',current_value:true,proposed_value:false,effect:'WEAKEN'}).decision,'BLOCK'));
test('external authorization cannot be learned away',()=>assert.equal(evaluateAdjustmentSafety({policy_key:'integration.external_authorization.required',current_value:true,proposed_value:false,effect:'WEAKEN'}).decision,'BLOCK'));
test('extension Core override can never be enabled',()=>assert.equal(evaluateAdjustmentSafety({policy_key:'extension.core_authority.override_allowed',current_value:false,proposed_value:true,effect:'ADVISORY'}).decision,'BLOCK'));
test('Capability Broker requirement cannot be disabled',()=>assert.equal(evaluateAdjustmentSafety({policy_key:'extension.capability_broker_required.enabled',current_value:true,proposed_value:false,effect:'ADVISORY'}).decision,'BLOCK'));
test('CORE profile floor cannot fall below DEV-3',()=>assert.equal(evaluateAdjustmentSafety({policy_key:'governance.profile_min.CORE',current_value:'DEV_3_HIGH_ASSURANCE',proposed_value:'DEV_2_STANDARD',effect:'ADVISORY'}).decision,'BLOCK'));
test('CORE profile may tighten',()=>assert.equal(evaluateAdjustmentSafety({policy_key:'governance.profile_min.CORE',current_value:'DEV_3_HIGH_ASSURANCE',proposed_value:'DEV_4_FOUNDATION_CRITICAL',effect:'TIGHTEN'}).decision,'ALLOW'));
test('candidate is bound to source report and evaluation requirements',()=>{const r=buildCalibrationReport(series());const c=createPolicyCandidate({report:r,selected_policy_keys:['governance.review_cycle_cap']});assert.equal(c.safety_decision,'ALLOW');assert.deepEqual(c.evaluation_requirements,['COUNTERFACTUAL','SHADOW']);assert.equal(verifyPolicyCandidate(c),true);});
test('candidate checksum tampering fails',()=>{const r=buildCalibrationReport(series());const c=createPolicyCandidate({report:r,selected_policy_keys:['governance.review_cycle_cap']});assert.throws(()=>verifyPolicyCandidate({...c,base_policy_version:'x'}),/TAMPERED/);});
