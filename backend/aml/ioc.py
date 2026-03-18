import asyncio
from typing import AsyncIterable, AsyncIterator

from dishka import Provider, Scope, make_async_container, provide
from dishka.integrations.fastapi import FastapiProvider
from aiohttp import ClientSession, ClientTimeout, TCPConnector
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.asynchronous.database import AsyncDatabase
from redis.asyncio import Redis

from settings import Settings
from services.auth_adapter import AuthAdapter
from services.audit import AuditService
from services.secret_service import SecretService


class ConfigProvider(Provider):
    @provide(scope=Scope.APP)
    def get_settings(self) -> Settings:
        return Settings()


class ServiceProvider(Provider):
    scope = Scope.APP

    @provide(scope=Scope.APP)
    async def get_http_session(self) -> AsyncIterable[ClientSession]:
        async with asyncio.Lock():
            connector = TCPConnector(
                limit=200,
                limit_per_host=50,
                ttl_dns_cache=300,
                force_close=False,
                enable_cleanup_closed=True,
            )
            timeout = ClientTimeout(total=30, connect=5, sock_read=15)
            ses = ClientSession(
                connector=connector,
                timeout=timeout,
                headers={"User-Agent": "AML/0.1"},
            )
        yield ses
        if ses:
            await ses.close()

    @provide(scope=Scope.APP)
    async def get_mongo_client(self, settings: Settings) -> AsyncIOMotorClient:
        return AsyncIOMotorClient(settings.mongodb_url)

    @provide(scope=Scope.APP)
    async def get_mongo_db(
        self, settings: Settings, client: AsyncIOMotorClient
    ) -> AsyncDatabase:
        return client[settings.mongodb_db_name]

    @provide(scope=Scope.REQUEST)
    def get_auth_adapter(self, settings: Settings, ses: ClientSession) -> AuthAdapter:
        return AuthAdapter(settings=settings, session=ses)

    @provide(scope=Scope.REQUEST)
    def get_audit_service(self) -> AuditService:
        return AuditService()

    @provide(scope=Scope.REQUEST)
    def get_secret_service(self, settings: Settings) -> SecretService:
        return SecretService(settings=settings)

    @provide(scope=Scope.REQUEST)
    async def get_redis(self, settings: Settings) -> AsyncIterator[Redis]:
        r = Redis.from_url(settings.redis_url, decode_responses=True)
        try:
            yield r
        finally:
            await r.aclose()


container = make_async_container(ServiceProvider(), ConfigProvider(), FastapiProvider())
