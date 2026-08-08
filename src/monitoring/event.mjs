import { COMPONENTS, MONITORING_VERSION, SEVERITIES } from './constants.mjs';
import { MonitoringError, checksumObject, deepFreeze, id, nowIso, requireString } from './util.mjs';
const RFC3339=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
export function createMonitoringEvent(input={}, {clock=()=>new Date()}={}){
  const component=requireString(input.component,'component').toUpperCase(); if(!COMPONENTS.includes(component))throw new MonitoringError('MONITORING_COMPONENT_INVALID',component);
  const observed_at=input.observed_at??nowIso(clock); if(typeof observed_at!=='string'||!RFC3339.test(observed_at)||Number.isNaN(Date.parse(observed_at)))throw new MonitoringError('MONITORING_TIME_INVALID');
  const severity_hint=(input.severity_hint??'INFO').toUpperCase(); if(!SEVERITIES.includes(severity_hint))throw new MonitoringError('MONITORING_SEVERITY_INVALID');
  const event={monitoring_event_version:MONITORING_VERSION,event_id:input.event_id??id('ME'),observed_at,project_id:requireString(input.project_id,'project_id'),task_id:input.task_id??null,run_id:input.run_id??null,correlation_id:input.correlation_id??input.run_id??null,component,metric:requireString(input.metric,'metric'),value:structuredClone(input.value),unit:input.unit??null,severity_hint,evidence:Array.isArray(input.evidence)?input.evidence.map(x=>structuredClone(x)):[],attributes:input.attributes&&typeof input.attributes==='object'?structuredClone(input.attributes):{}};
  for(const f of ['task_id','run_id','correlation_id']) if(event[f]!==null&&(typeof event[f]!=='string'||!event[f]))throw new MonitoringError('MONITORING_INPUT_INVALID',f);
  event.content_checksum=checksumObject(event); return deepFreeze(event);
}
export function verifyMonitoringEvent(event){
  if(!event||event.monitoring_event_version!==MONITORING_VERSION||event.content_checksum!==checksumObject(event))throw new MonitoringError('MONITORING_EVENT_TAMPERED');
  if(!COMPONENTS.includes(event.component)||!SEVERITIES.includes(event.severity_hint))throw new MonitoringError('MONITORING_EVENT_INVALID');
  return true;
}
