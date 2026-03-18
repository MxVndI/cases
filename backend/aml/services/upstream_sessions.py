import json
from http.cookies import SimpleCookie

from redis.asyncio import Redis


def _key(admin_id: str, target_id: str) -> str:
    return f"aml:upstream:{admin_id}:{target_id}"


class UpstreamSessionStore:
    def __init__(self, redis: Redis, ttl_seconds: int = 60 * 60):
        self.redis = redis
        self.ttl = ttl_seconds

    async def get_cookies(self, admin_id: str, target_id: str) -> dict[str, str]:
        raw = await self.redis.get(_key(admin_id, target_id))
        if not raw:
            return {}
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                return {str(k): str(v) for k, v in data.items()}
        except Exception:
            return {}
        return {}

    async def set_cookies(self, admin_id: str, target_id: str, cookies: dict[str, str]) -> None:
        await self.redis.setex(_key(admin_id, target_id), self.ttl, json.dumps(cookies))

    def apply_set_cookie_headers(self, cookies: dict[str, str], set_cookie_headers: list[str]) -> dict[str, str]:
        out = dict(cookies)
        for sc in set_cookie_headers:
            jar = SimpleCookie()
            jar.load(sc)
            for name, morsel in jar.items():
                out[name] = morsel.value
        return out

