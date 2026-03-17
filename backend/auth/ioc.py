# services/providers.py

from typing import AsyncIterator

from dishka import Provider, Scope, make_async_container, provide
from dishka.integrations.fastapi import (
    FastapiProvider,
)
from fastapi_sso import SSOBase
from fastapi_sso.sso.discord import DiscordSSO
from fastapi_sso.sso.yandex import YandexSSO
from faststream.redis import RedisBroker
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.asynchronous.database import AsyncDatabase
from redis.asyncio import Redis
from repos.session import SessionRepo
from services.auth import AuthService
from services.mail import MailSender
from services.redis import RedisService
from services.redis_manager import RedisManager
from services.session import SessionService
from settings import Settings


class SSOProvider(Provider):
    @provide(scope=Scope.APP)
    def get_yandex_sso(self, settings: Settings) -> YandexSSO:
        return YandexSSO(
            client_id=settings.yandex_cid,
            client_secret=settings.yandex_cs,
            redirect_uri=f"{settings.frontend_url}/auth/yandex/callback",
            allow_insecure_http=not settings.cookie_secure,
            scope=["login:email"],
        )

    @provide(scope=Scope.APP)
    def get_discord_sso(self, settings: Settings) -> DiscordSSO:
        return DiscordSSO(
            client_id=settings.discord_cid,
            client_secret=settings.discord_cs,
            redirect_uri=f"{settings.frontend_url}/auth/discord/callback",
            allow_insecure_http=not settings.cookie_secure,
            scope=["email"],
        )

    @provide(scope=Scope.APP)
    def get_sso_dict(
        self, yandex_sso: YandexSSO, discord_sso: DiscordSSO
    ) -> dict[str, SSOBase]:
        return {"yandex": yandex_sso, "discord": discord_sso}


class ConfigProvider(Provider):
    @provide(scope=Scope.APP)
    def get_settings(self) -> Settings:
        return Settings()


class ServiceProvider(Provider):
    scope = Scope.APP

    @provide(scope=Scope.APP)
    def get_mail_service(self, settings: Settings) -> MailSender:
        return MailSender(
            settings.smtp_server,
            settings.smtp_port,
            settings.email_address,
            settings.email_password,
        )

    @provide(scope=Scope.APP)
    async def get_redis_broker(self, settings: Settings) -> RedisBroker:
        broker = RedisBroker(url=settings.redis_url, max_connections=20)
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
    def get_session_repo(self, redis: RedisService) -> SessionRepo:
        return SessionRepo(redis)

    @provide(scope=Scope.REQUEST)
    def get_session_service(self, repo: SessionRepo) -> SessionService:
        return SessionService(repo)

    @provide(scope=Scope.REQUEST)
    def get_auth_service(
        self,
        session_service: SessionService,
        broker: RedisBroker,
        mail_service: MailSender,
        redis_service: RedisService,
        settings: Settings,
        sso_dict: dict[str, SSOBase],
    ) -> AuthService:
        return AuthService(
            session_service, broker, mail_service, redis_service, settings, sso_dict
        )


container = make_async_container(
    ServiceProvider(),
    ConfigProvider(),
    SSOProvider(),
    FastapiProvider(),
)
