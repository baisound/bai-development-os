from __future__ import annotations
from dataclasses import dataclass, field

_PRIVACY_ORDER = {"P0": 0, "P1": 1, "P2": 2}

def privacy_allows(cap: str, requested: str) -> bool:
    return cap in _PRIVACY_ORDER and requested in _PRIVACY_ORDER and _PRIVACY_ORDER[requested] <= _PRIVACY_ORDER[cap]

@dataclass(frozen=True)
class ClientPolicy:
    policy_version: str = "1.0"
    accepted_schema_versions: tuple[str, ...] = ("1.0",)
    event_catalog_version: str = "1.0"
    sampling: dict[str, float] = field(default_factory=dict)
    enabled_features: tuple[str, ...] = ()
    max_batch_events: int = 100
    max_payload_bytes: int = 262144
    max_outbox_bytes: int = 5 * 1024 * 1024
    max_privacy_level: str = "P1"
    @classmethod
    def from_dict(cls, value: dict) -> "ClientPolicy":
        privacy=value.get("max_privacy_level","P1")
        if privacy not in _PRIVACY_ORDER: raise ValueError("invalid privacy level")
        sampling={str(k):float(v) for k,v in value.get("sampling",{}).items()}
        if any(v < 0.0 or v > 1.0 for v in sampling.values()): raise ValueError("invalid sampling rate")
        versions=tuple(str(x) for x in value.get("accepted_schema_versions",["1.0"]))
        if not versions: raise ValueError("no accepted schema versions")
        batch_events=int(value.get("max_batch_events",100)); payload_bytes=int(value.get("max_payload_bytes",262144)); outbox_bytes=int(value.get("max_outbox_bytes",5*1024*1024))
        if not 1 <= batch_events <= 100: raise ValueError("invalid max_batch_events")
        if not 1024 <= payload_bytes <= 1048576: raise ValueError("invalid max_payload_bytes")
        if outbox_bytes < 0: raise ValueError("invalid max_outbox_bytes")
        return cls(policy_version=str(value.get("policy_version","1.0")),accepted_schema_versions=versions,event_catalog_version=str(value.get("event_catalog_version","1.0")),sampling=sampling,enabled_features=tuple(str(x) for x in value.get("enabled_features",[])),max_batch_events=batch_events,max_payload_bytes=payload_bytes,max_outbox_bytes=outbox_bytes,max_privacy_level=privacy)

def intersect_policy(local: ClientPolicy, server: ClientPolicy) -> ClientPolicy:
    if local.event_catalog_version != server.event_catalog_version: raise ValueError("event catalog version mismatch")
    versions=tuple(sorted(set(local.accepted_schema_versions)&set(server.accepted_schema_versions)))
    if not versions: raise ValueError("schema version mismatch")
    max_privacy = local.max_privacy_level if _PRIVACY_ORDER[local.max_privacy_level] <= _PRIVACY_ORDER[server.max_privacy_level] else server.max_privacy_level
    lf, sf = set(local.enabled_features), set(server.enabled_features)
    enabled = tuple(sorted(sf if not lf else lf if not sf else lf & sf))
    keys = set(local.sampling) | set(server.sampling)
    sampling = {k: min(local.sampling.get(k, 1.0), server.sampling.get(k, 1.0)) for k in keys}
    return ClientPolicy(policy_version=f"{local.policy_version}&{server.policy_version}",accepted_schema_versions=versions,event_catalog_version=local.event_catalog_version,sampling=sampling,enabled_features=enabled,max_batch_events=min(local.max_batch_events,server.max_batch_events),max_payload_bytes=min(local.max_payload_bytes,server.max_payload_bytes),max_outbox_bytes=min(local.max_outbox_bytes,server.max_outbox_bytes),max_privacy_level=max_privacy)
