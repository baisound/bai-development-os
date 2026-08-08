import { CALIBRATION_SUBSYSTEMS, CALIBRATION_VERSION, EVIDENCE_CLASSES, EVIDENCE_CLASS_WEIGHTS } from './constants.mjs';
import { CalibrationError } from './errors.mjs';
import { checksumObject, deepFreeze, newId, nowIso, requireEnum, requireFiniteNumber, requireString, safeId } from './util.mjs';

export function createCalibrationEvidence(input = {}, { clock = () => new Date() } = {}) {
  const subsystem = requireEnum(String(input.subsystem ?? '').toUpperCase(), CALIBRATION_SUBSYSTEMS, 'subsystem');
  const evidence_class = requireEnum(String(input.evidence_class ?? 'REAL').toUpperCase(), EVIDENCE_CLASSES, 'evidence_class');
  const event = {
    calibration_evidence_version: CALIBRATION_VERSION,
    evidence_id: safeId(input.evidence_id ?? newId('CE'), 'evidence_id'),
    observed_at: input.observed_at ?? nowIso(clock),
    project_id: safeId(input.project_id, 'project_id'),
    task_id: input.task_id == null ? null : safeId(input.task_id, 'task_id'),
    subsystem,
    metric: requireString(input.metric, 'metric'),
    value: requireFiniteNumber(input.value, 'value'),
    unit: input.unit ?? null,
    evidence_class,
    evidence_weight: input.evidence_weight ?? EVIDENCE_CLASS_WEIGHTS[evidence_class],
    source: requireString(input.source ?? 'DIRECT', 'source'),
    source_ref: input.source_ref ?? null,
    dimensions: input.dimensions && typeof input.dimensions === 'object' ? structuredClone(input.dimensions) : {},
    attributes: input.attributes && typeof input.attributes === 'object' ? structuredClone(input.attributes) : {},
  };
  if (!Number.isFinite(event.evidence_weight) || event.evidence_weight <= 0 || event.evidence_weight > 1) throw new CalibrationError('CALIBRATION_EVIDENCE_WEIGHT_INVALID');
  if (Number.isNaN(Date.parse(event.observed_at))) throw new CalibrationError('CALIBRATION_TIME_INVALID');
  event.content_checksum = checksumObject(event);
  return deepFreeze(event);
}

export function verifyCalibrationEvidence(event) {
  if (!event || event.calibration_evidence_version !== CALIBRATION_VERSION) throw new CalibrationError('CALIBRATION_EVIDENCE_VERSION_INVALID');
  if (event.content_checksum !== checksumObject(event)) throw new CalibrationError('CALIBRATION_EVIDENCE_TAMPERED');
  requireEnum(event.subsystem, CALIBRATION_SUBSYSTEMS, 'subsystem');
  requireEnum(event.evidence_class, EVIDENCE_CLASSES, 'evidence_class');
  requireFiniteNumber(event.value, 'value');
  return true;
}

const MONITORING_COMPONENT_MAP = Object.freeze({
  GOVERNANCE: 'GOVERNANCE', KNOWLEDGE: 'KNOWLEDGE', AUTOMATION: 'AUTOMATION', INTEGRATION: 'INTEGRATION',
  QUALITY: 'GOVERNANCE', COST: 'GOVERNANCE', CONTEXT: 'AUTOMATION', REGISTRY: 'MAINTENANCE',
  LIFECYCLE: 'GOVERNANCE', SYSTEM: 'MONITORING', MODEL: 'AUTOMATION',
});

export function evidenceFromMonitoringEvent(event, { subsystem = null, evidence_class = 'REAL', clock } = {}) {
  if (!event || typeof event !== 'object' || typeof event.metric !== 'string') throw new CalibrationError('CALIBRATION_MONITORING_EVENT_INVALID');
  if (typeof event.value !== 'number' || !Number.isFinite(event.value)) throw new CalibrationError('CALIBRATION_MONITORING_VALUE_NON_NUMERIC');
  const mapped = subsystem ?? MONITORING_COMPONENT_MAP[event.component] ?? 'MONITORING';
  return createCalibrationEvidence({
    evidence_id: `CE-${String(event.event_id ?? newId('ME')).replace(/[^A-Za-z0-9._:-]/g, '_').slice(0, 120)}`,
    observed_at: event.observed_at,
    project_id: event.project_id,
    task_id: event.task_id,
    subsystem: mapped,
    metric: event.metric,
    value: event.value,
    unit: event.unit,
    evidence_class,
    source: 'MONITORING_EVENT',
    source_ref: event.content_checksum ?? event.event_id ?? null,
    dimensions: { component: event.component, ...(event.attributes ?? {}) },
  }, { clock });
}
