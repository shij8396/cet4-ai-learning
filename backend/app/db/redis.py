from __future__ import annotations

import time
from typing import Protocol

from redis import Redis

from app.core.config import get_settings


class CacheClient(Protocol):
    def get(self, name: str) -> bytes | str | None: ...
    def setex(self, name: str, time: int, value: str) -> object: ...
    def exists(self, name: str) -> int: ...


class MemoryRedis:
    def __init__(self) -> None:
        self._store: dict[str, tuple[str, float]] = {}

    def get(self, name: str) -> str | None:
        entry = self._store.get(name)
        if entry is None:
            return None
        value, expires_at = entry
        if expires_at <= time.monotonic():
            self._store.pop(name, None)
            return None
        return value

    def setex(self, name: str, ttl: int, value: str) -> bool:
        self._store[name] = (value, time.monotonic() + ttl)
        return True

    def exists(self, name: str) -> int:
        return 1 if self.get(name) is not None else 0


def create_redis_client() -> CacheClient:
    settings = get_settings()
    if settings.redis_url == "memory://":
        return MemoryRedis()
    return Redis.from_url(settings.redis_url, decode_responses=True)


redis_client = create_redis_client()
