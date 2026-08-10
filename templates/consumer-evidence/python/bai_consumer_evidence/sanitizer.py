from __future__ import annotations
import re

_ALLOWED = {
    "feature_result": {"feature", "result", "duration_ms", "retry_count", "reason_code"},
    "diagnostic": {"component", "error_code", "retry_count", "recovered"},
    "performance": {"feature", "duration_ms", "retry_count", "sample_count"},
    "capability": {"capability", "available", "provider", "version"},
    "user_feedback": {"feature", "rating", "category", "comment"},
    "incident": {"component", "error_code", "recovered", "recovery_action", "retry_count"},
    "correction": {"feature", "action", "reason_code"},
    "adoption": {"feature", "status", "sample_count"},
}
_SENSITIVE_KEY = re.compile(r"(?:api[_-]?key|token|secret|password|passwd|authorization|credential|private[_-]?key|access[_-]?key)", re.I)
_SECRET = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bAKIA[A-Z0-9]{16}\b"),
    re.compile(r"\bBearer\s+[A-Za-z0-9._~+\/-]{16,}\b", re.I),
]
_WINDOWS_PATH = re.compile(r"\b[A-Za-z]:\\(?:[^\s<>:\"|?*]+\\)*[^\s<>:\"|?*]*")
_UNIX_HOME = re.compile(r"/(?:home|Users)/[^\s/]+/[^\s]*")
_EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)

def _check_secret(value: str) -> None:
    if any(p.search(value) for p in _SECRET):
        raise ValueError("secret-like content rejected")

def sanitize_event(event_type: str, privacy_level: str, payload: dict) -> dict:
    if privacy_level not in {"P0", "P1", "P2"}:
        raise ValueError("P3/raw content is not accepted")
    if event_type not in _ALLOWED:
        raise ValueError("unsupported event type")
    if event_type == "user_feedback" and privacy_level != "P2":
        raise ValueError("user feedback requires P2 consent")
    unknown = set(payload) - _ALLOWED[event_type]
    if unknown:
        raise ValueError(f"unsupported payload fields: {sorted(unknown)}")
    out = {}
    for key, value in payload.items():
        if _SENSITIVE_KEY.search(key):
            raise ValueError("sensitive key rejected")
        if isinstance(value, str):
            _check_secret(value)
            if event_type == "user_feedback" and key == "comment":
                value = _WINDOWS_PATH.sub("[REDACTED_PATH]", value)
                value = _UNIX_HOME.sub("[REDACTED_PATH]", value)
                value = _EMAIL.sub("[REDACTED_EMAIL]", value)
                if len(value) > 2000:
                    raise ValueError("feedback comment too large")
        out[key] = value
    return out
