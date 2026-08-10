from __future__ import annotations
import re
_CATALOG={
 ('feature_result','subtitle_import'):{'privacy':{'P0','P1'},'results':{'success','failure'},'properties':{'cue_count':int}},
 ('performance','long_running_job_result'):{'privacy':{'P0','P1'},'results':{'success','failure'},'properties':{'chunk_count':int,'resume_used':bool,'resumed_chunk_count':int}},
 ('correction','subtitle_review_summary'):{'privacy':{'P0','P1'},'results':{'completed','aborted'},'properties':{'imported_cue_count':int,'edited_cue_count':int,'inserted_cue_count':int,'deleted_cue_count':int,'approved_cue_count':int,'export_success':bool}},
}
_SECRET=[re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),re.compile(r'\bsk-[A-Za-z0-9_-]{20,}\b'),re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}\b'),re.compile(r'\bAKIA[A-Z0-9]{16}\b'),re.compile(r'\bBearer\s+[A-Za-z0-9._~+\/-]{16,}\b',re.I)]
_PATH=[re.compile(r'\b[A-Za-z]:\\'),re.compile(r'/(?:home|Users)/[^\s/]+/')]
_EMAIL=re.compile(r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b',re.I)
_PHONE_LIKE=re.compile(r'(?<!\d)(?:\+\d{1,3}[ -])?(?:\(?\d{2,4}\)?[ -])\d{2,4}[ -]\d{3,4}(?!\d)')
_FORBIDDEN_KEY=re.compile(r'(?:api[_-]?key|token|secret|password|authorization|credential|subtitle|transcript|prompt|raw[_-]?content|file[_-]?content|file[_-]?path|absolute[_-]?path|filename|email|phone|username|crash[_-]?dump)',re.I)
def _safe_string(v:str)->None:
 if any(p.search(v) for p in _SECRET): raise ValueError('secret-like content rejected')
 if any(p.search(v) for p in _PATH): raise ValueError('absolute path rejected')
 if _EMAIL.search(v) or _PHONE_LIKE.search(v): raise ValueError('personal data rejected')
def sanitize_event(event:dict)->dict:
 if event.get('privacy_level') not in {'P0','P1','P2'}: raise ValueError('P3/raw content is not accepted')
 allowed={'event_id','occurred_at','type','feature','operation','result','duration_ms','retry_count','error_code','privacy_level','properties'}
 if set(event)-allowed: raise ValueError('unknown event field')
 feature_present=bool(event.get('feature')); operation_present=bool(event.get('operation'))
 if feature_present == operation_present: raise ValueError('exactly one of feature or operation is required')
 feature=event.get('feature') or event.get('operation'); entry=_CATALOG.get((event.get('type'),feature))
 if not entry: raise ValueError('event not in catalog')
 if event.get('privacy_level') not in entry['privacy']: raise ValueError('privacy level not allowed for catalog entry')
 if event.get('result') not in entry['results']: raise ValueError('result not allowed')
 props=dict(event.get('properties') or {})
 if set(props)-set(entry['properties']): raise ValueError('property not allowed')
 for k,v in props.items():
  if _FORBIDDEN_KEY.search(k): raise ValueError('forbidden field')
  typ=entry['properties'][k]
  if typ is int and (isinstance(v,bool) or not isinstance(v,int) or v<0): raise ValueError('invalid numeric property')
  if typ is bool and not isinstance(v,bool): raise ValueError('invalid boolean property')
 for k,v in event.items():
  if _FORBIDDEN_KEY.search(k): raise ValueError('forbidden field')
  if isinstance(v,str): _safe_string(v)
 return {**event,'properties':props}
