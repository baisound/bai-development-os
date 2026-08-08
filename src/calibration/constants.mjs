export const CALIBRATION_VERSION = '1.0.0';
export const CALIBRATION_SUBSYSTEMS = Object.freeze([
  'GOVERNANCE', 'KNOWLEDGE', 'AUTOMATION', 'MONITORING', 'INTEGRATION',
  'SECURITY', 'RELEASE', 'CONFORMANCE', 'MAINTENANCE', 'EXTENSION',
]);
export const EVIDENCE_CLASSES = Object.freeze(['REAL', 'SANDBOX', 'SIMULATED', 'DECLARED']);
export const VERIFIED_EVIDENCE_CLASSES = Object.freeze(['REAL', 'SANDBOX']);
export const EVIDENCE_CLASS_WEIGHTS = Object.freeze({ REAL: 1, SANDBOX: 0.8, SIMULATED: 0.35, DECLARED: 0.1 });
export const EVALUATION_MODES = Object.freeze(['COUNTERFACTUAL', 'SHADOW']);
export const EVALUATION_RESULTS = Object.freeze(['PASS', 'FAIL', 'INSUFFICIENT']);
export const ADJUSTMENT_EFFECTS = Object.freeze(['ADVISORY', 'TIGHTEN', 'WEAKEN']);

export const IMMUTABLE_POLICY_PREFIXES = Object.freeze([
  'governance.safety_floor.',
  'governance.owner_gate.',
  'knowledge.mandatory.',
  'automation.owner_required.',
  'monitoring.mandatory_integrity.',
  'monitoring.mandatory_privacy.',
  'integration.external_authorization.',
  'integration.credential_secrecy.',
  'security.mandatory.',
  'security.restricted_data.',
  'release.signature_required.',
  'release.security_gate.',
  'release.mandatory_compatibility.',
  'conformance.evidence_classification.',
  'conformance.real_execution_floor.',
  'maintenance.mutation_precondition.',
  'maintenance.owner_gate.',
  'maintenance.single_use_plan.',
  'extension.core_authority.',
  'extension.execution_authorization.',
  'extension.capability_broker_required.',
]);

export const ABSOLUTELY_IMMUTABLE_POLICY_KEYS = Object.freeze([
  'governance.model_policy',
  'integration.external_authorization.required',
  'security.mandatory.secret_handling',
  'conformance.evidence_classification.real_definition',
  'maintenance.mutation_precondition.required',
  'extension.core_authority.override_allowed',
  'extension.capability_broker_required.enabled',
]);

export const DEVELOPMENT_PROFILE_MINIMUM_RANKS = Object.freeze({
  'governance.profile_min.CORE': 3,
  'governance.profile_min.FOUNDATION': 4,
  'governance.failure_impact_min.CRITICAL': 4,
  'governance.system_scale_min.FOUNDATION': 4,
  'governance.system_scale_min.MULTI_PROJECT': 3,
});
