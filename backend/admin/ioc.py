import asyncio
from typing import AsyncIterable, AsyncIterator

from aiohttp import ClientSession, ClientTimeout, TCPConnector
from dishka import Provider, Scope, make_async_container, provide
from dishka.integrations.fastapi import FastapiProvider
from services.case import CaseService
from services.local_auth import LocalAuth
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

    @provide(scope=Scope.REQUEST)
    def get_local_auth(self, st: Settings) -> LocalAuth:
        return LocalAuth(st)

    @provide(scope=Scope.REQUEST)
    def get_case_service(self, st: Settings, cs: ClientSession) -> CaseService:
        return CaseService(settings=st, session=cs)


container = make_async_container(
    ServiceProvider(), ConfigProvider(), FastapiProvider(), HttpProvider()
)
