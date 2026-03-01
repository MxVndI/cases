from models import Session
from services.redis import RedisService
from uuid import UUID
from datetime import datetime, UTC


class SessionRepo:
    def __init__(self, redis_service: RedisService):
        self.prefix = "sid:"
        self.redis = redis_service

    async def get(self, id: UUID) -> Session | None:
        data = await self.redis.get(f"{self.prefix}{id}", object_type=Session)
        if not data:
            data = await Session.get(id)
            if data:
                data.last_activity = datetime.now(tz=UTC)
                await self.redis.create(
                    prefix=self.prefix,
                    key=str(data.id),
                    value=data.model_dump(),
                    ttl=int(
                        (
                            data.exipres_at.astimezone(tz=UTC) - datetime.now(tz=UTC)
                        ).total_seconds()
                    ),
                )
        return data

    async def create(self, entity: Session) -> Session:
        data: Session = await entity.save()
        data.last_activity = datetime.now(tz=UTC)
        await self.redis.create(
            prefix=self.prefix,
            key=str(data.id),
            value=data.model_dump(),
            ttl=int(
                (
                    data.exipres_at.astimezone(tz=UTC) - datetime.now(tz=UTC)
                ).total_seconds()
            ),
        )
        return data

    async def delete(self, id: UUID) -> Session:
        await self.redis.delete(f"{self.prefix}{id}")
        await Session.find_one(Session.id == id).delete()
