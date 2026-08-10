from __future__ import annotations
import hashlib, json, urllib.error, urllib.parse, urllib.request, uuid
from datetime import datetime, timezone
from .policy import ClientPolicy, intersect_policy, privacy_allows
from .sanitizer import sanitize_event

def _iso_now(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
def _batch_id(events:list[dict])->str:
 material='|'.join(e['event_id'] for e in events).encode('utf-8'); return 'batch-'+hashlib.sha256(material).hexdigest()[:24]

def _acknowledged_event_ids(receipt:dict,batch:dict)->list[str]:
    if receipt.get('receipt_version') != '1.0' or receipt.get('batch_id') != batch.get('batch_id'): raise ValueError('receipt binding mismatch')
    accepted=list(receipt.get('accepted') or []); seen=list(receipt.get('already_seen') or []); rejected=list(receipt.get('rejected') or [])
    rejected_ids=[x.get('event_id') for x in rejected if isinstance(x,dict)]
    outcomes=accepted+seen+rejected_ids
    if any(not isinstance(x,str) or not x for x in outcomes) or len(outcomes)!=len(set(outcomes)): raise ValueError('receipt Event outcomes invalid')
    expected={e['event_id'] for e in batch.get('events',[])}
    if any(x not in expected for x in outcomes): raise ValueError('receipt contains unknown Event')
    return accepted+seen
class EvidenceClient:
    """Fail-isolated Product-owned reference. Product primary flow must never depend on delivery."""
    def __init__(self, endpoint:str, product_id:str, product_version:str, installation_id:str, credential_provider, outbox, timeout_seconds:float=3.0, local_policy:ClientPolicy|None=None):
        self.endpoint=endpoint.rstrip('/');self.product_id=product_id;self.product_version=product_version;self.installation_id=installation_id;self.credential_provider=credential_provider;self.outbox=outbox;self.timeout_seconds=timeout_seconds;self.local_policy=local_policy or ClientPolicy();self.effective_policy=self.local_policy
    def record_event(self,event_type:str,feature:str,result:str,privacy_level:str='P0',*,properties:dict|None=None,duration_ms:int|None=None,retry_count:int=0,error_code:str|None=None,event_id:str|None=None)->dict:
        try:
            eid=event_id or str(uuid.uuid4())
            if not privacy_allows(self.effective_policy.max_privacy_level,privacy_level): return {'status':'dropped_by_policy','reason':'privacy_cap'}
            rate=float(self.effective_policy.sampling.get(event_type,1.0));score=int.from_bytes(hashlib.sha256(eid.encode()).digest()[:8],'big')/float(1<<64)
            if rate<=0 or (rate<1 and score>=rate): return {'status':'dropped_by_policy','reason':'sampling'}
            if self.effective_policy.enabled_features and feature not in self.effective_policy.enabled_features:return {'status':'dropped_by_policy','reason':'feature_disabled'}
            event={'event_id':eid,'occurred_at':_iso_now(),'type':event_type,'feature':feature,'result':result,'retry_count':retry_count,'privacy_level':privacy_level,'properties':properties or {}}
            if duration_ms is not None:event['duration_ms']=duration_ms
            if error_code is not None:event['error_code']=error_code
            clean=sanitize_event(event);self.outbox.enqueue(clean);return {'status':'queued','event_id':eid}
        except (ValueError,OverflowError,OSError,KeyError,TypeError): return {'status':'dropped','reason':'local_evidence_error'}
    def _credential(self):
        try:return self.credential_provider.get_secret() if self.credential_provider.is_configured() else None
        except Exception:return None
    def _batch(self,events):
        created=max((e['occurred_at'] for e in events),default=_iso_now())
        return {'schema_version':'1.0','batch_id':_batch_id(events),'created_at':created,'product':{'product_id':self.product_id,'product_version':self.product_version},'installation':{'installation_id':self.installation_id},'events':events}
    def refresh_policy(self)->dict:
        secret=self._credential()
        if not secret:return {'status':'credential_unavailable'}
        req=urllib.request.Request(self.endpoint+'/v1/client-policy?'+urllib.parse.urlencode({'product_id':self.product_id,'product_version':self.product_version}),headers={'Authorization':f'Bearer {secret}'})
        try:
            with urllib.request.urlopen(req,timeout=self.timeout_seconds) as r:
                server=ClientPolicy.from_dict(json.loads(r.read().decode()));self.effective_policy=intersect_policy(self.local_policy,server);return {'status':'ok','policy':self.effective_policy}
        except urllib.error.HTTPError as e:return {'status':f'http_{e.code}'}
        except Exception:return {'status':'network_or_policy_unavailable'}
    def flush(self,max_events:int|None=None)->dict:
        try:
            events=self.outbox.list_events(min(max_events or self.effective_policy.max_batch_events,self.effective_policy.max_batch_events))
            if not events:return {'status':'empty','accepted':[]}
            secret=self._credential()
            if not secret:return {'status':'credential_unavailable','accepted':[]}
            batch=self._batch(events);raw=json.dumps(batch,ensure_ascii=False,separators=(',',':')).encode()
            if len(raw)>self.effective_policy.max_payload_bytes:return {'status':'payload_too_large','accepted':[]}
            req=urllib.request.Request(self.endpoint+'/v1/evidence/batch',data=raw,method='POST',headers={'Authorization':f'Bearer {secret}','Content-Type':'application/json'})
            with urllib.request.urlopen(req,timeout=self.timeout_seconds) as r:
                receipt=json.loads(r.read().decode());ack=_acknowledged_event_ids(receipt,batch);self.outbox.acknowledge(ack);return {'status':'ok',**receipt}
        except urllib.error.HTTPError as e:return {'status':f'http_{e.code}','accepted':[],'retry_after':e.headers.get('Retry-After')}
        except Exception:return {'status':'delivery_unavailable','accepted':[]}
