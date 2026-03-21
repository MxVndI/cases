from redis.asyncio import Redis
import json
from pydantic import BaseModel


class RedisService:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.ttl = 30 * 60

    async def create(self, prefix: str, key: str, value: dict, ttl: int = 0):
        if ttl == 0:
            ttl = self.ttl
        data = json.dumps(value)
        await self.redis.setex(
            f"{prefix}{key}",
            ttl,
            data,
        )

    async def get(
        self, pattern: str, object_type: BaseModel | None = None
    ) -> dict | BaseModel | None:
        data_raw = await self.redis.get(pattern)
        if data_raw:
            data = json.loads(data_raw)
            if object_type:
                return object_type(**data)
            return data
        return None

    async def delete(self, pattern: str):
        await self.redis.delete(pattern)
