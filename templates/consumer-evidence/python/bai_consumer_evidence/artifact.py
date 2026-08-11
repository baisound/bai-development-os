from __future__ import annotations
import hashlib, json, re
from datetime import datetime
_SEGMENT=re.compile(r'^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$')
def canonical_json(value:dict)->str:
 return json.dumps(value,ensure_ascii=False,separators=(',',':'),sort_keys=True)
def batch_sha256(batch:dict)->str:
 value=dict(batch); value.pop('content_sha256',None); return hashlib.sha256(canonical_json(value).encode('utf-8')).hexdigest()
def with_hash(batch:dict)->dict:
 out=dict(batch); out.pop('content_sha256',None); out['content_sha256']=batch_sha256(out); return out
def _segment(value:str)->str:
 v=str(value)
 if not _SEGMENT.fullmatch(v) or '..' in v: raise ValueError('unsafe object key segment')
 return v
def object_key(batch:dict)->str:
 d=datetime.fromisoformat(batch['created_at'].replace('Z','+00:00'))
 return f"consumer-evidence/v1/{_segment(batch['product']['product_id'])}/{d:%Y/%m/%d}/{_segment(batch['installation']['installation_id'])}/{_segment(batch['batch_id'])}.json"
def build_artifact(batch:dict)->dict:
 b=with_hash(batch); body=canonical_json(b)+'\n'; return {'key':object_key(b),'content_type':'application/json','encoding':'utf-8','compression':'none','content_sha256':b['content_sha256'],'body':body}
