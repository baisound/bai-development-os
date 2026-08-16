import { checksumObject, deepFreeze, requireString, sha256, stable } from './util.mjs';

export class NotificationError extends Error {
  constructor(code, message){ super(message); this.name = 'NotificationError'; this.code = code; }
}

export const NOTIFICATION_CLASSES = Object.freeze(['ROUTINE', 'MILESTONE', 'DECISION_REQUIRED', 'INCIDENT']);
const ALLOWED_PUBLIC_FIELDS = new Set(['title', 'summary', 'status', 'decision', 'incident_code', 'task_id', 'lane_id', 'evidence_coordinate']);

export function createNotificationEnvelope(input){
  if(!NOTIFICATION_CLASSES.includes(input?.notification_class)) throw new NotificationError('NOTIFICATION_CLASS_INVALID', String(input?.notification_class));
  const publicPayload = {};
  for(const [key, value] of Object.entries(input.public_payload ?? {})){
    if(!ALLOWED_PUBLIC_FIELDS.has(key)) throw new NotificationError('NOTIFICATION_FIELD_NOT_ALLOWED', key);
    if(typeof value !== 'string') throw new NotificationError('NOTIFICATION_FIELD_VALUE_INVALID', key);
    publicPayload[key] = value;
  }
  const semanticId = sha256(stable({ event_coordinate: input.event_coordinate, notification_class: input.notification_class, audience: input.audience, public_payload: publicPayload }));
  const envelope = {
    schema: 'BAI_NOTIFICATION_ENVELOPE_V1', notification_id: semanticId.slice(7), semantic_notification_id: semanticId,
    event_coordinate: requireString(input.event_coordinate, 'event_coordinate', NotificationError),
    notification_class: input.notification_class, audience: requireString(input.audience, 'audience', NotificationError),
    public_payload: publicPayload, state: input.notification_class === 'ROUTINE' ? 'LEDGER_ONLY' : 'PENDING',
    attempt_count: 0, acknowledged_at: null, expires_at: input.expires_at ?? null, superseded_by: null,
    created_at: requireString(input.created_at, 'created_at', NotificationError), updated_at: requireString(input.created_at, 'created_at', NotificationError),
  };
  envelope.content_checksum = checksumObject(envelope); return deepFreeze(envelope);
}

export function createNotificationOutbox(){
  const rows = new Map();
  return {
    enqueue(envelope){
      if(checksumObject(envelope) !== envelope.content_checksum) throw new NotificationError('NOTIFICATION_TAMPERED', envelope.notification_id);
      const existing = rows.get(envelope.semantic_notification_id);
      if(existing && existing.content_checksum !== envelope.content_checksum) throw new NotificationError('NOTIFICATION_SEMANTIC_COLLISION', envelope.semantic_notification_id);
      if(!existing) rows.set(envelope.semantic_notification_id, structuredClone(envelope));
      return deepFreeze(structuredClone(rows.get(envelope.semantic_notification_id)));
    },
    recordAttempt(id, { at, adapter_result }){
      const row = required(rows, id); if(row.state !== 'PENDING') throw new NotificationError('NOTIFICATION_NOT_DELIVERABLE', row.state);
      row.attempt_count += 1; row.updated_at = at;
      if(adapter_result === 'DELIVERED') row.state = 'DELIVERED';
      else if(adapter_result === 'UNKNOWN') row.state = 'PENDING';
      else if(adapter_result !== 'UNAVAILABLE') throw new NotificationError('NOTIFICATION_ADAPTER_RESULT_INVALID', adapter_result);
      refresh(row); return deepFreeze(structuredClone(row));
    },
    acknowledge(id, { at }){ const row = required(rows, id); if(!['PENDING', 'DELIVERED'].includes(row.state)) throw new NotificationError('NOTIFICATION_ACK_INVALID', row.state); row.state = 'ACKNOWLEDGED'; row.acknowledged_at = at; row.updated_at = at; refresh(row); return deepFreeze(structuredClone(row)); },
    supersede(id, { by, at }){ const row = required(rows, id); if(row.state === 'ACKNOWLEDGED') throw new NotificationError('NOTIFICATION_ALREADY_ACKNOWLEDGED', id); row.state = 'SUPERSEDED'; row.superseded_by = by; row.updated_at = at; refresh(row); return deepFreeze(structuredClone(row)); },
    expire(id, { at }){ const row = required(rows, id); if(!row.expires_at || Date.parse(at) < Date.parse(row.expires_at)) throw new NotificationError('NOTIFICATION_NOT_EXPIRED', id); row.state = 'EXPIRED'; row.updated_at = at; refresh(row); return deepFreeze(structuredClone(row)); },
    get(id){ const row = rows.get(id); return row ? deepFreeze(structuredClone(row)) : null; },
    snapshot(){ return deepFreeze([...rows.entries()].map(([key, row]) => [key, structuredClone(row)])); },
  };
}
function required(rows, id){ const row = rows.get(id); if(!row) throw new NotificationError('NOTIFICATION_MISSING', id); return row; }
function refresh(row){ row.content_checksum = checksumObject(row); }
