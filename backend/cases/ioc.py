import asyncio
from typing import AsyncIterable, AsyncIterator

from aiohttp import ClientSession, ClientTimeout, TCPConnector
from dishka import Provider, Scope, make_async_container, provide
from dishka.integrations.fastapi import (
    FastapiProvider,
)
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.asynchronous.database import AsyncDatabase
from redis.asyncio import Redis
from services.auth import AuthService
from services.case import CaseService
from services.inventory import InventoryService
from services.item import ItemService
from services.local_auth import LocalAuth
from services.payment import PaymentService
from services.rarity import RarityService
from services.tag import TagService
from services.user import UserService
from services.weapon import WeaponService
from services.weapon_type import WeaponTypeService
from settings import Settings


class HttpProvider(Provider):
    @provide(scope=Scope.APP)
    async def get_session(self) -> AsyncIterable[ClientSession]:

        async with asyncio.Lock():
            connector = TCPConnector(
                limit=100,
                limit_per_host=30,
                ttl_dns_cache=300,
                force_close=False,
                enable_cleanup_closed=True,
            )

            timeout = ClientTimeout(
                total=30,
                connect=5,
                sock_read=10,
            )

            ses = ClientSession(
                connector=connector,
                timeout=timeout,
                headers={"User-Agent": "CommunityBFF/1.0"},
            )

        yield ses

        if ses:
            await ses.close()


class ConfigProvider(Provider):
    @provide(scope=Scope.APP)
    def get_settings(self) -> Settings:
        return Settings()


class ServiceProvider(Provider):
    scope = Scope.APP

    @provide(scope=Scope.APP)
    async def get_mongo_client(self, settings: Settings) -> AsyncIOMotorClient:
        return AsyncIOMotorClient(settings.mongodb_url)

    @provide(scope=Scope.APP)
    async def get_redis(self, settings: Settings) -> AsyncIterable[Redis]:
        r = Redis.from_url(settings.redis_url, decode_responses=True)
        yield r
        await r.aclose()

    @provide(scope=Scope.APP)
    async def get_mongo_db(
        self, settings: Settings, client: AsyncIOMotorClient
    ) -> AsyncDatabase:

        return client[settings.mongodb_db_name]

    @provide(scope=Scope.REQUEST)
    def get_item_service(self) -> ItemService:
        return ItemService()

    @provide(scope=Scope.REQUEST)
    def get_rarity_service(self) -> RarityService:
        return RarityService()

    @provide(scope=Scope.REQUEST)
    def get_tag_service(self) -> TagService:
        return TagService()

    @provide(scope=Scope.REQUEST)
    def get_weapon_type_service(self) -> WeaponTypeService:
        return WeaponTypeService()

    @provide(scope=Scope.REQUEST)
    def get_weapon_service(self) -> WeaponService:
        return WeaponService()

    @provide(scope=Scope.REQUEST)
    def get_case_service(
        self, is_s: ItemService, inv_s: InventoryService, pay_s: PaymentService,
        redis: Redis,
    ) -> CaseService:
        return CaseService(item_service=is_s, inventory_service=inv_s, payment_service=pay_s, redis=redis)

    @provide(scope=Scope.REQUEST)
    def get_local_auth_service(self, st: Settings) -> LocalAuth:
        return LocalAuth(st)

    @provide(scope=Scope.REQUEST)
    def get_auth_service(self, st: Settings, ses: ClientSession) -> AuthService:
        return AuthService(st, ses)

    @provide(scope=Scope.REQUEST)
    def get_payment_service(self, st: Settings, ses: ClientSession) -> PaymentService:
        return PaymentService(st, ses)

    @provide(scope=Scope.REQUEST)
    def get_user_service(self, st: Settings, ses: ClientSession) -> UserService:
        return UserService(st, ses)

    @provide(scope=Scope.REQUEST)
    def get_inventory_service(self) -> InventoryService:
        return InventoryService()


container = make_async_container(
    ServiceProvider(),
    ConfigProvider(),
    HttpProvider(),
    FastapiProvider(),
)
