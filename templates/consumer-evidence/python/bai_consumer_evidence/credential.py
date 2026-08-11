from __future__ import annotations
from typing import Callable, Protocol

class CredentialProvider(Protocol):
    def is_configured(self) -> bool: ...
    def get_secret(self) -> str | None: ...
    def set_secret_from_user_input(self, secret: str) -> None: ...
    def clear_secret(self) -> None: ...

class CallbackCredentialProvider:
    """Delegates persistence to Product-owned external credential storage callbacks."""
    def __init__(self, getter: Callable[[], str | None], setter: Callable[[str], None], clearer: Callable[[], None]):
        self._getter = getter
        self._setter = setter
        self._clearer = clearer
    def is_configured(self) -> bool:
        value = self._getter()
        return bool(value)
    def get_secret(self) -> str | None:
        return self._getter()
    def set_secret_from_user_input(self, secret: str) -> None:
        if not secret or not secret.strip():
            raise ValueError("credential must not be empty")
        self._setter(secret)
    def clear_secret(self) -> None:
        self._clearer()
