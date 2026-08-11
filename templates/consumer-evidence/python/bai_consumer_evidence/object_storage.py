from __future__ import annotations
import ipaddress
import urllib.error
import urllib.parse
import urllib.request

_SENSITIVE_HEADERS = {"authorization", "cookie", "proxy-authorization"}
_SUCCESS = {200, 201, 204}

class _RejectRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, "redirect rejected", headers, fp)

def _loopback_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    if hostname.lower() == "localhost":
        return True
    try:
        return ipaddress.ip_address(hostname).is_loopback
    except ValueError:
        return False

def validate_presigned_url(url: str, *, allow_insecure_loopback: bool = False) -> str:
    if not isinstance(url, str) or not url:
        raise ValueError("presigned URL is required")
    parsed = urllib.parse.urlsplit(url)
    if parsed.username or parsed.password:
        raise ValueError("userinfo is not allowed in presigned URL")
    if parsed.scheme == "https" and parsed.hostname:
        return url
    if parsed.scheme == "http" and allow_insecure_loopback and _loopback_host(parsed.hostname):
        return url
    raise ValueError("presigned URL must use HTTPS; HTTP is allowed only for explicit loopback tests")

def upload_artifact_presigned(
    url: str,
    artifact: dict,
    *,
    headers: dict[str, str] | None = None,
    timeout_seconds: float = 5.0,
    allow_insecure_loopback: bool = False,
) -> dict:
    """PUT one canonical artifact without storing or accepting a long-lived storage credential.

    Redirects are rejected so an opaque signed URL cannot silently forward the Evidence body to
    another endpoint. The result intentionally never returns the signed URL.
    """
    try:
        safe_url = validate_presigned_url(url, allow_insecure_loopback=allow_insecure_loopback)
        body = artifact.get("body")
        if not isinstance(body, str):
            raise ValueError("artifact body invalid")
        if not isinstance(artifact.get("key"), str) or not artifact["key"]:
            raise ValueError("artifact key invalid")
        digest = artifact.get("content_sha256")
        if not isinstance(digest, str) or len(digest) != 64:
            raise ValueError("artifact digest invalid")
        request_headers = {str(k): str(v) for k, v in (headers or {}).items()}
        if any(k.lower() in _SENSITIVE_HEADERS for k in request_headers):
            raise ValueError("credential-bearing upload header is not allowed")
        request_headers.setdefault("Content-Type", artifact.get("content_type", "application/json"))
        request_headers.setdefault("X-Content-SHA256", digest)
        raw = body.encode("utf-8")
        request = urllib.request.Request(safe_url, data=raw, method="PUT", headers=request_headers)
        opener = urllib.request.build_opener(_RejectRedirects())
        with opener.open(request, timeout=timeout_seconds) as response:
            code = int(response.getcode())
            if code not in _SUCCESS:
                return {"status": f"http_{code}", "stored": False}
            return {
                "status": "stored",
                "stored": True,
                "artifact_key": artifact["key"],
                "content_sha256": digest,
                "bytes": len(raw),
            }
    except urllib.error.HTTPError as error:
        return {"status": f"http_{error.code}", "stored": False}
    except (ValueError, TypeError, OSError, urllib.error.URLError):
        return {"status": "delivery_unavailable", "stored": False}
