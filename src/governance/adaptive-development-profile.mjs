const ENUMS = Object.freeze({
  system_scale: ['LOCAL', 'PROJECT', 'MULTI_PROJECT', 'FOUNDATION'],
  feature_scale: ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'],
  criticality: ['AUXILIARY', 'STANDARD', 'CORE', 'FOUNDATION'],
  failure_impact: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
  reversibility: ['EASY', 'MODERATE', 'HARD'],
  novelty: ['ROUTINE', 'ADAPTATION', 'NEW_ARCHITECTURE'],
  change_kind: ['DOC_ONLY', 'TEST_ONLY', 'CONFIG', 'BUGFIX', 'FEATURE', 'REFACTOR', 'ARCHITECTURE'],
});

const WEIGHTS = Object.freeze({
  system_scale: { LOCAL: 0, PROJECT: 1, MULTI_PROJECT: 2, FOUNDATION: 4 },
  feature_scale: { MICRO: 0, SMALL: 1, MEDIUM: 2, LARGE: 4 },
  criticality: { AUXILIARY: 0, STANDARD: 1, CORE: 4, FOUNDATION: 6 },
  failure_impact: { LOW: 0, MODERATE: 1, HIGH: 4, CRITICAL: 6 },
  reversibility: { EASY: 0, MODERATE: 1, HARD: 3 },
  novelty: { ROUTINE: 0, ADAPTATION: 1, NEW_ARCHITECTURE: 3 },
  change_kind: { DOC_ONLY: 0, TEST_ONLY: 0, CONFIG: 1, BUGFIX: 1, FEATURE: 2, REFACTOR: 2, ARCHITECTURE: 4 },
});

export const DEVELOPMENT_PROFILES = Object.freeze({
  DEV_0_QUICK: Object.freeze({
    rank: 0,
    label: 'Quick',
    design_depth: 'NONE_OR_INLINE_NOTE',
    required_roles: ['Builder'],
    critic: 'NOT_REQUIRED',
    tester: 'NOT_REQUIRED',
    judge: 'NOT_REQUIRED',
    test_requirements: ['TARGETED_VALIDATION_IF_EXECUTABLE_BEHAVIOR_CHANGES'],
    review_cycle_cap: 0,
    revalidation_scope: 'IMPACTED_ONLY',
    evidence_level: 'MINIMAL',
  }),
  DEV_1_LIGHT: Object.freeze({
    rank: 1,
    label: 'Light',
    design_depth: 'SHORT_CHANGE_PLAN',
    required_roles: ['Builder'],
    critic: 'CONDITIONAL',
    tester: 'CONDITIONAL',
    judge: 'NOT_REQUIRED',
    test_requirements: ['TARGETED_UNIT_OR_SMOKE'],
    review_cycle_cap: 1,
    revalidation_scope: 'IMPACTED_ONLY',
    evidence_level: 'LIGHT',
  }),
  DEV_2_STANDARD: Object.freeze({
    rank: 2,
    label: 'Standard',
    design_depth: 'FOCUSED_DESIGN',
    required_roles: ['Builder', 'Tester'],
    critic: 'REQUIRED_ON_DESIGN_OR_IMPLEMENTATION',
    tester: 'REQUIRED',
    judge: 'CONDITIONAL',
    test_requirements: ['UNIT', 'RELEVANT_INTEGRATION', 'TARGETED_REGRESSION'],
    review_cycle_cap: 1,
    revalidation_scope: 'IMPACTED_ONLY',
    evidence_level: 'STANDARD',
  }),
  DEV_3_HIGH_ASSURANCE: Object.freeze({
    rank: 3,
    label: 'High Assurance',
    design_depth: 'DETAILED_DESIGN',
    required_roles: ['Builder', 'Critic', 'Tester'],
    critic: 'REQUIRED_DESIGN_AND_IMPLEMENTATION',
    tester: 'REQUIRED_INDEPENDENT_WHEN_AVAILABLE',
    judge: 'REQUIRED_FOR_GATE_OR_HIGH_RISK_DECISION',
    test_requirements: ['UNIT', 'BOUNDARY_NEGATIVE', 'INTEGRATION', 'REGRESSION'],
    review_cycle_cap: 2,
    revalidation_scope: 'IMPACTED_PLUS_RELEVANT_REGRESSION',
    evidence_level: 'HIGH',
  }),
  DEV_4_FOUNDATION_CRITICAL: Object.freeze({
    rank: 4,
    label: 'Foundation Critical',
    design_depth: 'ARCHITECTURE_AND_FAILURE_MODE_DESIGN',
    required_roles: ['Builder', 'Critic', 'Tester', 'Judge'],
    critic: 'REQUIRED_INDEPENDENT_DESIGN_AND_IMPLEMENTATION',
    tester: 'REQUIRED_INDEPENDENT',
    judge: 'REQUIRED',
    test_requirements: [
      'UNIT', 'BOUNDARY_NEGATIVE', 'INTEGRATION', 'REGRESSION',
      'CONTRACT', 'FAULT_INJECTION_OR_RECOVERY', 'CONSUMER_FIXTURE_WHEN_APPLICABLE',
    ],
    review_cycle_cap: 2,
    revalidation_scope: 'IMPACTED_PLUS_CORE_REGRESSION',
    evidence_level: 'CRITICAL',
  }),
});

const PROFILE_ORDER = Object.freeze(Object.keys(DEVELOPMENT_PROFILES));
const BOOLEAN_RISK_FLAGS = Object.freeze([
  'touches_security',
  'touches_authorization',
  'touches_state_machine',
  'data_migration',
  'cross_project_contract',
  'external_side_effects',
]);

const requireEnum = (field, value) => {
  if (!ENUMS[field].includes(value)) {
    throw new TypeError(`${field} must be one of: ${ENUMS[field].join(', ')}`);
  }
};

export function validateDevelopmentChange(input = {}) {
  const normalized = {
    system_scale: input.system_scale ?? 'PROJECT',
    feature_scale: input.feature_scale ?? 'SMALL',
    criticality: input.criticality ?? 'STANDARD',
    failure_impact: input.failure_impact ?? 'MODERATE',
    reversibility: input.reversibility ?? 'EASY',
    novelty: input.novelty ?? 'ROUTINE',
    change_kind: input.change_kind ?? 'FEATURE',
    ...Object.fromEntries(BOOLEAN_RISK_FLAGS.map((flag) => [flag, input[flag] ?? false])),
  };
  for (const field of Object.keys(ENUMS)) requireEnum(field, normalized[field]);
  for (const flag of BOOLEAN_RISK_FLAGS) {
    if (typeof normalized[flag] !== 'boolean') throw new TypeError(`${flag} must be boolean`);
  }
  return Object.freeze(normalized);
}

function scoreChange(change) {
  let score = 0;
  for (const field of Object.keys(WEIGHTS)) score += WEIGHTS[field][change[field]];
  score += BOOLEAN_RISK_FLAGS.reduce((sum, flag) => sum + (change[flag] ? 2 : 0), 0);
  return score;
}

function profileFromScore(score) {
  if (score <= 2) return 'DEV_0_QUICK';
  if (score <= 5) return 'DEV_1_LIGHT';
  if (score <= 10) return 'DEV_2_STANDARD';
  if (score <= 16) return 'DEV_3_HIGH_ASSURANCE';
  return 'DEV_4_FOUNDATION_CRITICAL';
}

function maxProfile(left, right) {
  return DEVELOPMENT_PROFILES[left].rank >= DEVELOPMENT_PROFILES[right].rank ? left : right;
}

function applySafetyFloors(change, initialProfile, reasons) {
  let profile = initialProfile;
  const floor = (candidate, reason) => {
    const elevated = maxProfile(profile, candidate);
    if (elevated !== profile) reasons.push(reason);
    profile = elevated;
  };

  if (change.criticality === 'CORE') floor('DEV_3_HIGH_ASSURANCE', 'CORE_FUNCTION_MINIMUM');
  if (change.criticality === 'FOUNDATION') floor('DEV_4_FOUNDATION_CRITICAL', 'FOUNDATION_FUNCTION_MINIMUM');
  if (change.failure_impact === 'CRITICAL') floor('DEV_4_FOUNDATION_CRITICAL', 'CRITICAL_FAILURE_IMPACT');
  if (change.system_scale === 'FOUNDATION') floor('DEV_4_FOUNDATION_CRITICAL', 'FOUNDATION_SYSTEM_SCALE');
  if (change.system_scale === 'MULTI_PROJECT') floor('DEV_3_HIGH_ASSURANCE', 'MULTI_PROJECT_IMPACT');
  if (change.cross_project_contract) floor('DEV_3_HIGH_ASSURANCE', 'CROSS_PROJECT_CONTRACT');
  if (change.touches_security || change.touches_authorization || change.touches_state_machine || change.data_migration) {
    floor('DEV_3_HIGH_ASSURANCE', 'HIGH_RISK_CHANGE_CLASS');
  }
  if (change.feature_scale === 'LARGE' && change.failure_impact === 'HIGH') {
    floor('DEV_4_FOUNDATION_CRITICAL', 'LARGE_HIGH_IMPACT_COMBINATION');
  }
  return profile;
}

function deriveExecution(profileId, change) {
  const base = DEVELOPMENT_PROFILES[profileId];
  const executableChange = !['DOC_ONLY', 'TEST_ONLY'].includes(change.change_kind);
  const requiredTests = executableChange
    ? [...base.test_requirements]
    : change.change_kind === 'TEST_ONLY' ? ['TEST_SUITE_SELF_VALIDATION'] : ['DOCUMENT_LINK_AND_CONSISTENCY_CHECK'];

  return Object.freeze({
    ...base,
    required_roles: Object.freeze([...base.required_roles]),
    test_requirements: Object.freeze(requiredTests),
    token_efficiency_rules: Object.freeze([
      'SUMMARY_FIRST_CONTEXT',
      'IMPACTED_ARTIFACTS_ONLY_BY_DEFAULT',
      'NO_FULL_REVIEW_RESTART_FOR_LOCAL_FIX',
      'STOP_AFTER_REVIEW_CYCLE_CAP_AND_ESCALATE_UNRESOLVED_ITEMS',
    ]),
    model_policy: 'UNCHANGED_BY_PROFILE',
  });
}

export function selectDevelopmentProfile(input = {}) {
  const change = validateDevelopmentChange(input);
  const score = scoreChange(change);
  const reasons = [`BASE_SCORE_${score}`];
  const scoreProfile = profileFromScore(score);
  const profile_id = applySafetyFloors(change, scoreProfile, reasons);
  if (profile_id !== scoreProfile) reasons.unshift(`SCORE_PROFILE_${scoreProfile}`);

  return Object.freeze({
    profile_id,
    score,
    reasons: Object.freeze(reasons),
    change,
    execution: deriveExecution(profile_id, change),
  });
}

export function applyProfileOverride(selection, requestedProfile, { owner_authorized = false, justification = '' } = {}) {
  if (!selection?.profile_id || !DEVELOPMENT_PROFILES[requestedProfile]) throw new TypeError('valid selection and requestedProfile are required');
  const currentRank = DEVELOPMENT_PROFILES[selection.profile_id].rank;
  const requestedRank = DEVELOPMENT_PROFILES[requestedProfile].rank;
  if (requestedRank >= currentRank) {
    return Object.freeze({ ...selection, profile_id: requestedProfile, override: 'ESCALATED', override_justification: justification || 'MANUAL_ESCALATION', execution: deriveExecution(requestedProfile, selection.change) });
  }
  if (!owner_authorized || !justification.trim()) throw new Error('PROFILE_DEESCALATION_REQUIRES_OWNER_AUTHORIZATION_AND_JUSTIFICATION');
  if (selection.change.criticality === 'FOUNDATION' || selection.change.failure_impact === 'CRITICAL' || selection.change.system_scale === 'FOUNDATION') {
    throw new Error('PROFILE_DEESCALATION_FORBIDDEN_FOR_FOUNDATION_OR_CRITICAL_CHANGE');
  }
  return Object.freeze({ ...selection, profile_id: requestedProfile, override: 'OWNER_DEESCALATED', override_justification: justification, execution: deriveExecution(requestedProfile, selection.change) });
}

export { ENUMS as DEVELOPMENT_PROFILE_ENUMS, PROFILE_ORDER as DEVELOPMENT_PROFILE_ORDER };
