import json

from faststream.redis import RedisBroker


class SessionService:
    def __init__(self, redis_broker: RedisBroker):
        self.redis = redis_broker

    async def get_user_id_by_sid(self, sid: str):
        data = await self.redis.request(
            stream="auth.rpc", message={"sid": sid}, timeout=5
        )

        if data and data.body:
            data = json.loads(data.body)
            return data.get("custom_data").get("user").get("id")
