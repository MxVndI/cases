from aiohttp import ClientSession
from loguru import logger
from settings import Settings


class TagService:
    def __init__(self, settings: Settings, session: ClientSession):
        self.base_url = settings.case_service_url
        self.settings = settings
        self.session = session

    @staticmethod
    def _normalize_entity(entity: dict | None):
        if entity and "_id" in entity and "id" not in entity:
            entity["id"] = entity.pop("_id")
        return entity

    async def get_all(self):
        try:
            async with self.session.get(f"{self.base_url}/tags/") as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list):
                        return [self._normalize_entity(item) for item in data]
                    return data
                logger.error(f"Tag service error: {response.status}")
                response.raise_for_status()
        except Exception:
            raise

    async def get_by_id(self, id: str):
        try:
            async with self.session.get(f"{self.base_url}/tags/{id}") as response:
                if response.status == 200:
                    return self._normalize_entity(await response.json())
                if response.status == 404:
                    return None
                logger.error(f"Tag service error: {response.status}")
                response.raise_for_status()
        except Exception:
            raise

    async def create(self, name: str):
        try:
            payload = {"name": name, "token": self.settings.token}
            async with self.session.post(f"{self.base_url}/tags/", json=payload) as response:
                if response.status == 200:
                    return self._normalize_entity(await response.json())
                if response.status == 404:
                    return None
                logger.error(f"Tag service error: {response.status}")
                response.raise_for_status()
        except Exception:
            raise

    async def update(self, id: str, name: str | None = None):
        try:
            payload = {"token": self.settings.token}
            if name is not None:
                payload["name"] = name
            async with self.session.patch(f"{self.base_url}/tags/{id}", json=payload) as response:
                if response.status == 200:
                    return self._normalize_entity(await response.json())
                if response.status == 404:
                    return None
                logger.error(f"Tag service error: {response.status}")
                response.raise_for_status()
        except Exception:
            raise

    async def delete(self, id: str):
        try:
            async with self.session.delete(
                f"{self.base_url}/tags/{id}",
                params={"token": self.settings.token},
            ) as response:
                if response.status == 200:
                    return await response.json()
                if response.status == 404:
                    return None
                logger.error(f"Tag service error: {response.status}")
                response.raise_for_status()
        except Exception:
            raise