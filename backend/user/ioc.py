# services/providers.py

from typing import AsyncIterator

from dishka import Provider, Scope, make_async_container, provide
from dishka.integrations.fastapi import (
    FastapiProvider,
)
from faststream.redis import RedisBroker
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.asynchronous.database import AsyncDatabase
from redis.asyncio import Redis
from services.redis import RedisService
from services.redis_manager import RedisManager
from services.session import SessionService
from services.user import UserService
from settings import Settings


class ConfigProvider(Provider):
    @provide(scope=Scope.APP)
    def get_settings(self) -> Settings:
        return Settings()


class ServiceProvider(Provider):
    scope = Scope.APP

    @provide(scope=Scope.APP)
    async def get_redis_broker(self, settings: Settings) -> RedisBroker:
        broker = RedisBroker(
            url=settings.redis_url,
            max_connections=20,
        )
        await broker.connect()
        return broker

    @provide(scope=Scope.APP)
    async def get_mongo_client(self, settings: Settings) -> AsyncIOMotorClient:
        return AsyncIOMotorClient(settings.mongodb_url)

    @provide(scope=Scope.APP)
    async def get_mongo_db(
        self, settings: Settings, client: AsyncIOMotorClient
    ) -> AsyncDatabase:

        return client[settings.mongodb_db_name]

    @provide(scope=Scope.APP)
    def get_redis_manager(self, settings: Settings) -> RedisManager:
        return RedisManager(settings)

    @provide(scope=Scope.REQUEST)
    async def get_redis_client(self, rm: RedisManager) -> AsyncIterator[Redis]:
        async with rm.get_client_context() as client:
            yield client

    @provide(scope=Scope.REQUEST)
    def get_redis_service(self, redis_client: Redis) -> RedisService:
        return RedisService(redis_client)

    @provide(scope=Scope.REQUEST)
    def get_session_service(self, redis_broker: RedisBroker) -> SessionService:
        return SessionService(redis_broker)

    @provide(scope=Scope.REQUEST)
    def get_user_service(self, redis_broker: RedisBroker) -> UserService:
        return UserService(redis_broker)


container = make_async_container(
    ServiceProvider(),
    ConfigProvider(),
    FastapiProvider(),
)
