from __future__ import annotations
import hashlib, json, urllib.error, urllib.parse, urllib.request, uuid
from datetime import datetime, timezone
from .policy import ClientPolicy, intersect_policy, privacy_allows
from .sanitizer import sanitize_event

class EvidenceClient:
    """Fail-isolated reference client. Evidence failures are returned as status, not raised into Product flow."""
    def __init__(self, endpoint: str, product_id: str, product_version: str, credential_provider, outbox, timeout_seconds: float = 3.0, local_policy: ClientPolicy | None = None):
        self.endpoint = endpoint.rstrip("/")
        self.product_id = product_id
        self.product_version = product_version
        self.credential_provider = credential_provider
        self.outbox = outbox
        self.timeout_seconds = timeout_seconds
        self.local_policy = local_policy or ClientPolicy()
        self.effective_policy = self.local_policy
    def record_event(self, event_type: str, privacy_level: str, payload: dict, *, event_id: str | None = None, installation_id: str | None = None) -> dict:
        try:
            eid = event_id or str(uuid.uuid4())
            if not privacy_allows(self.effective_policy.max_privacy_level, privacy_level):
                return {"status":"dropped_by_policy", "reason":"privacy_cap"}
            if event_type != "user_feedback":
                rate = float(self.effective_policy.sampling.get(event_type, 1.0))
                score = int.from_bytes(hashlib.sha256(eid.encode("utf-8")).digest()[:8], "big") / float(1 << 64)
                if rate <= 0.0 or (rate < 1.0 and score >= rate):
                    return {"status":"dropped_by_policy", "reason":"sampling"}
            feature = payload.get("feature") if isinstance(payload, dict) else None
            if feature and self.effective_policy.enabled_features and feature not in self.effective_policy.enabled_features:
                return {"status":"dropped_by_policy", "reason":"feature_disabled"}
            clean = sanitize_event(event_type, privacy_level, payload)
            event = {"schema_version":"1.0","event_id":eid,"occurred_at":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"product":{"product_id":self.product_id,"product_version":self.product_version},"installation_id":installation_id,"event_type":event_type,"privacy_level":privacy_level,"payload":clean}
            self.outbox.enqueue(event)
            return {"status":"queued", "event_id":eid}
        except (ValueError, OverflowError, OSError, KeyError, TypeError):
            return {"status":"dropped", "reason":"local_evidence_error"}
    def _credential(self) -> str | None:
        try:
            if not self.credential_provider.is_configured(): return None
            return self.credential_provider.get_secret()
        except Exception:
            return None
    def refresh_policy(self) -> dict:
        secret=self._credential()
        if not secret: return {"status":"credential_unavailable"}
        url=self.endpoint+"/v1/client-policy?"+urllib.parse.urlencode({"product_id":self.product_id,"product_version":self.product_version})
        req=urllib.request.Request(url,headers={"Authorization":f"Bearer {secret}"})
        try:
            with urllib.request.urlopen(req,timeout=self.timeout_seconds) as r:
                raw=json.loads(r.read().decode("utf-8")); server=ClientPolicy.from_dict(raw); self.effective_policy=intersect_policy(self.local_policy,server)
                if hasattr(self.outbox, "max_bytes"):
                    self.outbox.max_bytes = min(int(self.outbox.max_bytes), int(self.effective_policy.max_outbox_bytes))
                return {"status":"ok", "policy":self.effective_policy}
        except urllib.error.HTTPError as e: return {"status":f"http_{e.code}"}
        except (urllib.error.URLError,TimeoutError,ValueError,TypeError,KeyError): return {"status":"network_or_policy_unavailable"}
    def flush(self, max_events: int | None = None) -> dict:
        try:
            limit=min(max_events or self.effective_policy.max_batch_events,self.effective_policy.max_batch_events)
            events=self.outbox.list_events(limit)
            if not events: return {"status":"empty","accepted":[]}
            secret=self._credential()
            if not secret: return {"status":"credential_unavailable","accepted":[]}
            raw=json.dumps({"schema_version":"1.0","events":events},ensure_ascii=False,separators=(",",":")).encode("utf-8")
            if len(raw)>self.effective_policy.max_payload_bytes: return {"status":"payload_too_large","accepted":[]}
            req=urllib.request.Request(self.endpoint+"/v1/evidence/batch",data=raw,method="POST",headers={"Authorization":f"Bearer {secret}","Content-Type":"application/json"})
            with urllib.request.urlopen(req,timeout=self.timeout_seconds) as r:
                receipt=json.loads(r.read().decode("utf-8")); ack=list(receipt.get("accepted",[]))+list(receipt.get("already_seen",[])); self.outbox.acknowledge(ack); return {"status":"ok",**receipt}
        except urllib.error.HTTPError as e:
            return {"status":f"http_{e.code}","accepted":[],"retry_after":e.headers.get("Retry-After")}
        except (urllib.error.URLError,TimeoutError,OSError,ValueError,TypeError,KeyError,json.JSONDecodeError):
            return {"status":"delivery_unavailable","accepted":[]}
