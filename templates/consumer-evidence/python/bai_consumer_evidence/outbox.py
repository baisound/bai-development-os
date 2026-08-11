from __future__ import annotations
import hashlib, json, os
from pathlib import Path

class LocalOutbox:
    def __init__(self, root: str | Path, max_bytes: int = 5 * 1024 * 1024):
        self.root = Path(root)
        self.max_bytes = max_bytes
        self.root.mkdir(parents=True, exist_ok=True)
    @staticmethod
    def _name(event_id: str) -> str:
        return hashlib.sha256(event_id.encode("utf-8")).hexdigest() + ".json"
    def size_bytes(self) -> int:
        return sum(p.stat().st_size for p in self.root.glob("*.json") if p.is_file())
    def enqueue(self, event: dict) -> None:
        raw = (json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
        target = self.root / self._name(event["event_id"])
        projected = self.size_bytes() - (target.stat().st_size if target.exists() else 0) + len(raw)
        if projected > self.max_bytes:
            raise OverflowError("evidence outbox capacity exceeded")
        tmp = target.with_suffix(".tmp")
        with open(tmp, "wb") as f:
            f.write(raw); f.flush(); os.fsync(f.fileno())
        os.replace(tmp, target)
    def list_events(self, limit: int = 100) -> list[dict]:
        out=[]
        for p in sorted(self.root.glob("*.json"))[:limit]:
            with open(p, "r", encoding="utf-8") as f: out.append(json.load(f))
        return out
    def acknowledge(self, event_ids: list[str]) -> None:
        for event_id in event_ids:
            try: (self.root / self._name(event_id)).unlink()
            except FileNotFoundError: pass
