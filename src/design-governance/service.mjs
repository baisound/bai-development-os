import {
  analyzeRoadmapImpact, createDesignIntakeCheckpoint, createHandoffIntakeManifest,
  createInteractionAcceptanceRecord, createRegressionSurfaceRecord,
  curateHandoffSources, deepFreeze, discoverDesignGaps, evaluateDesignCompleteness,
  mapExistingImplementation, resumeDesignIntake, revalidateHandoffClaims,
  routeImprovementCandidate,
} from './contracts.mjs';
import { DesignGovernanceRepository } from './repository.mjs';

export class ConsumerDesignGovernanceService {
  constructor({ root = null, repository = null, clock = () => new Date() } = {}) {
    this.repository = repository ?? (root ? new DesignGovernanceRepository({ root, clock }) : null);
  }
  capabilities() { return deepFreeze(['HANDOFF_INTAKE', 'SOURCE_CURATION', 'CLAIM_REVALIDATION', 'IMPLEMENTATION_COVERAGE', 'GAP_DISCOVERY', 'ROADMAP_RECOMMENDATION_ONLY', 'DESIGN_COMPLETENESS', 'IMPROVEMENT_CANDIDATE_ROUTING_ONLY', 'CHECKPOINT_RESUME', 'ATOMIC_REVISION_STORE']); }
  createHandoffIntake(input) { return createHandoffIntakeManifest(input); }
  curateHandoffSources(manifest, decisions) { return curateHandoffSources(manifest, decisions); }
  revalidateHandoffClaims(input) { return revalidateHandoffClaims(input); }
  mapExistingImplementation(input) { return mapExistingImplementation(input); }
  discoverDesignGaps(input) { return discoverDesignGaps(input); }
  analyzeRoadmapImpact(input) { return analyzeRoadmapImpact(input); }
  evaluateDesignCompleteness(input) { return evaluateDesignCompleteness(input); }
  routeImprovementCandidate(input) { return routeImprovementCandidate(input); }
  createRegressionSurfaceRecord(input) { return createRegressionSurfaceRecord(input); }
  createInteractionAcceptanceRecord(input) { return createInteractionAcceptanceRecord(input); }
  createDesignIntakeCheckpoint(input) { return createDesignIntakeCheckpoint(input); }
  resumeDesignIntake(checkpoint, current) { return resumeDesignIntake(checkpoint, current); }
  async persistRevision(input) {
    if (!this.repository) throw new TypeError('Design Governance repository is not configured');
    return this.repository.persistRevision(input);
  }
  async verifyRevision(intakeId, revision) {
    if (!this.repository) throw new TypeError('Design Governance repository is not configured');
    return this.repository.verifyRevision(intakeId, revision);
  }
}
