import { createMonitoringEvent } from './event.mjs';
import { appendMonitoringEvent, readMonitoringEventLedger, verifyMonitoringEventLedger } from './store.mjs';
import { buildMonitoringSnapshot } from './snapshot.mjs';
import { buildDashboardModel, buildWorkspaceDashboard } from './dashboard.mjs';
import { buildCorrelationTrace, queryMonitoringEvents } from './audit.mjs';
import { deepFreeze } from './util.mjs';
export async function recordMonitoringObservation(root,input,options={}){const event=createMonitoringEvent(input,options);const record=await appendMonitoringEvent(root,event);return deepFreeze({result:'MONITORING_OBSERVATION_RECORDED',event,record_checksum:record.record_checksum});}
export async function buildProjectMonitoringView(input,options={}){const snapshot=buildMonitoringSnapshot(input,options);const dashboard=buildDashboardModel(snapshot,options);return deepFreeze({result:'MONITORING_VIEW_READY',snapshot,dashboard});}
export async function queryMonitoringAudit(root,query={}){const ledger=await readMonitoringEventLedger(root);return deepFreeze({result:'MONITORING_AUDIT_QUERY_READY',events:queryMonitoringEvents(ledger,query)});}
export async function traceMonitoringCorrelation(root,correlation_id){const ledger=await readMonitoringEventLedger(root);return deepFreeze({result:'MONITORING_CORRELATION_TRACE_READY',trace:buildCorrelationTrace(ledger,correlation_id)});}
export async function verifyMonitoringStore(root){return verifyMonitoringEventLedger(root);}
export function buildMultiProjectMonitoringView(snapshots,options={}){return deepFreeze({result:'WORKSPACE_MONITORING_VIEW_READY',dashboard:buildWorkspaceDashboard(snapshots,options)});}
