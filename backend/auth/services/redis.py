from redis.asyncio import Redis
import json
from pydantic import BaseModel


class RedisService:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.ttl = 30 * 60

    async def create(self, prefix: str, key: str, value: dict, ttl: int = 0):

        print(f"CREATE - value type: {type(value)}")
        print(f"CREATE - value: {value}")
        if ttl == 0:
            ttl = self.ttl
        data = json.dumps(value)
        print(f"CREATE - data type: {type(data)}")
        print(f"CREATE - data: {data}")
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
            print(data_raw)
            data = json.loads(data_raw)
            print(data)
            print(type(data))
            if object_type:
                return object_type(**data)
            return data
        return None

    async def delete(self, pattern: str):
        await self.redis.delete(pattern)
