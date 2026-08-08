import { createConformanceFixture, referenceFixtures } from './fixture.mjs';
import { buildCompatibilityMatrix } from './matrix.mjs';
import { evaluateNamespaceIsolation, evaluateOwnershipRecords } from './isolation.mjs';
import { allocateFairCapacity, evaluateNoisyNeighbor } from './fairness.mjs';
import { evaluateProviderEquivalence, runProviderFailureMatrix } from './provider.mjs';
import { evaluateUpgradeChain } from './upgrade.mjs';
import { evaluatePortabilityCoverage } from './portability.mjs';
import { createCertification, deriveCompatibilityLevel } from './certification.mjs';
import { runConformanceLab } from './lab.mjs';
import { runConsumerContract } from './runner.mjs';
export class ConformanceService {
  fixture(input){ return createConformanceFixture(input); }
  references(){ return referenceFixtures(); }
  matrix(input){ return buildCompatibilityMatrix(input); }
  isolation(fixtures,options){ return evaluateNamespaceIsolation(fixtures,options); }
  ownership(records){ return evaluateOwnershipRecords(records); }
  fairness(input){ return allocateFairCapacity(input); }
  noisyNeighbor(input){ return evaluateNoisyNeighbor(input); }
  providerEquivalence(providers,required){ return evaluateProviderEquivalence(providers,required); }
  providerFailureMatrix(input){ return runProviderFailureMatrix(input); }
  upgradeChain(input){ return evaluateUpgradeChain(input); }
  portability(input){ return evaluatePortabilityCoverage(input); }
  certification(input){ return createCertification(input); }
  level(input){ return deriveCompatibilityLevel(input); }
  consumerContract(input){ return runConsumerContract(input); }
  run(input){ return runConformanceLab(input); }
}
