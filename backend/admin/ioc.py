import asyncio
from typing import AsyncIterable, AsyncIterator

from aiohttp import ClientSession, ClientTimeout, TCPConnector
from dishka import Provider, Scope, make_async_container, provide
from dishka.integrations.fastapi import FastapiProvider
from services.auth import AdminAuth
from services.case import CaseService
from services.item import ItemService
from services.rarity import RarityService
from services.storage import StorageService
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
    scope = Scope.REQUEST

    @provide(scope=Scope.REQUEST)
    def get_admin_auth(self, st: Settings, cs: ClientSession) -> AdminAuth:
        return AdminAuth(st, cs)

    @provide(scope=Scope.REQUEST)
    def get_case_service(self, st: Settings, cs: ClientSession) -> CaseService:
        return CaseService(settings=st, session=cs)

    @provide(scope=Scope.REQUEST)
    def get_item_service(self, st: Settings, cs: ClientSession) -> ItemService:
        return ItemService(settings=st, session=cs)

    @provide(scope=Scope.REQUEST)
    def get_rarity_service(self, st: Settings, cs: ClientSession) -> RarityService:
        return RarityService(settings=st, session=cs)

    @provide(scope=Scope.REQUEST)
    def get_tag_service(self, st: Settings, cs: ClientSession) -> TagService:
        return TagService(settings=st, session=cs)

    @provide(scope=Scope.REQUEST)
    def get_user_service(self, st: Settings, cs: ClientSession) -> UserService:
        return UserService(settings=st, session=cs)

    @provide(scope=Scope.REQUEST)
    def get_weapon_type_service(self, st: Settings, cs: ClientSession) -> WeaponTypeService:
        return WeaponTypeService(settings=st, session=cs)

    @provide(scope=Scope.REQUEST)
    def get_weapon_service(self, st: Settings, cs: ClientSession) -> WeaponService:
        return WeaponService(settings=st, session=cs)

    @provide(scope=Scope.APP)
    def get_storage_service(self, st: Settings) -> StorageService:
        return StorageService(settings=st)


container = make_async_container(
    ServiceProvider(), ConfigProvider(), FastapiProvider(), HttpProvider()
)
