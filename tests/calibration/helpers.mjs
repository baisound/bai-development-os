import { createCalibrationEvidence } from '../../src/calibration/evidence.mjs';
export const fixedClock = () => new Date('2026-08-08T11:00:00.000Z');
export function series({ subsystem='GOVERNANCE', metric='review_cycles_used', values=[0,1,1,1,2,1,0,1,1,2], evidence_class='REAL', project_id='proj-a' }={}) {
  return values.map((value,index)=>createCalibrationEvidence({evidence_id:`CE-${subsystem}-${metric}-${index}`.replace(/[^A-Za-z0-9._:-]/g,'_').slice(0,120),project_id,task_id:'TASK-014',subsystem,metric,value,evidence_class,source:'TEST'}, {clock:fixedClock}));
}
export const evaluator = async (sample) => ({ baseline:{cost:sample.baseCost??10,quality:sample.baseQuality??10,risk:sample.baseRisk??1}, proposed:{cost:sample.proposedCost??8,quality:sample.proposedQuality??10,risk:sample.proposedRisk??1,mandatory_violation:sample.mandatory_violation??false} });
