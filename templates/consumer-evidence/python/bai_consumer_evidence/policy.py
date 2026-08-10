from __future__ import annotations
from dataclasses import dataclass, field

_PRIVACY_ORDER = {"P0": 0, "P1": 1, "P2": 2}

def privacy_allows(cap: str, requested: str) -> bool:
    return cap in _PRIVACY_ORDER and requested in _PRIVACY_ORDER and _PRIVACY_ORDER[requested] <= _PRIVACY_ORDER[cap]

@dataclass(frozen=True)
class ClientPolicy:
    policy_version: str = "1.0"
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
        return cls(policy_version=str(value.get("policy_version","1.0")),sampling=sampling,enabled_features=tuple(str(x) for x in value.get("enabled_features",[])),max_batch_events=max(1,min(100,int(value.get("max_batch_events",100)))),max_payload_bytes=max(1024,int(value.get("max_payload_bytes",262144))),max_outbox_bytes=max(0,int(value.get("max_outbox_bytes",5*1024*1024))),max_privacy_level=privacy)

def intersect_policy(local: ClientPolicy, server: ClientPolicy) -> ClientPolicy:
    max_privacy = local.max_privacy_level if _PRIVACY_ORDER[local.max_privacy_level] <= _PRIVACY_ORDER[server.max_privacy_level] else server.max_privacy_level
    lf, sf = set(local.enabled_features), set(server.enabled_features)
    enabled = tuple(sorted(sf if not lf else lf if not sf else lf & sf))
    keys = set(local.sampling) | set(server.sampling)
    sampling = {k: min(local.sampling.get(k, 1.0), server.sampling.get(k, 1.0)) for k in keys}
    return ClientPolicy(policy_version=f"{local.policy_version}&{server.policy_version}",sampling=sampling,enabled_features=enabled,max_batch_events=min(local.max_batch_events,server.max_batch_events),max_payload_bytes=min(local.max_payload_bytes,server.max_payload_bytes),max_outbox_bytes=min(local.max_outbox_bytes,server.max_outbox_bytes),max_privacy_level=max_privacy)
